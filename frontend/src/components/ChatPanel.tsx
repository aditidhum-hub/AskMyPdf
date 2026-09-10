import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  FileText, 
  ExternalLink,
  CornerDownRight,
  Filter
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, PdfDocument } from '../types';

interface ChatPanelProps {
  document: PdfDocument;
  messages: ChatMessage[];
  onSendMessage: (text: string, pageScope?: number) => void;
  isGenerating: boolean;
  onClearChat: () => void;
  onJumpToPage: (pageNumber: number) => void;
  activePage: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  document,
  messages,
  onSendMessage,
  isGenerating,
  onClearChat,
  onJumpToPage,
  activePage,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [scopeActivePageOnly, setScopeActivePageOnly] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Adjust textarea height dynamically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || isGenerating) return;

    onSendMessage(textToSend, scopeActivePageOnly ? activePage : undefined);
    if (!overrideText) {
      setInputText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\[Page \d+[^\]]*\]/g, ''));
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  const formatCitationsAsLinks = (content: string): string => {
    return content.replace(/\[(?:Page|P\.)\s*(\d+)(?:[,\s]+([^\]]+))?\]/gi, (_match, pageNum, subNote) => {
      const label = subNote ? `Page ${pageNum}, ${subNote}` : `Page ${pageNum}`;
      return `[${label}](#page-${pageNum})`;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white border-l border-slate-200 overflow-hidden relative">
      {/* Panel Header */}
      <div className="h-12 border-b border-slate-200 bg-slate-50/70 px-3 sm:px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>AskMyPDF Assistant</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearChat}
              title="Clear Conversation"
              aria-label="Clear Conversation"
              className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-xs flex items-center gap-1.5 min-h-[32px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="border-b border-slate-100 bg-slate-50/50 p-2 sm:p-2.5 overflow-x-auto select-none no-scrollbar flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap px-1 shrink-0">
          Quick Prompts:
        </span>
        <button
          type="button"
          onClick={() => handleSubmit('Summarize this document and its main takeaways')}
          className="shrink-0 text-xs bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 px-3 py-1.5 min-h-[32px] rounded-full transition-colors font-medium shadow-2xs cursor-pointer whitespace-nowrap"
        >
          📌 Executive Summary
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('Extract the top 4 key findings and quantitative data')}
          className="shrink-0 text-xs bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 px-3 py-1.5 min-h-[32px] rounded-full transition-colors font-medium shadow-2xs cursor-pointer whitespace-nowrap"
        >
          💡 Key Findings
        </button>
        <button
          type="button"
          onClick={() => handleSubmit('What are the risks, bottlenecks, or limitations identified?')}
          className="shrink-0 text-xs bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 px-3 py-1.5 min-h-[32px] rounded-full transition-colors font-medium shadow-2xs cursor-pointer whitespace-nowrap"
        >
          ⚠️ Risks & Limitations
        </button>
        {document.suggestedQuestions.slice(0, 2).map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSubmit(q)}
            className="shrink-0 text-xs bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 px-3 py-1.5 min-h-[32px] rounded-full transition-colors font-medium shadow-2xs cursor-pointer truncate max-w-[220px]"
            title={q}
          >
            ❓ {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-6 space-y-4 select-none">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-sm space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Ask anything about this document</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask questions, extract data points, synthesize sections, and verify every response with interactive page citations.
              </p>
            </div>

            {/* Document Quick Starter Cards */}
            <div className="w-full max-w-md pt-2 space-y-2 text-left">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Suggested questions for {document.name}:
              </div>
              <div className="space-y-1.5">
                {document.suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSubmit(question)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/60 hover:bg-indigo-50/50 transition-all text-xs text-slate-700 flex items-center justify-between group min-h-[44px] cursor-pointer"
                  >
                    <span className="font-medium pr-2 leading-relaxed">{question}</span>
                    <CornerDownRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';

            return (
              <div
                key={message.id}
                className={`flex gap-2.5 sm:gap-3 text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[88%] sm:max-w-[82%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Message Bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="markdown-body prose-xs prose-slate max-w-none">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children, ...props }) => {
                              if (href && href.startsWith('#page-')) {
                                const pageNum = parseInt(href.replace('#page-', ''), 10);
                                return (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onJumpToPage(pageNum);
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-900 border border-amber-300 text-[11px] font-bold cursor-pointer transition-all shadow-2xs no-underline align-baseline"
                                    title={`Click to jump to Page ${pageNum}`}
                                  >
                                    <span>{children}</span>
                                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                  </button>
                                );
                              }
                              return (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline" {...props}>
                                  {children}
                                </a>
                              );
                            }
                          }}
                        >
                          {formatCitationsAsLinks(message.content)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Grounded Citation Chips for Assistant */}
                  {!isUser && message.citations && message.citations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1 mr-1">
                        <FileText className="w-3 h-3" />
                        Citations:
                      </span>
                      {message.citations.map((citation, cIdx) => (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => onJumpToPage(citation.pageNumber)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 min-h-[30px] rounded-lg bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-200/80 text-[11px] font-bold transition-all group cursor-pointer shadow-2xs"
                          title={`Click to jump to Page ${citation.pageNumber}: "${citation.snippet}"`}
                        >
                          <span>Page {citation.pageNumber}</span>
                          <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action Bar for Assistant */}
                  {!isUser && (
                    <div className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-400">
                      <button
                        type="button"
                        onClick={() => handleCopy(message.id, message.content)}
                        className="hover:text-slate-700 flex items-center gap-1 px-1.5 py-1 rounded transition-colors"
                        title="Copy to clipboard"
                        aria-label="Copy message text"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <span>•</span>

                      <button
                        type="button"
                        onClick={() => handleSpeak(message.id, message.content)}
                        className="hover:text-slate-700 flex items-center gap-1 px-1.5 py-1 rounded transition-colors"
                        title="Read aloud"
                        aria-label="Read message aloud"
                      >
                        {speakingId === message.id ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-indigo-600 font-semibold">Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </>
                        )}
                      </button>

                      <span className="ml-auto text-[10px] text-slate-300">
                        {message.timestamp}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Thinking / Generating Indicator */}
        {isGenerating && (
          <div className="flex gap-3 text-sm justify-start items-center text-slate-500 animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-xs text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span className="font-medium">Synthesizing document and verifying citations...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="p-3 border-t border-slate-200 bg-white select-none">
        {/* Scope Pill */}
        <div className="flex items-center justify-between mb-2 px-0.5 text-xs">
          <button
            type="button"
            onClick={() => setScopeActivePageOnly(!scopeActivePageOnly)}
            aria-pressed={scopeActivePageOnly}
            className={`flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] rounded-lg border text-[11px] transition-colors cursor-pointer ${
              scopeActivePageOnly
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold shadow-2xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>
              {scopeActivePageOnly ? `Focused on Page ${activePage}` : 'Entire Document Scope'}
            </span>
          </button>

          <span className="hidden sm:inline text-[10px] text-slate-400">
            Enter to send, Shift+Enter for newline
          </span>
        </div>

        {/* Text Input & Send */}
        <div className="relative flex items-end border border-slate-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/10 rounded-2xl bg-slate-50/50 p-1.5 shadow-2xs transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Ask a question about "${document.name}"...`}
            aria-label={`Ask a question about ${document.name}`}
            className="w-full max-h-36 resize-none bg-transparent px-2.5 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden leading-relaxed"
          />

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={!inputText.trim() || isGenerating}
            aria-label="Send message"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all shrink-0 flex items-center justify-center shadow-xs cursor-pointer"
            title="Send question"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
