import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  X, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { PdfDocument } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => Promise<void>;
  sampleDocuments: PdfDocument[];
  onSelectSampleDoc: (doc: PdfDocument) => void;
  currentDocId: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  sampleDocuments,
  onSelectSampleDoc,
  currentDocId,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    try {
      setIsProcessing(true);
      await onFileUpload(file);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-4 sm:p-6 relative overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 id="upload-modal-title" className="text-sm sm:text-base font-bold text-slate-900">
                Upload or Select Document
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Add any PDF document or explore pre-indexed research samples
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div className="my-4 sm:my-5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt"
            className="hidden"
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/60'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center py-3 space-y-2 text-indigo-600">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-semibold">Extracting text and indexing pages...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-800">
                    Click to upload a PDF or drag and drop
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports standard PDF files up to 25 MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Curated Sample Documents */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Or test with curated sample documents:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-0.5">
            {sampleDocuments.map((doc) => {
              const isSelected = doc.id === currentDocId;

              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    onSelectSampleDoc(doc);
                    onClose();
                  }}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer min-h-[90px] ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {doc.category}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] text-indigo-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                      {doc.name}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 font-sans leading-relaxed">
                      {doc.summary}
                    </p>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{doc.pageCount} pages</span>
                    <span className="flex items-center gap-0.5 text-indigo-600 font-semibold">
                      Open <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
