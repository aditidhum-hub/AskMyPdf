import React, { useRef, useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  ChevronDown, 
  Sparkles, 
  Columns2, 
  BookOpen, 
  MessageSquare, 
  Download, 
  Check, 
  Cpu,
  Layers,
  FileCheck2,
  User as UserIcon
} from 'lucide-react';
import { PdfDocument, ViewLayout, User } from '../types';

interface HeaderProps {
  currentDoc: PdfDocument;
  documents: PdfDocument[];
  onSelectDoc: (doc: PdfDocument) => void;
  onFileUpload: (file: File) => void;
  layout: ViewLayout;
  onLayoutChange: (layout: ViewLayout) => void;
  onExportChat: () => void;
  onExportAnnotatedPdf: () => void;
  hasMessages: boolean;
  onOpenUploadModal: () => void;
  currentUser: User | null;
  activeWorkspaceName?: string;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDoc,
  documents,
  onSelectDoc,
  onFileUpload,
  layout,
  onLayoutChange,
  onExportChat,
  onExportAnnotatedPdf,
  hasMessages,
  onOpenUploadModal,
  currentUser,
  activeWorkspaceName,
  onOpenAuthModal,
}) => {
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && docDropdownOpen) {
        setDocDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docDropdownOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Document Selector */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-sky-500 flex items-center justify-center shadow-xs text-white font-bold">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base md:text-lg tracking-tight text-slate-900 leading-tight">
                AskMy<span className="text-indigo-600">PDF</span>
              </span>
              <span className="hidden md:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                AI Engine
              </span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

        {/* Document Selector Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDocDropdownOpen(!docDropdownOpen)}
            aria-expanded={docDropdownOpen}
            aria-haspopup="listbox"
            aria-label={`Current document: ${currentDoc.name}. Click to switch document.`}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 min-h-[42px] rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/80 hover:bg-slate-100 transition-all text-left max-w-[170px] xs:max-w-[210px] sm:max-w-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="truncate min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {currentDoc.name}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 leading-tight mt-0.5">
                <span>{currentDoc.pageCount} pgs</span>
                <span>•</span>
                <span className="truncate">{currentDoc.category}</span>
              </div>
            </div>
            <ChevronDown 
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto transition-transform duration-200 ${
                docDropdownOpen ? 'rotate-180 text-indigo-600' : ''
              }`} 
            />
          </button>

          {/* Dropdown Menu */}
          {docDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDocDropdownOpen(false)} 
              />
              <div 
                role="listbox"
                aria-label="Select Document"
                className="absolute left-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-84 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  <span>Available Documents</span>
                  <span className="text-[10px] text-indigo-600 font-bold">{documents.length} Loaded</span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 p-0.5">
                  {documents.map((doc) => {
                    const isSelected = doc.id === currentDoc.id;
                    return (
                      <button
                        key={doc.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          onSelectDoc(doc);
                          setDocDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 min-h-[44px] rounded-xl text-left text-xs transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/90 text-indigo-950 font-semibold ring-1 ring-indigo-500/20'
                            : 'hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="truncate font-semibold text-xs leading-tight">
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>{doc.pageCount} pages</span>
                              <span>•</span>
                              <span>{doc.category}</span>
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Dropdown Action Buttons */}
                <div className="pt-2 mt-1 border-t border-slate-100 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDocDropdownOpen(false);
                      onOpenUploadModal();
                    }}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 min-h-[40px] text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50/60 hover:bg-indigo-100/80 rounded-xl transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Browse Sample Library & Upload...</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Status, Layout Modes, Upload & Export */}
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        {/* Model status badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
          <Cpu className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Gemini 3.8 Flash Active</span>
        </div>

        {/* Layout Mode Switcher (Desktop & Tablets) */}
        <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => onLayoutChange('reader-only')}
            title="Focus on Document Reader"
            aria-label="View Document Reader only"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              layout === 'reader-only'
                ? 'bg-white shadow-xs text-indigo-600 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reader</span>
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange('split')}
            title="Split View (Reader & Chat side-by-side)"
            aria-label="View Split screen"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              layout === 'split'
                ? 'bg-white shadow-xs text-indigo-600 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Split</span>
          </button>
          <button
            type="button"
            onClick={() => onLayoutChange('chat-only')}
            title="Focus on AI Assistant"
            aria-label="View Chat Assistant only"
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
              layout === 'chat-only'
                ? 'bg-white shadow-xs text-indigo-600 font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Chat</span>
          </button>
        </div>

        {/* Upload Button */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".pdf,.txt" 
          className="hidden" 
        />
        <button
          type="button"
          onClick={onOpenUploadModal}
          aria-label="Upload PDF document"
          className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Upload PDF</span>
        </button>

        {/* Export Annotated PDF Button */}
        <button
          type="button"
          onClick={onExportAnnotatedPdf}
          title="Export Annotated PDF with Native Acrobat Highlights & Citations"
          aria-label="Export Annotated PDF with Native Acrobat Highlights & Citations"
          className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 min-h-[40px] text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl border border-indigo-200/80 transition-colors shadow-2xs"
        >
          <FileCheck2 className="w-4 h-4 text-indigo-600" />
          <span className="hidden md:inline">Annotated PDF</span>
        </button>

        {/* Export Chat */}
        {hasMessages && (
          <button
            type="button"
            onClick={onExportChat}
            title="Export Conversation to Markdown"
            aria-label="Export Conversation to Markdown"
            className="flex items-center justify-center w-10 h-10 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* User Authentication & Workspaces */}
        <button
          type="button"
          onClick={onOpenAuthModal}
          title={currentUser ? `Signed in as ${currentUser.name} (${activeWorkspaceName || 'Primary Workspace'})` : 'Sign In to Workspace'}
          aria-label={currentUser ? `User account: ${currentUser.name}` : 'Sign In'}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all text-left ${
            currentUser
              ? 'bg-slate-50 border-slate-200 hover:border-indigo-300'
              : 'bg-gradient-to-r from-indigo-50 to-slate-50 border-indigo-200 hover:border-indigo-400 text-indigo-800'
          }`}
        >
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-2xs shrink-0 ${
            currentUser ? 'bg-gradient-to-tr from-indigo-600 to-sky-600' : 'bg-slate-700'
          }`}>
            {currentUser ? currentUser.name.slice(0, 2).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
          </div>
          <div className="hidden xl:flex flex-col min-w-0 pr-1 text-left">
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[120px] leading-tight">
              {currentUser ? currentUser.name : 'Workspace'}
            </span>
            <span className="text-[10px] text-slate-500 truncate max-w-[120px] leading-tight">
              {currentUser ? (activeWorkspaceName || 'Personal') : 'Sign In / Sync'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
