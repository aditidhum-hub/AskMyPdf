# Changelog

All notable changes to **AskMyPDF** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-10 (Phase 5: Cloud Persistence, Auth & Enterprise)

### Added
- **Persistent Relational Database**:
  - Implemented [src/server/db/database.ts](file:///d:/Project/AskMyPdf/src/server/db/database.ts) using Node 24 native `DatabaseSync` (`node:sqlite`).
  - Strict schema adherence to `memory.md`: `users`, `workspaces`, `documents`, `document_pages`, `chat_sessions`, `chat_messages`, and `annotations`.
  - Enforced foreign keys with `ON DELETE CASCADE` and WAL mode.
- **Enterprise Authentication & Private Workspaces**:
  - Implemented [src/server/auth.ts](file:///d:/Project/AskMyPdf/src/server/auth.ts) with crypto.scryptSync salted hashing and HMAC-SHA256 session tokens.
  - Added REST endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/workspaces`, `POST /api/workspaces`.
  - Added [src/components/AuthModal.tsx](file:///d:/Project/AskMyPdf/src/components/AuthModal.tsx) for glassmorphic user authentication, profile display, and workspace switching.
- **Native Annotated PDF Export**:
  - Implemented [src/utils/annotatedPdfExport.ts](file:///d:/Project/AskMyPdf/src/utils/annotatedPdfExport.ts) using `pdf-lib`.
  - Generates Adobe Acrobat and Apple Preview compliant PDF files with native `/Highlight` and `/Text` (sticky comment) annotation dictionaries.
  - Added "Annotated PDF" download action button to application Header.
- **Security & Rate Limiting**:
  - Protected AI generation and authentication endpoints via `express-rate-limit`.
  - Added multi-stage production [Dockerfile](file:///d:/Project/AskMyPdf/Dockerfile) and [docker-compose.yml](file:///d:/Project/AskMyPdf/docker-compose.yml).
- **Automated Verification Suite (`npm run test:phase5`)**:
  - Added [test/phase5.test.ts](file:///d:/Project/AskMyPdf/test/phase5.test.ts) covering authentication, SQLite persistence, cascade deletions, chat sessions, PDF annotation bytecode, and rate limiting.

---

## [0.4.0] - 2026-09-10

### Added
- **Hybrid RAG & Vector Retrieval Engine**:
  - Implemented [src/utils/ragEngine.ts](file:///d:/Project/AskMyPdf/src/utils/ragEngine.ts) with `InMemoryVectorIndex` supporting dense vector cosine similarity and sparse keyword scoring.
  - Implemented configurable sliding-window text chunker (`chunkDocument`) with word overlap prevention.
  - Added unit-normalized dense term embeddings (`computeTermEmbedding`) and cosine similarity ranking.
- **Cross-Document Comparative Analysis**:
  - Added `askComparativeAssistant` in [src/utils/documentAssistant.ts](file:///d:/Project/AskMyPdf/src/utils/documentAssistant.ts) allowing multi-document semantic queries with dual source citations.
- **Phase 4 Automated Test Suite (`npm run test:phase4`)**:
  - Added [test/phase4.test.ts](file:///d:/Project/AskMyPdf/test/phase4.test.ts) covering chunking, vector normalization, cosine math, hybrid retrieval ranking, multi-document comparison, and large-corpus sub-millisecond scaling.

---

## [0.3.0] - 2026-09-10

### Added
- **In-Browser OCR Pipeline**:
  - Integrated `tesseract.js` via [src/utils/ocrEngine.ts](file:///d:/Project/AskMyPdf/src/utils/ocrEngine.ts) to detect image-only scanned pages and transcribe text.
  - Added `isOcr: boolean` indicator badge to document pages.
- **Dynamic Citation Bounding Box Highlights**:
  - Added visual bounding box highlight overlay directly on document pages when citations are referenced.
  - Added normalized coordinate extraction (`0%` to `100%`) for responsive overlays across screen sizes.
- **Dual Display Modes (Text vs. Visual Canvas)**:
  - Added toolbar toggle for **Text Reader View** and **Visual Canvas View** in [PdfViewer.tsx](file:///d:/Project/AskMyPdf/src/components/PdfViewer.tsx).
- **Offline Worker Infrastructure**:
  - Bundled worker scripts in [public/workers/pdf.worker.min.mjs](file:///d:/Project/AskMyPdf/public/workers/pdf.worker.min.mjs) and [public/workers/pdf.worker.min.js](file:///d:/Project/AskMyPdf/public/workers/pdf.worker.min.js).
- **Phase 3 Automated Test Suite (`npm run test:phase3`)**:
  - Added [test/phase3.test.ts](file:///d:/Project/AskMyPdf/test/phase3.test.ts) verifying offline worker files, OCR detection thresholds, synthetic fallback, normalized bounding boxes, and display mode state.

---

## [0.2.0] - 2026-09-10

### Added
- **Server-Side Gemini 3.8 Flash Integration**: Added `/api/chat` and `/api/summarize` endpoints using `@google/genai` with strict bracketed page citation instructions.
- **Dual-Engine Architecture**: Implemented automatic fallback to in-browser local document engine in `src/utils/documentAssistant.ts` when running offline or without `GEMINI_API_KEY`.
- **Interactive Deep-Linking Citations**:
  - Citation tags `[Page X]` in chat answers are rendered as interactive clickable badges.
  - Clicking a badge smoothly scrolls the document viewer to the targeted page and triggers a 3-second visual pulse animation.
- **Selection Floating Action Tooltip**:
  - Highlighting text in the PDF reader exposes a floating "Ask AI about selection" button.
  - Pre-populates a scoped query to the assistant referencing the specific excerpt.
- **Transcript Markdown Export**:
  - Added export modal and utility in `App.tsx` to download the active conversation history with metadata and source citations as a clean `.md` file.
- **Text-to-Speech (TTS) Integration**:
  - Added speech synthesis controls to chat messages via the Web Speech API with pause, resume, and active speaking indicators.
- **Document Search & Match Stepper**:
  - Added in-reader search bar with match counter, next/previous match buttons, and real-time text highlighting.
- **Phase 1 Automated Test Suite (`npm run test:phase1`)**:
  - Added [test/phase1.test.ts](file:///d:/Project/AskMyPdf/test/phase1.test.ts) verifying sample documents, citation regex extraction, search match algorithms, fallback query synthesis, and API health.
- **Phase 2 Automated Test Suite (`npm run test:phase2`)**:
  - Added [test/phase2.test.ts](file:///d:/Project/AskMyPdf/test/phase2.test.ts) testing server health validation, `/api/chat` validation, `/api/summarize`, dual-engine fallback, multi-document chat isolation, transcript export, and inline citation transforms.
- **Interactive Inline Markdown Citation Badges**:
  - Transformed bracketed citations inside assistant responses into clickable button pills right within the text via custom `ReactMarkdown` component routing.
- **Local PDF.js Web Worker**:
  - Bundled `/pdf.worker.min.mjs` directly in `public/` and configured [src/utils/pdfParser.ts](file:///d:/Project/AskMyPdf/src/utils/pdfParser.ts) for offline, air-gapped PDF ingestion.
- **AI Persistent Documentation Context**:
  - Added `decisions.md` (Architecture Decision Records).
  - Added `rules.md` (Coding standards, folder structure, security, and prime directives).
  - Added `memory.md` (System memory, tech stack, API endpoints, schema, and business logic).
  - Added `phases.md` (Project phasing roadmap, timelines, and acceptance criteria).
  - Added `changelog.md` (Version tracking and change records).

### Changed
- **Tailwind CSS v4 Migration**: Upgraded styling to Tailwind v4 via `@tailwindcss/vite` and unified custom markdown styling rules in `src/index.css`.
- **Chat State Isolation**: Refactored `chatHistories` state in `App.tsx` from a single array to a dictionary keyed by document ID (`Record<string, ChatMessage[]>`) to prevent cross-document memory bleeding.
- **Page Context Assembly**: Enhanced prompt formatting to include document summary, active viewed page indicator, and page scoping.

### Fixed
- **Mobile Split View Collision**: Fixed layout overflow on smaller screens by adding a dedicated mobile bottom navigation bar toggling between `Document Reader` and `AI Assistant`.
- **PDF.js Fallback on Worker Failure**: Added safe structured text fallback in `src/utils/pdfParser.ts` if the external worker fails to load or parse corrupted binaries.
- **Chat Textarea Auto-Resize**: Corrected auto-expanding input field behavior in `ChatPanel.tsx` to cap smoothly at 140px.

---

## [0.1.0] - 2026-09-08

### Added
- **Core Document Viewer & Split-Pane Workspace**:
  - Dual-pane layout featuring an interactive PDF reader and conversational assistant.
  - Page navigation controls, zoom in/out, fit-to-width, and jump-to-page input.
  - Sidebar with thumbnail previews and document executive summaries.
- **Client-Side PDF Ingestion Pipeline**:
  - Integrated `pdfjs-dist` to extract text, calculate word counts, and infer page titles in-browser without server upload.
  - Drag-and-drop file upload modal with progress indicators.
- **Curated Sample Knowledge Base**:
  - Included preloaded documents:
    1. *Global Clean Energy & Grid Transition Report 2026* (Finance / Energy)
    2. *Autonomous Systems & Edge AI Architecture* (Technology / AI)
    3. *Cross-Border FinTech Compliance & Digital Assets Directive* (Legal / FinTech)
  - Preloaded executive summaries, key findings, and starter prompt suggestions.
- **Fullstack Dev Server**:
  - Created unified `server.ts` utilizing Express with embedded Vite middleware for seamless same-port development (`http://0.0.0.0:3000`).
  - Added build pipeline using `vite build` and `esbuild` for production bundle generation.

---

## Change Categories Reference

| Category | Description |
| :--- | :--- |
| **Added** | For new features and capabilities introduced to the platform. |
| **Changed** | For changes in existing functionality, refactors, or UI updates. |
| **Deprecated** | For soon-to-be-removed features. |
| **Removed** | For now-removed features. |
| **Fixed** | For any bug fixes. |
| **Security** | In case of vulnerabilities or authentication improvements. |
