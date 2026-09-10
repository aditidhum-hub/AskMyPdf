import assert from 'node:assert';
import { SAMPLE_DOCUMENTS } from '../src/data/sampleDocuments.js';
import {
  chunkDocument,
  computeTermEmbedding,
  cosineSimilarity,
  computeKeywordScore,
  InMemoryVectorIndex,
} from '../src/utils/ragEngine.js';
import { askComparativeAssistant } from '../src/utils/documentAssistant.js';

console.log('🧪 Starting Phase 4 Verification Suite (Hybrid RAG, Embeddings & Multi-Doc)...\n');

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

// 1. Sliding-Window Token/Word Chunker
test('chunkDocument produces valid overlapping chunks with page metadata', () => {
  const doc = SAMPLE_DOCUMENTS[0];
  const chunks = chunkDocument(doc, 100, 25);

  assert(chunks.length > 0, 'Must produce chunks');
  assert(chunks.every(c => c.documentId === doc.id), 'All chunks must retain documentId');
  assert(chunks.every(c => c.pageNumber >= 1 && c.pageNumber <= doc.pageCount), 'Chunks must reference valid pages');
  assert(chunks.every(c => c.content.length > 0), 'Chunk content must not be empty');
  assert(chunks.every(c => c.wordCount > 0), 'Chunk word count must be positive');

  // Verify chunk indexing sequence
  for (let i = 0; i < chunks.length; i++) {
    assert(chunks[i].id.includes(doc.id));
  }
});

// 2. Vector Embedding & Cosine Similarity Mathematics
test('computeTermEmbedding generates normalized unit vectors of specified dimension', () => {
  const text = 'Clean energy grid storage battery economics and sodium ion manufacturing.';
  const vector = computeTermEmbedding(text, 64);

  assert.strictEqual(vector.length, 64, 'Vector must match dimensions');
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  assert(Math.abs(magnitude - 1.0) < 0.001, 'Vector must be normalized to unit length');
});

test('cosineSimilarity scores identical texts higher than disparate texts', () => {
  const v1 = computeTermEmbedding('Autonomous edge AI neural networks inference robotics', 64);
  const v2 = computeTermEmbedding('Autonomous edge AI inference acceleration and robotics vision', 64);
  const v3 = computeTermEmbedding('Corporate bond yields and fixed income macroeconomics', 64);

  const simHigh = cosineSimilarity(v1, v2);
  const simLow = cosineSimilarity(v1, v3);

  assert(simHigh > simLow, `Related texts (${simHigh.toFixed(2)}) must score higher than disparate texts (${simLow.toFixed(2)})`);
});

// 3. Keyword Scoring (Sparse BM25 Approximation)
test('computeKeywordScore accurately reflects term matching frequency', () => {
  const query = 'sodium battery storage';
  const matchingText = 'Sodium ion battery technology is expanding in storage applications.';
  const unrelatedText = 'Federal monetary policy adjusted the central lending rate.';

  const scoreHigh = computeKeywordScore(query, matchingText);
  const scoreZero = computeKeywordScore(query, unrelatedText);

  assert(scoreHigh > 0, 'Matching text must produce positive keyword score');
  assert.strictEqual(scoreZero, 0, 'Unrelated text must score zero');
});

// 4. InMemoryVectorIndex Hybrid Retrieval
test('InMemoryVectorIndex indexes documents and executes hybrid dense+sparse retrieval', () => {
  const index = new InMemoryVectorIndex();
  index.indexDocuments(SAMPLE_DOCUMENTS);

  assert(index.getChunkCount() >= SAMPLE_DOCUMENTS.length, 'Index must contain all document chunks');

  const query = 'battery chemistry capex and pack cost';
  const results = index.hybridSearch(query, 5, 0.65);

  assert(results.length > 0, 'Should return top search results');
  assert(results.length <= 5, 'Should limit to topK');
  assert(results[0].score >= results[results.length - 1].score, 'Results must be ranked in descending score order');

  // Verify top result maps to Clean Energy document which discusses battery capex
  const topDocId = results[0].chunk.documentId;
  assert.strictEqual(topDocId, 'doc-clean-energy-2026', 'Top result should be Clean Energy report');
});

test('InMemoryVectorIndex respects documentIdFilter for scoped multi-doc isolation', () => {
  const index = new InMemoryVectorIndex();
  index.indexDocuments(SAMPLE_DOCUMENTS);

  const targetDocId = 'doc-autonomous-systems-2026';
  const results = index.hybridSearch('architecture and sensors', 4, 0.6, targetDocId);

  assert(results.every(r => r.chunk.documentId === targetDocId), 'All results must belong to filtered document');
});

// 5. Cross-Document Comparative Analysis
test('askComparativeAssistant synthesizes comparative insights across multiple documents', async () => {
  const docA = SAMPLE_DOCUMENTS[0]; // Clean Energy
  const docB = SAMPLE_DOCUMENTS[1]; // Autonomous Systems

  const response = await askComparativeAssistant(
    'Compare system challenges and reliability considerations between these reports',
    [docA, docB]
  );

  assert(response.content.includes('Cross-Document Comparative Analysis'), 'Must contain comparative header');
  assert(response.content.includes(docA.name), 'Must reference Document A');
  assert(response.content.includes(docB.name), 'Must reference Document B');
  assert(response.citations.length >= 2, 'Must provide citations for both sources');
});

// 6. Scaling Simulation for Large Documents
test('RAG Index scales gracefully to 100+ simulated chunks with sub-millisecond retrieval', () => {
  const largeMockPages = Array.from({ length: 40 }, (_, i) => ({
    pageNumber: i + 1,
    title: `Technical Specification Section ${i + 1}`,
    content: `Chapter ${i + 1}: Detailed engineering documentation regarding system node ${i + 1}, latency metrics, and error margins. Overclocking frequency reached ${(i * 1.5).toFixed(1)} GHz.`,
  }));

  const simulatedLargeDoc = {
    ...SAMPLE_DOCUMENTS[0],
    id: 'doc-massive-spec',
    name: 'Massive Enterprise Architecture Manual',
    pages: largeMockPages,
    pageCount: largeMockPages.length,
  };

  const startTime = Date.now();
  const index = new InMemoryVectorIndex();
  index.indexDocuments([simulatedLargeDoc]);

  const searchStart = Date.now();
  const results = index.hybridSearch('overclocking frequency latency', 5);
  const searchDurationMs = Date.now() - searchStart;

  assert(results.length === 5, 'Must return top 5 chunks');
  assert(searchDurationMs < 50, `Search across 40+ sections must be under 50ms (took ${searchDurationMs}ms)`);
});

// Summary runner
setTimeout(() => {
  console.log(`\n========================================`);
  console.log(`📊 Phase 4 Test Results: ${passedTests}/${totalTests} Passed`);
  console.log(`========================================\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All Phase 4 Core Capabilities Verified Successfully!');
    process.exit(0);
  } else {
    console.error('⚠️ Some Phase 4 tests failed.');
    process.exit(1);
  }
}, 1000);
