import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Database, 
  FileCode, 
  Download, 
  Check, 
  Loader2, 
  Calendar, 
  MessageSquare, 
  Sparkles,
  AlertCircle,
  ArrowLeft,
  Copy,
  ChevronDown
} from 'lucide-react';
import { ChatSession } from '../types';
import { 
  exportChatAsPDF, 
  exportChatAsJSON, 
  exportChatAsMarkdown, 
  copyChatMarkdownToClipboard 
} from '../utils/exportChat';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, session }) => {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfStatus, setPdfStatus] = useState('');
  const [exportedFormat, setExportedFormat] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMarkdownOption, setSelectedMarkdownOption] = useState<'download' | 'copy'>('download');
  const [isMarkdownMenuOpen, setIsMarkdownMenuOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const markdownMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (markdownMenuRef.current && !markdownMenuRef.current.contains(event.target as Node)) {
        setIsMarkdownMenuOpen(false);
      }
    };
    if (isMarkdownMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMarkdownMenuOpen]);

  if (!isOpen || !session) return null;

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      setErrorMessage(null);
      setPdfStatus('শুরু হচ্ছে...');
      await exportChatAsPDF(session, (status) => {
        setPdfStatus(status);
      });
      setExportedFormat('PDF');
      setTimeout(() => setExportedFormat(null), 3500);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setErrorMessage(err.message || 'পিডিএফ তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsExportingPDF(false);
      setPdfStatus('');
    }
  };

  const handleExportJSON = () => {
    try {
      setErrorMessage(null);
      exportChatAsJSON(session);
      setExportedFormat('JSON');
      setTimeout(() => setExportedFormat(null), 3500);
    } catch (err: any) {
      console.error('JSON export failed:', err);
      setErrorMessage(err.message || 'JSON ফাইলে এক্সপোর্ট করা সম্ভব হয়নি।');
    }
  };

  const handleExportMarkdown = () => {
    try {
      setErrorMessage(null);
      exportChatAsMarkdown(session);
      setExportedFormat('Markdown');
      setTimeout(() => setExportedFormat(null), 3500);
    } catch (err: any) {
      console.error('Markdown export failed:', err);
      setErrorMessage(err.message || 'Markdown ফাইলে এক্সপোর্ট করা সম্ভব হয়নি।');
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      setErrorMessage(null);
      const success = await copyChatMarkdownToClipboard(session);
      if (success) {
        setIsCopied(true);
        setExportedFormat('Markdown ক্লিপবোর্ডে কপি করা হয়েছে');
        setTimeout(() => {
          setIsCopied(false);
          setExportedFormat(null);
        }, 3500);
      } else {
        setErrorMessage('ক্লিপবোর্ডে কপি করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch (err: any) {
      console.error('Markdown copy failed:', err);
      setErrorMessage('ক্লিপবোর্ডে কপি করতে সমস্যা হয়েছে।');
    }
  };

  const handleExecuteMarkdownAction = (action?: 'download' | 'copy') => {
    const act = action || selectedMarkdownOption;
    if (act === 'copy') {
      handleCopyMarkdown();
    } else {
      handleExportMarkdown();
    }
  };

  const formattedDate = new Date(session.createdAt).toLocaleDateString('bn-BD', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      id="export-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="export-modal-content"
        className="relative w-full max-w-xl bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-stone-200 dark:border-stone-800 overflow-hidden text-stone-900 dark:text-stone-100 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-950/40 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                কথোপকথন এক্সপোর্ট করুন
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Export Chat
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                আপনার কথোপকথনটি সংরক্ষণ ও শেয়ার করার জন্য কাঙ্ক্ষিত ফাইল ফরম্যাট বেছে নিন।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all cursor-pointer shadow-xs border border-stone-200 dark:border-stone-700"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              id="close-export-modal-btn"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Chat Summary Card */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold truncate max-w-[280px]" title={session.title}>
              {session.title || 'নতুন কথোপকথন'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400 shrink-0 text-[11px]">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {session.messages.length}টি বার্তা
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Success toast notification */}
        {exportedFormat && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {exportedFormat.includes('কপি') ? (
                <strong>{exportedFormat}</strong>
              ) : (
                <>
                  <strong>{exportedFormat}</strong> ফাইলটি সফলভাবে ডাউনলোড হয়েছে! আপনার ব্রাউজারের ডাউনলোড ফোল্ডার চেক করুন।
                </>
              )}
            </span>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Options Grid */}
        <div className="p-5 space-y-3">
          {/* 1. PDF Export Option */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 bg-white dark:bg-stone-900/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    PDF ডকুমেন্ট (.pdf)
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                    জনপ্রিয়
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  সুন্দর ফরম্যাটিং, বাংলা ফন্ট, কোড সিনট্যাক্স ও সোর্স লিঙ্ক সহ প্রিন্ট বা পড়ার জন্য উচ্চ মানের A4 পিডিএফ।
                </p>
                {isExportingPDF && pdfStatus && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1.5 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {pdfStatus}
                  </p>
                )}
              </div>
            </div>

            <button
              id="export-as-pdf-btn"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="sm:self-center shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white shadow-xs transition-colors cursor-pointer"
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>PDF ডাউনলোড</span>
                </>
              )}
            </button>
          </div>

          {/* 2. JSON Export Option */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 bg-white dark:bg-stone-900/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    JSON ডেটা ফাইল (.json)
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    ডেটা ও ব্যাকআপ
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                  মেটাডেটা, টাইমস্ট্যাম্প, রোল, গ্রাউন্ডিং তথ্য ও সমস্ত বার্তা সহ পূর্ণাঙ্গ কাঠামোগত JSON ব্যাকআপ।
                </p>
              </div>
            </div>

            <button
              id="export-as-json-btn"
              onClick={handleExportJSON}
              className="sm:self-center shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>JSON ডাউনলোড</span>
            </button>
          </div>

          {/* 3. Markdown Export Option with Dropdown Menu & Selectable Actions */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 bg-white dark:bg-stone-900/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-all flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Markdown ফরম্যাট (.md)
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      নোটস ও ডকুমেন্ট
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                    Obsidian, Notion, GitHub বা টেক্সট এডিটরে ব্যবহারের জন্য রিডেবল মার্কডাউন। ডাউনলোড অথবা সরাসরি ক্লিপবোর্ডে কপি করুন।
                  </p>
                </div>
              </div>

              {/* Split Button / Menu Control */}
              <div className="relative sm:self-center shrink-0" ref={markdownMenuRef}>
                <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-blue-600 dark:border-blue-500">
                  {/* Primary Action Button */}
                  <button
                    id="export-as-markdown-btn"
                    onClick={() => handleExecuteMarkdownAction()}
                    className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                    title={selectedMarkdownOption === 'copy' ? 'ক্লিপবোর্ডে কপি করুন' : 'Markdown ফাইল ডাউনলোড করুন'}
                  >
                    {selectedMarkdownOption === 'copy' ? (
                      isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-200" />
                          <span>কপি হয়েছে!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy to Clipboard</span>
                        </>
                      )
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download as Markdown</span>
                      </>
                    )}
                  </button>

                  {/* Dropdown Menu Toggle Button */}
                  <button
                    id="markdown-menu-toggle-btn"
                    type="button"
                    onClick={() => setIsMarkdownMenuOpen((prev) => !prev)}
                    className="px-2.5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white border-l border-blue-500/50 transition-colors cursor-pointer flex items-center justify-center"
                    title="Markdown মেনু বিকল্প নির্বাচন করুন (Select Option)"
                    aria-label="Toggle Markdown Menu"
                    aria-expanded={isMarkdownMenuOpen}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMarkdownMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isMarkdownMenuOpen && (
                  <div
                    id="markdown-export-menu"
                    className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-stone-850 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-3.5 py-1.5 text-[10px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-100 dark:border-stone-800">
                      Markdown অপশন মেনু
                    </div>

                    {/* Option 1: Download as Markdown */}
                    <button
                      type="button"
                      id="menu-download-markdown-btn"
                      onClick={() => {
                        setSelectedMarkdownOption('download');
                        setIsMarkdownMenuOpen(false);
                        handleExecuteMarkdownAction('download');
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer ${
                        selectedMarkdownOption === 'download'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Download className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <div className="font-medium">Download as Markdown</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">.md ফাইল হিসেবে ডিভাইসে সেভ</div>
                        </div>
                      </div>
                      {selectedMarkdownOption === 'download' && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </button>

                    {/* Option 2: Copy to Clipboard */}
                    <button
                      type="button"
                      id="menu-copy-markdown-btn"
                      onClick={() => {
                        setSelectedMarkdownOption('copy');
                        setIsMarkdownMenuOpen(false);
                        handleExecuteMarkdownAction('copy');
                      }}
                      className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer ${
                        selectedMarkdownOption === 'copy'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <div className="font-medium">Copy to Clipboard</div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400">সরাসরি ক্লিপবোর্ডে কপি করুন</div>
                        </div>
                      </div>
                      {selectedMarkdownOption === 'copy' && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Segmented Toggle Menu Bar for Direct Selection */}
            <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                মেনু বিকল্প নির্বাচন করুন:
              </span>
              <div className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  id="tab-download-markdown-btn"
                  onClick={() => {
                    setSelectedMarkdownOption('download');
                    handleExecuteMarkdownAction('download');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedMarkdownOption === 'download'
                      ? 'bg-white dark:bg-stone-700 text-blue-600 dark:text-blue-300 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download as Markdown</span>
                </button>
                <button
                  type="button"
                  id="tab-copy-markdown-btn"
                  onClick={() => {
                    setSelectedMarkdownOption('copy');
                    handleExecuteMarkdownAction('copy');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedMarkdownOption === 'copy'
                      ? 'bg-white dark:bg-stone-700 text-blue-600 dark:text-blue-300 shadow-xs font-semibold'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'কপি হয়েছে' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-950/60 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span className="truncate mr-2">🔒 সমস্ত এক্সপোর্ট সরাসরি আপনার ব্রাউজারে সুরক্ষিত থাকে।</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-700 dark:hover:bg-stone-600 font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>চ্যাটে ফিরে যান (Back)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
