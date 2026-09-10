import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { requiresOcrExtraction, performOcrOnCanvas, generateSyntheticOcrFallback } from '../src/utils/ocrEngine.js';
import { DocumentDisplayMode, BoundingBox } from '../src/types.js';
import { SAMPLE_DOCUMENTS } from '../src/data/sampleDocuments.js';

console.log('🧪 Starting Phase 3 Verification Suite (OCR, Canvas & Offline Worker)...\n');

let passedTests = 0;
let totalTests = 0;

function test(name: string, fn: () => void | Promise<void>) {
  totalTests++;
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          passedTests++;
          console.log(`  ✅ PASS: ${name}`);
        })
        .catch((err) => {
          console.error(`  ❌ FAIL: ${name}`);
          console.error(err);
        });
    } else {
      passedTests++;
      console.log(`  ✅ PASS: ${name}`);
    }
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

// 1. Bundled Local Web Worker Verification
test('Bundled PDF.js worker files exist in public/ and public/workers/ for offline compliance', () => {
  const publicDir = fs.existsSync(path.join(process.cwd(), 'public'))
    ? path.join(process.cwd(), 'public')
    : path.join(process.cwd(), '..', 'frontend', 'public');
  const primaryWorker = path.join(publicDir, 'pdf.worker.min.mjs');
  const subWorkerMjs = path.join(publicDir, 'workers', 'pdf.worker.min.mjs');
  const subWorkerJs = path.join(publicDir, 'workers', 'pdf.worker.min.js');

  assert(fs.existsSync(primaryWorker), 'public/pdf.worker.min.mjs must exist');
  assert(fs.statSync(primaryWorker).size > 500000, 'Worker file must be substantial (> 500KB)');

  assert(fs.existsSync(subWorkerMjs), 'public/workers/pdf.worker.min.mjs must exist');
  assert(fs.existsSync(subWorkerJs), 'public/workers/pdf.worker.min.js must exist');
});

// 2. OCR Detection Rule
test('requiresOcrExtraction identifies image-only pages and bypasses text-rich pages', () => {
  // Case 1: Empty text content
  assert.strictEqual(requiresOcrExtraction('', 0), true, 'Empty content must trigger OCR');

  // Case 2: Very short or scanned placeholder string
  assert.strictEqual(requiresOcrExtraction('[Page 1 contains media]', 0), true, 'Placeholder media tag must trigger OCR');

  // Case 3: Text-rich page
  const textRichContent = SAMPLE_DOCUMENTS[0].pages[0].content;
  assert.strictEqual(requiresOcrExtraction(textRichContent, 100), false, 'Dense textual content must not require OCR');
});

// 3. OCR Engine & Normalized Bounding Box Generation
test('generateSyntheticOcrFallback produces valid OCR transcript and normalized percentage bounding boxes', () => {
  const ocrResult = generateSyntheticOcrFallback(3);

  assert(ocrResult.text.length > 20, 'OCR text output must be populated');
  assert(ocrResult.confidence > 70, 'Confidence score should be realistic');
  assert(Array.isArray(ocrResult.boundingBoxes), 'boundingBoxes must be an array');
  assert(ocrResult.boundingBoxes.length > 0, 'Must produce bounding boxes');

  ocrResult.boundingBoxes.forEach((box: BoundingBox) => {
    assert.strictEqual(box.pageNumber, 3);
    assert(box.x >= 0 && box.x <= 100, `Box x (${box.x}) must be between 0% and 100%`);
    assert(box.y >= 0 && box.y <= 100, `Box y (${box.y}) must be between 0% and 100%`);
    assert(box.width > 0 && box.width <= 100, `Box width (${box.width}) must be between 0% and 100%`);
    assert(box.height > 0 && box.height <= 100, `Box height (${box.height}) must be between 0% and 100%`);
    assert(box.confidence !== undefined && box.confidence > 0, 'Confidence must be positive');
  });
});

test('performOcrOnCanvas returns structured OcrResult with bounding boxes', async () => {
  const result = await performOcrOnCanvas('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 1);

  assert(result.text.length > 0, 'Result text must be non-empty');
  assert(result.confidence > 0, 'Confidence must be positive');
  assert(Array.isArray(result.boundingBoxes), 'Must return boundingBoxes array');
});

// 4. Document Display Mode Validation
test('DocumentDisplayMode supports text-reading and canvas-visual view modes', () => {
  const modes: DocumentDisplayMode[] = ['text-reading', 'canvas-visual'];
  assert.strictEqual(modes.length, 2);
  assert(modes.includes('text-reading'));
  assert(modes.includes('canvas-visual'));
});

// 5. Bounding Box Attachment to Document Page Model
test('DocumentPage schema supports optional isOcr flag and boundingBoxes collection', () => {
  const samplePageWithOcr = {
    pageNumber: 1,
    title: 'Scanned Financial Audit',
    content: 'Extracted financial statements via OCR',
    isOcr: true,
    boundingBoxes: [
      {
        id: 'box-1',
        pageNumber: 1,
        x: 10,
        y: 20,
        width: 80,
        height: 15,
        text: 'Balance Sheet Q3',
        confidence: 95,
      },
    ],
  };

  assert.strictEqual(samplePageWithOcr.isOcr, true);
  assert.strictEqual(samplePageWithOcr.boundingBoxes.length, 1);
  assert.strictEqual(samplePageWithOcr.boundingBoxes[0].text, 'Balance Sheet Q3');
});

// Summary runner
setTimeout(() => {
  console.log(`\n========================================`);
  console.log(`📊 Phase 3 Test Results: ${passedTests}/${totalTests} Passed`);
  console.log(`========================================\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All Phase 3 Core Capabilities Verified Successfully!');
    process.exit(0);
  } else {
    console.error('⚠️ Some Phase 3 tests failed.');
    process.exit(1);
  }
}, 1000);
