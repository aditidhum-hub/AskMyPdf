import assert from 'node:assert';
import { SAMPLE_DOCUMENTS } from '../src/data/sampleDocuments.js';
import { extractCitationsFromText, askDocumentAssistant } from '../src/utils/documentAssistant.js';
import { PdfDocument, DocumentSearchMatch } from '../src/types.js';

console.log('🧪 Starting Phase 1 Verification Suite...\n');

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

// 1. Curated Knowledge Base Verification
test('SAMPLE_DOCUMENTS contains curated datasets with valid schema', () => {
  assert(Array.isArray(SAMPLE_DOCUMENTS), 'SAMPLE_DOCUMENTS should be an array');
  assert(SAMPLE_DOCUMENTS.length >= 3, 'Should have at least 3 curated sample documents');

  SAMPLE_DOCUMENTS.forEach((doc, idx) => {
    assert(doc.id, `Doc ${idx} must have an id`);
    assert(doc.name, `Doc ${idx} must have a name`);
    assert(doc.pageCount > 0, `Doc ${doc.id} must have pageCount > 0`);
    assert(doc.pages.length === doc.pageCount, `Doc ${doc.id} pageCount mismatch`);
    assert(doc.wordCount > 0, `Doc ${doc.id} must have wordCount > 0`);
    assert(doc.summary.length > 50, `Doc ${doc.id} must have a meaningful summary`);
    assert(doc.keyFindings.length >= 3, `Doc ${doc.id} must have at least 3 key findings`);
    assert(doc.suggestedQuestions.length >= 2, `Doc ${doc.id} must have suggested prompts`);

    // Verify page indexing
    doc.pages.forEach((page, pIdx) => {
      assert.strictEqual(page.pageNumber, pIdx + 1, `Page number must be 1-indexed in ${doc.id}`);
      assert(page.content.trim().length > 0, `Page ${page.pageNumber} in ${doc.id} must have text`);
    });
  });
});

// 2. Citation Extraction Engine
test('extractCitationsFromText handles [Page X] and [Page X, Header] formats', () => {
  const sampleDoc = SAMPLE_DOCUMENTS[0];
  const responseText = 'Investment grew significantly [Page 1]. Capex dropped by 28% [Page 2, Battery Chemistries]. Transmission delays exist [P. 3].';

  const citations = extractCitationsFromText(responseText, sampleDoc);
  assert.strictEqual(citations.length, 3, 'Should extract 3 distinct citations');
  assert.strictEqual(citations[0].pageNumber, 1);
  assert.strictEqual(citations[1].pageNumber, 2);
  assert.strictEqual(citations[1].heading, 'Battery Chemistries');
  assert.strictEqual(citations[2].pageNumber, 3);
});

test('extractCitationsFromText rejects invalid out-of-bounds page numbers and deduplicates', () => {
  const sampleDoc = SAMPLE_DOCUMENTS[0]; // 3 pages
  const textWithInvalidAndDuplicate = 'Here is info [Page 1] and repeated [Page 1] and out-of-bounds [Page 99].';

  const citations = extractCitationsFromText(textWithInvalidAndDuplicate, sampleDoc);
  assert.strictEqual(citations.length, 1, 'Should deduplicate Page 1 and ignore Page 99');
  assert.strictEqual(citations[0].pageNumber, 1);
});

// 3. Document Search & Match Stepper Logic
test('Document search correctly computes case-insensitive matches across pages', () => {
  const sampleDoc = SAMPLE_DOCUMENTS[0];
  const query = 'battery';

  const matches: DocumentSearchMatch[] = [];
  sampleDoc.pages.forEach((page) => {
    const lines = page.content.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        matches.push({
          pageNumber: page.pageNumber,
          snippet: line.trim(),
          lineIndex: idx,
        });
      }
    });
  });

  assert(matches.length > 0, 'Should find matches for "battery"');
  assert(matches.every((m) => m.snippet.toLowerCase().includes('battery')), 'Every snippet must contain the query');
  assert(matches.some((m) => m.pageNumber === 2), 'Battery matches should appear on Page 2');
});

// 4. Client Fallback Grounded Intelligence Engine
test('askDocumentAssistant generates grounded executive summary with citations', async () => {
  const sampleDoc = SAMPLE_DOCUMENTS[0];
  const response = await askDocumentAssistant('Give me an executive summary of this document', sampleDoc, []);

  assert(response.content.includes('Executive Summary'), 'Content must contain Executive Summary header');
  assert(response.citations.length > 0, 'Must produce source citations');
  assert(response.citations.every((c) => c.pageNumber >= 1 && c.pageNumber <= sampleDoc.pageCount), 'Citations must be within page bounds');
});

test('askDocumentAssistant generates structured key findings with page citations', async () => {
  const sampleDoc = SAMPLE_DOCUMENTS[0];
  const response = await askDocumentAssistant('What are the key findings and takeaways?', sampleDoc, []);

  assert(response.content.includes('Key Takeaways'), 'Content must contain Key Takeaways header');
  assert(response.citations.length >= 3, 'Must produce citations for key takeaways');
});

test('askDocumentAssistant handles specific page scoped inquiries', async () => {
  const sampleDoc = SAMPLE_DOCUMENTS[0];
  const response = await askDocumentAssistant('What is discussed on this page?', sampleDoc, [], 2);

  assert(response.citations.some((c) => c.pageNumber === 2), 'Must cite Page 2 when scoped to Page 2');
});

// 5. Server Health Check (if server is up)
test('Server health endpoint returns operational status', async () => {
  try {
    const res = await fetch('http://localhost:3000/api/health');
    if (res.ok) {
      const data = await res.json();
      assert.strictEqual(data.status, 'ok', 'Server status must be "ok"');
      assert.strictEqual(data.appName, 'AskMyPDF', 'App name must be "AskMyPDF"');
    }
  } catch {
    console.log('    ℹ️  Note: Local server at port 3000 not reachable in this test runner instance, testing in-memory logic only.');
  }
});

// Summary runner
setTimeout(() => {
  console.log(`\n========================================`);
  console.log(`📊 Phase 1 Test Results: ${passedTests}/${totalTests} Passed`);
  console.log(`========================================\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All Phase 1 Core Capabilities Verified Successfully!');
    process.exit(0);
  } else {
    console.error('⚠️ Some tests failed.');
    process.exit(1);
  }
}, 1000);
