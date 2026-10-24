import React, { useState, useEffect } from 'react';
import { 
  X, 
  Youtube, 
  Play, 
  Eye, 
  Users, 
  Film, 
  ListVideo, 
  Search, 
  ExternalLink, 
  RefreshCw, 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Share2, 
  ChevronRight,
  LogOut,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  YouTubeChannel, 
  YouTubeVideo, 
  YouTubePlaylist, 
  getMyYouTubeChannel, 
  getChannelUploads, 
  getMyPlaylists, 
  searchYouTubeVideos, 
  formatCountCompact, 
  formatPublishDate 
} from '../lib/youtubeService';

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (text: string, title?: string) => void;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const { user, accessToken, requestYouTubeToken, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'videos' | 'playlists' | 'analytics' | 'search'>('videos');
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Active playing video for inline modal preview
  const [playingVideo, setPlayingVideo] = useState<YouTubeVideo | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load channel & content when modal opens or token is available
  useEffect(() => {
    if (isOpen && accessToken) {
      loadChannelData();
    }
  }, [isOpen, accessToken]);

  const loadChannelData = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const ch = await getMyYouTubeChannel(accessToken);
      setChannel(ch);

      if (ch && ch.uploadsPlaylistId) {
        const vids = await getChannelUploads(accessToken, ch.uploadsPlaylistId, 30);
        setVideos(vids);
      }

      const pls = await getMyPlaylists(accessToken, 20);
      setPlaylists(pls);
    } catch (err: any) {
      console.warn('YouTube load error:', err);
      setError(err?.message || 'ইউটিউব চ্যানেল ডেটা লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectYouTube = async () => {
    try {
      setLoading(true);
      setError(null);
      await requestYouTubeToken();
    } catch (err: any) {
      setError(err?.message || 'YouTube সংযোগ স্থাপন করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!accessToken || !searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setError(null);
      const res = await searchYouTubeVideos(accessToken, searchQuery.trim(), 20);
      setSearchResults(res);
      setActiveTab('search');
    } catch (err: any) {
      setError(err?.message || 'ভিডিও সার্চ করতে সমস্যা হয়েছে।');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAskAIAboutVideo = (video: YouTubeVideo) => {
    const prompt = `এই ইউটিউব ভিডিওটি নিয়ে আমাকে সাহায্য করুন:\n- শিরোনাম: ${video.title}\n- বর্ণনা: ${video.description || 'কোনো বর্ণনা নেই'}\n- লিংক: ${video.url}\n\nদয়া করে এই ভিডিওটির জন্য আকর্ষণীয় বাংলা ও ইংরেজি এসইও (SEO) মেটা-ট্যাগ, অপ্টিমাইজড টাইটেল সাজেশন ও সামাজিক মাধ্যমে প্রচারের জন্য ৩টি ক্যাপশন তৈরি করুন।`;
    if (onSendToChat) {
      onSendToChat(prompt, `YouTube SEO: ${video.title.slice(0, 30)}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl bg-stone-950 border border-stone-800 shadow-2xl text-stone-100 overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-stone-900/80 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center shadow-inner">
              <Youtube className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-100 tracking-tight">
                  YouTube Studio & Channel Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/15 text-red-400 border border-red-500/25">
                  v3 API
                </span>
              </div>
              <p className="text-xs text-stone-400 font-mono">
                গুগল ইউটিউব চ্যানেল, ভিডিও ও প্লেলিস্ট ম্যানেজমেন্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {accessToken && (
              <button
                type="button"
                onClick={loadChannelData}
                disabled={loading}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-red-400' : ''}`} />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 transition-all cursor-pointer hover:rotate-90"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
          
          {/* State 1: Unauthenticated View */}
          {!accessToken ? (
            <div className="my-auto flex flex-col items-center justify-center py-10 px-4 text-center max-w-xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-red-600/10 text-red-500 border border-red-500/20 flex items-center justify-center mb-5 shadow-2xl animate-pulse">
                <Youtube className="w-12 h-12 fill-current" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-stone-100 mb-2">
                ইউটিউব চ্যানেল সংযুক্ত করুন
              </h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed mb-5">
                আপনার গুগল ইউটিউব অ্যাকাউন্টে লগইন করে সরাসরি আপনার চ্যানেল, ভিডিও, প্লেলিস্ট ও মেট্রিক্স দেখুন এবং এআই সহকারী দিয়ে এসইও ও মেটাডেটা অপটিমাইজ করুন।
              </p>

              {user && (
                <div className="mb-6 px-4 py-2.5 rounded-2xl bg-stone-900 border border-stone-800 flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-red-500/50" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-600/30 text-red-400 flex items-center justify-center text-xs font-bold">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="text-left min-w-0">
                    <p className="text-xs font-semibold text-stone-200 truncate">{user.displayName || 'Google User'}</p>
                    <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                  </div>
                  <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    সাইনড-ইন
                  </span>
                </div>
              )}

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-3 w-full mb-8 text-left">
                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-start gap-3">
                  <Film className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">আপলোডকৃত ভিডিও</h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">সব ভিডিওর তালিকা ও ভিউ কাউন্ট</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-start gap-3">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">চ্যানেল পরিসংখ্যান</h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">সাবস্ক্রাইবার ও মোট ওয়াচ ভিউজ</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-start gap-3">
                  <ListVideo className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">প্লেলিস্ট ম্যানেজমেন্ট</h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">সকল প্লেলিস্টের কালেকশন ব্রাউজ</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-stone-200">এআই এসইও অডিট</h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">টাইটেল, ট্যাগ ও ডেসক্রিপশন জেনারেশন</p>
                  </div>
                </div>
              </div>

              {/* Official Google Sign-In Button conforming to SKILL.md */}
              <button
                type="button"
                onClick={handleConnectYouTube}
                disabled={loading}
                className="w-full max-w-sm flex items-center justify-center gap-3 py-3 px-5 rounded-2xl bg-white hover:bg-stone-100 text-stone-800 font-semibold text-sm shadow-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span>{loading ? 'সংযোগ হচ্ছে...' : user ? 'গুগল অ্যাকাউন্টে YouTube অনুমোদন দিন' : 'Sign in with Google (Connect YouTube)'}</span>
              </button>

              {/* Error and Troubleshooting Card */}
              {error && (
                <div className="mt-5 p-4 bg-rose-950/70 border border-rose-800 text-rose-200 rounded-2xl text-xs max-w-md text-left space-y-2 shadow-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <p className="font-semibold text-rose-100">{error}</p>
                  </div>
                  <p className="text-[11px] text-rose-300/80">
                    💡 ব্রাউজার পপ-আপ ব্লক করলে অ্যাড্রেসবারে অনুমোদন করুন অথবা সরাসরি নতুন ট্যাবে চেষ্টা করুন।
                  </p>
                  <button
                    type="button"
                    onClick={handleConnectYouTube}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>পুনরায় চেষ্টা করুন</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* State 2: Authenticated Channel Studio */
            <div className="flex flex-col gap-6">
              
              {/* Channel Header Banner */}
              {channel && (
                <div className="relative rounded-3xl bg-gradient-to-r from-red-950/60 via-stone-900 to-stone-900 border border-stone-800 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-xl">
                  <div className="flex items-center gap-4">
                    {channel.thumbnails?.high?.url || channel.thumbnails?.medium?.url ? (
                      <img
                        src={channel.thumbnails.high?.url || channel.thumbnails.medium?.url}
                        alt={channel.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-red-500/60 shadow-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold">
                        {channel.title.charAt(0)}
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-stone-100 flex items-center gap-2">
                        <span>{channel.title}</span>
                        {channel.customUrl && (
                          <span className="text-xs text-red-400 font-mono font-normal">
                            {channel.customUrl}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-stone-400 mt-1 max-w-xl line-clamp-2">
                        {channel.description || 'কোনো চ্যানেল ডেসক্রিপশন নেই।'}
                      </p>

                      {/* Stats Pills */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap text-xs font-mono">
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 font-semibold">
                          <Users className="w-3 h-3" />
                          <span>{formatCountCompact(channel.statistics.subscriberCount)} সাবস্ক্রাইবার</span>
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                          <Eye className="w-3 h-3 text-sky-400" />
                          <span>{formatCountCompact(channel.statistics.viewCount)} মোট ভিউ</span>
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                          <Film className="w-3 h-3 text-amber-400" />
                          <span>{channel.statistics.videoCount || 0} টি ভিডিও</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Channel External Link and Reconnect */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={handleConnectYouTube}
                      disabled={loading}
                      title="ইউটিউব অ্যাকাউন্ট রিকানেক্ট বা পরিবর্তন করুন"
                      className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700 shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-red-400' : ''}`} />
                      <span>সুইচ অ্যাকাউন্ট</span>
                    </button>

                    <a
                      href={`https://www.youtube.com/channel/${channel.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>ইউটিউব চ্যানেল খুলুন</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Navigation Tabs and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-stone-800">
                <div className="flex items-center gap-1.5 p-1 bg-stone-900 border border-stone-800 rounded-2xl overflow-x-auto">
                  {[
                    { id: 'videos', label: `আপলোডকৃত ভিডিও (${videos.length})`, icon: Film },
                    { id: 'playlists', label: `প্লেলিস্ট (${playlists.length})`, icon: ListVideo },
                    { id: 'search', label: 'ভিডিও সার্চ', icon: Search },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Video Search Input */}
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ইউটিউবে ভিডিও খুঁজুন..."
                      className="w-full pl-8 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium border border-stone-700 transition-colors cursor-pointer"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-400" /> : 'সার্চ'}
                  </button>
                </form>
              </div>

              {/* Inline Embedded Player View (if a video is selected) */}
              {playingVideo && (
                <div className="p-4 rounded-3xl bg-stone-900/90 border border-red-500/30 flex flex-col gap-3 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-red-500 fill-current" />
                      <h4 className="text-sm font-bold text-stone-200 truncate max-w-lg">
                        {playingVideo.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlayingVideo(null)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-inner">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${playingVideo.id}?autoplay=1`}
                      title={playingVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-none"
                    />
                  </div>

                  {/* Player Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <span className="text-xs text-stone-400 font-mono">
                      প্রকাশ: {formatPublishDate(playingVideo.publishedAt)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyLink(playingVideo.url, playingVideo.id)}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium border border-stone-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedId === playingVideo.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>লিংক কপি</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAskAIAboutVideo(playingVideo)}
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>এআই এসইও ও ট্যাগ তৈরি করুন</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Channel Uploaded Videos */}
              {activeTab === 'videos' && (
                <div className="flex flex-col gap-4">
                  {loading && videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
                      <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                      <span className="text-xs font-mono">ভিডিওসমূহ লোড হচ্ছে...</span>
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="text-center py-16 text-stone-500 text-xs font-mono">
                      এই চ্যানেলে কোনো আপলোডকৃত ভিডিও পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {videos.map((vid) => (
                        <div
                          key={vid.id}
                          className="group rounded-2xl bg-stone-900/70 hover:bg-stone-900 border border-stone-800/80 hover:border-red-500/40 p-3 flex flex-col justify-between transition-all shadow-md"
                        >
                          <div>
                            {/* Video Thumbnail with Hover Overlay */}
                            <div 
                              onClick={() => setPlayingVideo(vid)}
                              className="relative aspect-video rounded-xl overflow-hidden bg-stone-950 cursor-pointer mb-3"
                            >
                              {vid.thumbnails.medium?.url || vid.thumbnails.default?.url ? (
                                <img
                                  src={vid.thumbnails.medium?.url || vid.thumbnails.default?.url}
                                  alt={vid.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-700">
                                  <Film className="w-8 h-8" />
                                </div>
                              )}
                              
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>

                            <h4 className="text-xs font-bold text-stone-200 line-clamp-2 group-hover:text-red-400 transition-colors">
                              {vid.title}
                            </h4>
                            <p className="text-[11px] text-stone-500 font-mono mt-1">
                              প্রকাশ: {formatPublishDate(vid.publishedAt)}
                            </p>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-800/80 text-xs">
                            <button
                              type="button"
                              onClick={() => setPlayingVideo(vid)}
                              className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>প্লে করুন</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleAskAIAboutVideo(vid)}
                              className="text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                              title="ভিডিও এসইও ও মেটাডেটা প্রম্পট"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                              <span>এসইও অডিট</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: User's Playlists */}
              {activeTab === 'playlists' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {playlists.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-stone-500 text-xs font-mono">
                      কোনো প্লেলিস্ট পাওয়া যায়নি।
                    </div>
                  ) : (
                    playlists.map((pl) => (
                      <div
                        key={pl.id}
                        className="p-4 rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-red-500/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-stone-950 mb-3">
                            {pl.thumbnails.medium?.url || pl.thumbnails.default?.url ? (
                              <img
                                src={pl.thumbnails.medium?.url || pl.thumbnails.default?.url}
                                alt={pl.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-700">
                                <ListVideo className="w-8 h-8" />
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-white font-mono text-[10px] flex items-center gap-1">
                              <Film className="w-3 h-3 text-red-400" />
                              <span>{pl.itemCount} টি আইটেম</span>
                            </div>
                          </div>

                          <h4 className="text-xs font-bold text-stone-200 line-clamp-2">
                            {pl.title}
                          </h4>
                          <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">
                            {pl.description || 'কোনো বর্ণনা নেই।'}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-stone-800 flex justify-between items-center text-xs">
                          <a
                            href={`https://www.youtube.com/playlist?list=${pl.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>প্লেলিস্ট দেখুন</span>
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Search Results */}
              {activeTab === 'search' && (
                <div className="flex flex-col gap-4">
                  {searchResults.length === 0 ? (
                    <div className="text-center py-16 text-stone-500 text-xs font-mono">
                      {isSearching ? 'সার্চ হচ্ছে...' : 'উপরের সার্চ বক্সে লিখে যেকোনো ইউটিউব ভিডিও খুঁজুন।'}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {searchResults.map((vid) => (
                        <div
                          key={vid.id}
                          className="group rounded-2xl bg-stone-900/70 border border-stone-800 hover:border-red-500/40 p-3 flex flex-col justify-between transition-all"
                        >
                          <div>
                            <div 
                              onClick={() => setPlayingVideo(vid)}
                              className="relative aspect-video rounded-xl overflow-hidden bg-stone-950 cursor-pointer mb-3"
                            >
                              <img
                                src={vid.thumbnails.medium?.url || vid.thumbnails.default?.url}
                                alt={vid.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <h4 className="text-xs font-bold text-stone-200 line-clamp-2">
                              {vid.title}
                            </h4>
                            <p className="text-[11px] text-stone-400 mt-1">
                              চ্যানেল: {vid.channelTitle}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-800 text-xs">
                            <button
                              type="button"
                              onClick={() => setPlayingVideo(vid)}
                              className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>প্লে করুন</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAskAIAboutVideo(vid)}
                              className="text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                              <span>এআই বিশ্লেষণ</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
