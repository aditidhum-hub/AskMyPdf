export interface DocumentPage {
  pageNumber: number;
  title?: string;
  content: string;
  keyTopics?: string[];
}

export interface Citation {
  pageNumber: number;
  snippet: string;
  heading?: string;
}

export interface PdfDocument {
  id: string;
  name: string;
  size: number; // bytes
  fileType: string;
  uploadDate: string;
  pageCount: number;
  wordCount: number;
  category: 'finance' | 'technology' | 'legal' | 'research' | 'custom';
  summary: string;
  keyFindings: string[];
  suggestedQuestions: string[];
  pages: DocumentPage[];
  blobUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  citations?: Citation[];
  confidenceScore?: number;
  isGenerating?: boolean;
}

export type ViewLayout = 'split' | 'reader-only' | 'chat-only';
export type ReaderSidebarTab = 'thumbnails' | 'summary' | 'search' | 'highlights';

export interface DocumentSearchMatch {
  pageNumber: number;
  snippet: string;
  lineIndex: number;
}
