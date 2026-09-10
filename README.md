# AskMyPDF 🤖📄

AI-powered PDF research assistant. Chat with any PDF document, extract insights, view pages with interactive citations, and export annotated PDFs.

## Architecture

```
User Browser → [frontend/ (Vite + React 19)] 
                     ↓ (REST API /api)
               [backend/ (Node.js + Express)] → [SQLite (node:sqlite) / Gemini 3.8 Flash]
```

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 19 + Vite 6 + Tailwind CSS v4 | PDF Viewer, Dual Engine Assistant, OCR & RAG, Citations |
| **Backend** | Node.js + Express + `node:sqlite` | REST API, Auth, Sessions, Workspaces, Gemini Integration |
| **Database** | SQLite (`node:sqlite`) | Persistent relational database (Zero configuration required) |
| **AI** | Google Gemini 3.8 Flash | Generative AI document synthesis with grounding |

---

## Local Development & Quick Start

### Prerequisites
- Node.js 22+ (native `node:sqlite` built-in)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com) (optional; dual-engine fallback works offline)

### 1. Unified Root Commands
From the project root, you can orchestrate everything:
```bash
# Install dependencies
npm install
cd frontend && npm install && cd ../backend && npm install && cd ..

# Run all 5 Phase verification suites (Phase 1 - 5)
npm test

# Build both frontend and backend production bundles
npm run build

# Typecheck and lint both frontend and backend
npm run lint
```

### 2. Running Services Locally
Open two terminal windows:

**Terminal 1 (Backend API - Port 3000):**
```bash
npm run dev:backend
# Starts Express server at http://localhost:3000
```

**Terminal 2 (Frontend UI - Port 5173):**
```bash
npm run dev:frontend
# Starts Vite dev server at http://localhost:5173 with API proxy
```

Open [http://localhost:5173](http://localhost:5173) in your browser. All `/api` calls proxy seamlessly to the backend on `:3000`.

---

## Deployment

### Step 1 — Deploy Backend on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
4. Add **Environment Variables**:
   ```
   DATABASE_URL        → (from your Render PostgreSQL addon)
   GEMINI_API_KEY      → your-gemini-key
   ASKMYPDF_JWT_SECRET → a-long-random-secret-string
   FRONTEND_URL        → https://your-project.vercel.app  (update after Vercel deploy)
   NODE_ENV            → production
   ```
5. Add a **PostgreSQL addon**: New → PostgreSQL → link it to this service (auto-sets `DATABASE_URL`)
6. Deploy → copy the URL: `https://your-backend.onrender.com` ✅

### Step 2 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite (auto-detected)
4. Add **Environment Variable**:
   ```
   VITE_API_URL → https://your-backend.onrender.com
   ```
5. Deploy → copy the URL: `https://your-project.vercel.app` ✅

### Step 3 — Connect Render to Vercel

Go back to **Render → Backend → Environment Variables** and update:
```
FRONTEND_URL = https://your-project.vercel.app
```
Save and redeploy.

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `GEMINI_API_KEY` | ✅ | Google AI API key |
| `ASKMYPDF_JWT_SECRET` | ✅ | Secret for signing auth tokens (min 32 chars) |
| `FRONTEND_URL` | ✅ | Vercel frontend URL for CORS |
| `PORT` | ❌ | Server port (Render sets this automatically) |
| `NODE_ENV` | ❌ | `production` in deployment |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Your Render backend URL |

---

## Running Tests

```bash
cd backend
npm install
npx prisma generate
npm test    # Runs all 38 tests across Phases 1–5
```

---

## Project Structure

```
AskMyPdf/
├── frontend/               ← Vercel (React + Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/     (Header, PdfViewer, ChatPanel, AuthModal, UploadModal)
│   │   ├── utils/          (pdfParser, documentAssistant, ragEngine, ocrEngine, annotatedPdfExport)
│   │   ├── data/           (sampleDocuments)
│   │   └── types.ts
│   ├── public/             (pdf.worker.min.mjs, workers/)
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                ← Render (Express + Prisma)
│   ├── server.ts
│   ├── src/
│   │   ├── auth.ts
│   │   ├── db/database.ts  (Prisma repository layer)
│   │   └── types.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── test/               (phase1 – phase5 test suites)
│   └── package.json
│
├── decisions.md            ← Architecture decisions log
├── memory.md               ← Project memory & status
├── phases.md               ← Feature phases tracker
├── changelog.md            ← Version history
└── .gitignore
```
