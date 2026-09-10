import React, { useState, useEffect } from 'react';
import { BookOpen, MessageSquare } from 'lucide-react';
import { Header } from './components/Header';
import { PdfViewer } from './components/PdfViewer';
import { ChatPanel } from './components/ChatPanel';
import { UploadModal } from './components/UploadModal';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { PdfDocument, ChatMessage, ViewLayout } from './types';
import { parsePdfFile } from './utils/pdfParser';
import { askDocumentAssistant } from './utils/documentAssistant';

export function App() {
  const [documents, setDocuments] = useState<PdfDocument[]>(SAMPLE_DOCUMENTS);
  const [currentDoc, setCurrentDoc] = useState<PdfDocument>(SAMPLE_DOCUMENTS[0]);
  const [activePage, setActivePage] = useState<number>(1);
  const [targetCitationPage, setTargetCitationPage] = useState<number | null>(null);
  const [layout, setLayout] = useState<ViewLayout>('split');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Store chat history by document ID so switching preserves context
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

  // Reset page when switching documents
  const handleSelectDoc = (doc: PdfDocument) => {
    setCurrentDoc(doc);
    setActivePage(1);
    setTargetCitationPage(null);

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

      // Seed initial welcoming message
      setChatHistories(prev => ({
        ...prev,
        [parsedDoc.id]: [
          {
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
          }
        ]
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

    // If on mobile, switch to reader view so the user immediately sees the highlighted citation
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setLayout('reader-only');
    } else if (layout === 'chat-only') {
      setLayout('split');
    }

    // Reset citation highlight pulse after 3 seconds
    setTimeout(() => {
      setTargetCitationPage(null);
    }, 3000);
  };

  const handleAskAboutSelection = (selectedText: string) => {
    // If on mobile, switch to chat view so the user sees the generated analysis
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
        hasMessages={currentMessages.length > 0}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
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
    </div>
  );
}

export default App;
