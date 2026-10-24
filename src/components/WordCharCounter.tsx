import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  BarChart3, 
  Clock, 
  Hash, 
  AlignLeft, 
  Layers, 
  Cpu, 
  Copy, 
  Check, 
  Sparkles,
  Info,
  X
} from 'lucide-react';

export interface WordCharCounterProps {
  text: string;
  className?: string;
  onCleanWhitespace?: (cleaned: string) => void;
}

// Convert numbers to Bengali digits
export const toBengaliDigits = (num: number | string): string => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
};

export const WordCharCounter: React.FC<WordCharCounterProps> = ({
  text,
  className = '',
  onCleanWhitespace,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Compute live text statistics
  const stats = useMemo(() => {
    const raw = text || '';
    const trimmed = raw.trim();
    
    // Characters count
    const totalChars = raw.length;
    const charsNoSpaces = raw.replace(/\s+/g, '').length;
    
    // Words count (handles Bengali, English, numbers, punctuations)
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    
    // Lines and paragraphs
    const lines = raw ? raw.split('\n').length : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0;
    
    // Estimated reading time (~180 words per minute)
    let readingTimeText = '০ সেকেন্ড';
    if (words > 0) {
      const seconds = Math.max(1, Math.round((words / 180) * 60));
      if (seconds < 60) {
        readingTimeText = `~${toBengaliDigits(seconds)} সেকেন্ড`;
      } else {
        const minutes = Math.ceil(seconds / 60);
        readingTimeText = `~${toBengaliDigits(minutes)} মিনিট`;
      }
    }
    
    // Estimated Gemini tokens (approximation: ~3 characters per token for mixed Bengali/English)
    const estimatedTokens = totalChars > 0 ? Math.max(1, Math.ceil(totalChars / 3.2)) : 0;

    return {
      totalChars,
      charsNoSpaces,
      words,
      lines,
      paragraphs,
      readingTimeText,
      estimatedTokens,
    };
  }, [text]);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCleanSpaces = () => {
    if (!onCleanWhitespace || !text) return;
    // Normalize consecutive spaces and trim edges
    const cleaned = text
      .split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      .trim();
    onCleanWhitespace(cleaned);
  };

  // Determine counter accent theme based on length
  const isHighLength = stats.totalChars > 4000;
  const isMediumLength = stats.totalChars > 1500;

  return (
    <div ref={containerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Interactive live stats pill button */}
      <button
        id="word-char-counter-pill"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="লাইভ টেক্সট পরিসংখ্যান (শব্দ ও অক্ষর কাউন্টার) - বিস্তারিত দেখতে ক্লিক করুন"
        aria-expanded={isOpen}
        className={`group flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all select-none cursor-pointer border ${
          stats.totalChars > 0
            ? isHighLength
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
              : 'bg-stone-100 dark:bg-stone-850 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200/70 dark:hover:bg-stone-800 hover:border-emerald-500/40'
            : 'bg-transparent text-stone-400 dark:text-stone-500 border-transparent hover:bg-stone-100 dark:hover:bg-stone-800/60'
        }`}
      >
        <BarChart3 className={`w-3.5 h-3.5 shrink-0 transition-colors ${
          stats.totalChars > 0 
            ? 'text-emerald-600 dark:text-emerald-400' 
            : 'text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300'
        }`} />

        <div className="hidden sm:flex items-center gap-1 tracking-tight">
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            {toBengaliDigits(stats.words)}
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">শব্দ</span>
          
          <span className="text-stone-300 dark:text-stone-700 mx-0.5">•</span>
          
          <span className="font-semibold text-stone-800 dark:text-stone-200">
            {toBengaliDigits(stats.totalChars)}
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">অক্ষর</span>
        </div>

        <div className="sm:hidden flex items-center gap-0.5 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
          <span>{toBengaliDigits(stats.words)}</span>
          <span className="text-[9px] text-stone-400">w</span>
        </div>

        <Info className={`hidden sm:inline-block w-3 h-3 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity ${
          isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'
        }`} />
      </button>

      {/* Floating Detailed Text Statistics Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="text-statistics-popup-card"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full right-0 mb-2 w-72 sm:w-80 p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl shadow-stone-950/15 z-50 text-stone-800 dark:text-stone-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight text-stone-900 dark:text-stone-100">
                    টেক্সট পরিসংখ্যান (Live Statistics)
                  </h4>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">
                    ইনপুট লেখার রিয়েল-টাইম হিসাব
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Words */}
              <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-1">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] font-medium">মোট শব্দ</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
                    {toBengaliDigits(stats.words)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">({stats.words})</span>
                </div>
              </div>

              {/* Total Characters */}
              <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-1">
                  <Hash className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-[11px] font-medium">মোট অক্ষর</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
                    {toBengaliDigits(stats.totalChars)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">({stats.totalChars})</span>
                </div>
              </div>

              {/* Characters without spaces */}
              <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-1">
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[11px] font-medium">স্পেস ছাড়া অক্ষর</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-stone-900 dark:text-stone-100 font-mono">
                    {toBengaliDigits(stats.charsNoSpaces)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">({stats.charsNoSpaces})</span>
                </div>
              </div>

              {/* Lines & Paragraphs */}
              <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-1">
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-medium">লাইন / প্যারাগ্রাফ</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100 font-mono">
                    {toBengaliDigits(stats.lines)} <span className="text-[10px] font-normal text-stone-500">লাইন</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {toBengaliDigits(stats.paragraphs)} প্যারা
                  </span>
                </div>
              </div>

              {/* Reading Time */}
              <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-[11px] font-medium">পড়ার সময়</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    {stats.readingTimeText}
                  </span>
                  <span className="text-[9px] text-stone-400">@১৮০ wpm</span>
                </div>
              </div>

              {/* AI Token estimate */}
              <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800/80 flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-[11px] font-medium">এআই টোকেন (প্রায়)</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-teal-700 dark:text-teal-300 font-mono">
                    ~{toBengaliDigits(stats.estimatedTokens)}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">
                    (~{stats.estimatedTokens})
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            {stats.totalChars > 0 && (
              <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                {onCleanWhitespace && (
                  <button
                    type="button"
                    onClick={handleCleanSpaces}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-[11px] font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1 cursor-pointer transition-colors"
                    title="অতিরিক্ত স্পেস ও খালি লাইন দূর করুন"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>স্পেস ছাঁটাই</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-auto px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  title="সম্পূর্ণ ইনপুট ক্লিপবোর্ডে কপি করুন"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>কপি হয়েছে</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>কপি করুন</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
