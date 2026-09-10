# Project Rules for AI Assistants

This document establishes the mandatory engineering rules, architectural constraints, conventions, and security standards for **AskMyPDF**. Every AI assistant, pair programmer, and contributing engineer **must adhere strictly to these rules** at all times.

---

## 1. Prime Directive: Functionality Preservation

> [!CRITICAL]
> **NEVER break existing functionality unless explicitly requested by the user.**
> - Always verify that existing features (PDF ingestion, dual-engine Q&A, citation jump-and-pulse, chat history persistence per document, search within document, speech playback, markdown export) continue to work after any modification.
> - When refactoring, retain all existing prop interfaces, function signatures, and fallback mechanisms unless a breaking change is explicitly specified in the user prompt.
> - Preserve all existing comments, docstrings, and license tags.

---

## 2. Coding Standards

### 2.1 TypeScript & Type Safety
- **Strict Mode Compliance**: All TypeScript code must strictly adhere to the project's `tsconfig.json` (`strict: true`, `noImplicitAny: true`).
- **No Unsafe `any`**: Avoid `any` types wherever possible. Define explicit interfaces or types in `src/types.ts`. If an external library returns unstructured data, validate or narrow it with a type guard.
- **Shared Types**: Centralize all domain entities (`PdfDocument`, `DocumentPage`, `ChatMessage`, `Citation`, `ViewLayout`, `ReaderSidebarTab`, `DocumentSearchMatch`) in [src/types.ts](file:///d:/Project/AskMyPdf/src/types.ts). Do not redefine duplicate types in component files.

### 2.2 React 19 Best Practices
- **Functional Components**: Use standard functional components with TypeScript interfaces for props (e.g. `export const MyComponent: React.FC<MyProps> = (...) => { ... }`).
- **Controlled State**: Use React hooks (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`) predictably. Avoid mutating state objects directly; always use immutable updates (`setItems(prev => [...prev, newItem])`).
- **Clean Cleanup**: Any hook creating timers, event listeners, or Web Audio/Speech synthesis instances must clean them up in the `useEffect` return teardown.
- **Error Boundaries & Safe Fallbacks**: Network calls (`fetch('/api/chat')`, PDF loading) must always be wrapped in `try...catch` blocks with intuitive, user-friendly fallback handling.

### 2.3 Backend & Express Standards
- **Stateless Endpoints**: Handlers in `server.ts` must remain stateless. Do not store user documents or chat histories in global server variables.
- **Payload Limits**: Express JSON parser must retain the configured body limit (`express.json({ limit: '10mb' })`) to prevent denial-of-service memory exhaustion while accommodating multi-page parsed text.
- **Async Error Handling**: All async Express handlers must catch errors and return structured JSON responses:
  ```typescript
  res.status(500).json({ error: 'Descriptive error message', details: err.message });
  ```

---

## 3. Folder Structure Rules

The project enforces a strict, modular layout. Place all new files into their respective architectural directories:

```
AskMyPdf/
├── .env.example            # Template for environment configuration
├── decisions.md            # Architectural Decision Records (ADRs)
├── rules.md                # This rules file (AI constraints & standards)
├── memory.md               # Long-term project memory & technical state
├── phases.md               # Multi-phase project roadmap & milestone tracking
├── changelog.md            # Chronological release log
├── package.json            # Node.js dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration with Tailwind and custom plugins
├── server.ts               # Unified Express server & Vite middleware host
├── public/                 # Static public assets (icons, favicons)
└── src/
    ├── main.tsx            # React application entry point
    ├── App.tsx             # Root layout, dual-pane state & document routing
    ├── index.css           # Tailwind v4 import & custom typography styles
    ├── types.ts            # Central TypeScript domain interfaces
    ├── components/         # Pure & feature-specific React UI components
    │   ├── Header.tsx      # Top bar, document switcher, layout mode toggles
    │   ├── PdfViewer.tsx   # Document reader, sidebar, thumbnails, search & selection
    │   ├── ChatPanel.tsx   # Conversational research assistant, citation chips, TTS
    │   └── UploadModal.tsx # File dropzone modal & sample document selector
    ├── data/               # Seed datasets & static mock records
    │   └── sampleDocuments.ts # Curated sample documents with full text & metadata
    └── utils/              # Pure utility functions and domain logic
        ├── documentAssistant.ts # Dual-engine Q&A, prompt assembler & local fallback
        └── pdfParser.ts    # PDF.js text extraction & metadata generator
```

### Folder Placement Rules:
1. **New UI Components**: Place in `src/components/`. If a component exceeds 350 lines, split sub-components into a dedicated subfolder (e.g. `src/components/viewer/ThumbnailList.tsx`).
2. **Utilities & Services**: Pure functions, parsing algorithms, and API clients belong in `src/utils/`.
3. **Data & Mock Files**: Static documents, seed questions, and fixtures belong in `src/data/`.
4. **Backend Routes**: Express routes belong in `server.ts` or a modular `server/routes/` directory if endpoints exceed 5 handlers.

---

## 4. Naming Conventions

| Item | Convention | Example |
| :--- | :--- | :--- |
| **React Components** | PascalCase | `PdfViewer.tsx`, `ChatPanel.tsx` |
| **Component Props Interface** | PascalCase with `Props` suffix | `ChatPanelProps`, `HeaderProps` |
| **Utility / Helper Files** | camelCase | `pdfParser.ts`, `documentAssistant.ts` |
| **TypeScript Types & Interfaces** | PascalCase | `PdfDocument`, `ChatMessage` |
| **Constants & Enums** | UPPER_SNAKE_CASE | `SAMPLE_DOCUMENTS`, `PORT` |
| **CSS Classes** | Tailwind utilities or kebab-case | `markdown-body`, `no-scrollbar` |
| **Markdown Documentation** | lowercase kebab-case | `decisions.md`, `rules.md` |
| **Git Branches** | `type/short-description` | `feat/citation-anchors`, `fix/worker-url` |

---

## 5. UI/UX Consistency Rules

- **Design Aesthetic**: Premium, modern, clean executive design.
- **Color Palette**:
  - **Neutrals**: `slate-50` through `slate-900` for backgrounds, surfaces, text, and borders.
  - **Brand / Accent**: `indigo-600` for primary actions, badges, active tabs, and accent pulses.
  - **Subtle Highlights**: `amber-50` / `indigo-50` for active page highlights and quote blocks.
- **Dual-Pane Balance**:
  - Desktop view uses a balanced split: Viewer (`58%-60%`) and Assistant Chat (`40%-42%`).
  - Tablet/Mobile view uses responsive bottom navigation with clean toggles between `Document Reader` and `AI Assistant`.
  - Never allow content to overflow horizontally or create awkward double scrollbars.
- **Accessibility & Touch Targets**:
  - Interactive buttons and clickable elements must have a minimum touch target size of **42px** (`min-h-[42px]`) or adequate padding (`p-2`).
  - Provide descriptive `aria-label` or visible labels on icon-only buttons.
- **Typography & Markdown**:
  - All AI chat responses must render via `react-markdown` inside a container styled with `.markdown-body`.
  - Citation tags must be clearly differentiated as clickable chips: `[Page X]` rendered with an interactive icon.
- **Feedback & Micro-interactions**:
  - Loading states must display animated indicators (pulsing dots or spinners).
  - Copying actions must show a brief checkmark confirmation (`Copied!`).
  - Text-to-speech must visually highlight the active message being spoken.

---

## 6. Git Commit Rules

The repository adheres to the **Conventional Commits** specification:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Allowed Types:
- `feat`: A new feature (e.g., `feat(viewer): add thumbnail grid sidebar`)
- `fix`: A bug fix (e.g., `fix(parser): resolve text extraction line break issue`)
- `docs`: Documentation changes only (e.g., `docs: update memory.md with new roadmap`)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependency updates, or configuration

### Commit Guidelines:
- Write the summary line in lowercase imperative tense (e.g., `feat: add pdf export` NOT `Added pdf export`).
- Keep the first line under 72 characters.

---

## 7. Security & Environment Variable Rules

> [!WARNING]
> **Zero Credential Leakage Policy**

1. **Environment Variables**:
   - `GEMINI_API_KEY`: Strictly server-side. **NEVER** expose `GEMINI_API_KEY` to the client-side bundle or prefix it with `VITE_`.
   - Client code must only communicate with the AI engine via internal endpoints (`/api/chat`, `/api/summarize`).
   - Any new environment variable must be documented in [.env.example](file:///d:/Project/AskMyPdf/.env.example) with placeholder values.
2. **Never Commit Secrets**:
   - `.env` and `.env.local` are gitignored. Never hardcode API keys, tokens, or private URLs in code.
3. **User Document Privacy**:
   - Do not log full user document contents to server consoles in production.
   - Restrict logging to metadata (document title, page count, word count) for telemetry and debugging.
4. **Input Sanitization**:
   - Sanitize and limit client input lengths before passing them to LLM prompt templates to guard against prompt injection.

---

## 8. AI Assistant Workflow Rules

When working on this codebase, AI assistants must follow this loop:

1. **Consult Context First**: Before modifying architecture, check [memory.md](file:///d:/Project/AskMyPdf/memory.md) for current features, known issues, and database schemas.
2. **Review Past Decisions**: Check [decisions.md](file:///d:/Project/AskMyPdf/decisions.md) before proposing significant architectural or library changes.
3. **Record New Decisions**: If an architectural change or new pattern is introduced, append a new ADR entry to `decisions.md`.
4. **Log Updates**: Whenever completing a feature, fix, or deprecation, add the corresponding record to [changelog.md](file:///d:/Project/AskMyPdf/changelog.md).
5. **Update Memory & Roadmap**: Update `memory.md` and check off completed deliverables in [phases.md](file:///d:/Project/AskMyPdf/phases.md) whenever state models, endpoints, or features evolve.
6. **Verify Code Integrity**: Run `npm run lint` or `npx tsc --noEmit` to verify type safety before reporting completion.
