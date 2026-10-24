import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  ExternalLink,
  Music,
  Youtube,
  Disc3,
  Sparkles,
  Share2,
  Copy,
  Check,
  AlertCircle,
  Play,
  RotateCcw,
  Search,
  Radio,
  RefreshCw,
  ArrowLeft,
  SkipForward,
  SkipBack,
  Repeat,
  Repeat1,
  Shuffle,
  Heart,
  ListMusic,
  History,
  Clock,
  Trash2,
  Plus,
  Flame,
  Volume2,
  Zap,
  Lightbulb,
  Headphones,
  Moon,
  Coffee,
  Globe,
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useMiniBrowser } from '../context/MiniBrowserContext';
import { extractYouTubeVideoId } from '../utils/youtube';
import {
  getTimeOfDayPeriod,
  getTimeMoodInfo,
  CURATED_YOUTUBE_TRACKS,
  SMART_MUSIC_IDEAS,
  formatRelativeTimeBn,
  TimeOfDayPeriod,
  MusicIdea,
} from '../utils/dynamicMusicFeed';
import { MusicTrack } from '../types';
import { ScrollNavigationButtons } from './ScrollNavigationButtons';

interface MusicPlayerModalProps {
  onAskAIAboutSong?: (prompt: string) => void;
  onOpenShareModal?: (config?: {
    title?: string;
    text?: string;
    url?: string;
    sessionId?: string;
    shareType?: 'session' | 'app' | 'message';
  }) => void;
}

export const MusicPlayerModal: React.FC<MusicPlayerModalProps> = ({
  onAskAIAboutSong,
  onOpenShareModal,
}) => {
  const {
    currentTrack,
    queue,
    history,
    favorites,
    currentIndex,
    isOpen,
    isMinimized,
    autoplay,
    loopMode,
    isShuffle,
    playTrack,
    playVideoId,
    playQueue,
    addToQueue,
    removeFromQueue,
    clearQueue,
    nextTrack,
    prevTrack,
    toggleAutoplay,
    toggleLoop,
    toggleShuffle,
    toggleFavorite,
    isFavorite,
    clearHistory,
    reListenHistory,
    onTrackEnded,
    closePlayer,
    minimizePlayer,
    expandPlayer,
  } = useMusicPlayer();
  const { openYouTubeInBrowser } = useMiniBrowser();

  const [activeTab, setActiveTab] = useState<'feed' | 'search' | 'queue' | 'history' | 'favorites'>('feed');
  const [selectedFeedCategory, setSelectedFeedCategory] = useState<string>('auto');
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useNoCookie, setUseNoCookie] = useState(false);
  const [key, setKey] = useState(0); // For manual reload/replay
  const [inputLinkOrId, setInputLinkOrId] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ videoId: string; title: string; author: string; url: string; thumbnail: string; duration?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [liveFeedVideos, setLiveFeedVideos] = useState<MusicTrack[]>([]);

  // AI Music Idea Generator state
  const [customMoodInput, setCustomMoodInput] = useState('');
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [aiGeneratedIdeas, setAiGeneratedIdeas] = useState<Array<{
    titleBn: string;
    artist?: string;
    searchQuery?: string;
    moodReasonBn?: string;
    genre?: string;
    topVideo?: { videoId: string; title: string; author: string; thumbnail: string };
  }>>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [modalScrollState, setModalScrollState] = useState({
    canScroll: false,
    isNearTop: true,
    isNearBottom: true,
    scrollPercentage: 0,
  });

  const handleModalScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = scrollHeight - clientHeight;
    const canScroll = maxScroll > 60;
    const isNearTop = scrollTop <= 35;
    const isNearBottom = maxScroll - scrollTop <= 45;
    const scrollPercentage =
      maxScroll > 0
        ? Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)))
        : 0;
    setModalScrollState({ canScroll, isNearTop, isNearBottom, scrollPercentage });
  };

  // Time of day calculation
  const currentPeriod: TimeOfDayPeriod = getTimeOfDayPeriod();
  const moodInfo = getTimeMoodInfo(currentPeriod);

  // Listen for YouTube iframe player postMessage events (e.g. video ended for autoplay)
  useEffect(() => {
    const handleYouTubeMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (_) {
            return;
          }
        }
        if (data && (data.event === 'onStateChange' || data.type === 'onStateChange')) {
          // YT.PlayerState.ENDED is 0
          if (data.info === 0) {
            onTrackEnded();
          }
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, [onTrackEnded]);

  // Fetch dynamic updated feed for the selected category / time of day
  const fetchDynamicFeed = useCallback(async (cat: string, period: TimeOfDayPeriod) => {
    setIsRefreshingFeed(true);
    try {
      const res = await fetch(`/api/youtube/time-feed?period=${period}&category=${cat}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          const mapped: MusicTrack[] = data.videos.map((v: any) => ({
            videoId: v.videoId,
            title: v.title,
            artist: v.author,
            originalUrl: v.url,
            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
            duration: v.duration,
            category: cat === 'auto' ? moodInfo.badge : cat,
          }));
          setLiveFeedVideos(mapped);
          return;
        }
      }
    } catch (err) {
      console.warn('Dynamic feed fetch failed:', err);
    } finally {
      setIsRefreshingFeed(false);
    }

    // Curated catalog fallback (100% verified IDs)
    if (cat === 'auto') {
      setLiveFeedVideos(CURATED_YOUTUBE_TRACKS[period] || CURATED_YOUTUBE_TRACKS.morning);
    } else if (CURATED_YOUTUBE_TRACKS[cat]) {
      setLiveFeedVideos(CURATED_YOUTUBE_TRACKS[cat]);
    } else {
      setLiveFeedVideos(CURATED_YOUTUBE_TRACKS[period] || CURATED_YOUTUBE_TRACKS.morning);
    }
  }, [moodInfo.badge]);

  // Initial load of time-based songs
  useEffect(() => {
    fetchDynamicFeed(selectedFeedCategory, currentPeriod);
  }, [selectedFeedCategory, currentPeriod, fetchDynamicFeed]);

  // Execute Search for accurate YouTube tracks
  const handlePerformSearch = async (searchTerm: string) => {
    const val = searchTerm.trim();
    if (!val) return;

    // Immediately switch to the search tab so user sees loading and results
    setActiveTab('search');
    setHasSearched(true);
    setLastSearchQuery(val);

    const detectedId = extractYouTubeVideoId(val);
    if (detectedId) {
      setKey((prev) => prev + 1);
      playVideoId(detectedId, 'ইউটিউব মিউজিক স্ট্রিম', { autoPlay: true });
      setInputLinkOrId('');
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: val }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          setSearchResults(data.videos);
        } else {
          setSearchResults([]);
        }
      }
    } catch (e) {
      console.warn('Search error:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputLinkOrId.trim()) {
      setActiveTab('search');
      handlePerformSearch(inputLinkOrId);
    }
  };

  // Play video with instant iframe refresh and smooth scroll to player
  const handlePlayHere = (vid: string, trackTitle: string, trackAuthor?: string) => {
    setKey((prev) => prev + 1);
    playVideoId(vid, trackTitle, { autoPlay: true, artist: trackAuthor });
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate AI Music Ideas
  const handleGenerateAIIdeas = async (moodQuery?: string) => {
    const targetMood = moodQuery || customMoodInput || 'বাংলা ব্যান্ডের সেরা নস্টালজিক গান ও মেলোডি';
    setIsGeneratingIdeas(true);
    try {
      const res = await fetch('/api/youtube/ai-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: targetMood }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.ideas) && data.ideas.length > 0) {
          setAiGeneratedIdeas(data.ideas);
        }
      }
    } catch (err) {
      console.warn('AI music ideas error:', err);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Sync fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // When player opens or a new video track is played, automatically scroll smoothly to the video player at the top
  useEffect(() => {
    if (isOpen && !isMinimized && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isOpen, isMinimized, currentTrack?.videoId]);

  if (!isOpen || !currentTrack) return null;

  const { videoId, title, originalUrl, searchQuery, artist } = currentTrack;
  const cleanTitle = title || searchQuery || 'গান / মিউজিক';
  const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTitle)}`;
  const ytMusicUrl = `https://music.youtube.com/search?q=${encodeURIComponent(cleanTitle)}`;
  const watchUrl = originalUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ytSearchUrl);

  const host = useNoCookie ? 'www.youtube-nocookie.com' : 'www.youtube.com';
  const currentOrigin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';
  const originParam = currentOrigin ? `&origin=${encodeURIComponent(currentOrigin)}` : '';

  // Reliable clean YouTube embed URL with origin handshake and autoplay
  const embedUrl = videoId
    ? `https://${host}/embed/${videoId}?autoplay=1&playsinline=1&rel=0&enablejsapi=1${originParam}`
    : `https://${host}/embed?listType=search&list=${encodeURIComponent(cleanTitle)}&autoplay=1&playsinline=1&enablejsapi=1${originParam}`;

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(watchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (onOpenShareModal) {
      onOpenShareModal({
        title: `ইউটিউব মিউজিক: ${cleanTitle}`,
        text: `এই চমৎকার গানটি শুনুন: "${cleanTitle}" — আমাদের এআই অ্যাসিস্ট্যান্ট মিউজিক প্লেয়ারে শুনুন।`,
        url: watchUrl,
        shareType: 'app',
      });
    } else {
      handleCopyLink();
    }
  };

  const handleAskAI = () => {
    if (onAskAIAboutSong) {
      minimizePlayer();
      onAskAIAboutSong(
        `"${cleanTitle}" এই গানটির লিরিক্স (কথা), গানের অর্থ ও শিল্পী সম্পর্কে বিস্তারিত বুঝিয়ে দিন।`
      );
    }
  };

  const nextSongInQueue = queue[currentIndex + 1];
  const isCurrentFavorite = isFavorite(videoId || '');

  return (
    <div
      ref={containerRef}
      onScroll={handleModalScroll}
      id="in-app-music-streaming-player"
      className={
        isMinimized
          ? 'fixed bottom-4 right-4 z-50 w-[340px] sm:w-[420px] bg-stone-950/95 text-stone-100 border border-red-500/50 rounded-2xl shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2.5 transition-all duration-300 animate-in slide-in-from-bottom-5'
          : 'fixed inset-0 z-50 flex flex-col bg-stone-950/98 text-stone-100 backdrop-blur-2xl overflow-y-auto antialiased animate-in fade-in duration-200'
      }
    >
      {/* Glow backdrop elements (Fullscreen mode only) */}
      {!isMinimized && (
        <>
          <div className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
          <div className="pointer-events-none fixed -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl" />
        </>
      )}

      {/* TOP HEADER BAR */}
      {isMinimized ? (
        /* Minimized Header */
        <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-red-600 text-white shrink-0 animate-pulse">
              <Radio className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{cleanTitle}</h4>
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                <span className="text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  অটো-প্লে {autoplay ? 'ON ⚡' : 'OFF'}
                </span>
                {queue.length > 1 && (
                  <span className="text-stone-400">
                    • {currentIndex + 1}/{queue.length}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={prevTrack}
              disabled={queue.length <= 1}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="পূর্ববর্তী গান"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={nextTrack}
              disabled={queue.length <= 1}
              className="p-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="পরবর্তী গান (Next Video)"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={expandPlayer}
              className="p-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="ফুলস্ক্রিন প্লেয়ারে ফেরত যান"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={closePlayer}
              className="p-1.5 rounded-lg bg-stone-850 hover:bg-rose-950/80 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="প্লেয়ার বন্ধ করুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Fullscreen Header */
        <header className="relative z-10 px-4 sm:px-6 py-3 border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={closePlayer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-200 text-xs font-semibold border border-stone-750 transition-all cursor-pointer shadow-xs shrink-0"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  ইউটিউব অটো-কন্টিনিউয়াস প্লেয়ার
                </span>
                <span className="hidden sm:inline text-xs text-emerald-400 font-medium">
                  • একের পর এক গান নিজে চলবে
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {cleanTitle}
              </h2>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Autoplay Toggle Badge */}
            <button
              onClick={toggleAutoplay}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                autoplay
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 shadow-xs'
                  : 'bg-stone-900 border-stone-800 text-stone-400'
              }`}
              title={autoplay ? 'অটো-প্লে চালু আছে (পরের গান নিজে চালু হবে)' : 'অটো-প্লে বন্ধ করুন'}
            >
              <Zap className={`w-3.5 h-3.5 ${autoplay ? 'text-emerald-400 fill-emerald-400' : 'text-stone-500'}`} />
              <span className="hidden md:inline">অটো-প্লে:</span>
              <span>{autoplay ? 'ON' : 'OFF'}</span>
            </button>

            {/* Loop Toggle */}
            <button
              onClick={toggleLoop}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer hidden sm:flex items-center gap-1 ${
                loopMode !== 'off'
                  ? 'bg-red-950/50 border-red-500/40 text-red-300'
                  : 'bg-stone-900 border-stone-800 text-stone-400'
              }`}
              title={
                loopMode === 'all'
                  ? 'পুরো প্লেলিস্ট লুপ (চলতেই থাকবে)'
                  : loopMode === 'one'
                  ? 'একই গান বারবার লুপ'
                  : 'লুপ বন্ধ'
              }
            >
              {loopMode === 'one' ? <Repeat1 className="w-3.5 h-3.5 text-red-400" /> : <Repeat className="w-3.5 h-3.5" />}
              <span className="text-[11px] hidden md:inline">
                {loopMode === 'all' ? 'সব লুপ' : loopMode === 'one' ? '১টি গান' : 'লুপ বন্ধ'}
              </span>
            </button>

            {/* Shuffle Toggle */}
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer hidden sm:flex items-center gap-1 ${
                isShuffle
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-400'
              }`}
              title={isShuffle ? 'শাফল চালু (এলোমেলো গান)' : 'শাফল বন্ধ'}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            {/* Favorite Star Button */}
            <button
              onClick={() => currentTrack && toggleFavorite(currentTrack)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isCurrentFavorite
                  ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
              }`}
              title={isCurrentFavorite ? 'পছন্দের তালিকা থেকে সরান' : 'পছন্দের তালিকায় রাখুন (Favorite)'}
            >
              <Heart className={`w-3.5 h-3.5 ${isCurrentFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            {/* Refresh Player */}
            <button
              onClick={() => setKey((k) => k + 1)}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer border border-stone-800 text-xs hidden sm:flex items-center gap-1"
              title="ভিডিও রিফ্রেশ / পুনরায় শুরু করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Minimize */}
            <button
              onClick={minimizePlayer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-emerald-400 hover:text-emerald-300 text-xs font-semibold border border-stone-800 hover:border-emerald-500/40 transition-colors cursor-pointer"
              title="মিনিমাইজ করুন (গান ব্যাকগ্রাউন্ডে অবিরাম চলবে)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ব্যাকগ্রাউন্ড মোড</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleBrowserFullscreen}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 transition-colors cursor-pointer border border-stone-800"
              title={isBrowserFullscreen ? 'ফুলস্ক্রিন থেকে বের হন' : 'সম্পূর্ণ স্ক্রিন করুন'}
            >
              {isBrowserFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={closePlayer}
              className="p-2 rounded-xl bg-stone-900 hover:bg-rose-950/80 text-stone-300 hover:text-rose-400 transition-colors cursor-pointer border border-stone-800"
              title="প্লেয়ার বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>
      )}

      {/* CORE PERSISTENT IFRAME PLAYER & CONTROLS */}
      <div className={isMinimized ? 'w-full' : 'relative z-10 flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-start gap-4'}>
        
        {/* Fullscreen Search / Input Bar with Instant Live Search */}
        {!isMinimized && (
          <div className="space-y-2">
            <form
              onSubmit={handleSearchFormSubmit}
              className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-lg focus-within:border-red-500/60 transition-colors"
            >
              <div className="pl-3 text-red-500 shrink-0">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inputLinkOrId}
                onChange={(e) => setInputLinkOrId(e.target.value)}
                placeholder="সরাসরি গান, শিল্পী বা ইউটিউব লিঙ্ক খুঁজুন (যেমন: কোক স্টুডিও, জেমস, রবীন্দ্র সংগীত, Lofi)..."
                className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-0 px-2"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>একুরেট সার্চ</span>
              </button>
            </form>

            {/* Quick Search Idea Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[11px] text-stone-400 shrink-0 flex items-center gap-1 font-semibold pl-1">
                <Lightbulb className="w-3 h-3 text-amber-400" /> আইডিয়া:
              </span>
              {[
                'কোক স্টুডিও বাংলা',
                'জেমস নগর বাউল',
                'আইয়ুব বাচ্চু সেরা গান',
                'রবীন্দ্র সংগীত শান্ত সুর',
                'ওয়ারফেজ অবাক ভালোবাসা',
                'মাইলস সেরা গান',
                'ঘুড়ি তুমি কার আকাশে ওড়ো',
                'হরিপ্রসাদ চৌরাসিয়া বাঁশি',
                'Lofi Girl Chill Beats',
                'Deep sleep relaxing piano rain',
              ].map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => {
                    setInputLinkOrId(query);
                    handlePerformSearch(query);
                    setActiveTab('search');
                  }}
                  className="px-2.5 py-1 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-800 shrink-0 text-[11px] transition-colors cursor-pointer"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video Player Box */}
        <div
          className={
            isMinimized
              ? 'relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-stone-800 shadow-md'
              : 'relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-red-950/40 border border-stone-800 bg-black group'
          }
        >
          <iframe
            ref={iframeRef}
            key={`stream-${key}-${useNoCookie ? 'nocookie' : 'standard'}-${videoId || 'search'}`}
            src={embedUrl}
            title={cleanTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full border-0"
          />

        </div>

        {/* Continuous Autoplay Controls & Player Status Bar */}
        {!isMinimized && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900/90 to-stone-950 border border-stone-800 shadow-lg">
            {/* Left: Previous / Next & Status */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevTrack}
                disabled={queue.length <= 1}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-750 disabled:opacity-30 text-stone-200 transition-colors cursor-pointer border border-stone-700"
                title="পূর্ববর্তী গান চালান"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={nextTrack}
                disabled={queue.length <= 1}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all cursor-pointer"
                title="পরবর্তী গান চালান (Next Track)"
              >
                <span>পরবর্তী গান</span>
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-stone-800">
                <span className="text-xs font-medium text-stone-300">
                  কিউ: {currentIndex + 1} / {Math.max(1, queue.length)}
                </span>
                {nextSongInQueue && (
                  <span className="text-xs text-stone-400 truncate max-w-[220px]">
                    (পরবর্তী: {nextSongInQueue.title})
                  </span>
                )}
              </div>
            </div>

            {/* Right: Autoplay & Audio Visualizer */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 font-medium">
                <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>অটোমেটিক পরবর্তী গান চলার মোড সক্রিয়</span>
              </div>

              {/* Refresh / Reload Player */}
              <button
                type="button"
                onClick={() => setKey((k) => k + 1)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-[11px] font-semibold border border-stone-700 transition-colors cursor-pointer"
                title="প্লেয়ার রিফ্রেশ / পুনরায় চালান"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">রিফ্রেশ</span>
              </button>

              {/* In-App Mini Browser Player */}
              <button
                type="button"
                onClick={() => {
                  if (videoId) {
                    openYouTubeInBrowser(videoId, cleanTitle, watchUrl);
                  } else {
                    openYouTubeInBrowser(watchUrl, cleanTitle);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold shadow-xs transition-colors cursor-pointer"
                title="ইন-অ্যাপ মিনি ব্রাউজারে চালান (১০০% প্লেব্যাক গ্যারান্টি)"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>মিনি ব্রাউজারে চালান</span>
              </button>

              {/* Direct YouTube 1-click fallback guarantee */}
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-white text-[11px] font-semibold border border-stone-700 transition-colors"
                title="কোনো কারণে প্লেব্যাকের সমস্যা হলে সরাসরি ইউটিউব অ্যাপে শুনুন"
              >
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span className="hidden lg:inline">ইউটিউবে চালান</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </a>

              {/* Dynamic Equalizer Visualizer Bars */}
              <div className="hidden md:flex items-end gap-1 h-4" title="লাইভ অডিও ভিজ্যুয়ালাইজার">
                {[60, 100, 40, 80, 50, 90, 70, 30, 85, 45, 95, 65, 80, 55].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%`, animationDelay: `${i * 0.08}s` }}
                    className="w-1 bg-gradient-to-t from-red-600 to-rose-400 rounded-full animate-pulse [animation-duration:0.7s]"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Minimized bottom controls */}
        {isMinimized && (
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-0.5">
            <div className="flex items-center gap-1.5 truncate">
              <Disc3 className="w-3.5 h-3.5 text-red-500 animate-spin [animation-duration:5s] shrink-0" />
              <span className="truncate">
                {nextSongInQueue ? `পরের গান: ${nextSongInQueue.title}` : 'ব্যাকগ্রাউন্ডে স্বয়ংক্রিয়ভাবে চলছে'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={nextTrack}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-0.5"
                title="পরবর্তী গানে যান"
              >
                <span>পরের গান</span>
                <SkipForward className="w-3 h-3" />
              </button>
              <button
                onClick={expandPlayer}
                className="text-xs font-semibold text-stone-200 hover:text-white cursor-pointer flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" />
                <span>ফুলস্ক্রিন</span>
              </button>
            </div>
          </div>
        )}

        {/* FULLSCREEN MULTI-TAB NAVIGATION */}
        {!isMinimized && (
          <div className="space-y-4 pt-1">
            {/* Tab Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('feed')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'feed'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30'
                      : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>🕒 সময় অনুযায়ী গান (Auto Feed)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'search'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                  <span>🔍 একুরেট সার্চ ও এআই আইডিয়া</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'queue'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>📋 প্লেলিস্ট ও কিউ ({queue.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
                      : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>📜 সম্প্রতি শোনা গান ({history.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('favorites')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'favorites'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/30'
                      : 'bg-stone-900 hover:bg-stone-850 text-stone-300'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>⭐ পছন্দের গান ({favorites.length})</span>
                </button>
              </div>

              {/* Quick Actions Right */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAskAI}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer"
                  title="এআই-এর কাছে গানের লিরিক্স ও অর্থ জানুন"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">লিরিক্স ও অর্থ</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-stone-800 cursor-pointer"
                  title="গানটি শেয়ার করুন"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 cursor-pointer"
                  title="লিংক কপি করুন"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* TAB 1: DYNAMIC TIME-OF-DAY AUTO-UPDATING SONGS FEED */}
            {activeTab === 'feed' && (
              <div className="space-y-4">
                {/* Time-of-Day Banner */}
                <div className={`p-4 rounded-3xl bg-gradient-to-r ${moodInfo.themeColor} border border-stone-800/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-bold">
                        {moodInfo.badge}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {moodInfo.greetingBn}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {moodInfo.titleBn}
                    </h3>
                    <p className="text-xs text-stone-300">
                      {moodInfo.subtitleBn}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fetchDynamicFeed(selectedFeedCategory, currentPeriod)}
                      disabled={isRefreshingFeed}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-white text-xs font-semibold border border-stone-700 cursor-pointer shadow-xs"
                      title="ইউটিউব থেকে নতুন গান রিফ্রেশ করুন"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingFeed ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingFeed ? 'আপডেট হচ্ছে...' : 'নতুন গান রিফ্রেশ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (liveFeedVideos.length > 0) {
                          playQueue(liveFeedVideos, 0, { autoPlay: true });
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-red-600/30 cursor-pointer"
                      title="এই সময়ের সবগুলো গান একের পর এক স্বয়ংক্রিয়ভাবে চালান"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>সবগুলো একসাথে চালান</span>
                    </button>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'auto', label: '🕒 সময় অনুযায়ী (Auto)' },
                    { id: 'bands', label: '🎸 বাংলা ব্যান্ড ও রক' },
                    { id: 'coke_studio', label: '🔥 কোক স্টুডিও বাংলা' },
                    { id: 'rabindra', label: '🌸 রবীন্দ্র সংগীত' },
                    { id: 'lofi', label: '🎧 লো-ফাই চিল' },
                    { id: 'sleep', label: '🌙 ডিপ স্লিপ ও বৃষ্টি' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedFeedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        selectedFeedCategory === cat.id
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Songs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {liveFeedVideos.map((track, idx) => {
                    const isCurrent = currentTrack?.videoId === track.videoId;
                    return (
                      <div
                        key={track.videoId || idx}
                        className={`p-2.5 rounded-2xl border transition-all flex items-center gap-3 group ${
                          isCurrent
                            ? 'bg-red-950/40 border-red-500/50 shadow-md'
                            : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800'
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-black shrink-0">
                          <img
                            src={track.thumbnail || `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-current" />
                          </div>
                          {isCurrent && (
                            <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                              <Radio className="w-4 h-4 text-white animate-pulse" />
                            </div>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="min-w-0 flex-1 space-y-1">
                          <h4 className="text-xs font-bold text-white truncate" title={track.title}>
                            {track.title}
                          </h4>
                          <p className="text-[10px] text-stone-400 truncate">
                            {track.artist || track.category || 'ইউটিউব অফিসিয়াল'}
                          </p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => playTrack(track, { autoPlay: true })}
                              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>{isCurrent ? 'চলছে' : 'চালান'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => addToQueue(track)}
                              className="p-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white text-[10px] transition-colors cursor-pointer"
                              title="কিউতে যোগ করুন"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleFavorite(track)}
                              className={`p-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-[10px] transition-colors cursor-pointer ${
                                isFavorite(track.videoId) ? 'text-rose-400' : 'text-stone-400'
                              }`}
                              title="পছন্দ করুন"
                            >
                              <Heart className={`w-3 h-3 ${isFavorite(track.videoId) ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: ACCURATE SEARCH & AI MUSIC IDEAS GENERATOR (একুরেট সার্চ ও আইডিয়া জেনারেটর) */}
            {activeTab === 'search' && (
              <div className="space-y-5">
                {/* 1. Searching State Loading Card */}
                {isSearching && (
                  <div className="p-8 rounded-3xl bg-stone-900/90 border border-red-500/30 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
                    <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                    <h4 className="text-sm font-bold text-white">ইউটিউবে একুরেট সার্চ করা হচ্ছে...</h4>
                    <p className="text-xs text-stone-400">
                      "{lastSearchQuery || inputLinkOrId}" গানের আসল ভিডিও এবং অফিসিয়াল ট্র্যাক লোড হচ্ছে
                    </p>
                  </div>
                )}

                {/* 2. Search Results Grid (if search performed and results exist) */}
                {!isSearching && searchResults.length > 0 && (
                  <div className="p-4 rounded-3xl bg-stone-900 border border-stone-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        <h4 className="text-xs sm:text-sm font-bold text-white">
                          একুরেট সার্চ ফলাফল ({searchResults.length}টি আসল ভিডিও পাওয়া গেছে)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const mapped: MusicTrack[] = searchResults.map((s) => ({
                            videoId: s.videoId,
                            title: s.title,
                            artist: s.author,
                            thumbnail: s.thumbnail,
                            duration: s.duration,
                          }));
                          playQueue(mapped, 0, { autoPlay: true });
                          setKey((k) => k + 1);
                          containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>ফলাফলের সবগুলো একসাথে চালান</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {searchResults.map((item) => (
                        <div
                          key={item.videoId}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-950/80 hover:bg-stone-850 border border-stone-800/80 transition-all group"
                        >
                          <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-black shrink-0">
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {item.duration && (
                              <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[9px] font-mono text-white">
                                {item.duration}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <h5 className="text-xs font-semibold text-white truncate" title={item.title}>
                              {item.title}
                            </h5>
                            <p className="text-[10px] text-stone-400 truncate">{item.author}</p>
                            <div className="flex flex-wrap items-center gap-1 pt-0.5">
                              <button
                                type="button"
                                onClick={() => handlePlayHere(item.videoId, item.title, item.author)}
                                className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-medium text-[10px] flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="এখানে প্লেয়ারে চালান"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>এখানে চালান</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openYouTubeInBrowser(item.videoId, item.title, item.url)}
                                className="px-2 py-0.5 rounded bg-blue-600/90 hover:bg-blue-600 text-white font-medium text-[10px] flex items-center gap-1 cursor-pointer"
                                title="ইন-অ্যাপ মিনি ব্রাউজারে চালান (১০০% গ্যারান্টি)"
                              >
                                <Globe className="w-2.5 h-2.5" />
                                <span>মিনি ব্রাউজার</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  addToQueue({
                                    videoId: item.videoId,
                                    title: item.title,
                                    artist: item.author,
                                    thumbnail: item.thumbnail,
                                    duration: item.duration,
                                  })
                                }
                                className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] cursor-pointer"
                                title="কিউতে যোগ করুন"
                              >
                                + কিউ
                              </button>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white text-[10px] cursor-pointer"
                                title="সরাসরি ইউটিউবে খুলুন"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. No Results Found State */}
                {hasSearched && !isSearching && searchResults.length === 0 && (
                  <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-stone-200">কোনো ভিডিও পাওয়া যায়নি</h4>
                    <p className="text-xs text-stone-400 max-w-md mx-auto">
                      "{lastSearchQuery}" দিয়ে কোনো সরাসরি ভিডিও মেলেনি। অনুগ্রহ করে সঠিক নাম বা শিল্পীর নাম দিয়ে খুঁজুন।
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      {['জেমস নগর বাউল', 'কোক স্টুডিও বাংলা', 'হাবিব ওয়াহিদ', 'তাহসান', 'Lofi Relax'].map((suggest) => (
                        <button
                          key={suggest}
                          type="button"
                          onClick={() => {
                            setInputLinkOrId(suggest);
                            handlePerformSearch(suggest);
                          }}
                          className="px-2.5 py-1 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs cursor-pointer border border-stone-700"
                        >
                          🔍 {suggest}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Initial Guide before search */}
                {!hasSearched && !isSearching && searchResults.length === 0 && (
                  <div className="p-6 rounded-3xl bg-gradient-to-r from-red-950/30 via-stone-900 to-stone-900 border border-red-500/20 text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto">
                      <Search className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-stone-200">যেকোনো গান বা শিল্পীর নাম লিখে একুরেট সার্চ করুন</h4>
                    <p className="text-[11px] text-stone-400 max-w-md mx-auto">
                      উপরের সার্চ বক্সে লিখুন এবং "একুরেট সার্চ" বাটনে ক্লিক করুন। সরাসরি ইউটিউবের আসল অফিসিয়াল ভিডিও চলে আসবে।
                    </p>
                  </div>
                )}

                {/* AI Music Idea Generator Panel */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-stone-900 border border-indigo-500/30 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-indigo-600 text-white">
                          <Lightbulb className="w-4 h-4" />
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          💡 এআই মিউজিক ও গানের আইডিয়া জেনারেটর
                        </h4>
                      </div>
                      <p className="text-xs text-stone-300">
                        আপনার বর্তমান অনুভূতি বা পছন্দ লিখুন — এআই আপনাকে বাছাইকৃত গানের সেরা আইডিয়া তৈরি করে দিবে।
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleGenerateAIIdeas()}
                      disabled={isGeneratingIdeas}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingIdeas ? 'animate-spin' : ''}`} />
                      <span>{isGeneratingIdeas ? 'আইডিয়া তৈরি হচ্ছে...' : '✨ নতুন আইডিয়া জেনারেট করুন'}</span>
                    </button>
                  </div>

                  {/* Mood Selector Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[
                      { label: '🔥 আজকের ট্রেন্ডিং হিটস', mood: 'কোক স্টুডিও ও বাংলাদেশের সেরা ট্রেন্ডিং গান' },
                      { label: '🎸 বাংলা ব্যান্ডের সোনালী গান', mood: 'জেমস, আইয়ুব বাচ্চু, মাইলস, ওয়ারফেজ ব্যান্ডের মেগা হিটস' },
                      { label: '💖 মন ভালো করা মিষ্টি রোমান্টিক', mood: 'মন ভালো করা বাংলা সফট রোমান্টিক মেলোডি গান' },
                      { label: '🌧️ বৃষ্টি ও নস্টালজিয়া', mood: 'বৃষ্টির দিনের স্মৃতিময় ও আনপ্লাগড অ্যাকোস্টিক বাংলা গান' },
                      { label: '💻 কোডিং ও গভীর ফোকাস', mood: 'পড়াশোনা ও কোডিং করার জন্য গভীর মনোযোগের লো-ফাই বিটস' },
                      { label: '😴 সুনিদ্রা ও রিল্যাক্সেশন', mood: 'গভীর শান্তির ঘুমে তলিয়ে যাওয়ার নরম পিয়ানো ও বাঁশির সুর' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setCustomMoodInput(item.mood);
                          handleGenerateAIIdeas(item.mood);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-900/90 hover:bg-stone-850 text-indigo-200 border border-indigo-500/30 text-xs font-medium cursor-pointer transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* AI Generated Ideas List */}
                  {aiGeneratedIdeas.length > 0 && (
                    <div className="space-y-2.5 pt-2 border-t border-indigo-500/20">
                      <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>আপনার মুডের জন্য তৈরি এআই গানের আইডিয়াসমূহ:</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {aiGeneratedIdeas.map((idea, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl bg-stone-950/90 border border-indigo-500/25 space-y-2 flex flex-col justify-between group hover:border-indigo-400/50 transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {idea.genre || 'সেরা আইডিয়া'}
                                </span>
                              </div>
                              <h6 className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                                {idea.titleBn}
                              </h6>
                              {idea.artist && (
                                <p className="text-[10px] text-stone-400">{idea.artist}</p>
                              )}
                              {idea.moodReasonBn && (
                                <p className="text-[11px] text-indigo-300/90 italic">
                                  "{idea.moodReasonBn}"
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (idea.topVideo) {
                                    playVideoId(idea.topVideo.videoId, idea.topVideo.title, {
                                      autoPlay: true,
                                      artist: idea.artist,
                                    });
                                  } else {
                                    handlePerformSearch(idea.searchQuery || idea.titleBn);
                                  }
                                  containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="flex-1 py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>এখনই চালান</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handlePerformSearch(idea.searchQuery || idea.titleBn);
                                }}
                                className="p-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 text-[10px] cursor-pointer"
                                title="ইউটিউবে আরও ভিডিও খুঁজুন"
                              >
                                <Search className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pre-Loaded Curated Ideas */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>বাছাইকৃত গানের আইডিয়াসমূহ (Curated Inspirations):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {SMART_MUSIC_IDEAS.map((idea) => (
                      <div
                        key={idea.id}
                        className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 hover:border-stone-700 transition-all space-y-2 flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-white">
                            {idea.titleBn}
                          </h5>
                          <p className="text-[11px] text-stone-400 leading-relaxed">
                            {idea.descriptionBn}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setInputLinkOrId(idea.query);
                              handlePerformSearch(idea.query);
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>গানগুলো খুঁজুন ও চালান</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CURRENT QUEUE & PLAYLIST */}
            {activeTab === 'queue' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-900 border border-stone-800 text-xs">
                  <div className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">
                      চলতি প্লেলিস্ট ({queue.length}টি গান সাজানো আছে)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearQueue}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 text-[11px] cursor-pointer"
                    >
                      কিউ মুছুন
                    </button>
                  </div>
                </div>

                {queue.length === 0 ? (
                  <div className="p-8 text-center space-y-2 rounded-2xl bg-stone-900/50 border border-stone-800 text-stone-400">
                    <ListMusic className="w-8 h-8 mx-auto text-stone-600" />
                    <p className="text-sm font-semibold text-stone-300">প্লেলিস্টে কোনো গান নেই</p>
                    <p className="text-xs">উপরের ফিড বা সার্চ থেকে গান যোগ করুন</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {queue.map((track, idx) => {
                      const isCurrent = idx === currentIndex;
                      return (
                        <div
                          key={`${track.videoId || track.title}-${idx}`}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isCurrent
                              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md'
                              : 'bg-stone-900/80 hover:bg-stone-850 border-stone-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="w-5 text-center text-xs font-mono text-stone-400">
                              {isCurrent ? <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse inline" /> : idx + 1}
                            </span>
                            <div className="w-12 h-9 rounded-lg overflow-hidden bg-black shrink-0">
                              <img
                                src={track.thumbnail || `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`}
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate max-w-sm">
                                {track.title}
                              </h5>
                              <p className="text-[10px] text-stone-400 truncate">
                                {track.artist || 'ইউটিউব মিউজিক'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => playQueue(queue, idx, { autoPlay: true })}
                                className="px-2 py-1 rounded bg-stone-800 hover:bg-emerald-600 text-stone-300 hover:text-white text-[10px] font-medium cursor-pointer"
                              >
                                চালান
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeFromQueue(idx)}
                              className="p-1.5 rounded text-stone-500 hover:text-rose-400 cursor-pointer"
                              title="কিউ থেকে মুছুন"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: RECENTLY PLAYED HISTORY & RE-LISTEN (পুনরায় শোনার ব্যবস্থা) */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between p-3.5 rounded-2xl bg-stone-900 border border-stone-800 gap-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        সম্প্রতি শোনা গানসমূহ ({history.length}টি গান রেকর্ড করা হয়েছে)
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        যে গানগুলো ইতিমধ্যে শুনেছেন তা যেকোনো সময় পুনরায় শুনুন
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {history.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => reListenHistory(false)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 cursor-pointer"
                          title="সবগুলো পূর্বের গান ক্রমানুসারে আবার শুনুন"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>সবগুলো পুনরায় শুনুন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => reListenHistory(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold border border-stone-700 cursor-pointer"
                          title="এলোমেলোভাবে পুনরায় শুনুন"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>শাফল রি-প্লে</span>
                        </button>

                        <button
                          type="button"
                          onClick={clearHistory}
                          className="p-1.5 rounded-xl bg-stone-850 hover:bg-rose-950/70 text-stone-400 hover:text-rose-400 border border-stone-800 cursor-pointer"
                          title="হিস্ট্রি পরিষ্কার করুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="p-8 text-center space-y-2 rounded-2xl bg-stone-900/50 border border-stone-800 text-stone-400">
                    <History className="w-8 h-8 mx-auto text-stone-600" />
                    <p className="text-sm font-semibold text-stone-300">কোনো হিস্ট্রি পাওয়া যায়নি</p>
                    <p className="text-xs">আপনি যে গানগুলো শুনবেন তা স্বয়ংক্রিয়ভাবে এখানে জমা হবে</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {history.map((track, idx) => (
                      <div
                        key={`${track.videoId || track.title}-${idx}`}
                        className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-850 border border-stone-800 flex items-center gap-2.5 group transition-all"
                      >
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-black shrink-0">
                          <img
                            src={track.thumbnail || `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <h5 className="text-xs font-semibold text-white truncate" title={track.title}>
                            {track.title}
                          </h5>
                          <p className="text-[10px] text-amber-400/90 font-mono">
                            {track.playedAt ? formatRelativeTimeBn(track.playedAt) : 'পূর্বের রেকর্ড'}
                          </p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => playTrack(track, { autoPlay: true })}
                              className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>পুনরায় শুনুন</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => addToQueue(track)}
                              className="p-1 rounded bg-stone-800 text-stone-300 hover:text-white text-[10px] cursor-pointer"
                              title="কিউতে যোগ করুন"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: FAVORITES (পছন্দের গান) */}
            {activeTab === 'favorites' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        পছন্দের গানসমূহ ({favorites.length}টি গান সেভ করা হয়েছে)
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        আপনার প্রিয় গানগুলো এক ক্লিকে যেকোনো সময় শুনুন
                      </p>
                    </div>
                  </div>

                  {favorites.length > 0 && (
                    <button
                      type="button"
                      onClick={() => playQueue(favorites, 0, { autoPlay: true })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>পছন্দের সব গান চালান</span>
                    </button>
                  )}
                </div>

                {favorites.length === 0 ? (
                  <div className="p-8 text-center space-y-2 rounded-2xl bg-stone-900/50 border border-stone-800 text-stone-400">
                    <Heart className="w-8 h-8 mx-auto text-stone-600" />
                    <p className="text-sm font-semibold text-stone-300">কোনো পছন্দের গান নেই</p>
                    <p className="text-xs">যেকোনো গানের পাশের হার্ট (❤️) আইকনে ক্লিক করে সেভ করুন</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                    {favorites.map((track, idx) => (
                      <div
                        key={`${track.videoId || track.title}-${idx}`}
                        className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-850 border border-stone-800 flex items-center gap-2.5 group transition-all"
                      >
                        <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-black shrink-0">
                          <img
                            src={track.thumbnail || `https://i.ytimg.com/vi/${track.videoId}/hqdefault.jpg`}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <h5 className="text-xs font-semibold text-white truncate" title={track.title}>
                            {track.title}
                          </h5>
                          <p className="text-[10px] text-rose-400/90 truncate">
                            {track.artist || 'প্রিয় গান'}
                          </p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => playTrack(track, { autoPlay: true })}
                              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>চালান</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleFavorite(track)}
                              className="p-1 rounded bg-stone-800 text-rose-400 text-[10px] cursor-pointer"
                              title="পছন্দ থেকে সরান"
                            >
                              <Heart className="w-2.5 h-2.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Playback Troubleshooting & Instant 100% Guaranteed YouTube Launcher */}
        {!isMinimized && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="truncate sm:whitespace-normal">
                <strong>প্লেব্যাক নিশ্চয়তা:</strong> কোনো কপিরাইটযুক্ত গান অন্য সাইটে প্লেব্যাক বন্ধ রাখলে নিচে ১-ক্লিকে সরাসরি ইউটিউব বা নো-কুকি সার্ভারে চালাতে পারেন।
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setUseNoCookie((v) => !v)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-colors cursor-pointer text-[11px] font-medium"
              >
                🔄 সার্ভার পরিবর্তন ({useNoCookie ? 'নো-কুকি' : 'স্ট্যান্ডার্ড'})
              </button>
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-bold text-[11px] shadow-sm transition-all"
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>সরাসরি YouTube এ চালান (100% গ্যারান্টি)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Floating Scroll to Top/Bottom Navigation Buttons for Music Player */}
      {!isMinimized && (
        <ScrollNavigationButtons
          onScrollToTop={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          onScrollToBottom={() => {
            if (containerRef.current) {
              containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: 'smooth',
              });
            }
          }}
          isNearTop={modalScrollState.isNearTop}
          isNearBottom={modalScrollState.isNearBottom}
          canScroll={modalScrollState.canScroll}
          scrollPercentage={modalScrollState.scrollPercentage}
          className="bottom-6 right-6"
        />
      )}
    </div>
  );
};
