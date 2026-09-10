import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, MessageSquare } from 'lucide-react';
import { Header } from './components/Header';
import { PdfViewer } from './components/PdfViewer';
import { ChatPanel } from './components/ChatPanel';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { PdfDocument, ChatMessage, ViewLayout, User, Workspace } from './types';
import { parsePdfFile } from './utils/pdfParser';
import { askDocumentAssistant } from './utils/documentAssistant';
import { downloadAnnotatedPdf } from './utils/annotatedPdfExport';

// In production (Vercel), VITE_API_URL = 'https://your-backend.onrender.com'
// In local dev, VITE_API_URL is unset and Vite proxy routes /api → localhost:3000
const API_BASE = import.meta.env.VITE_API_URL || '';

export function App() {
  const [documents, setDocuments] = useState<PdfDocument[]>(SAMPLE_DOCUMENTS);
  const [currentDoc, setCurrentDoc] = useState<PdfDocument>(SAMPLE_DOCUMENTS[0]);
  const [activePage, setActivePage] = useState<number>(1);
  const [targetCitationPage, setTargetCitationPage] = useState<number | null>(null);
  const [layout, setLayout] = useState<ViewLayout>('split');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Authentication & Workspaces state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // Store chat history by document ID
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({
    'doc-clean-energy-2026': [
      {
        id: 'msg-welcome-1',
        role: 'assistant',
        content: `👋 Welcome to **AskMyPDF**! I've indexed **"${SAMPLE_DOCUMENTS[0].name}"** (${SAMPLE_DOCUMENTS[0].pageCount} pages, ${SAMPLE_DOCUMENTS[0].wordCount} words).

Here are key topics covered:
- **LFP vs. Sodium-Ion battery economics** ($112/kWh pack cost) [Page 2]
- **Grid interconnection queue backlogs** (4.2-year wait times) [Page 3]
- **Capital allocation & solar additions** ($1.85T deployed) [Page 1]

Click any suggested prompt above or type your question below!`,
        timestamp: 'Just now',
        citations: [
          { pageNumber: 1, snippet: 'Combined clean tech investment surpassed $1.85T...', heading: 'Global Macro' },
          { pageNumber: 2, snippet: 'BESS capex dropped 28% to $112/kWh...', heading: 'Battery Chemistries' },
          { pageNumber: 3, snippet: 'Average interconnection queue latency 4.2 years...', heading: 'Transmission Crisis' }
        ]
      }
    ]
  });

  const currentMessages = chatHistories[currentDoc.id] || [];

  // Restore authenticated session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('askmypdf_token');
    if (savedToken) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            setToken(savedToken);
            setWorkspaces(data.workspaces || []);
            if (data.workspaces && data.workspaces.length > 0) {
              setActiveWorkspaceId(data.workspaces[0].id);
            }
          } else {
            localStorage.removeItem('askmypdf_token');
          }
        })
        .catch(() => {
          localStorage.removeItem('askmypdf_token');
        });
    }
  }, []);

  // Fetch persisted documents when user or workspace changes
  const loadWorkspaceDocuments = useCallback(async (wsId?: string | null) => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const url = wsId ? `${API_BASE}/api/documents?workspaceId=${encodeURIComponent(wsId)}` : `${API_BASE}/api/documents`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.documents && data.documents.length > 0) {
          // Merge unique persisted documents with sample documents
          const existingIds = new Set(SAMPLE_DOCUMENTS.map(d => d.id));
          const newDocSummaries = data.documents.filter((d: any) => !existingIds.has(d.id));

          if (newDocSummaries.length > 0) {
            // Load full document details for each
            const fullDocs: PdfDocument[] = [];
            for (const summary of newDocSummaries) {
              const docRes = await fetch(`${API_BASE}/api/documents/${summary.id}`);
              if (docRes.ok) {
                const docData = await docRes.json();
                if (docData.document) fullDocs.push(docData.document);
              }
            }
            if (fullDocs.length > 0) {
              setDocuments(prev => [...fullDocs, ...prev.filter(p => !fullDocs.some(fd => fd.id === p.id))]);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Could not load persistent documents:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadWorkspaceDocuments(activeWorkspaceId);
    }
  }, [token, activeWorkspaceId, loadWorkspaceDocuments]);

  // Load chat history from SQLite when switching documents
  const handleSelectDoc = async (doc: PdfDocument) => {
    setCurrentDoc(doc);
    setActivePage(1);
    setTargetCitationPage(null);

    // Try to load persisted chat messages from backend
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/documents/${doc.id}/messages`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setChatHistories(prev => ({
            ...prev,
            [doc.id]: data.messages,
          }));
          return;
        }
      }
    } catch {
      // Continue with client state
    }

    // If document has no messages yet, seed an informative welcome message
    if (!chatHistories[doc.id] || chatHistories[doc.id].length === 0) {
      setChatHistories(prev => ({
        ...prev,
        [doc.id]: [
          {
            id: `msg-seed-${doc.id}`,
            role: 'assistant',
            content: `📄 **"${doc.name}"** is loaded and ready for analysis! (${doc.pageCount} pages, ${doc.wordCount} words).

**Summary**: ${doc.summary}

Feel free to ask for an executive summary, extract tables/data, or investigate specific pages.`,
            timestamp: 'Just now',
            citations: [
              { pageNumber: 1, snippet: doc.summary, heading: 'Overview' }
            ]
          }
        ]
      }));
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const parsedDoc = await parsePdfFile(file);
      setDocuments(prev => [parsedDoc, ...prev]);
      setCurrentDoc(parsedDoc);
      setActivePage(1);
      setTargetCitationPage(null);

      // Persist document to SQLite database
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        await fetch(`${API_BASE}/api/documents`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...parsedDoc,
            workspaceId: activeWorkspaceId,
          }),
        });
      } catch (e) {
        console.warn('Could not persist document to server:', e);
      }

      // Seed initial welcoming message
      const welcomeMsg: ChatMessage = {
        id: `msg-upload-${parsedDoc.id}`,
        role: 'assistant',
        content: `🚀 Successfully indexed your document: **"${parsedDoc.name}"**!

- **Total Pages**: ${parsedDoc.pageCount}
- **Word Count**: ${parsedDoc.wordCount} words
- **Status**: Full text extraction complete. Grounded citations active.

What would you like to investigate first?`,
        timestamp: 'Just now',
        citations: [
          { pageNumber: 1, snippet: parsedDoc.summary, heading: 'Page 1' }
        ]
      };

      setChatHistories(prev => ({
        ...prev,
        [parsedDoc.id]: [welcomeMsg]
      }));
    } catch (err) {
      console.error('Failed to parse uploaded PDF:', err);
    }
  };

  const handleSendMessage = async (text: string, pageScope?: number) => {
    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: pageScope ? `[Page ${pageScope} Scope] ${text}` : text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...currentMessages, userMessage];
    setChatHistories(prev => ({
      ...prev,
      [currentDoc.id]: updatedMessages
    }));

    // Async persist user message to SQLite
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(`${API_BASE}/api/documents/${currentDoc.id}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(userMessage),
    }).catch(() => {});

    setIsGenerating(true);

    try {
      const response = await askDocumentAssistant(
        text,
        currentDoc,
        updatedMessages,
        pageScope
      );

      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        citations: response.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatHistories(prev => ({
        ...prev,
        [currentDoc.id]: [...updatedMessages, assistantMessage]
      }));

      // Async persist assistant message with citations to SQLite
      fetch(`${API_BASE}/api/documents/${currentDoc.id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(assistantMessage),
      }).catch(() => {});

    } catch (err) {
      console.error('Error generating assistant response:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'I encountered an issue processing that query. Please try rephrasing or asking about a specific section.',
        timestamp: 'Just now'
      };
      setChatHistories(prev => ({
        ...prev,
        [currentDoc.id]: [...updatedMessages, errorMessage]
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJumpToPage = (pageNumber: number) => {
    setActivePage(pageNumber);
    setTargetCitationPage(pageNumber);

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setLayout('reader-only');
    } else if (layout === 'chat-only') {
      setLayout('split');
    }

    setTimeout(() => {
      setTargetCitationPage(null);
    }, 3000);
  };

  const handleAskAboutSelection = (selectedText: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setLayout('chat-only');
    }
    handleSendMessage(`Explain or analyze this excerpt from Page ${activePage}: "${selectedText}"`, activePage);
  };

  const handleClearChat = () => {
    setChatHistories(prev => ({
      ...prev,
      [currentDoc.id]: []
    }));
  };

  const handleExportChat = () => {
    if (currentMessages.length === 0) return;

    const transcript = [
      `# AskMyPDF Conversation Export`,
      `**Document**: ${currentDoc.name}`,
      `**Date**: ${new Date().toLocaleString()}`,
      `**Pages**: ${currentDoc.pageCount} | **Words**: ${currentDoc.wordCount}`,
      `\n---\n`,
      ...currentMessages.map(m => {
        const sender = m.role === 'user' ? 'User' : 'AskMyPDF Assistant';
        const cites = m.citations && m.citations.length > 0 
          ? `\n*Citations: ${m.citations.map(c => `Page ${c.pageNumber}`).join(', ')}*`
          : '';
        return `### [${m.timestamp}] ${sender}\n${m.content}${cites}\n`;
      })
    ].join('\n\n');

    const blob = new Blob([transcript], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AskMyPDF-Export-${currentDoc.name.replace(/\.[^/.]+$/, '')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAnnotatedPdf = async () => {
    try {
      // Gather citations across current conversation to embed as native PDF highlights & comments
      const citations = currentMessages.flatMap(m => m.citations || []);
      await downloadAnnotatedPdf(currentDoc, {
        citations,
        includeCitationsAsHighlights: true,
      });
    } catch (err) {
      console.error('Failed to export annotated PDF:', err);
    }
  };

  const handleLoginSuccess = (user: User, userToken: string, userWorkspaces: Workspace[]) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem('askmypdf_token', userToken);
    setWorkspaces(userWorkspaces);
    if (userWorkspaces.length > 0) {
      setActiveWorkspaceId(userWorkspaces[0].id);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('askmypdf_token');
    setWorkspaces([]);
    setActiveWorkspaceId(null);
    setIsAuthModalOpen(false);
  };

  const handleCreateWorkspace = async (workspaceName: string) => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/api/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: workspaceName }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to create workspace.');
    }
    const data = await res.json();
    setWorkspaces(prev => [...prev, data.workspace]);
    setActiveWorkspaceId(data.workspace.id);
  };

  const activeWorkspaceName = workspaces.find(w => w.id === activeWorkspaceId)?.name;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      {/* Top Application Header */}
      <Header
        currentDoc={currentDoc}
        documents={documents}
        onSelectDoc={handleSelectDoc}
        onFileUpload={handleFileUpload}
        layout={layout}
        onLayoutChange={setLayout}
        onExportChat={handleExportChat}
        onExportAnnotatedPdf={handleExportAnnotatedPdf}
        hasMessages={currentMessages.length > 0}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        currentUser={currentUser}
        activeWorkspaceName={activeWorkspaceName}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Dual-Pane Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left: PDF Document Viewer */}
        {(layout === 'split' || layout === 'reader-only') && (
          <div className={`${layout === 'split' ? 'w-full md:w-[58%] lg:w-[60%]' : 'w-full'} h-full flex flex-col transition-all duration-200`}>
            <PdfViewer
              document={currentDoc}
              activePage={activePage}
              onPageChange={setActivePage}
              targetCitationPage={targetCitationPage}
              onAskAboutSelection={handleAskAboutSelection}
            />
          </div>
        )}

        {/* Right: AI Chat & Research Assistant */}
        {(layout === 'split' || layout === 'chat-only') && (
          <div className={`${layout === 'split' ? 'hidden md:flex md:w-[42%] lg:w-[40%]' : 'w-full'} h-full flex flex-col transition-all duration-200`}>
            <ChatPanel
              document={currentDoc}
              messages={currentMessages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onClearChat={handleClearChat}
              onJumpToPage={handleJumpToPage}
              activePage={activePage}
            />
          </div>
        )}
      </main>

      {/* Mobile Navigation Bar for Phone Screens */}
      <nav 
        aria-label="Mobile Navigation" 
        className="md:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around px-3 shrink-0 z-20 shadow-xs select-none"
      >
        <button
          type="button"
          onClick={() => setLayout('reader-only')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 min-h-[42px] rounded-xl text-xs font-semibold transition-all ${
            layout === 'reader-only' || layout === 'split'
              ? 'bg-indigo-50 text-indigo-700 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Document Reader</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        <button
          type="button"
          onClick={() => setLayout('chat-only')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 min-h-[42px] rounded-xl text-xs font-semibold transition-all relative ${
            layout === 'chat-only'
              ? 'bg-indigo-50 text-indigo-700 font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI Assistant</span>
          {currentMessages.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          )}
        </button>
      </nav>

      {/* Modal for uploading PDF or selecting from curated samples */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
        sampleDocuments={SAMPLE_DOCUMENTS}
        onSelectSampleDoc={handleSelectDoc}
        currentDocId={currentDoc.id}
      />

      {/* Modal for User Authentication & Workspace management */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        workspaces={workspaces}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={setActiveWorkspaceId}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </div>
  );
}

export default App;
