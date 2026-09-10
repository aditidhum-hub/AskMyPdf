import React, { useState, useEffect, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  X, 
  Maximize2, 
  Sidebar,
  Tag,
  Highlighter,
  MessageSquarePlus,
  BookOpen,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Check,
  Layers,
  Scan
} from 'lucide-react';
import { PdfDocument, ReaderSidebarTab, DocumentSearchMatch, DocumentDisplayMode } from '../types';

interface PdfViewerProps {
  document: PdfDocument;
  activePage: number;
  onPageChange: (pageNum: number) => void;
  targetCitationPage?: number | null;
  onAskAboutSelection: (selectedText: string) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  document,
  activePage,
  onPageChange,
  targetCitationPage,
  onAskAboutSelection,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fitWidth, setFitWidth] = useState<boolean>(true);
  const [displayMode, setDisplayMode] = useState<DocumentDisplayMode>('text-reading');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<ReaderSidebarTab>('thumbnails');
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionCoord, setSelectionCoord] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Auto open sidebar on desktop wide screens initially
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

  // Scroll to active page when targetCitationPage or activePage changes
  useEffect(() => {
    const pageToScroll = targetCitationPage || activePage;
    const pageElement = pageRefs.current[pageToScroll];
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [targetCitationPage, activePage]);

  // Compute search matches across all pages
  const searchMatches: DocumentSearchMatch[] = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    const matches: DocumentSearchMatch[] = [];

    document.pages.forEach((page) => {
      const lines = page.content.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes(query)) {
          matches.push({
            pageNumber: page.pageNumber,
            snippet: line.trim(),
            lineIndex: idx,
          });
        }
      });
    });

    return matches;
  }, [searchQuery, document]);

  // Reset match index when query changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    onPageChange(searchMatches[nextIdx].pageNumber);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    onPageChange(searchMatches[prevIdx].pageNumber);
  };

  // Handle text selection in document
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 3) {
      const text = selection.toString().trim();
      setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionCoord({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    } else {
      setSelectedText('');
      setSelectionCoord(null);
    }
  };

  const handleZoom = (delta: number) => {
    setFitWidth(false);
    setZoomLevel((prev) => Math.min(180, Math.max(60, prev + delta)));
  };

  const highlightMatchesInText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-300 text-slate-900 rounded-xs px-0.5 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/80 overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="h-12 border-b border-slate-200 bg-white px-2 sm:px-3 flex items-center justify-between shrink-0 select-none z-10 shadow-xs">
        {/* Left: Sidebar toggle & Page navigators */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Toggle Thumbnails / Outline Sidebar"
            aria-label="Toggle Thumbnails / Outline Sidebar"
            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
              sidebarOpen 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sidebar className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5 sm:mx-1" />

          {/* Page navigation */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, activePage - 1))}
              disabled={activePage <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Previous Page"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 px-1">
              <span>{activePage}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-500">{document.pageCount}</span>
            </div>
            <button
              type="button"
              onClick={() => onPageChange(Math.min(document.pageCount, activePage + 1))}
              disabled={activePage >= document.pageCount}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Next Page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: In-document search */}
        <div className="flex items-center gap-1.5">
          {isSearchOpen ? (
            <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-300 shadow-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find in text..."
                aria-label="Search within document"
                className="w-24 xs:w-32 sm:w-44 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                autoFocus
              />
              {searchQuery && (
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium whitespace-nowrap">
                  <span>{searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : '0'}</span>
                  {searchMatches.length > 0 && (
                    <div className="flex items-center">
                      <button 
                        type="button"
                        onClick={handlePrevMatch} 
                        className="p-0.5 hover:text-slate-800"
                        title="Previous match"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button 
                        type="button"
                        onClick={handleNextMatch} 
                        className="p-0.5 hover:text-slate-800"
                        title="Next match"
                      >
                        <ChevronDownIcon className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-0.5"
                title="Close search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              title="Search within PDF"
              aria-label="Search within PDF"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right: Zoom controls & Fit width */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={() => handleZoom(-15)}
            disabled={zoomLevel <= 60}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-semibold text-slate-600 w-10 text-center">
            {fitWidth ? 'Fit' : `${zoomLevel}%`}
          </span>

          <button
            type="button"
            onClick={() => handleZoom(15)}
            disabled={zoomLevel >= 180}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setFitWidth(!fitWidth);
              if (!fitWidth) setZoomLevel(100);
            }}
            className={`px-1.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1 ${
              fitWidth 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Fit Width"
            aria-label="Toggle Fit Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fit</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <button
            type="button"
            onClick={() => setDisplayMode(displayMode === 'text-reading' ? 'canvas-visual' : 'text-reading')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1.5 ${
              displayMode === 'canvas-visual'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={displayMode === 'text-reading' ? 'Switch to Visual Canvas View' : 'Switch to Structured Text View'}
            aria-label="Toggle Document View Mode"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{displayMode === 'text-reading' ? 'Visual View' : 'Text View'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area: Sidebar Drawer + Scrollable Document Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop for Sidebar Drawer */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-30 animate-in fade-in duration-150"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Document Sidebar (Slide-in drawer on mobile, sticky side pane on desktop) */}
        {sidebarOpen && (
          <aside className="fixed inset-y-0 left-0 z-40 md:static w-72 md:w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 select-none shadow-xl md:shadow-none transition-all duration-200 animate-in slide-in-from-left duration-150">
            {/* Mobile Header with Close button */}
            <div className="flex md:hidden items-center justify-between px-3 py-2.5 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-bold text-slate-800">Document Navigation</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-medium bg-slate-50/50">
              <button
                type="button"
                onClick={() => setSidebarTab('thumbnails')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors min-h-[40px] flex items-center justify-center ${
                  sidebarTab === 'thumbnails'
                    ? 'border-indigo-600 text-indigo-700 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Pages ({document.pageCount})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('summary')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-colors min-h-[40px] flex items-center justify-center ${
                  sidebarTab === 'summary'
                    ? 'border-indigo-600 text-indigo-700 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSidebarTab('search')}
                  className={`flex-1 py-2.5 text-center border-b-2 transition-colors min-h-[40px] flex items-center justify-center ${
                    sidebarTab === 'search'
                      ? 'border-indigo-600 text-indigo-700 font-bold bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Matches ({searchMatches.length})
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {sidebarTab === 'thumbnails' && (
                <div className="space-y-3">
                  {document.pages.map((p) => {
                    const isCurrent = p.pageNumber === activePage;
                    return (
                      <button
                        type="button"
                        key={p.pageNumber}
                        onClick={() => {
                          onPageChange(p.pageNumber);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className={`w-full group cursor-pointer rounded-xl p-2.5 border transition-all text-left block ${
                          isCurrent
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/30'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-xs font-bold ${isCurrent ? 'text-indigo-900' : 'text-slate-700'}`}>
                            Page {p.pageNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {p.content.split(/\s+/).length} words
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-800 line-clamp-1 mb-1">
                          {p.title || `Section ${p.pageNumber}`}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-serif">
                          {p.content}
                        </p>
                        {p.keyTopics && p.keyTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.keyTopics.slice(0, 2).map((topic, i) => (
                              <span
                                key={i}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {sidebarTab === 'summary' && (
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Document Abstract
                    </h4>
                    <p className="text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      {document.summary}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      Core Findings
                    </h4>
                    <ul className="space-y-2">
                      {document.keyFindings.map((finding, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {sidebarTab === 'search' && (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-500 font-medium mb-1">
                    Occurrences of "{searchQuery}":
                  </div>
                  {searchMatches.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onPageChange(m.pageNumber);
                        if (window.innerWidth < 768) setSidebarOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                        idx === currentMatchIndex
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                          : 'border-slate-200 hover:border-indigo-300 bg-white hover:bg-indigo-50/30'
                      }`}
                    >
                      <div className="text-[10px] font-bold text-indigo-600 mb-0.5 flex items-center justify-between">
                        <span>Page {m.pageNumber}</span>
                        {idx === currentMatchIndex && <span className="text-[9px] uppercase font-bold text-indigo-700">Active</span>}
                      </div>
                      <p className="text-[11px] text-slate-700 line-clamp-2">
                        {highlightMatchesInText(m.snippet, searchQuery)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Scrollable Document Canvas */}
        <div
          ref={containerRef}
          onMouseUp={handleMouseUp}
          className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 flex flex-col items-center space-y-6 scroll-smooth"
        >
          {document.pages.map((page) => {
            const isTargetCitation = targetCitationPage === page.pageNumber;
            const isCurrent = activePage === page.pageNumber;

            return (
              <div
                key={page.pageNumber}
                ref={(el) => {
                  pageRefs.current[page.pageNumber] = el;
                }}
                id={`page-${page.pageNumber}`}
                style={{
                  width: fitWidth ? '100%' : `${Math.round(zoomLevel * 6.5)}px`,
                  maxWidth: fitWidth ? '780px' : 'none',
                  minHeight: `${Math.round((fitWidth ? 100 : zoomLevel) * 8.4)}px`,
                }}
                className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 relative flex flex-col justify-between p-5 sm:p-8 md:p-12 font-serif text-slate-800 ${
                  isTargetCitation
                    ? 'ring-4 ring-amber-400/80 border-amber-500 shadow-xl shadow-amber-500/10 scale-[1.005]'
                    : isCurrent
                    ? 'border-indigo-300 shadow-md'
                    : 'border-slate-200'
                }`}
              >
                {/* Header of paper page */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5 font-sans text-xs text-slate-400 select-none">
                  <span className="font-semibold text-slate-600 tracking-tight truncate max-w-[180px] sm:max-w-[280px]">
                    {document.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {page.isOcr && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                        <Scan className="w-2.5 h-2.5" />
                        OCR Extracted
                      </span>
                    )}
                    {isTargetCitation && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse">
                        Cited in Answer
                      </span>
                    )}
                    <span className="font-medium">Page {page.pageNumber}</span>
                  </div>
                </div>

                {/* Dynamic Bounding Box Overlay for Citations */}
                {isTargetCitation && (
                  <div 
                    className="absolute inset-x-4 sm:inset-x-8 top-16 bottom-14 rounded-xl border-2 border-amber-500/80 bg-amber-400/10 pointer-events-none transition-all duration-300 animate-pulse shadow-lg shadow-amber-500/10 flex items-start justify-end p-2 z-10"
                  >
                    <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
                      Referenced Citation
                    </span>
                  </div>
                )}

                {/* OCR and Semantic Bounding Boxes */}
                {page.boundingBoxes && page.boundingBoxes.map((box) => (
                  <div
                    key={box.id}
                    style={{
                      position: 'absolute',
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      zIndex: 5,
                    }}
                    className="border border-indigo-400/40 bg-indigo-500/5 rounded-xs pointer-events-none"
                    title={box.text}
                  />
                ))}

                {/* Main page content: Visual Canvas Mode vs Text Reader Mode */}
                {displayMode === 'canvas-visual' ? (
                  <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col justify-between font-sans relative overflow-hidden shadow-inner">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-200/80 pb-2">
                        <span>CANVAS VIEWPORT [SCALE: {zoomLevel}%]</span>
                        <span>DPI: 150</span>
                      </div>
                      <h2 className="font-bold text-lg text-slate-900 border-l-4 border-indigo-600 pl-3">
                        {highlightMatchesInText(page.title || `Section ${page.pageNumber}`, searchQuery)}
                      </h2>
                      <div className="whitespace-pre-line text-slate-700 text-xs sm:text-sm font-mono leading-relaxed bg-white/80 p-4 rounded-lg border border-slate-200">
                        {highlightMatchesInText(page.content, searchQuery)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 space-y-4 leading-relaxed text-xs sm:text-sm md:text-base font-serif text-slate-800">
                    {page.title && (
                      <h2 className="font-sans font-bold text-base sm:text-lg md:text-xl text-slate-900 border-l-4 border-indigo-600 pl-3 py-0.5">
                        {highlightMatchesInText(page.title, searchQuery)}
                      </h2>
                    )}

                    <div className="whitespace-pre-line text-justify tracking-normal leading-relaxed">
                      {highlightMatchesInText(page.content, searchQuery)}
                    </div>
                  </div>
                )}

                {/* Footer of paper page */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between font-sans text-[11px] sm:text-xs text-slate-400 select-none">
                  <span>AskMyPDF Grounded Extraction</span>
                  <span>Document Page {page.pageNumber} of {document.pageCount}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Tooltip when text is highlighted */}
        {selectedText && selectionCoord && (
          <div
            style={{
              position: 'fixed',
              left: `${Math.max(80, Math.min(window.innerWidth - 80, selectionCoord.x))}px`,
              top: `${Math.max(15, selectionCoord.y - 45)}px`,
              transform: 'translateX(-50%)',
            }}
            className="z-50 bg-slate-900 text-white rounded-xl shadow-2xl px-3 py-1.5 flex items-center gap-2 text-xs font-medium animate-in fade-in zoom-in-95 duration-150"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="max-w-[140px] truncate">"{selectedText}"</span>
            <button
              type="button"
              onClick={() => {
                onAskAboutSelection(selectedText);
                setSelectedText('');
                setSelectionCoord(null);
              }}
              className="ml-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 min-h-[30px] rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
            >
              <MessageSquarePlus className="w-3 h-3" />
              <span>Ask AI</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
