# Architecture & Product Decision Log

This document records every major technical, architectural, and product decision for **AskMyPDF**. Every entry follows an immutable structure explaining the context, alternatives evaluated, rationale, and project-wide implications.

---

## Decision Index

| ID | Title | Status | Date | Area |
| :--- | :--- | :--- | :--- | :--- |
| [DEC-001](#dec-001-dual-execution-ai-engine-server-side-gemini--client-side-grounded-engine) | Dual-Execution AI Engine (Server-Side Gemini + Client-Side Grounded Engine) | **Accepted** | 2026-09-08 | AI / Backend |
| [DEC-002](#dec-002-client-side-pdfjs-text-extraction-over-server-binary-uploads) | Client-Side PDF.js Text Extraction vs. Server Binary Uploads | **Accepted** | 2026-09-08 | Ingestion / Performance |
| [DEC-003](#dec-003-bracketed-page-citation-contract-page-x-with-regex-extraction) | Bracketed Page Citation Contract `[Page X]` with Regex Extraction | **Accepted** | 2026-09-09 | AI / UX |
| [DEC-004](#dec-004-document-keyed-chat-histories-isolated-in-memory-state) | Document-Keyed Chat Histories Isolated in Memory State | **Accepted** | 2026-09-09 | Frontend / State |
| [DEC-005](#dec-005-unified-express--vite-fullstack-dev-and-production-build) | Unified Express + Vite Fullstack Dev and Production Build | **Accepted** | 2026-09-09 | Tooling / Infrastructure |
| [DEC-006](#dec-006-tailwind-css-v4-via-tailwindcssvite-without-heavy-component-libraries) | Tailwind CSS v4 via `@tailwindcss/vite` Without Heavy Component Libraries | **Accepted** | 2026-09-10 | Styling / UI |

---

### DEC-001: Dual-Execution AI Engine (Server-Side Gemini + Client-Side Grounded Engine)

- **Date**: 2026-09-08
- **Status**: **Accepted**
- **Deciders**: Core Engineering Team

#### Context / Problem
Users need immediate, highly accurate answers grounded in their uploaded PDF documents. However, deployment environments (such as client demo sandboxes, local developer preview, or rate-limited API keys) might not always have an active, valid `GEMINI_API_KEY`. Relying strictly on server-side LLM calls breaks the app when the key is missing or when running completely offline.

#### Decision Taken
Implement a resilient **dual-engine architecture**:
1. **Primary**: Express backend endpoint `/api/chat` invoking `@google/genai` with `gemini-3.8-flash`, supplying structured page context, document metadata, and conversation history.
2. **Fallback**: If the API key is not present or the backend is unreachable, the frontend seamlessly invokes `generateLocalDocumentResponse()` in `src/utils/documentAssistant.ts`. This local engine performs keyword scoring, section intent detection, executive summaries, and extraction of key findings directly in the browser with page citations.

#### Reasoning
- Zero-friction developer onboarding: Any developer can clone, run `npm run dev`, and immediately interact with documents without configuring cloud credentials first.
- High resilience: API network errors, rate limits, or quota exhaustion gracefully degrade to client-side grounded answers rather than displaying generic error screens.
- Cost efficiency: Common document queries (e.g. summaries or key takeaways) can be serviced even when API usage needs to be constrained.

#### Alternatives Considered
1. **Hard Server-Only LLM**: Block UI or render error toasts whenever `GEMINI_API_KEY` is missing. Rejected due to poor developer experience and brittle demo stability.
2. **Pure Client-Side In-Browser LLM (WebLLM / Transformers.js)**: Downloaded multi-gigabyte ONNX models into browser cache. Rejected due to extreme bandwidth overhead, slow startup times, and poor mobile device performance.

#### Impact on Project
- All assistant communication goes through `src/utils/documentAssistant.ts`, which abstracts server vs. local resolution transparently.
- Responses always guarantee the same data shape (`{ content: string, citations: Citation[] }`).
- Server `/api/health` reports `hasGeminiKey` so client UI can inform users of active mode if needed.

---

### DEC-002: Client-Side PDF.js Text Extraction vs. Server Binary Uploads

- **Date**: 2026-09-08
- **Status**: **Accepted**
- **Deciders**: Core Engineering Team

#### Context / Problem
PDF files can range from tiny 50 KB documents to 50 MB corporate annual reports. Uploading multi-megabyte binary PDFs to the backend consumes server memory, requires multipart streaming, storage infrastructure (S3/Cloud Storage), and creates privacy/compliance concerns for sensitive corporate documents.

#### Decision Taken
Use `pdfjs-dist` inside the client browser to extract text page-by-page directly upon file selection:
- The raw text items are collected per page, alongside auto-inferred page titles and dominant keyword frequency.
- The binary PDF stays local as a `blob:` URL in browser memory for rendering.
- Only parsed JSON page payloads (`{ pageNumber, title, content }`) are sent over `/api/chat`.

#### Reasoning
- **Privacy First**: Sensitive documents never have their raw binary files stored on disk or in remote third-party buckets.
- **Low Server Overhead**: The backend remains stateless and lightweight; no local disk caching or file cleanup cron jobs required.
- **Instant Client Feedback**: Extraction progress is shown in real-time in the client upload modal.

#### Alternatives Considered
1. **Server-Side Multer + PDF-Parse / Poppler**: Upload raw binary to Express, parse on Node.js. Rejected because it requires disk management, increases Node memory pressure, and demands multipart file upload security measures.
2. **Google Cloud Document AI / Gemini File API**: Upload PDFs directly to Google Gemini Files API. Rejected for the baseline tier because it requires cloud storage authentication, increases latency for small documents, and prevents offline fallback.

#### Impact on Project
- `src/utils/pdfParser.ts` contains the parsing worker configuration and page text extraction logic.
- Graceful fallbacks exist if PDF.js fails on image-only scanned documents.

---

### DEC-003: Bracketed Page Citation Contract `[Page X]` with Regex Extraction

- **Date**: 2026-09-09
- **Status**: **Accepted**
- **Deciders**: Core Engineering & Product Design

#### Context / Problem
Users do not trust generative AI answers unless they can verify the exact claim against the source document. Traditional AI chat responses often hallucinate page references or provide non-interactive text notes that force users to manually hunt through dozens of pages.

#### Decision Taken
Standardize on a strict, system-prompted bracketed citation contract: `[Page X]` or `[Page X, Section Header]`.
- Prompt instructions mandate that every factual assertion contains bracketed citations.
- Both server (`server.ts`) and client (`documentAssistant.ts`) execute the regex:
  ```regex
  /\[(?:Page|P\.)\s*(\d+)(?:[,\s]+([^\]]+))?\]/gi
  ```
- The frontend renders these citations as interactive clickable badges that trigger `handleJumpToPage(pageNumber)`.
- When clicked, the PDF reader smoothly scrolls to the target page and applies a temporary pulse/glow highlight.

#### Reasoning
- Markdown friendly: Easy for LLMs to generate reliably with minimal prompt overhead.
- Universal UX: Allows both inline interactive badges and a dedicated "Sources & References" chip list under each message.
- Deep linking: Links the conversational pane directly to the document viewer pane.

#### Alternatives Considered
1. **Structured JSON Output Mode (`responseSchema`)**: Enforce Gemini tool calls or JSON output format. Rejected because streaming Markdown with rich headers and bullet points provides better conversational rendering than raw JSON payloads.
2. **Fuzzy Text Snippet Matching**: Attempting to highlight exact words on the rendered canvas. Rejected as MVP phase due to layout variation and OCR divergence, though retained in roadmap for future coordinate-based highlighting.

#### Impact on Project
- Markdown renderer in `ChatPanel.tsx` handles citation pills seamlessly.
- `PdfViewer.tsx` exposes `targetCitationPage` prop to trigger auto-scroll and pulse animations.

---

### DEC-004: Document-Keyed Chat Histories Isolated in Memory State

- **Date**: 2026-09-09
- **Status**: **Accepted**
- **Deciders**: Frontend Engineering

#### Context / Problem
AskMyPDF allows users to switch between multiple documents (sample datasets or uploaded files). If all messages share a single linear chat history, switching documents corrupts context: questions about a Clean Energy report would bleed into questions about a FinTech regulation paper.

#### Decision Taken
Store chat messages in a map keyed by document ID:
```typescript
const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({
  [docId]: [ ...messages ]
});
```
- When a document is selected, the active conversation is derived via `chatHistories[currentDoc.id] || []`.
- If a document has never been viewed, a welcoming context seed is automatically populated with page stats and starter prompts.
- Clearing chat only clears the active document's history.

#### Reasoning
- Prevents cross-document hallucinations in conversation memory sent to `/api/chat`.
- Enables rapid switching between multiple research papers without losing user notes or query history.
- Simple, predictable state flow without external Redux or Zustand dependencies.

#### Alternatives Considered
1. **Global Linear Chat**: Single message array. User has to clear chat when switching docs. Rejected due to terrible user experience.
2. **Browser LocalStorage Persistence**: Save all histories to `localStorage`. Deferred to v0.3 because large documents and extensive transcripts can exceed the 5 MB `localStorage` quota.

#### Impact on Project
- `App.tsx` acts as the single source of truth for `chatHistories`.
- Exports (`handleExportChat`) cleanly export only the active document's conversational transcript as Markdown.

---

### DEC-005: Unified Express + Vite Fullstack Dev and Production Build

- **Date**: 2026-09-09
- **Status**: **Accepted**
- **Deciders**: DevOps / Fullstack Engineering

#### Context / Problem
Running separate frontend dev servers (e.g. Vite on port 5173) and backend servers (Express on port 3000) causes CORS configuration issues, port collisions, and complex multi-process management.

#### Decision Taken
Implement a single-entry unified server architecture in `server.ts`:
- **Development**: `tsx server.ts` starts Express, which embeds Vite in middleware mode (`createViteServer({ server: { middlewareMode: true }, appType: 'spa' })`). Vite handles HMR and frontend compilation seamlessly on `http://0.0.0.0:3000`.
- **Production**: `npm run build` runs `vite build` to output static assets to `dist/`, then bundles `server.ts` into `dist/server.cjs` via `esbuild`. In production mode, Express serves the static `dist/` directory.

#### Reasoning
- Single port (`3000`) for both API endpoints and the single-page application.
- Eliminates CORS issues entirely since all requests are same-origin (`/api/*`).
- One-command startup for developers (`npm run dev`).
- Cloud-native ready: Perfectly aligns with Google Cloud Run, AI Studio applets, Docker containers, and Heroku/Render deployments.

#### Alternatives Considered
1. **Separate Frontend & Backend Repositories**: High maintenance overhead for a focused single-purpose application.
2. **Vite Proxy (`vite.config.ts` proxy to Express)**: Requires launching two processes concurrently (e.g. via `concurrently` or `npm-run-all`), adding fragility on Windows and headless environments.

#### Impact on Project
- `package.json` scripts: `dev`, `build`, `start`, `clean`.
- Single `.env` configuration shared between backend and build tools.

---

### DEC-006: Tailwind CSS v4 via `@tailwindcss/vite` Without Heavy Component Libraries

- **Date**: 2026-09-10
- **Status**: **Accepted**
- **Deciders**: Frontend & Design

#### Context / Problem
Document viewers require responsive split panes, floating action tooltips, custom scrollbars, and high-performance layout re-renders. Heavy third-party component libraries (e.g., Material UI, Ant Design) introduce massive CSS bundles, conflicting style overrides, and rigid layout constraints.

#### Decision Taken
Adopt **Tailwind CSS v4** utilizing `@tailwindcss/vite` with pure CSS imports (`@import "tailwindcss";` in `src/index.css`):
- All UI components are custom built with Tailwind utility classes.
- Lucide React is used for crisp, lightweight iconography.
- Subtle micro-animations and smooth layout transitions are managed via utility classes and CSS transitions.

#### Reasoning
- Minimal bundle size and near-instant Vite HMR build speeds.
- Full design flexibility to craft a custom aesthetic (slate/indigo palette, clean typography, dual-pane borders, interactive badges).
- No hydration bugs or React 19 version mismatches often caused by legacy component libraries.

#### Alternatives Considered
1. **Tailwind CSS v3 with PostCSS**: Standard configuration with `tailwind.config.js`. Migrated to Tailwind v4 for native Vite plugin integration and faster compile times.
2. **Shadcn UI / Radix Primitives**: Adds extra dependencies and configuration files. Deferred until complex accessibility primitives (like nested dropdown menus) are required.

#### Impact on Project
- Clean, maintainable JSX in `src/components/`.
- Custom typography rules defined in `src/index.css` for `.markdown-body`.

---

### DEC-006: Node 24 Native SQLite (`DatabaseSync`) for Relational Persistence

- **Date**: 2026-09-10
- **Status**: **Approved & Implemented**

#### Context / Problem
Phase 5 required persistent database storage conforming to the schema documented in `memory.md` (`users`, `workspaces`, `documents`, `document_pages`, `chat_sessions`, `chat_messages`, `annotations`). Native C++ SQLite modules (`better-sqlite3`, `sqlite3`) frequently fail to compile on developer and enterprise Windows systems without Visual Studio Build Tools.

#### Decision Taken
Utilize Node 24's built-in `node:sqlite` module (`DatabaseSync`). It provides synchronous execution, write-ahead logging (WAL), full foreign key support with cascading deletes, and in-memory test databases without external native binary dependencies.

#### Reasoning
- Zero compilation or platform installation hurdles on Windows, macOS, or Linux.
- 100% compliant SQL with foreign keys (`PRAGMA foreign_keys = ON;`).
- Fast, synchronous API ideal for high-throughput local and containerized usage.
- Sub-millisecond queries for document pages and chat sessions.

#### Alternatives Considered
1. **better-sqlite3**: Excellent performance but requires `node-gyp` and Python/C++ compiler on Windows.
2. **PostgreSQL / Supabase**: Requires external network credentials or Docker daemon running during basic development and tests.

#### Impact on Project
- Full persistent relational backend implemented in `src/server/db/database.ts`.
- Zero new build tools or native dependencies required.

---

### DEC-007: Native PDF Annotation Objects via pdf-lib with Disabled Object Streams

- **Date**: 2026-09-10
- **Status**: **Approved & Implemented**

#### Context / Problem
Phase 5 required downloading PDFs with user highlights and AI citations embedded as native PDF annotation objects viewable in Adobe Acrobat, Apple Preview, and standard PDF readers.

#### Decision Taken
Implement `annotatedPdfExport.ts` using `pdf-lib` to construct native `/Highlight` and `/Text` (sticky comment) annotation dictionaries registered directly in each page's `/Annots` array. Explicitly disable object stream compression (`useObjectStreams: false`) during save.

#### Reasoning
- Disabling object streams keeps annotation dictionaries uncompressed and immediately parseable by legacy viewers, security scanners, and automated test suites.
- Using `PDFName.of('Annot')` and `PDFName.of('Highlight')` ensures valid PDF spec token generation.
- Full offline client and server compatibility.

#### Alternatives Considered
1. **Client canvas screenshot export**: Loses native text selection and native Acrobat annotation tree.
2. **PDF.js AnnotationStorage serialization**: Read-only rendering in browser without native binary save support.

#### Impact on Project
- Seamless "Export Annotated PDF" button in Header allowing instant download of publication-ready PDFs with native highlight objects.

