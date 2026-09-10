import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import crypto from 'crypto';
import { PdfDocument, DocumentPage, ChatMessage, PdfAnnotation } from '../types.js';

let dbInstance: DatabaseSync | null = null;

/**
 * Initializes and returns the SQLite database instance.
 * @param dbPath Optional custom path (e.g. ':memory:' for tests)
 */
export function initDatabase(dbPath?: string): DatabaseSync {
  if (dbInstance && !dbPath) {
    return dbInstance;
  }

  const targetPath = dbPath || process.env.ASKMYPDF_DB_PATH || path.join(process.cwd(), 'askmypdf.db');
  const db = new DatabaseSync(targetPath);

  // Enable foreign keys and modern write-ahead logging
  db.exec('PRAGMA foreign_keys = ON;');
  if (targetPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }

  // Create tables matching memory.md schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      workspace_id TEXT,
      name TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      page_count INTEGER NOT NULL,
      word_count INTEGER NOT NULL,
      category TEXT DEFAULT 'custom',
      summary TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS document_pages (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      key_topics TEXT,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT,
      title TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      citations TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      user_id TEXT,
      page_number INTEGER NOT NULL,
      type TEXT NOT NULL,
      rect TEXT NOT NULL,
      text TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_doc_pages_doc_id ON document_pages(document_id);
    CREATE INDEX IF NOT EXISTS idx_chat_msg_session_id ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_annotations_doc_id ON annotations(document_id);
  `);

  if (!dbPath) {
    dbInstance = db;
  }
  return db;
}

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// ----------------------------------------------------
// User Repository
// ----------------------------------------------------
export function createUser(
  db: DatabaseSync,
  params: { email: string; passwordHash: string; name: string }
): { id: string; email: string; name: string; created_at: string } {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, params.email.toLowerCase().trim(), params.passwordHash, params.name.trim(), createdAt);

  // Automatically create a Default Workspace for the new user
  const wsId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO workspaces (id, user_id, name, created_at)
    VALUES (?, ?, ?, ?)
  `).run(wsId, id, 'Primary Workspace', createdAt);

  return { id, email: params.email.toLowerCase().trim(), name: params.name.trim(), created_at: createdAt };
}

export function getUserByEmail(db: DatabaseSync, email: string): any {
  const stmt = db.prepare(`SELECT * FROM users WHERE email = ? LIMIT 1`);
  return stmt.get(email.toLowerCase().trim()) || null;
}

export function getUserById(db: DatabaseSync, id: string): any {
  const stmt = db.prepare(`SELECT id, email, name, created_at FROM users WHERE id = ? LIMIT 1`);
  return stmt.get(id) || null;
}

// ----------------------------------------------------
// Workspaces Repository
// ----------------------------------------------------
export function createWorkspace(
  db: DatabaseSync,
  userId: string,
  name: string
): { id: string; userId: string; name: string; createdAt: string } {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO workspaces (id, user_id, name, created_at) VALUES (?, ?, ?, ?)`).run(id, userId, name, createdAt);
  return { id, userId, name, createdAt };
}

export function getWorkspacesByUser(
  db: DatabaseSync,
  userId: string
): Array<{ id: string; userId: string; name: string; createdAt: string }> {
  const rows = db.prepare(
    `SELECT id, user_id as userId, name, created_at as createdAt FROM workspaces WHERE user_id = ? ORDER BY created_at ASC`
  ).all(userId) as any[];
  return rows || [];
}

// ----------------------------------------------------
// Document & Page Repository
// ----------------------------------------------------
export function saveDocument(
  db: DatabaseSync,
  doc: PdfDocument,
  userId?: string,
  workspaceId?: string
): void {
  const createdAt = doc.uploadDate || new Date().toISOString();

  // Insert or update document
  const upsertDoc = db.prepare(`
    INSERT INTO documents (id, user_id, workspace_id, name, size_bytes, page_count, word_count, category, summary, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      size_bytes = excluded.size_bytes,
      page_count = excluded.page_count,
      word_count = excluded.word_count,
      category = excluded.category,
      summary = excluded.summary
  `);
  upsertDoc.run(
    doc.id,
    userId || null,
    workspaceId || null,
    doc.name,
    doc.size || 0,
    doc.pageCount,
    doc.wordCount,
    doc.category || 'custom',
    doc.summary || '',
    createdAt
  );

  // Clear existing pages for idempotency
  db.prepare(`DELETE FROM document_pages WHERE document_id = ?`).run(doc.id);

  // Insert document pages
  const insertPage = db.prepare(`
    INSERT INTO document_pages (id, document_id, page_number, title, content, key_topics)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const page of doc.pages) {
    const pageId = crypto.randomUUID();
    const topics = page.keyTopics ? JSON.stringify(page.keyTopics) : null;
    insertPage.run(pageId, doc.id, page.pageNumber, page.title || null, page.content, topics);
  }
}

export function getDocumentById(db: DatabaseSync, id: string): PdfDocument | null {
  const docRow = db.prepare(`SELECT * FROM documents WHERE id = ? LIMIT 1`).get(id) as any;
  if (!docRow) return null;

  const pageRows = db.prepare(`
    SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number ASC
  `).all(id) as any[];

  const pages: DocumentPage[] = pageRows.map(p => ({
    pageNumber: p.page_number,
    title: p.title || undefined,
    content: p.content,
    keyTopics: p.key_topics ? JSON.parse(p.key_topics) : undefined,
  }));

  return {
    id: docRow.id,
    name: docRow.name,
    size: docRow.size_bytes,
    fileType: 'application/pdf',
    uploadDate: docRow.created_at,
    pageCount: docRow.page_count,
    wordCount: docRow.word_count,
    category: docRow.category as any,
    summary: docRow.summary || '',
    keyFindings: [],
    suggestedQuestions: [],
    pages,
  };
}

export function listDocuments(
  db: DatabaseSync,
  userId?: string,
  workspaceId?: string
): Array<{ id: string; name: string; pageCount: number; wordCount: number; category: string; summary: string; createdAt: string }> {
  let query = `SELECT id, name, page_count, word_count, category, summary, created_at FROM documents`;
  const params: any[] = [];

  if (userId && workspaceId) {
    query += ` WHERE user_id = ? AND workspace_id = ?`;
    params.push(userId, workspaceId);
  } else if (userId) {
    query += ` WHERE user_id = ? OR user_id IS NULL`;
    params.push(userId);
  }

  query += ` ORDER BY created_at DESC`;
  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    pageCount: r.page_count,
    wordCount: r.word_count,
    category: r.category,
    summary: r.summary,
    createdAt: r.created_at,
  }));
}

export function deleteDocument(db: DatabaseSync, id: string): boolean {
  const result = db.prepare(`DELETE FROM documents WHERE id = ?`).run(id);
  return result.changes > 0;
}

// ----------------------------------------------------
// Chat Sessions & Messages Repository
// ----------------------------------------------------
export function getOrCreateChatSession(db: DatabaseSync, documentId: string, userId?: string): string {
  let row: any;
  if (userId) {
    row = db.prepare(`SELECT id FROM chat_sessions WHERE document_id = ? AND user_id = ? LIMIT 1`).get(documentId, userId);
  } else {
    row = db.prepare(`SELECT id FROM chat_sessions WHERE document_id = ? AND user_id IS NULL LIMIT 1`).get(documentId);
  }

  if (row) {
    return row.id;
  }

  const newId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO chat_sessions (id, document_id, user_id, title, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(newId, documentId, userId || null, `Session for ${documentId}`, createdAt);

  return newId;
}

export function addChatMessage(db: DatabaseSync, sessionId: string, message: ChatMessage): void {
  const createdAt = new Date().toISOString();
  const citations = message.citations ? JSON.stringify(message.citations) : null;
  db.prepare(`
    INSERT INTO chat_messages (id, session_id, role, content, citations, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(message.id, sessionId, message.role, message.content, citations, createdAt);
}

export function getChatMessages(db: DatabaseSync, sessionId: string): ChatMessage[] {
  const rows = db.prepare(`
    SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC
  `).all(sessionId) as any[];

  return rows.map(r => ({
    id: r.id,
    role: r.role as 'user' | 'assistant' | 'system',
    content: r.content,
    timestamp: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    citations: r.citations ? JSON.parse(r.citations) : undefined,
  }));
}

// ----------------------------------------------------
// Annotations Repository
// ----------------------------------------------------
export function saveAnnotation(db: DatabaseSync, annotation: PdfAnnotation): void {
  const id = annotation.id || crypto.randomUUID();
  const createdAt = annotation.createdAt || new Date().toISOString();
  db.prepare(`
    INSERT INTO annotations (id, document_id, user_id, page_number, type, rect, text, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    annotation.documentId,
    annotation.userId || null,
    annotation.pageNumber,
    annotation.type,
    JSON.stringify(annotation.rect),
    annotation.text || null,
    annotation.note || null,
    createdAt
  );
}

export function getAnnotationsByDocument(db: DatabaseSync, documentId: string): PdfAnnotation[] {
  const rows = db.prepare(`
    SELECT * FROM annotations WHERE document_id = ? ORDER BY page_number ASC, created_at ASC
  `).all(documentId) as any[];

  return rows.map(r => ({
    id: r.id,
    documentId: r.document_id,
    userId: r.user_id || undefined,
    pageNumber: r.page_number,
    type: r.type as any,
    rect: JSON.parse(r.rect),
    text: r.text || undefined,
    note: r.note || undefined,
    createdAt: r.created_at,
  }));
}
