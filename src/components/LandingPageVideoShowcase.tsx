import React, { useState, useRef, useEffect } from 'react';
import {
  Youtube,
  Play,
  Maximize2,
  Music,
  Disc3,
  Search,
  ExternalLink,
  Sparkles,
  Radio,
  Headphones,
  Laptop,
  ArrowUp
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { MusicTrack } from '../types';
import { extractYouTubeVideoId } from '../utils/youtube';

interface LandingPageVideoShowcaseProps {
  onSendToChat?: (prompt: string) => void;
}

// Curated verified tracks that play reliably in in-app fullscreen
const CURATED_TRACKS: (MusicTrack & { category: string; duration: string; icon: React.ReactNode })[] = [
  {
    videoId: 'jfKfPfyJRdk',
    title: 'Lofi Girl - Chill Beats to Code & Study To',
    artist: 'Lofi Girl',
    category: 'কোডিং ও স্টাডি',
    duration: 'লাইভ রেডিও / রিল্যাক্সিং',
    icon: <Headphones className="w-4 h-4 text-emerald-400" />,
  },
  {
    videoId: '4xDzrJKXOOY',
    title: 'Synthwave Radio - Chill Retro Beats to Relax & Game To',
    artist: 'Lofi Girl / Synthwave',
    category: 'রেট্রো সিন্থওয়েভ',
    duration: 'লাইভ সিন্থ স্ট্রিম',
    icon: <Radio className="w-4 h-4 text-rose-400" />,
  },
  {
    videoId: 'DWcJFNfaw90',
    title: 'Chill Drive - Late Night Lofi & Coding Focus Beats',
    artist: 'Chill Music Lab',
    category: 'প্রোগ্রামিং ফোকাস',
    duration: 'স্টাডি সেশন',
    icon: <Laptop className="w-4 h-4 text-blue-400" />,
  },
  {
    videoId: 'M576WGiDBdQ',
    title: 'Deep Focus Nature Ambience & Calm Mind Piano',
    artist: 'Ambient Soundscape',
    category: 'ধ্যান ও প্রশান্তি',
    duration: 'রিল্যাক্সিং সাউন্ড',
    icon: <Disc3 className="w-4 h-4 text-amber-400" />,
  },
];

export const LandingPageVideoShowcase: React.FC<LandingPageVideoShowcaseProps> = ({
  onSendToChat,
}) => {
  const { playTrack, playVideoId } = useMusicPlayer();
  const [featuredTrack, setFeaturedTrack] = useState<MusicTrack>(CURATED_TRACKS[0]);
  const [customInput, setCustomInput] = useState('');
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const [highlightStage, setHighlightStage] = useState(false);
  const [isPlayingOnStage, setIsPlayingOnStage] = useState(false);
  const [isScrolledPastPlayer, setIsScrolledPastPlayer] = useState(false);

  const videoStageRef = useRef<HTMLDivElement>(null);

  // Directly and smoothly scroll to the video watching player
  const scrollToVideoPlayer = (smooth = true) => {
    if (videoStageRef.current) {
      videoStageRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'center',
      });
    }
  };

  // Check if player is scrolled out of viewport so we can provide a quick jump button
  useEffect(() => {
    const handleScroll = () => {
      if (videoStageRef.current) {
        const rect = videoStageRef.current.getBoundingClientRect();
        // If bottom of player is above viewport or top is far below
        setIsScrolledPastPlayer(rect.bottom < 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Directly play track on the video stage and bring user straight to the video player
  const handlePlayOnStage = (track: MusicTrack, autoPlay = true) => {
    setFeaturedTrack(track);
    setShouldAutoplay(autoPlay);
    setIsPlayingOnStage(true);
    setHighlightStage(true);

    // Immediately and smoothly scroll up to the video player area
    setTimeout(() => {
      scrollToVideoPlayer(true);
    }, 40);

    setTimeout(() => {
      setHighlightStage(false);
    }, 3500);
  };

  const handleInputChange = (val: string) => {
    setCustomInput(val);
    const detectedId = extractYouTubeVideoId(val);
    if (detectedId) {
      setFeaturedTrack({
        videoId: detectedId,
        title: 'ইউটিউব ভিডিও (লিংক শনাক্ত হয়েছে)',
        originalUrl: `https://www.youtube.com/watch?v=${detectedId}`,
        searchQuery: val,
      });
    }
  };

  // Play custom input directly on stage with auto-scroll
  const handlePlayDirectStage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = customInput.trim();
    if (!query) return;

    const detectedId = extractYouTubeVideoId(query);
    const trackToPlay: MusicTrack = {
      videoId: detectedId || 'jfKfPfyJRdk',
      title: detectedId ? 'ইউটিউব ভিডিও / গান' : query,
      originalUrl: detectedId ? `https://www.youtube.com/watch?v=${detectedId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      searchQuery: query,
    };
    handlePlayOnStage(trackToPlay, true);
  };

  const handlePlayCustomFullscreen = (e: React.FormEvent) => {
    e.preventDefault();
    const query = customInput.trim();
    if (!query) return;

    const detectedId = extractYouTubeVideoId(query);
    if (detectedId) {
      const trackToPlay: MusicTrack = {
        videoId: detectedId,
        title: 'ইউটিউব ভিডিও / গান',
        originalUrl: `https://www.youtube.com/watch?v=${detectedId}`,
        searchQuery: query,
      };
      setFeaturedTrack(trackToPlay);
      playVideoId(detectedId, 'ইউটিউব ভিডিও / গান', { autoPlay: true });
    } else {
      playVideoId(query, query, { autoPlay: true });
    }
  };

  const handleSendQueryToChat = () => {
    const query = customInput.trim();
    if (!query || !onSendToChat) return;
    onSendToChat(`ইউটিউবে "${query}" সম্পর্কিত সেরা গান বা ভিডিও লিংক ও বিবরণ দিন।`);
  };

  return (
    <section className="my-6 rounded-3xl overflow-hidden border border-red-500/25 dark:border-red-500/20 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-900 shadow-xl text-white relative">
      {/* Top Banner Header */}
      <div className="px-5 sm:px-7 py-4 bg-stone-950/80 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-[10px] font-bold border border-red-500/30 uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                মিউজিক ও ভিডিও স্টুডিও
              </span>
              <span className="text-xs text-stone-400 font-medium hidden sm:inline">
                • গান প্লে করলে সরাসরি ভিডিও দেখার স্থানে নিয়ে যাবে
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
              ইউটিউব ইন-অ্যাপ সিনেমা ও ব্যাকগ্রাউন্ড প্লেয়ার
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToVideoPlayer(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold text-xs border border-stone-750 transition-all cursor-pointer"
            title="স্ক্রোল করে ভিডিও প্লেয়ারে যান"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>ভিডিও স্ক্রিনে যান</span>
          </button>

          <button
            type="button"
            onClick={() => playTrack(featuredTrack)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:brightness-110 active:scale-98 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all cursor-pointer self-start sm:self-auto"
            title="ফিচার্ড ভিডিওটি এখনই সম্পূর্ণ ফুলস্ক্রিনে প্লে করুন"
          >
            <Maximize2 className="w-4 h-4" />
            <span>ফুলস্ক্রিন প্লেয়ারে চালান</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Direct Search or YouTube URL Input Bar */}
        <form onSubmit={handlePlayDirectStage} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="যেকোনো গানের নাম লিখুন বা YouTube URL পেস্ট করুন (যেমন: https://youtube.com/watch?v=...)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-750 text-white placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              title="এখানে সরাসরি ভিডিও স্ক্রিনে নিয়ে গিয়ে চালান"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>এখানে চালান</span>
            </button>

            <button
              type="button"
              onClick={handlePlayCustomFullscreen}
              disabled={!customInput.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-850 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-200 text-xs font-semibold border border-stone-750 transition-all cursor-pointer"
              title="ইন-অ্যাপ বড় ফুলস্ক্রিন প্লেয়ারে খুলুন"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ফুলস্ক্রিন</span>
            </button>

            {onSendToChat && (
              <button
                type="button"
                onClick={handleSendQueryToChat}
                disabled={!customInput.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-stone-850 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-stone-300 hover:text-white text-xs font-medium border border-stone-750 transition-colors cursor-pointer"
                title="এআই চ্যাটে গানটির বিষয়ে প্রশ্ন করুন"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">চ্যাটে খুঁজুন</span>
              </button>
            )}
          </div>
        </form>

        {/* Featured Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Main Video Stage Preview - Target of automatic scroll */}
          <div className="lg:col-span-7">
            <div
              ref={videoStageRef}
              id="landing-page-video-player"
              className={`relative aspect-video w-full rounded-2xl overflow-hidden bg-black border transition-all duration-500 shadow-2xl group ${
                highlightStage
                  ? 'border-red-500 ring-4 ring-red-500/80 shadow-red-600/50 scale-[1.01]'
                  : 'border-stone-800'
              }`}
            >
              <iframe
                key={`featured-${featuredTrack.videoId}-${shouldAutoplay ? 'auto' : 'static'}`}
                src={`https://www.youtube.com/embed/${featuredTrack.videoId}?autoplay=${shouldAutoplay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}
                title={featuredTrack.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />

              {/* Status indicator on active play */}
              {highlightStage && (
                <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/90 text-white text-xs font-bold backdrop-blur-md shadow-lg animate-in fade-in slide-in-from-top-2">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  <span>সরাসরি ভিডিও প্লেয়ার শুরু হয়েছে</span>
                </div>
              )}

              {/* Overlay Fullscreen Button on Hover */}
              <button
                onClick={() => playTrack(featuredTrack)}
                className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/85 hover:bg-red-600 text-white text-xs font-semibold backdrop-blur-md border border-stone-700 hover:border-red-500 transition-all shadow-lg cursor-pointer"
                title="অ্যাপের ভেতরে বড় সিনেমাটিক ফুলস্ক্রিন প্লেয়ারে নিন"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>ফুলস্ক্রিন মোড</span>
              </button>
            </div>
          </div>

          {/* Featured Track Info & Live Controls */}
          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-600/30 text-red-400 border border-red-500/30 uppercase font-bold flex items-center gap-1">
                  {isPlayingOnStage && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                  এখন প্লে হচ্ছে
                </span>
                <span className="text-[11px] text-stone-400 font-mono">
                  ID: {featuredTrack.videoId}
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {featuredTrack.title}
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                যেকোনো গানে ক্লিক করলেই পেজ স্ক্রোল না করে সরাসরি ভিডিও দেখার স্থানে নিয়ে যাবে এবং স্বয়ংক্রিয়ভাবে ভিডিও চালানো শুরু হবে।
              </p>
            </div>

            {/* Quick action buttons for featured track */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handlePlayOnStage(featuredTrack, true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-red-600/25 transition-all cursor-pointer"
                title="সরাসরি এই প্লেয়ারে ভিডিওটি চালান"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>ভিডিওটি চালান</span>
              </button>

              <button
                type="button"
                onClick={() => playTrack(featuredTrack)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-200 hover:text-white text-xs font-semibold border border-stone-750 transition-colors cursor-pointer"
                title="বড় ফুলস্ক্রিন সিনেমা মোডে নিন"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>ফুলস্ক্রিন প্লেয়ার</span>
              </button>

              <a
                href={`https://www.youtube.com/watch?v=${featuredTrack.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold border border-stone-750 transition-colors"
              >
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>YouTube এ</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Curated Playlist Cards Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-red-400" />
              <span>জনপ্রিয় প্লেলিস্ট ও কিউরেটেড ট্র্যাকসমূহ (সরাসরি ভিডিও দেখুন)</span>
            </h4>
            <span className="text-[11px] text-stone-500">ক্লিক করলে সরাসরি ভিডিও দেখার স্থানে নিয়ে যাবে</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CURATED_TRACKS.map((t) => {
              const isSelected = featuredTrack.videoId === t.videoId;
              return (
                <div
                  key={t.videoId}
                  onClick={() => handlePlayOnStage(t, true)}
                  className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between gap-3 group/track cursor-pointer ${
                    isSelected
                      ? 'bg-stone-900 border-red-500/80 shadow-lg shadow-red-950/40 ring-1 ring-red-500/50'
                      : 'bg-stone-950/60 border-stone-800 hover:border-red-500/40 hover:bg-stone-900/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-stone-900 text-stone-300 font-mono text-[10px] border border-stone-800 flex items-center gap-1">
                        {t.icon}
                        <span>{t.category}</span>
                      </span>
                      {isSelected ? (
                        <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-bold flex items-center gap-1 animate-pulse">
                          <Play className="w-2 h-2 fill-current" />
                          প্লে হচ্ছে
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-400 font-mono">{t.duration}</span>
                      )}
                    </div>

                    <h5 className="text-xs font-bold text-white group-hover/track:text-red-400 transition-colors line-clamp-2 leading-snug">
                      {t.title}
                    </h5>
                    <p className="text-[11px] text-stone-400 truncate">{t.artist}</p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-stone-850">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayOnStage(t, true);
                      }}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                      title="স্ক্রোল না করে সরাসরি ভিডিও দেখার স্থানে নিয়ে গিয়ে গানটি চালান"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>ভিডিও চালান</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFeaturedTrack(t);
                        playTrack(t);
                      }}
                      className="py-1.5 px-2.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-200 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      title="অ্যাপের ভেতরে বড় ফুলস্ক্রিন প্লেয়ারে চালান"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>ফুলস্ক্রিন</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Quick Jump to Video Button when scrolled past video stage */}
        {isScrolledPastPlayer && (
          <button
            type="button"
            onClick={() => scrollToVideoPlayer(true)}
            className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-2xl shadow-red-600/50 backdrop-blur-md border border-red-400/40 transition-all cursor-pointer animate-bounce"
            title="ভিডিও প্লেয়ার দেখার স্থানে যান"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>ভিডিও দেখার স্থানে যান</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  );
};
