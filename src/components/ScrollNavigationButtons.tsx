import React, { useState } from 'react';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

interface ScrollNavigationButtonsProps {
  onScrollToTop: () => void;
  onScrollToBottom: () => void;
  isNearTop?: boolean;
  isNearBottom?: boolean;
  canScroll?: boolean;
  scrollPercentage?: number;
  className?: string;
  variant?: 'vertical' | 'horizontal';
}

export const ScrollNavigationButtons: React.FC<ScrollNavigationButtonsProps> = ({
  onScrollToTop,
  onScrollToBottom,
  isNearTop = false,
  isNearBottom = false,
  canScroll = true,
  scrollPercentage = 0,
  className = '',
  variant = 'vertical',
}) => {
  const [hovered, setHovered] = useState<'top' | 'bottom' | null>(null);

  // If content is not scrollable at all, we keep it minimal or hide
  if (!canScroll && isNearTop && isNearBottom) {
    return null;
  }

  return (
    <div
      className={`fixed sm:absolute z-30 select-none ${className}`}
      role="region"
      aria-label="স্ক্রল নেভিগেশন কন্ট্রোল"
    >
      <div
        className={`flex ${
          variant === 'vertical' ? 'flex-col' : 'flex-row'
        } items-center gap-1.5 p-1.5 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border border-stone-200/90 dark:border-stone-750/90 shadow-xl shadow-stone-900/10 dark:shadow-black/40 transition-all duration-300`}
      >
        {/* Scroll to Top Button */}
        <div className="relative group">
          <button
            type="button"
            id="scroll-to-top-btn"
            onClick={onScrollToTop}
            onMouseEnter={() => setHovered('top')}
            onMouseLeave={() => setHovered(null)}
            title="পৃষ্ঠার শীর্ষে যান (Scroll to Top)"
            aria-label="পৃষ্ঠার শীর্ষে যান"
            disabled={isNearTop}
            className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 cursor-pointer ${
              isNearTop
                ? 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
                : 'bg-emerald-50 hover:bg-emerald-500 dark:bg-emerald-950/60 dark:hover:bg-emerald-600 text-emerald-700 hover:text-white dark:text-emerald-300 dark:hover:text-white hover:shadow-md hover:scale-105 active:scale-95'
            }`}
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-y-0.5" />
          </button>

          {/* Floating Tooltip */}
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center whitespace-nowrap pointer-events-none z-50">
            <span className="px-2.5 py-1 text-[11px] font-medium text-white bg-stone-900/95 dark:bg-stone-800/95 rounded-lg shadow-lg border border-stone-700/60 backdrop-blur-xs flex items-center gap-1.5">
              <span>উপরে যান (Top)</span>
              {scrollPercentage > 0 && (
                <span className="text-[10px] text-emerald-300 font-mono">({scrollPercentage}%)</span>
              )}
            </span>
          </div>
        </div>

        {/* Scroll Percentage Indicator Pill */}
        {scrollPercentage > 0 && scrollPercentage < 100 && (
          <div
            className="text-[9px] font-mono font-bold text-stone-500 dark:text-stone-400 px-1 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800/80"
            title={`বর্তমান স্ক্রল অবস্থান: ${scrollPercentage}%`}
          >
            {scrollPercentage}%
          </div>
        )}

        {/* Scroll to Bottom Button */}
        <div className="relative group">
          <button
            type="button"
            id="scroll-to-bottom-btn"
            onClick={onScrollToBottom}
            onMouseEnter={() => setHovered('bottom')}
            onMouseLeave={() => setHovered(null)}
            title="পৃষ্ঠার নিচে যান (Scroll to Bottom)"
            aria-label="পৃষ্ঠার নিচে যান"
            disabled={isNearBottom}
            className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 cursor-pointer ${
              isNearBottom
                ? 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
                : 'bg-emerald-50 hover:bg-emerald-500 dark:bg-emerald-950/60 dark:hover:bg-emerald-600 text-emerald-700 hover:text-white dark:text-emerald-300 dark:hover:text-white hover:shadow-md hover:scale-105 active:scale-95'
            }`}
          >
            <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-y-0.5" />
          </button>

          {/* Floating Tooltip */}
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center whitespace-nowrap pointer-events-none z-50">
            <span className="px-2.5 py-1 text-[11px] font-medium text-white bg-stone-900/95 dark:bg-stone-800/95 rounded-lg shadow-lg border border-stone-700/60 backdrop-blur-xs flex items-center gap-1.5">
              <span>নিচে যান (Bottom)</span>
              <span className="text-[10px] text-emerald-300 font-mono">সর্বশেষ বার্তা</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
