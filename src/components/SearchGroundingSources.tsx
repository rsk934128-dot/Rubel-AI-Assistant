import React, { useState, useMemo } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Search, 
  Copy, 
  Check, 
  Layers, 
  LayoutGrid, 
  ListFilter, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import { GroundingChunk } from '../types';

interface SearchGroundingSourcesProps {
  groundingChunks?: GroundingChunk[];
  searchQueries?: string[];
  className?: string;
  onOpenBrowser?: (url: string, type: 'web' | 'search', context?: any) => void;
}

interface CleanSource {
  id: string;
  url: string;
  title: string;
  domain: string;
  faviconUrl: string;
}

// Convert English digits to Bengali digits
function toBengaliNumerals(n: number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n)
    .split('')
    .map((d) => bnDigits[parseInt(d, 10)] ?? d)
    .join('');
}

export const SearchGroundingSources: React.FC<SearchGroundingSourcesProps> = ({
  groundingChunks = [],
  searchQueries = [],
  className = '',
  onOpenBrowser,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [failedFavicons, setFailedFavicons] = useState<Record<string, boolean>>({});

  // Deduplicate and sanitize sources
  const sources = useMemo<CleanSource[]>(() => {
    if (!Array.isArray(groundingChunks) || groundingChunks.length === 0) return [];

    const seenUrls = new Set<string>();
    const list: CleanSource[] = [];

    for (let i = 0; i < groundingChunks.length; i++) {
      const chunk = groundingChunks[i];
      if (!chunk?.web?.uri) continue;

      const rawUri = chunk.web.uri.trim();
      if (!rawUri || !rawUri.startsWith('http')) continue;

      // Normalize URL to deduplicate (remove utm params and trailing slash)
      let normalized = rawUri;
      let domain = 'web';
      try {
        const parsed = new URL(rawUri);
        domain = parsed.hostname.replace(/^www\./, '');
        // Normalized key: domain + pathname without trailing slash
        normalized = `${parsed.protocol}//${parsed.hostname}${parsed.pathname.replace(/\/$/, '')}`;
      } catch {
        normalized = rawUri;
      }

      if (seenUrls.has(normalized)) continue;
      seenUrls.add(normalized);

      const rawTitle = (chunk.web.title || '').trim();
      const displayTitle = rawTitle || domain;
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

      list.push({
        id: `src-${i}-${domain}`,
        url: rawUri,
        title: displayTitle,
        domain,
        faviconUrl,
      });
    }

    return list;
  }, [groundingChunks]);

  if (sources.length === 0 && (!searchQueries || searchQueries.length === 0)) {
    return null;
  }

  const handleCopy = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => {
      setCopiedUrl((prev) => (prev === url ? null : prev));
    }, 2000);
  };

  const visibleSources = isExpanded ? sources : sources.slice(0, 4);
  const hasMore = sources.length > 4;

  return (
    <div
      className={`mt-4 pt-3.5 border-t border-stone-200/80 dark:border-stone-800/80 ${className}`}
    >
      {/* Header bar with Badges & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>গুগল সার্চ গ্রাউন্ডিং তথ্যসূত্র</span>
          </div>
          {sources.length > 0 && (
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
              {toBengaliNumerals(sources.length)}টি বিশ্বস্ত সোর্স
            </span>
          )}
        </div>

        {/* View Toggle & Open All Action */}
        <div className="flex items-center gap-1.5 shrink-0">
          {sources.length > 1 && onOpenBrowser && (
            <button
              type="button"
              onClick={() => {
                const first = sources[0];
                onOpenBrowser(first.url, 'web', {
                  urls: sources.map((s) => ({ url: s.url, title: s.title })),
                  topics: searchQueries,
                });
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
              title="সবগুলো তথ্যসূত্র মিনি গুগল ব্রাউজারে ব্রাউজ করুন"
            >
              <BookOpen className="w-3 h-3 text-blue-500" />
              <span className="hidden sm:inline">সবগুলো পড়ুন</span>
            </button>
          )}

          {sources.length > 1 && (
            <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-stone-700 text-blue-600 dark:text-blue-300 shadow-2xs font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="কার্ড ভিউ"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                className={`p-1 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === 'compact'
                    ? 'bg-white dark:bg-stone-700 text-blue-600 dark:text-blue-300 shadow-2xs font-semibold'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="কম্প্যাক্ট লিংক ভিউ"
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sources Display: Cards View */}
      {viewMode === 'cards' && sources.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {visibleSources.map((source, index) => {
            const hasFailedFavicon = Boolean(failedFavicons[source.domain]);

            return (
              <div
                key={source.id}
                className="group/card relative flex flex-col justify-between p-3 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-blue-400/80 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-200 text-xs"
              >
                {/* Top Section: Citation Index, Favicon, Title */}
                <div className="flex items-start gap-2.5 min-w-0">
                  {/* Citation index pill */}
                  <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] font-bold text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60">
                    {toBengaliNumerals(index + 1)}
                  </span>

                  {/* Favicon or fallback globe icon */}
                  <div className="shrink-0 w-6 h-6 rounded-md bg-stone-100 dark:bg-stone-800 flex items-center justify-center overflow-hidden border border-stone-200/60 dark:border-stone-700/60 mt-0.5">
                    {!hasFailedFavicon ? (
                      <img
                        src={source.faviconUrl}
                        alt=""
                        className="w-4 h-4 object-contain"
                        onError={() => {
                          setFailedFavicons((prev) => ({ ...prev, [source.domain]: true }));
                        }}
                      />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                    )}
                  </div>

                  {/* Title & Domain */}
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenBrowser) {
                          onOpenBrowser(source.url, 'web', {
                            urls: sources.map((s) => ({ url: s.url, title: s.title })),
                            topics: searchQueries,
                          });
                        }
                      }}
                      className="text-left cursor-pointer w-full group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors"
                      title={source.title}
                    >
                      <h4 className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 leading-snug">
                        {source.title}
                      </h4>
                    </button>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-1 flex items-center gap-1 font-mono">
                      <span>{source.domain}</span>
                    </p>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between gap-1 text-[11px]">
                  {/* In-app Mini Browser button */}
                  {onOpenBrowser ? (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenBrowser(source.url, 'web', {
                          urls: sources.map((s) => ({ url: s.url, title: s.title })),
                          topics: searchQueries,
                        });
                      }}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors cursor-pointer"
                      title="মিনি গুগল ব্রাউজারে পড়ুন"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>মিনি ব্রাউজার</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-stone-400 font-medium">যাচাইকৃত লিংক</span>
                  )}

                  {/* Actions: Copy Link & External Open */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleCopy(source.url, e)}
                      className={`p-1 rounded-md transition-colors cursor-pointer ${
                        copiedUrl === source.url
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                      }`}
                      title={copiedUrl === source.url ? 'কপি হয়েছে!' : 'লিংক কপি করুন'}
                    >
                      {copiedUrl === source.url ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                      title="নতুন ট্যাবে খুলুন"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sources Display: Compact Badges / Links View */}
      {viewMode === 'compact' && sources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSources.map((source, index) => {
            const hasFailedFavicon = Boolean(failedFavicons[source.domain]);

            return (
              <div
                key={source.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-850 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-xs transition-all shadow-2xs group"
              >
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
                  [{toBengaliNumerals(index + 1)}]
                </span>

                <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                  {!hasFailedFavicon ? (
                    <img
                      src={source.faviconUrl}
                      alt=""
                      className="w-3.5 h-3.5 object-contain"
                      onError={() => {
                        setFailedFavicons((prev) => ({ ...prev, [source.domain]: true }));
                      }}
                    />
                  ) : (
                    <Globe className="w-3 h-3 text-blue-500" />
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenBrowser) {
                      onOpenBrowser(source.url, 'web', {
                        urls: sources.map((s) => ({ url: s.url, title: s.title })),
                        topics: searchQueries,
                      });
                    }
                  }}
                  className="font-medium text-stone-800 dark:text-stone-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 max-w-[180px] sm:max-w-[260px] truncate text-left cursor-pointer"
                  title={source.title}
                >
                  {source.title}
                </button>

                <div className="flex items-center gap-0.5 ml-1 border-l border-stone-200 dark:border-stone-700 pl-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleCopy(source.url, e)}
                    className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                    title={copiedUrl === source.url ? 'কপি হয়েছে' : 'কপি করুন'}
                  >
                    {copiedUrl === source.url ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                    title="নতুন ট্যাবে খুলুন"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Show more / collapse button */}
      {hasMore && (
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:text-blue-600 dark:hover:text-blue-300 py-1 px-2.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>সংক্ষেপ করুন</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>আরও {toBengaliNumerals(sources.length - 4)}টি তথ্যসূত্র দেখুন</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Search Queries Section */}
      {searchQueries && searchQueries.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-850 flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1 shrink-0">
            <Search className="w-3 h-3 text-blue-500" />
            <span>গুগল সার্চ কোয়েরি:</span>
          </span>
          {searchQueries.map((query, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (onOpenBrowser) {
                  onOpenBrowser(query, 'search');
                }
              }}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-stone-100/90 hover:bg-blue-50 dark:bg-stone-800 dark:hover:bg-blue-950/40 text-stone-700 hover:text-blue-600 dark:text-stone-300 dark:hover:text-blue-300 border border-stone-200/80 hover:border-blue-300 dark:border-stone-700 transition-colors cursor-pointer font-sans"
              title={`মিনি ব্রাউজারে '${query}' সার্চ করুন`}
            >
              <span>"{query}"</span>
              <ArrowUpRight className="w-2.5 h-2.5 opacity-60" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
