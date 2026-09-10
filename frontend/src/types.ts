export interface BoundingBox {
  id: string;
  pageNumber: number;
  x: number; // percentage: 0 to 100
  y: number; // percentage: 0 to 100
  width: number; // percentage: 0 to 100
  height: number; // percentage: 0 to 100
  text?: string;
  confidence?: number;
}

export interface DocumentPage {
  pageNumber: number;
  title?: string;
  content: string;
  keyTopics?: string[];
  isOcr?: boolean;
  boundingBoxes?: BoundingBox[];
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
export type DocumentDisplayMode = 'text-reading' | 'canvas-visual';

export interface DocumentSearchMatch {
  pageNumber: number;
  snippet: string;
  lineIndex: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface PdfAnnotation {
  id: string;
  documentId: string;
  userId?: string;
  pageNumber: number;
  type: 'highlight' | 'note' | 'citation';
  rect: {
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
    width: number;
    height: number;
  };
  text?: string;
  note?: string;
  createdAt: string;
}

