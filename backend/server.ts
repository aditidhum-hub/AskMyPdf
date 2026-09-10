import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import {
  initDatabase,
  createUser,
  getUserByEmail,
  getUserById,
  createWorkspace,
  getWorkspacesByUser,
  saveDocument,
  getDocumentById,
  listDocuments,
  deleteDocument,
  getOrCreateChatSession,
  addChatMessage,
  getChatMessages,
  saveAnnotation,
  getAnnotationsByDocument,
} from './src/db/database.js';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  createOptionalAuthMiddleware,
  createRequireAuthMiddleware,
  AuthenticatedRequest,
} from './src/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// ── CORS ────────────────────────────────────────────────────────────────────
// In production FRONTEND_URL must be set to the Vercel URL.
// In development, allow localhost origins so Vite proxy works.
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ── Body & DB ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' }));
const db = initDatabase();

// ── Auth Middleware ───────────────────────────────────────────────────────────
const optionalAuth = createOptionalAuthMiddleware(db);
const requireAuth = createRequireAuthMiddleware(db);

// ── Rate Limiters ─────────────────────────────────────────────────────────────
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait a moment before sending another query.' },
});

// ── Gemini Client ─────────────────────────────────────────────────────────────
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!aiClient && key && key !== 'MY_GEMINI_API_KEY' && key.trim().length > 5) {
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });
  }
  return aiClient;
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const key = process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    appName: 'AskMyPDF',
    version: '1.0.0',
    phase: 'Phase 5: Cloud Persistence, Auth & Enterprise',
    hasGeminiKey: Boolean(key && key !== 'MY_GEMINI_API_KEY' && key.trim().length > 5),
    database: 'SQLite (node:sqlite)',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── Auth Endpoints ────────────────────────────────────────────────────────────
app.post('/api/auth/register', authRateLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, valid email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const existingUser = getUserByEmail(db, email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }
    const passwordHash = hashPassword(password);
    const user = createUser(db, { email, passwordHash, name });
    const token = createSessionToken(user.id, user.email);
    const workspaces = getWorkspacesByUser(db, user.id);
    res.status(201).json({ user: { id: user.id, email: user.email, name: user.name }, workspaces, token });
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error);
    res.status(500).json({ error: 'Failed to create user account.', details: error.message });
  }
});

app.post('/api/auth/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = getUserByEmail(db, email);
    if (!user || !verifyPassword(password, user.password_hash || user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }
    const token = createSessionToken(user.id, user.email);
    const workspaces = await getWorkspacesByUser(db, user.id);
    res.json({ user: { id: user.id, email: user.email, name: user.name }, workspaces, token });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    res.status(500).json({ error: 'Authentication failed.', details: error.message });
  }
});

app.get('/api/auth/me', optionalAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.json({ authenticated: false, user: null, workspaces: [] });
  }
  const workspaces = await getWorkspacesByUser(db, req.user.id);
  res.json({ authenticated: true, user: req.user, workspaces });
});

// ── Workspace Endpoints ───────────────────────────────────────────────────────
app.get('/api/workspaces', requireAuth, async (req: AuthenticatedRequest, res) => {
  const workspaces = await getWorkspacesByUser(db, req.user!.id);
  res.json({ workspaces });
});

app.post('/api/workspaces', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Workspace folder name is required.' });
    }
    const ws = await createWorkspace(db, req.user!.id, name.trim());
    res.status(201).json({ workspace: ws });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create workspace.', details: error.message });
  }
});

// ── Document Endpoints ────────────────────────────────────────────────────────
app.get('/api/documents', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const workspaceId = req.query.workspaceId as string | undefined;
    const docs = await listDocuments(db, req.user?.id, workspaceId);
    res.json({ documents: docs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to list documents.', details: error.message });
  }
});

app.post('/api/documents', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const doc = req.body;
    if (!doc || !doc.id || !doc.name || !Array.isArray(doc.pages)) {
      return res.status(400).json({ error: 'Invalid document structure.' });
    }
    const workspaceId = req.body.workspaceId || null;
    await saveDocument(db, doc, req.user?.id, workspaceId);
    res.status(201).json({ status: 'saved', documentId: doc.id });
  } catch (error: any) {
    console.error('Error in POST /api/documents:', error);
    res.status(500).json({ error: 'Failed to persist document.', details: error.message });
  }
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const doc = await getDocumentById(db, req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });
    res.json({ document: doc });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch document.', details: error.message });
  }
});

app.delete('/api/documents/:id', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await deleteDocument(db, req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Document not found or already deleted.' });
    res.json({ status: 'deleted', id: req.params.id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete document.', details: error.message });
  }
});

// ── Chat & Annotation Endpoints ───────────────────────────────────────────────
app.get('/api/documents/:id/messages', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const sessionId = await getOrCreateChatSession(db, req.params.id, req.user?.id);
    const messages = await getChatMessages(db, sessionId);
    res.json({ sessionId, messages });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load chat history.', details: error.message });
  }
});

app.post('/api/documents/:id/messages', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const message = req.body;
    if (!message || !message.role || !message.content) {
      return res.status(400).json({ error: 'Invalid chat message payload.' });
    }
    const sessionId = await getOrCreateChatSession(db, req.params.id, req.user?.id);
    await addChatMessage(db, sessionId, message);
    res.status(201).json({ status: 'saved', sessionId, messageId: message.id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to persist message.', details: error.message });
  }
});

app.get('/api/documents/:id/annotations', async (req, res) => {
  try {
    const annotations = await getAnnotationsByDocument(db, req.params.id);
    res.json({ annotations });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load annotations.', details: error.message });
  }
});

app.post('/api/documents/:id/annotations', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const annotation = { ...req.body, documentId: req.params.id };
    if (req.user) annotation.userId = req.user.id;
    await saveAnnotation(db, annotation);
    res.status(201).json({ status: 'saved', id: annotation.id });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save annotation.', details: error.message });
  }
});

// ── AI Endpoints ──────────────────────────────────────────────────────────────
app.post('/api/chat', aiRateLimiter, async (req, res) => {
  try {
    const { question, documentTitle, documentSummary, pages, activePage, history } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const ai = getGenAI();
    if (!ai) {
      return res.status(200).json({
        fallback: true,
        message: 'No GEMINI_API_KEY detected on server. Fallback to client-side document engine.',
      });
    }

    const pageContexts = (pages || [])
      .map((p: any) => `[DOCUMENT PAGE ${p.pageNumber}: ${p.title || 'Section ' + p.pageNumber}]\n${p.content}`)
      .join('\n\n');

    const promptText = `DOCUMENT TITLE: ${documentTitle || 'Uploaded Document'}
DOCUMENT SUMMARY: ${documentSummary || 'N/A'}
ACTIVE VIEWED PAGE: ${activePage ? `Page ${activePage}` : 'Entire Document'}

DOCUMENT CONTENTS:
${pageContexts}

USER CONVERSATION HISTORY:
${(history || []).map((h: any) => `${h.role.toUpperCase()}: ${h.content}`).join('\n')}

USER QUESTION:
${question}

Instructions for AskMyPDF:
1. Provide a direct, highly accurate, and thorough answer based strictly on the document text provided above.
2. Every time you state a fact or finding, you MUST cite the exact page in brackets, e.g. [Page 1] or [Page 2, Header].
3. Use clean Markdown formatting with clear headings (###), bullet points, and bold keywords for scannability.
4. If the exact answer cannot be determined from the text, state what related information is available in the document.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptText,
      config: {
        systemInstruction: 'You are AskMyPDF, an elite AI research assistant specialized in document synthesis, precision factual extraction, and exact page citations.',
        temperature: 0.2,
      },
    });

    const answerText = response.text || '';
    const citations: Array<{ pageNumber: number; snippet: string; heading?: string }> = [];
    const regex = /\[(?:Page|P\.)\s*(\d+)(?:[,\s]+([^\]]+))?\]/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(answerText)) !== null) {
      const pageNum = parseInt(match[1], 10);
      const subNote = match[2]?.trim();
      const matchedPage = (pages || []).find((p: any) => p.pageNumber === pageNum);
      if (matchedPage && !citations.some(c => c.pageNumber === pageNum)) {
        citations.push({
          pageNumber: pageNum,
          snippet: matchedPage.content.slice(0, 150) + '...',
          heading: subNote || matchedPage.title,
        });
      }
    }

    res.json({ answer: answerText, citations, model: 'gemini-3.8-flash' });
  } catch (error: any) {
    console.error('Gemini API Error in /api/chat:', error);
    res.status(200).json({
      fallback: true,
      message: 'Gemini API call encountered an error. Falling back to grounded local document engine.',
      details: error?.message || String(error),
    });
  }
});

app.post('/api/summarize', aiRateLimiter, async (req, res) => {
  try {
    const { documentTitle, pages } = req.body;
    const ai = getGenAI();
    if (!ai) return res.status(200).json({ fallback: true, message: 'No GEMINI_API_KEY detected.' });

    const pageContexts = (pages || []).map((p: any) => `[PAGE ${p.pageNumber}]\n${p.content}`).join('\n\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Provide an executive summary and 5 core quantitative or factual takeaways with page citations for:\n\nTITLE: ${documentTitle}\n\n${pageContexts}`,
      config: { temperature: 0.1 },
    });

    res.json({ summary: response.text || '' });
  } catch (error: any) {
    console.error('Error in /api/summarize:', error);
    res.status(200).json({ fallback: true, message: 'Summarization failed.', error: error?.message });
  }
});

// ── Static Frontend Serving in Production ─────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const possiblePaths = [
    path.join(process.cwd(), '..', 'frontend', 'dist'),
    path.join(process.cwd(), 'frontend-dist'),
    path.join(process.cwd(), 'dist', 'frontend'),
  ];
  const frontendDist = possiblePaths.find(p => fs.existsSync(p));
  if (frontendDist) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }
}

// ── Start Server ──────────────────────────────────────────────────────────────
const isMainScript = Boolean(
  process.argv[1] &&
    (process.argv[1].endsWith('server.ts') ||
      process.argv[1].endsWith('server.cjs') ||
      process.argv[1].endsWith('server.js'))
);

if (isMainScript && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ AskMyPDF backend running on http://0.0.0.0:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   CORS origins: ${allowedOrigins.join(', ')}`);
  });
}

export { app, db };
