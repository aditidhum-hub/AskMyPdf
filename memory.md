# Project Memory: AskMyPDF

This document serves as the persistent, long-term technical memory for **AskMyPDF**. It maintains the current state of features, technical stack, architecture, schemas, business logic, known limitations, and active roadmap items.

---

## 1. Project Overview

**AskMyPDF** is an intelligent, privacy-conscious AI-powered document research assistant. It enables knowledge workers, researchers, financial analysts, and legal teams to upload and analyze complex PDF documents, execute grounded Q&A with verifiable page citations, navigate synchronized dual-pane views, extract executive summaries, and search text with deep-link navigation.

### Key Value Propositions
- **Precision Grounding**: Every answer cites exact source pages `[Page X]` and allows instantaneous 1-click scroll navigation with visual pulse highlights.
- **Dual Engine Resilience**: Operates via server-side Google Gemini 3.8 Flash or automatically falls back to an in-browser client document synthesis engine when offline or without an API key.
- **Privacy First**: Documents are parsed locally via PDF.js; raw binaries are never permanently stored on external disks.
- **Dual-Pane Experience**: Interactive document reader on the left and dynamic AI conversational research assistant on the right.

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | `^19.0.1` | UI component tree, hooks, rendering |
| **Frontend DOM** | React DOM | `^19.0.1` | Virtual DOM mount and browser bindings |
| **Language** | TypeScript | `~5.8.2` | End-to-end static type safety |
| **Styling** | Tailwind CSS | `^4.1.14` | Modern styling via `@tailwindcss/vite` |
| **Build & Dev Tool** | Vite | `^6.2.3` | Ultra-fast HMR and frontend asset bundler |
| **Server Runtime** | Express | `^4.21.2` | REST API endpoints & production static host |
| **Dev Execution** | tsx | `^4.21.0` | Direct TypeScript execution for server without manual compile steps |
| **Prod Bundler** | esbuild | `^0.25.0` | Bundles `server.ts` into a lightweight CJS single-file server |
| **AI SDK** | `@google/genai` | `^2.4.0` | Official Google GenAI SDK running Gemini 3.8 Flash |
| **PDF Ingestion** | `pdfjs-dist` | `^6.3.289` | In-browser client-side PDF text extraction |
| **Icons** | Lucide React | `^0.546.0` | Clean, modern SVG icon set |
| **Markdown Rendering**| `react-markdown` | `^10.1.0` | Renders structured AI markdown responses |
| **Environment** | `dotenv` | `^17.2.3` | Loads `.env` configuration securely on server |

---

## 3. Features Completed

- [x] **Client-Side PDF Ingestion (`src/utils/pdfParser.ts`)**:
  - Drag-and-drop or file picker PDF upload modal.
  - In-browser text extraction using `pdfjs-dist` Web Worker.
  - Page-by-page word count calculation and automated key topic frequency analysis.
  - Fallback text parser when PDF.js worker encounters scanned media or binary limitations.
- [x] **Curated Sample Dataset (`src/data/sampleDocuments.ts`)**:
  - Preloaded multi-page real-world documents (Clean Tech Investment Report 2026, Autonomous Systems Whitepaper, FinTech Compliance).
  - Seeded summaries, key takeaways, and suggested query chips.
- [x] **Dual-Engine AI Chat Assistant (`src/utils/documentAssistant.ts`)**:
  - **Server Engine**: `/api/chat` with `gemini-3.8-flash`, temperature 0.2, and system instructions enforcing bracketed page citations.
  - **Client Fallback Engine**: Local document search & extraction algorithm providing summaries, key findings, and topic extraction even with no internet/API key.
- [x] **Interactive Page Citations & Deep Linking**:
  - Regex detection of `[Page X]` citations.
  - Rendering citations as clickable interactive badges.
  - Clicking any citation automatically scrolls the PDF reader to that page and fires a 3-second visual pulse animation.
- [x] **Interactive Text Selection Floating Tooltip**:
  - Highlight any text in the PDF reader to trigger a floating "Ask AI about selection" button.
  - Automatically sends a scoped prompt to the assistant referencing that specific excerpt.
- [x] **Document Search & Hit Navigation**:
  - In-reader search bar with query highlight, occurrence count, and next/prev match scrolling.
- [x] **Multi-Document Isolated State (`src/App.tsx`)**:
  - Independent chat history maps keyed by document ID (`Record<string, ChatMessage[]>`).
  - Switching documents preserves active conversations and auto-populates helpful welcome messages.
- [x] **Accessibility & Audio Features**:
  - Text-to-Speech (TTS) integration using the browser Web Speech API with pause/resume and active speaking indicators.
  - One-click copy message content to clipboard with confirmation checkmark.
- [x] **Transcript Markdown Export**:
  - Generates and downloads a clean Markdown file containing full Q&A transcripts with source citation references.
- [x] **Responsive Layout Modes**:
  - Desktop: Split pane (`60% / 40%`).
  - Mobile: Fullscreen reader mode or assistant mode with bottom navigation bar.

---

## 4. Pending Features & Roadmap

- [x] **OCR for Image-Only PDFs**: Integrated Tesseract.js client OCR pipeline and bounding box generator in `src/utils/ocrEngine.ts`.
- [x] **Vector Database & Chunked Embeddings (RAG)**: In-memory vector store with sliding-window chunking, dense cosine similarity, and sparse BM25 keyword scoring in `src/utils/ragEngine.ts`.
- [x] **Multi-Document Cross-Analysis**: Cross-document comparative query synthesis with dual-source citations via `askComparativeAssistant`.
- [x] **Visual PDF Canvas Highlighting**: Interactive bounding box highlights overlaid on referenced citation anchors and OCR regions.
- [x] **User Authentication & Cloud Workspaces**: User login with secure scrypt hashing, cryptographic session tokens, and workspace folder isolation.
- [x] **Persistent SQLite Database (`askmypdf.db`)**: Relational document, chunk, page, chat session, and annotation storage with foreign key cascade deletions.
- [x] **Annotated PDF Export**: Export downloaded PDFs with AI citations and user notes embedded as native PDF `/Highlight` and `/Text` annotation objects.
- [x] **Enterprise Telemetry & Rate Limiting**: Production rate limiting on auth and AI endpoints via `express-rate-limit`, with multi-stage Docker and docker-compose configurations.

---

## 5. API Endpoints Specification

All endpoints are hosted on the unified Express server running on port `3000` (or `process.env.PORT`).

### 5.1 `GET /api/health`
Checks server status and reports whether Gemini credentials are configured.
- **Request**: `GET /api/health`
- **Response**:
  ```json
  {
    "status": "ok",
    "appName": "AskMyPDF",
    "hasGeminiKey": true
  }
  ```

### 5.2 `POST /api/chat`
Submits a user query grounded against the active document's page contents.
- **Request Body**:
  ```typescript
  {
    question: string;
    documentTitle?: string;
    documentSummary?: string;
    pages: Array<{ pageNumber: number; title?: string; content: string }>;
    activePage?: number;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "answer": "Battery storage installations grew by 140% [Page 2]...",
    "citations": [
      {
        "pageNumber": 2,
        "snippet": "BESS capex dropped 28% to $112/kWh...",
        "heading": "Battery Chemistries"
      }
    ],
    "model": "gemini-3.8-flash"
  }
  ```
- **Fallback Response (200 OK with `fallback: true`)**:
  Returned when `GEMINI_API_KEY` is missing on server, directing the frontend to invoke the local document engine.
- **Error Response (400 / 500)**:
  ```json
  {
    "error": "Failed to generate response via Gemini API",
    "details": "Error message details"
  }
  ```

### 5.3 `POST /api/summarize`
Generates an executive summary and 5 core quantitative takeaways with page citations.
- **Request Body**:
  ```typescript
  {
    documentTitle: string;
    pages: Array<{ pageNumber: number; content: string }>;
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "summary": "### Executive Summary\n\n1. Global investment reached $1.85T [Page 1]..."
  }
  ```

---

## 6. Database & State Schema Summary

Currently, AskMyPDF operates with **in-memory and client-side reactive state** for zero latency and privacy. Below are the canonical interfaces:

### In-Memory Domain Models ([src/types.ts](file:///d:/Project/AskMyPdf/src/types.ts))

```typescript
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
  size: number;
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
```

### Planned Persistent Relational Schema (PostgreSQL / SQLite)

When migrating to persistent database storage, the schema will map as follows:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    page_count INT NOT NULL,
    word_count INT NOT NULL,
    category VARCHAR(50) DEFAULT 'custom',
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE document_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    title VARCHAR(255),
    content TEXT NOT NULL,
    key_topics TEXT[]
);

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    citations JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 7. Important Business Logic

### 7.1 Citation Extraction Algorithm
The system enforces strict page bracket syntax. Both client and server parse citations using the regular expression:
```typescript
const regex = /\[(?:Page|P\.)\s*(\d+)(?:[,\s]+([^\]]+))?\]/gi;
```
When matches are detected, duplicates are filtered and mapped to corresponding `DocumentPage` objects to extract context snippets (first 150 characters) and section titles.

### 7.2 Active Page Biasing & Context Injection
When sending a query:
- If the user is currently viewing Page 3, `activePage: 3` is forwarded to the API.
- The prompt instructs Gemini: `ACTIVE VIEWED PAGE: Page 3`.
- If the user checks "Filter to current page only" in `ChatPanel.tsx`, the prompt prepends `[Page X Scope]` so the model prioritizes answers from that specific page.

### 7.3 Grounded Local Fallback Engine
When backend calls fail or `GEMINI_API_KEY` is not found, `generateLocalDocumentResponse()` analyzes keyword density against the document's pages, handles queries containing intents like `summarize`, `key findings`, `risks`, or `metrics`, and formats a structured response with page citations extracted from the highest-scoring pages.

---

## 8. Known Issues & Limitations

1. **PDF.js Worker in Strictest Offline / CSP Environments**:
   - In `pdfParser.ts`, the worker source points to Cloudflare CDN:
     ```typescript
     pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
     ```
   - In environments without external internet access, PDF.js falls back to the safe structured text placeholder. Bundling the worker script locally in `public/` is scheduled for v0.3.
2. **Scanned Image-Only PDFs**:
   - PDFs that consist entirely of scanned images without an embedded text layer yield empty text strings from PDF.js. An OCR step is needed for full support.
3. **Large Document Token Limits**:
   - Documents with 100+ pages of dense text may approach model context limits when all page contents are concatenated into `promptText`. Chunking and vector search (RAG) will resolve this for massive files.
