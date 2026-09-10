import { PdfDocument, DocumentPage, Citation } from '../types.js';

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  chunkIndex: number;
  content: string;
  heading?: string;
  wordCount: number;
  vector?: number[];
}

export interface HybridSearchResult {
  chunk: DocumentChunk;
  score: number;
  semanticScore: number;
  keywordScore: number;
}

/**
 * Splits document pages into overlapping semantic chunks for RAG indexing.
 * Prevents context fragmentation across page and paragraph boundaries.
 */
export function chunkDocument(
  document: PdfDocument,
  chunkSizeWords: number = 180,
  overlapWords: number = 40
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let globalChunkIndex = 0;

  document.pages.forEach((page: DocumentPage) => {
    const paragraphs = page.content.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const words = page.content.split(/\s+/).filter(Boolean);

    if (words.length <= chunkSizeWords) {
      // Small page: single chunk
      chunks.push({
        id: `chunk-${document.id}-p${page.pageNumber}-${globalChunkIndex++}`,
        documentId: document.id,
        documentName: document.name,
        pageNumber: page.pageNumber,
        chunkIndex: globalChunkIndex,
        content: page.content,
        heading: page.title || `Section ${page.pageNumber}`,
        wordCount: words.length,
      });
      return;
    }

    // Sliding window chunking with overlap
    let startIdx = 0;
    while (startIdx < words.length) {
      const endIdx = Math.min(words.length, startIdx + chunkSizeWords);
      const chunkWords = words.slice(startIdx, endIdx);
      const chunkText = chunkWords.join(' ');

      chunks.push({
        id: `chunk-${document.id}-p${page.pageNumber}-${globalChunkIndex++}`,
        documentId: document.id,
        documentName: document.name,
        pageNumber: page.pageNumber,
        chunkIndex: globalChunkIndex,
        content: chunkText,
        heading: page.title || `Page ${page.pageNumber}`,
        wordCount: chunkWords.length,
      });

      if (endIdx >= words.length) break;
      startIdx += (chunkSizeWords - overlapWords);
    }
  });

  return chunks;
}

/**
 * Computes deterministic lightweight term embeddings for semantic similarity scoring.
 */
export function computeTermEmbedding(text: string, dimensions: number = 64): number[] {
  const vector = new Array(dimensions).fill(0);
  const matches = text.toLowerCase().match(/\b[a-z]{3,}\b/g);
  const cleanWords: string[] = matches ? Array.from(matches) : [];

  if (cleanWords.length === 0) return vector;

  cleanWords.forEach((word: string) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dimensions;
    vector[idx] += 1;
  });

  // Normalize vector to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return vector;
  return vector.map(val => val / magnitude);
}

/**
 * Computes Cosine Similarity between two normalized dense vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return Math.max(0, Math.min(1, dotProduct));
}

/**
 * Computes BM25-style keyword relevance score for a given query against chunk text.
 */
export function computeKeywordScore(query: string, text: string): number {
  const queryTerms = query.toLowerCase().replace(/[?.,!]/g, '').split(/\s+/).filter(w => w.length > 2);
  if (queryTerms.length === 0) return 0;

  const textLower = text.toLowerCase();
  let matches = 0;

  queryTerms.forEach(term => {
    if (textLower.includes(term)) {
      matches += 1;
      // Bonus if term appears multiple times
      const count = (textLower.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      if (count > 1) matches += Math.min(2, count * 0.5);
    }
  });

  return matches / queryTerms.length;
}

/**
 * In-Memory Vector Store & Hybrid RAG Retrieval Engine.
 */
export class InMemoryVectorIndex {
  private chunks: DocumentChunk[] = [];

  constructor() {}

  /**
   * Indexes all pages of one or more documents into vectorized chunks.
   */
  public indexDocuments(documents: PdfDocument[]): void {
    this.chunks = [];
    documents.forEach(doc => {
      const docChunks = chunkDocument(doc);
      docChunks.forEach(chunk => {
        chunk.vector = computeTermEmbedding(chunk.content);
        this.chunks.push(chunk);
      });
    });
  }

  public getChunkCount(): number {
    return this.chunks.length;
  }

  /**
   * Executes Hybrid Retrieval combining Dense Cosine Similarity with BM25 Keyword Scoring.
   * @param query Search query
   * @param topK Number of top chunks to retrieve (default: 5)
   * @param alpha Balance between dense semantic (1.0) and sparse keyword (0.0)
   * @param documentIdFilter Optional filter for a specific document
   */
  public hybridSearch(
    query: string,
    topK: number = 5,
    alpha: number = 0.65,
    documentIdFilter?: string
  ): HybridSearchResult[] {
    const queryVector = computeTermEmbedding(query);
    const candidates = documentIdFilter
      ? this.chunks.filter(c => c.documentId === documentIdFilter)
      : this.chunks;

    const results: HybridSearchResult[] = candidates.map(chunk => {
      const semanticScore = chunk.vector ? cosineSimilarity(queryVector, chunk.vector) : 0;
      const keywordScore = computeKeywordScore(query, chunk.content);
      const combinedScore = alpha * semanticScore + (1 - alpha) * keywordScore;

      return {
        chunk,
        score: combinedScore,
        semanticScore,
        keywordScore,
      };
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Generates cross-document comparative context across multiple documents.
   */
  public retrieveComparativeContext(
    query: string,
    documents: PdfDocument[],
    chunksPerDoc: number = 3
  ): { contextString: string; citations: Citation[] } {
    const citations: Citation[] = [];
    const contextSections: string[] = [];

    documents.forEach(doc => {
      const topChunks = this.hybridSearch(query, chunksPerDoc, 0.6, doc.id);
      const docSnippets = topChunks.map(res => {
        citations.push({
          pageNumber: res.chunk.pageNumber,
          snippet: res.chunk.content.slice(0, 150) + '...',
          heading: `${doc.name} (P.${res.chunk.pageNumber})`,
        });

        return `[${doc.name.toUpperCase()} - PAGE ${res.chunk.pageNumber}]\n${res.chunk.content}`;
      });

      if (docSnippets.length > 0) {
        contextSections.push(docSnippets.join('\n\n'));
      }
    });

    return {
      contextString: contextSections.join('\n\n---\n\n'),
      citations,
    };
  }
}
