import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe,
  Search,
  Youtube,
  Music,
  FileText,
  ExternalLink,
  X,
  Maximize2,
  Minimize2,
  RotateCw,
  Home,
  Play,
  Check,
  Copy,
  Sparkles,
  Disc3,
  Headphones,
  AlertCircle,
  ArrowRight,
  Radio,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  History,
  ArrowLeft,
  Volume2,
  VolumeX,
  ShieldCheck,
  MessageSquare,
  Send,
  Link2,
  ChevronDown,
  ChevronUp,
  Tag,
  HardDrive,
  FileSpreadsheet,
  Presentation,
  MapPin,
  Mail,
  FileCode,
  Languages,
  TrendingUp,
  Image as ImageIcon,
  Newspaper,
  GraduationCap,
  Layers,
  Download,
  Eye,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useMiniBrowser } from '../context/MiniBrowserContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { ContinuousTTSPlayer } from '../utils/textToSpeech';
import { ChatSession } from '../types';

export interface MiniGoogleBrowserModalProps {
  activeSession?: ChatSession;
  onInsertIntoChat?: (text: string) => void;
  onOpenGoogleDrive?: () => void;
}

export type SearchFilterType = 'all' | 'images' | 'news' | 'academic';

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  author: string;
  url: string;
  thumbnail: string;
}

export interface SearchResult {
  title: string;
  url: string;
  domain?: string;
  snippet: string;
}

export interface ImageResult {
  title: string;
  url: string;
  imageUrl: string;
  thumbnailUrl?: string;
  source: string;
  domain: string;
  width?: number;
  height?: number;
}

export interface NewsResult {
  title: string;
  url: string;
  domain: string;
  source: string;
  timeAgo?: string;
  snippet: string;
  imageUrl?: string;
}

export interface AcademicResult {
  title: string;
  url: string;
  authors?: string;
  journal?: string;
  year?: string | number;
  snippet: string;
  pdfUrl?: string;
  citationsCount?: number;
}

export interface SearchResponse {
  query: string;
  filter?: SearchFilterType;
  instantAnswer?: string;
  knowledgeCard?: {
    title: string;
    subtitle?: string;
    description?: string;
    fields?: Array<{ label: string; value: string }>;
  };
  results: SearchResult[];
  imageResults?: ImageResult[];
  newsResults?: NewsResult[];
  academicResults?: AcademicResult[];
  youtubeMedia?: {
    videoId?: string;
    title?: string;
    artist?: string;
    watchUrl?: string;
    musicUrl?: string;
  };
  groundingSources?: Array<{ uri: string; title: string }>;
}

interface LyricsData {
  title: string;
  artist?: string;
  lyricsText: string;
}

interface HistoryEntry {
  tab: 'search' | 'youtube' | 'web' | 'lyrics' | 'resources';
  urlOrQuery: string;
  filter?: SearchFilterType;
  videoId?: string;
  videoTitle?: string;
  searchData?: SearchResponse | null;
  lyricsData?: LyricsData | null;
}

export const MiniGoogleBrowserModal: React.FC<MiniGoogleBrowserModalProps> = ({
  activeSession,
  onInsertIntoChat,
  onOpenGoogleDrive,
}) => {
  const {
    isOpen,
    closeBrowser,
    activeUrl,
    setActiveUrl,
    searchQuery,
    setSearchQuery,
    activeVideoId,
    activeVideoTitle,
    activeTab,
    setActiveTab,
    openYouTubeInBrowser,
    chatContext,
  } = useMiniBrowser();

  const [inputUrlOrQuery, setInputUrlOrQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Search filter states: 'all' | 'images' | 'news' | 'academic'
  const [searchFilter, setSearchFilter] = useState<SearchFilterType>('all');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<ImageResult | null>(null);

  // Chat context research states
  const [isChatContextOpen, setIsChatContextOpen] = useState(true);
  const [insertedFeedback, setInsertedFeedback] = useState<string | null>(null);

  // Web tab proxy & reader mode states
  const [webViewMode, setWebViewMode] = useState<'proxy' | 'reader'>('proxy');
  const [readerData, setReaderData] = useState<{ title: string; domain: string; content: string; url: string } | null>(null);
  const [isReaderLoading, setIsReaderLoading] = useState(false);
  const [isReaderSpeaking, setIsReaderSpeaking] = useState(false);

  // Track last handled query & url to avoid unnecessary repeated searches
  const lastHandledQueryRef = useRef<string | null>(null);
  const lastHandledUrlRef = useRef<string | null>(null);
  const lastHandledVideoRef = useRef<string | null>(null);
  const browserContentRef = useRef<HTMLDivElement>(null);
  const ytPlayerBoxRef = useRef<HTMLDivElement>(null);

  const musicPlayer = useMusicPlayer();
  const [ytVideos, setYtVideos] = useState<YouTubeSearchResult[]>([]);
  const [isYtSearching, setIsYtSearching] = useState(false);
  const [ytSearchTerm, setYtSearchTerm] = useState('');

  // Local copy of active video for navigation history
  const [navVideoId, setNavVideoId] = useState<string | undefined>(activeVideoId);
  const [navVideoTitle, setNavVideoTitle] = useState<string | undefined>(activeVideoTitle);

  // Automatically scroll directly to the video watching player when a YouTube video is played
  useEffect(() => {
    if (activeTab === 'youtube' && (navVideoId || activeVideoId)) {
      browserContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      ytPlayerBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab, navVideoId, activeVideoId]);

  // Navigation History Stack
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Derive research topics and URLs from either passed activeSession or chatContext
  const currentChatResearch = React.useMemo(() => {
    const sessionTitle = activeSession?.title && activeSession.title !== 'নতুন কথোপকথন'
      ? activeSession.title
      : chatContext?.sessionTitle;

    const topicSet = new Set<string>();
    const urlList: Array<{ url: string; title: string }> = [];
    const seenUrls = new Set<string>();

    if (sessionTitle) topicSet.add(sessionTitle);
    if (chatContext?.currentPrompt) topicSet.add(chatContext.currentPrompt);
    if (chatContext?.topics) {
      chatContext.topics.forEach((t) => topicSet.add(t));
    }
    if (chatContext?.urls) {
      chatContext.urls.forEach((u) => {
        if (!seenUrls.has(u.url)) {
          seenUrls.add(u.url);
          urlList.push({ url: u.url, title: u.title || new URL(u.url).hostname });
        }
      });
    }

    if (activeSession?.messages) {
      activeSession.messages.forEach((msg) => {
        // Grounding chunks from Gemini
        msg.groundingChunks?.forEach((chunk) => {
          if (chunk.web?.uri && !seenUrls.has(chunk.web.uri)) {
            seenUrls.add(chunk.web.uri);
            urlList.push({
              url: chunk.web.uri,
              title: chunk.web.title || new URL(chunk.web.uri).hostname,
            });
          }
        });

        // Search queries from Gemini
        msg.searchQueries?.forEach((sq) => {
          if (sq && sq.trim()) topicSet.add(sq.trim());
        });

        // Any URLs in message text
        const foundUrls = msg.text.match(/https?:\/\/[^\s)<>"']+/g);
        if (foundUrls) {
          foundUrls.forEach((u) => {
            const cleanU = u.replace(/[.,;!?]+$/, '');
            if (!seenUrls.has(cleanU)) {
              try {
                seenUrls.add(cleanU);
                urlList.push({ url: cleanU, title: new URL(cleanU).hostname });
              } catch (_) {}
            }
          });
        }

        // Recent user questions (topics discussed)
        if (msg.role === 'user' && msg.text.trim()) {
          const firstLine = msg.text.trim().split('\n')[0];
          if (firstLine.length > 4 && firstLine.length < 80) {
            topicSet.add(firstLine);
          }
        }
      });
    }

    const topics = Array.from(topicSet).slice(0, 10);
    const urls = urlList.slice(0, 10);

    return {
      title: sessionTitle,
      topics,
      urls,
      hasContext: Boolean(sessionTitle || topics.length > 0 || urls.length > 0),
    };
  }, [activeSession, chatContext]);

  const handleInsertReference = (title: string, url: string, snippet?: string) => {
    const referenceText = snippet 
      ? `> **[${title}](${url})**\n> ${snippet}\n`
      : `[${title}](${url})`;

    if (onInsertIntoChat) {
      onInsertIntoChat(referenceText);
      setInsertedFeedback('চ্যাটে রেফারেন্স যোগ হয়েছে!');
      setTimeout(() => setInsertedFeedback(null), 2500);
    } else {
      navigator.clipboard.writeText(referenceText);
      setInsertedFeedback('রেফারেন্স লিঙ্ক কপি হয়েছে!');
      setTimeout(() => setInsertedFeedback(null), 2500);
    }
  };

  const googleResourcesList = React.useMemo(() => [
    {
      title: 'Google Drive (গুগল ড্রাইভ)',
      description: 'ক্লাউড ফাইল ও কোড স্টোরেজ, ইন-অ্যাপ ব্যাকআপ ও সরাসরি ম্যানেজমেন্ট।',
      url: 'https://drive.google.com',
      icon: HardDrive,
      bg: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      action: 'drive',
      primaryActionLabel: onOpenGoogleDrive ? 'ইন-অ্যাপ ড্রাইভ' : 'ড্রাইভ খুলুন',
    },
    {
      title: 'ForTrade Pro Trading Terminal (PWA)',
      description: 'রিয়েল-টাইম ফরেক্স, ক্রিপ্টো ও স্টক মার্কেট লাইভ চার্ট, টেকনিক্যাল অ্যানালাইসিস ও ট্রেডিং টার্মিনাল।',
      url: 'https://fortrade-pro-trading-terminal-dev-d-nine.vercel.app/?source=pwa',
      icon: TrendingUp,
      bg: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      primaryActionLabel: 'টার্মিনাল ওপেন',
    },
    {
      title: 'Google Docs (গুগল ডক্স)',
      description: 'অনলাইনে স্মার্ট ডকুমেন্ট তৈরি, নোট লেখালেখি ও ফরম্যাটিং।',
      url: 'https://docs.google.com/document/create',
      icon: FileText,
      bg: 'bg-blue-500/10',
      textColor: 'text-blue-400',
    },
    {
      title: 'Google Sheets (গুগল শিটস)',
      description: 'অনলাইন স্প্রেডশিট, এক্সেল ক্যালকুলেশন ও ডাটা টেবিল।',
      url: 'https://sheets.google.com/create',
      icon: FileSpreadsheet,
      bg: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
    },
    {
      title: 'Google Slides (গুগল স্লাইডস)',
      description: 'প্রেজেন্টেশন তৈরি ও প্রফেশনাল স্লাইড ডেক ডিজাইন।',
      url: 'https://slides.google.com/create',
      icon: Presentation,
      bg: 'bg-orange-500/10',
      textColor: 'text-orange-400',
    },
    {
      title: 'Google Maps (গুগল ম্যাপস)',
      description: 'স্যাটেলাইট ভিউ, গ্লোবাল লোকেশন, নেভিগেশন ও দিকনির্দেশনা।',
      url: 'https://www.google.com/maps',
      icon: MapPin,
      bg: 'bg-red-500/10',
      textColor: 'text-red-400',
    },
    {
      title: 'Google Translate (গুগল অনুবাদক)',
      description: 'বাংলা, ইংরেজি ও শতাধিক আন্তর্জাতিক ভাষায় নির্ভুল টেক্সট অনুবাদ।',
      url: 'https://translate.google.com/?sl=auto&tl=bn',
      icon: Languages,
      bg: 'bg-blue-500/10',
      textColor: 'text-blue-400',
    },
    {
      title: 'YouTube ও মিউজিক',
      description: 'ভিডিও ও ব্যাকগ্রাউন্ড গান স্ট্রিমিং ও লিরিক্স প্লেয়ার।',
      url: 'https://www.youtube.com',
      icon: Youtube,
      bg: 'bg-red-500/10',
      textColor: 'text-red-400',
      action: 'youtube',
      primaryActionLabel: 'ইন-অ্যাপ প্লেয়ার',
    },
    {
      title: 'Google Keep (গুগল কিপ)',
      description: 'দ্রুত নোট, চেকলিস্ট ও দৈনন্দিন রিমাইন্ডার সংরক্ষণ।',
      url: 'https://keep.google.com',
      icon: Sparkles,
      bg: 'bg-yellow-500/10',
      textColor: 'text-yellow-400',
    },
    {
      title: 'Google News (গুগল নিউজ)',
      description: 'তাজা জাতীয় ও আন্তর্জাতিক ব্রেকিং সংবাদ ও শিরোনাম।',
      url: 'https://news.google.com',
      icon: BookOpen,
      bg: 'bg-sky-500/10',
      textColor: 'text-sky-400',
    },
    {
      title: 'Gmail (গুগল মেইল)',
      description: 'নিরাপদ গুগল ইমেইল ইনবক্স ও বার্তা আদান-প্রদান।',
      url: 'https://mail.google.com',
      icon: Mail,
      bg: 'bg-rose-500/10',
      textColor: 'text-rose-400',
    },
    {
      title: 'Google Scholar (গুগল স্কলার)',
      description: 'গবেষণাপত্র, থিসিস ও আন্তর্জাতিক জার্নাল অনুসন্ধান।',
      url: 'https://scholar.google.com',
      icon: BookOpen,
      bg: 'bg-indigo-500/10',
      textColor: 'text-indigo-400',
    },
    {
      title: 'Google Colab (গুগল কোলাব)',
      description: 'পাইথন জুপিটার নোটবুক ও এআই কোডিং এনভায়রনমেন্ট।',
      url: 'https://colab.research.google.com',
      icon: FileCode,
      bg: 'bg-amber-500/10',
      textColor: 'text-amber-400',
    },
  ], [onOpenGoogleDrive]);

  const handleSelectChatTopic = (topic: string) => {
    setInputUrlOrQuery(topic);
    setActiveTab('search');
    handleSearch(topic, true);
  };

  const handleSelectChatUrl = (url: string) => {
    setInputUrlOrQuery(url);
    setActiveUrl(url);
    setActiveTab('web');
    pushHistory({
      tab: 'web',
      urlOrQuery: url,
    });
  };

  // Dedicated YouTube searcher
  const handleSearchYouTube = useCallback(async (term: string) => {
    const q = term.trim();
    if (!q) return;
    setIsYtSearching(true);
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          setYtVideos(data.videos);
        }
      }
    } catch (err) {
      console.warn('YouTube search error:', err);
    } finally {
      setIsYtSearching(false);
    }
  }, []);

  // Helper to push history entry
  const pushHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => {
      // Discard any forward history if user navigated from a middle state
      const truncated = prev.slice(0, historyIndex + 1);
      const last = truncated[truncated.length - 1];
      // Avoid pushing immediate duplicates
      if (
        last &&
        last.tab === entry.tab &&
        last.urlOrQuery === entry.urlOrQuery &&
        last.videoId === entry.videoId
      ) {
        return truncated;
      }
      return [...truncated, entry];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // Sync state when modal opens or external query/videoId is passed
  useEffect(() => {
    if (isOpen) {
      if (activeVideoId && activeVideoId !== lastHandledVideoRef.current) {
        lastHandledVideoRef.current = activeVideoId;
        setNavVideoId(activeVideoId);
        setNavVideoTitle(activeVideoTitle || 'ইউটিউব গান / ভিডিও');
        const url = `https://www.youtube.com/watch?v=${activeVideoId}`;
        setInputUrlOrQuery(url);
        const entry: HistoryEntry = {
          tab: 'youtube',
          urlOrQuery: url,
          videoId: activeVideoId,
          videoTitle: activeVideoTitle,
        };
        pushHistory(entry);
        handleSearchYouTube(activeVideoTitle || 'Zack Knight Dheere');
      } else if (searchQuery && searchQuery !== lastHandledQueryRef.current) {
        lastHandledQueryRef.current = searchQuery;
        setInputUrlOrQuery(searchQuery);
        handleSearch(searchQuery, true);
        handleSearchYouTube(searchQuery);
      } else if (activeUrl && activeUrl !== 'https://www.google.com' && activeUrl !== lastHandledUrlRef.current) {
        lastHandledUrlRef.current = activeUrl;
        setInputUrlOrQuery(activeUrl);
        const entry: HistoryEntry = {
          tab: 'web',
          urlOrQuery: activeUrl,
        };
        pushHistory(entry);
      } else if (history.length === 0) {
        // Default Google Search Home
        const defaultEntry: HistoryEntry = {
          tab: 'search',
          urlOrQuery: 'Google Search',
        };
        setHistory([defaultEntry]);
        setHistoryIndex(0);
        setInputUrlOrQuery('Google Search');
        handleSearch('Google Search', false);
        handleSearchYouTube('Zack Knight Dheere');
      }
    } else {
      lastHandledQueryRef.current = null;
      lastHandledUrlRef.current = null;
      lastHandledVideoRef.current = null;
    }
  }, [isOpen, activeVideoId, searchQuery, activeUrl, handleSearchYouTube]);

  const loadReaderContent = useCallback(async (urlToRead: string) => {
    if (!urlToRead) return;
    setIsReaderLoading(true);
    try {
      const res = await fetch(`/api/proxy/reader?url=${encodeURIComponent(urlToRead)}`);
      if (res.ok) {
        const data = await res.json();
        setReaderData(data);
      } else {
        setReaderData({
          title: 'ওয়েব পেজ',
          domain: new URL(urlToRead).hostname,
          content: 'ওয়েব পেজের টেক্সট এক্সট্র্যাক্ট করা যায়নি। সম্পূর্ণ পেজ দেখতে লাইভ ওয়েব মোড ব্যবহার করুন।',
          url: urlToRead,
        });
      }
    } catch {
      setReaderData({
        title: 'ওয়েব পেজ',
        domain: urlToRead,
        content: 'লোড করতে সমস্যা হয়েছে। লাইভ ব্রাউজারে অথবা নতুন ট্যাবে খুলুন।',
        url: urlToRead,
      });
    } finally {
      setIsReaderLoading(false);
    }
  }, []);

  const readerPlayerRef = useRef<ContinuousTTSPlayer | null>(null);

  useEffect(() => {
    if (activeTab === 'web' && webViewMode === 'reader' && activeUrl) {
      loadReaderContent(activeUrl);
    }
  }, [activeTab, webViewMode, activeUrl, loadReaderContent]);

  useEffect(() => {
    return () => {
      readerPlayerRef.current?.stop();
    };
  }, []);

  const handleToggleSpeakReader = () => {
    if (isReaderSpeaking) {
      readerPlayerRef.current?.stop();
      setIsReaderSpeaking(false);
      return;
    }
    if (!readerData?.content) return;
    const speed = parseFloat(localStorage.getItem('ai_preferred_tts_speed') || '0.85');
    readerPlayerRef.current = new ContinuousTTSPlayer({
      speed,
      onStateChange: (speaking) => setIsReaderSpeaking(speaking),
      onComplete: () => setIsReaderSpeaking(false),
      onError: () => setIsReaderSpeaking(false),
    });
    setIsReaderSpeaking(true);
    readerPlayerRef.current.play(readerData.content, 0);
  };

  const handleSearch = async (
    queryText: string,
    addToHistory: boolean = true,
    filterOverride?: SearchFilterType
  ) => {
    const q = queryText.trim();
    if (!q) return;

    const activeFilter = filterOverride || searchFilter;
    if (filterOverride && filterOverride !== searchFilter) {
      setSearchFilter(filterOverride);
    }

    setIsLoading(true);
    setActiveTab('search');
    try {
      const res = await fetch('/api/mini-browser/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, filter: activeFilter }),
      });
      if (res.ok) {
        const data: SearchResponse = await res.json();
        setSearchData(data);
        if (data.youtubeMedia?.videoId) {
          setNavVideoId(data.youtubeMedia.videoId);
          setNavVideoTitle(data.youtubeMedia.title);
        }
        if (addToHistory) {
          pushHistory({
            tab: 'search',
            urlOrQuery: q,
            filter: activeFilter,
            searchData: data,
            videoId: data.youtubeMedia?.videoId,
            videoTitle: data.youtubeMedia?.title,
          });
        }
      }
    } catch (err) {
      console.warn('Mini browser search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilter: SearchFilterType) => {
    setSearchFilter(newFilter);
    const q = (inputUrlOrQuery || searchData?.query || 'Google Search').trim();
    handleSearch(q, true, newFilter);
  };

  const handleFetchLyrics = async (
    title: string,
    artist?: string,
    vid?: string,
    addToHistory: boolean = true
  ) => {
    setIsLyricsLoading(true);
    setActiveTab('lyrics');
    try {
      const res = await fetch('/api/mini-browser/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songTitle: title, artist, videoId: vid }),
      });
      if (res.ok) {
        const data: LyricsData = await res.json();
        setLyricsData(data);
        if (addToHistory) {
          pushHistory({
            tab: 'lyrics',
            urlOrQuery: title,
            videoId: vid,
            videoTitle: title,
            lyricsData: data,
          });
        }
      }
    } catch (err) {
      console.warn('Lyrics fetch failed:', err);
    } finally {
      setIsLyricsLoading(false);
    }
  };

  // Navigate to specific history entry
  const applyHistoryEntry = (entry: HistoryEntry) => {
    setInputUrlOrQuery(entry.urlOrQuery);
    setActiveTab(entry.tab);

    if (entry.videoId) {
      setNavVideoId(entry.videoId);
      setNavVideoTitle(entry.videoTitle);
    }

    if (entry.tab === 'search') {
      if (entry.filter) {
        setSearchFilter(entry.filter);
      }
      if (entry.searchData) {
        setSearchData(entry.searchData);
      } else {
        handleSearch(entry.urlOrQuery, false, entry.filter);
      }
    } else if (entry.tab === 'lyrics') {
      if (entry.lyricsData) {
        setLyricsData(entry.lyricsData);
      } else {
        handleFetchLyrics(entry.urlOrQuery, undefined, entry.videoId, false);
      }
    } else if (entry.tab === 'web') {
      setActiveUrl(entry.urlOrQuery);
    }
  };

  // Back Button
  const canGoBack = historyIndex > 0;
  const handleGoBack = useCallback(() => {
    if (canGoBack) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      applyHistoryEntry(history[newIdx]);
    }
  }, [canGoBack, historyIndex, history]);

  // Forward Button
  const canGoForward = historyIndex >= 0 && historyIndex < history.length - 1;
  const handleGoForward = useCallback(() => {
    if (canGoForward) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      applyHistoryEntry(history[newIdx]);
    }
  }, [canGoForward, historyIndex, history]);

  // Refresh Button
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);

    try {
      if (activeTab === 'search') {
        const q = inputUrlOrQuery.trim() || 'Google Search';
        await handleSearch(q, false);
      } else if (activeTab === 'lyrics') {
        const title = navVideoTitle || inputUrlOrQuery || 'গান';
        await handleFetchLyrics(title, undefined, navVideoId, false);
      } else if (activeTab === 'youtube') {
        // Trigger key increment so iframe reloads smoothly
        setRefreshKey((k) => k + 1);
      } else if (activeTab === 'web') {
        setRefreshKey((k) => k + 1);
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [activeTab, inputUrlOrQuery, navVideoTitle, navVideoId]);

  // Home Button
  const handleGoHome = () => {
    setInputUrlOrQuery('https://www.google.com');
    setActiveTab('search');
    handleSearch('Google Search', true);
  };

  // Keyboard Navigation Shortcuts (Alt+Left, Alt+Right, F5 / Ctrl+R)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture shortcuts if typing in text inputs (except Alt+Left/Right)
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Alt + Left Arrow -> Back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGoBack();
        return;
      }
      // Alt + Right Arrow -> Forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleGoForward();
        return;
      }
      // F5 or Ctrl+R (when modal focused) -> Refresh modal without full page reload
      if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r' && !isInput)) {
        e.preventDefault();
        handleRefresh();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleGoBack, handleGoForward, handleRefresh]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputUrlOrQuery.trim();
    if (!val) return;

    // Check if user entered a direct YouTube link
    const ytMatch = val.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
    if (ytMatch) {
      const vid = ytMatch[1];
      setNavVideoId(vid);
      setNavVideoTitle('ইউটিউব গান / ভিডিও');
      setActiveTab('youtube');
      pushHistory({
        tab: 'youtube',
        urlOrQuery: val,
        videoId: vid,
        videoTitle: 'ইউটিউব গান / ভিডিও',
      });
      return;
    }

    // If it's a google domain, switch to search tab
    if (/^https?:\/\/(?:www\.)?google\.[a-z.]+(?:\/)?$/i.test(val)) {
      setActiveTab('search');
      return;
    }
    const googleQueryMatch = val.match(/^https?:\/\/(?:www\.)?google\.[a-z.]+\/search\?.*q=([^&]+)/i);
    if (googleQueryMatch) {
      const q = decodeURIComponent(googleQueryMatch[1].replace(/\+/g, ' '));
      setInputUrlOrQuery(q);
      handleSearch(q, true);
      return;
    }

    if (val.startsWith('http://') || val.startsWith('https://')) {
      setActiveUrl(val);
      setActiveTab('web');
      pushHistory({
        tab: 'web',
        urlOrQuery: val,
      });
    } else if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(\/.*)?$/i.test(val)) {
      const fullUrl = `https://${val}`;
      setActiveUrl(fullUrl);
      setActiveTab('web');
      pushHistory({
        tab: 'web',
        urlOrQuery: fullUrl,
      });
    } else {
      handleSearch(val, true);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const currentVideoId = navVideoId || activeVideoId || searchData?.youtubeMedia?.videoId;
  const currentSongTitle = navVideoTitle || activeVideoTitle || searchData?.youtubeMedia?.title || searchData?.knowledgeCard?.title || inputUrlOrQuery || 'গান / মিউজিক';
  const watchUrl = currentVideoId ? `https://www.youtube.com/watch?v=${currentVideoId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(currentSongTitle)}`;
  const musicUrl = currentVideoId ? `https://music.youtube.com/watch?v=${currentVideoId}` : `https://music.youtube.com/search?q=${encodeURIComponent(currentSongTitle)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`bg-stone-900 border border-stone-750 text-stone-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full rounded-none sm:rounded-xl'
            : 'w-full max-w-4xl h-[90vh] max-h-[820px]'
        }`}
      >
        {/* Browser Top Titlebar (Chrome / Safari style) */}
        <div className="px-3.5 py-2.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Window control dots */}
            <div className="flex items-center gap-1.5 mr-2">
              <button
                type="button"
                onClick={closeBrowser}
                className="w-3 h-3 rounded-full bg-rose-500 hover:bg-rose-600 transition-colors"
                title="বন্ধ করুন"
              />
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors"
                title={isFullscreen ? 'ছোট করুন' : 'বড় করুন'}
              />
              <button
                type="button"
                onClick={() => window.open(watchUrl, '_blank')}
                className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                title="ব্রাউজারে খুলুন"
              />
            </div>

            {/* Titlebar Tabs */}
            <div className="flex items-center gap-1 bg-stone-900/90 p-0.5 rounded-lg border border-stone-800 text-xs overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('search');
                  pushHistory({
                    tab: 'search',
                    urlOrQuery: inputUrlOrQuery || 'Google Search',
                    searchData,
                  });
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all shrink-0 cursor-pointer ${
                  activeTab === 'search'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-white" />
                <span>গুগল সার্চ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('web');
                  pushHistory({
                    tab: 'web',
                    urlOrQuery: activeUrl || 'https://www.google.com',
                  });
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all shrink-0 cursor-pointer ${
                  activeTab === 'web'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-white" />
                <span>লাইভ ওয়েব</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('resources');
                  pushHistory({
                    tab: 'resources',
                    urlOrQuery: 'গুগল রিসোর্স হাব',
                  });
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all shrink-0 cursor-pointer ${
                  activeTab === 'resources'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
                title="Google Drive, Docs, Sheets, Maps, Translate ও গুগল সার্ভিসেস"
              >
                <HardDrive className="w-3.5 h-3.5 text-white" />
                <span>গুগল রিসোর্স হাব</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('youtube');
                  pushHistory({
                    tab: 'youtube',
                    urlOrQuery: watchUrl,
                    videoId: currentVideoId,
                    videoTitle: currentSongTitle,
                  });
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all shrink-0 cursor-pointer ${
                  activeTab === 'youtube'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <Youtube className="w-3.5 h-3.5 text-white" />
                <span>ইউটিউব ও মিউজিক</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!lyricsData) {
                    handleFetchLyrics(currentSongTitle, undefined, currentVideoId, true);
                  } else {
                    setActiveTab('lyrics');
                    pushHistory({
                      tab: 'lyrics',
                      urlOrQuery: currentSongTitle,
                      videoId: currentVideoId,
                      videoTitle: currentSongTitle,
                      lyricsData,
                    });
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all shrink-0 cursor-pointer ${
                  activeTab === 'lyrics'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-white" />
                <span>লিরিক্স ও তথ্য</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={closeBrowser}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-750 text-stone-300 transition-colors"
              title={isFullscreen ? 'রিস্টোর করুন' : 'ফুলস্ক্রিন করুন'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={closeBrowser}
              className="p-1.5 rounded-lg bg-stone-800/80 hover:bg-rose-900/60 text-stone-300 hover:text-rose-200 transition-colors"
              title="বন্ধ করুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Omnibox / Browser Navigation Toolbar */}
        <div className="p-2.5 bg-stone-900 border-b border-stone-800 flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Navigation Controls Group: Back, Forward, Refresh, Home */}
          <div className="flex items-center gap-1 shrink-0 bg-stone-950/70 p-1 rounded-xl border border-stone-800">
            {/* 1. BACK BUTTON */}
            <button
              type="button"
              onClick={handleGoBack}
              disabled={!canGoBack}
              title="পেছনে যান (Back - Alt+Left)"
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* 2. FORWARD BUTTON */}
            <button
              type="button"
              onClick={handleGoForward}
              disabled={!canGoForward}
              title="সামনে যান (Forward - Alt+Right)"
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* 3. REFRESH / RELOAD BUTTON */}
            <button
              type="button"
              onClick={handleRefresh}
              title="রিফ্রেশ করুন (Refresh / Reload)"
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition-all cursor-pointer"
            >
              <RotateCw
                className={`w-3.5 h-3.5 ${
                  isLoading || isRefreshing || isLyricsLoading ? 'animate-spin text-blue-400' : ''
                }`}
              />
            </button>

            {/* 4. HOME BUTTON */}
            <button
              type="button"
              onClick={handleGoHome}
              title="গুগল হোম (Home)"
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-300 hover:text-white transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Omnibox / Search & Address Input */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex items-center relative min-w-0">
            <div className="absolute left-3 flex items-center gap-1.5 text-stone-400 pointer-events-none">
              <span className="font-bold text-blue-400 text-xs">G</span>
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={inputUrlOrQuery}
              onChange={(e) => setInputUrlOrQuery(e.target.value)}
              placeholder="গুগলে খুঁজুন বা ইউটিউব লিঙ্ক পেস্ট করুন (যেমন: https://youtu.be/...)"
              className="w-full pl-12 pr-28 py-2 rounded-xl bg-stone-950 border border-stone-750 focus:border-blue-500 focus:outline-hidden text-xs text-stone-100 placeholder-stone-500 transition-all font-sans"
            />

            {/* History Position Indicator & Submit Button */}
            <div className="absolute right-1.5 flex items-center gap-1">
              {history.length > 1 && (
                <span
                  className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-stone-800/80 text-[10px] text-stone-400 font-mono"
                  title={`হিস্টোরি অবস্থান: ${historyIndex + 1} / ${history.length}`}
                >
                  <History className="w-2.5 h-2.5 text-stone-500" />
                  <span>{historyIndex + 1}/{history.length}</span>
                </span>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                <span>খুঁজুন</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* External Browser Launcher */}
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="সরাসরি মূল ব্রাউজারে খুলুন"
            className="p-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white transition-colors shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 💬 CHAT CONTEXT RESEARCH BAR */}
        {currentChatResearch.hasContext && (
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-blue-950/40 via-stone-900 to-stone-950 border-b border-blue-900/40 shrink-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3 h-3" />
                </div>
                <span className="text-xs font-bold text-blue-300 shrink-0">
                  চ্যাট প্রসঙ্গ:
                </span>
                <span
                  className="text-xs font-medium text-stone-200 truncate max-w-[220px] sm:max-w-[360px]"
                  title={currentChatResearch.title || 'চলমান কথোপকথন'}
                >
                  {currentChatResearch.title || 'চলমান কথোপকথন'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {insertedFeedback && (
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800 animate-in fade-in">
                    {insertedFeedback}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsChatContextOpen(!isChatContextOpen)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isChatContextOpen ? 'সংক্ষিপ্ত করুন' : 'প্রদর্শন করুন'}</span>
                  {isChatContextOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {isChatContextOpen && (
              <div className="space-y-1.5 pt-0.5">
                {/* 1. Topics and Prompts from this chat */}
                {currentChatResearch.topics.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                    <span className="text-[10px] text-stone-400 uppercase font-bold shrink-0">
                      টপিক:
                    </span>
                    {currentChatResearch.topics.map((topic, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectChatTopic(topic)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs shrink-0 transition-all cursor-pointer font-sans shadow-2xs hover:scale-102"
                        title={`গুগলে '${topic}' সার্চ করুন`}
                      >
                        <Search className="w-2.5 h-2.5 text-blue-400" />
                        <span className="max-w-[180px] sm:max-w-[260px] truncate">{topic}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Detected Links and Sources from this chat */}
                {currentChatResearch.urls.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold shrink-0">
                      লিংক:
                    </span>
                    {currentChatResearch.urls.map((linkObj, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectChatUrl(linkObj.url)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] shrink-0 transition-all cursor-pointer font-sans hover:scale-102"
                        title={`${linkObj.url} ওপেন করুন`}
                      >
                        <Globe className="w-2.5 h-2.5 text-emerald-400" />
                        <span className="max-w-[170px] truncate">{linkObj.title || linkObj.url}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Suggestion Pills */}
        <div className="px-3 py-1.5 bg-stone-950/60 border-b border-stone-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 scrollbar-none">
          <span className="text-stone-500 text-[10px] uppercase font-semibold shrink-0">জনপ্রিয়:</span>
          {[
            { label: '🎵 Zack Knight - Dheere', query: 'https://youtu.be/Vny_75WmEH4?si=CnMSNOnq_rgEuf17' },
            { label: '🇧🇩 আমার সোনার বাংলা', query: 'আমার সোনার বাংলা গান' },
            { label: '🎧 ইউটিউব মিউজিক ট্রেন্ডিং', query: 'YouTube Music Top Songs' },
            { label: '📰 আজকের খবর', query: 'বাংলাদেশ আজকের খবর' },
          ].map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputUrlOrQuery(item.query);
                if (item.query.startsWith('http')) {
                  const ytMatch = item.query.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
                  if (ytMatch) {
                    const vid = ytMatch[1];
                    setNavVideoId(vid);
                    setNavVideoTitle(item.label);
                    setActiveTab('youtube');
                    pushHistory({
                      tab: 'youtube',
                      urlOrQuery: item.query,
                      videoId: vid,
                      videoTitle: item.label,
                    });
                  }
                } else {
                  handleSearch(item.query, true);
                }
              }}
              className="px-2 py-0.5 rounded-full bg-stone-800/70 hover:bg-stone-750 text-stone-300 hover:text-white transition-colors shrink-0 border border-stone-700/60 cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Browser Viewport Content Area */}
        <div ref={browserContentRef} className="flex-1 overflow-y-auto bg-stone-950 p-4 space-y-4">
          {/* TAB 1: YOUTUBE & MUSIC WEB PLAYER */}
          {activeTab === 'youtube' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Media Title & Author Banner */}
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 via-stone-900 to-stone-900 border border-red-500/20 shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-red-600/30">
                    <Music className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">
                      {currentSongTitle}
                    </h3>
                    <p className="text-xs text-stone-400 flex items-center gap-2 mt-0.5">
                      <span className="inline-flex items-center gap-1 text-red-400 font-medium">
                        <Youtube className="w-3 h-3" />
                        <span>ইউটিউব মিউজিক স্ট্রিম</span>
                      </span>
                      {currentVideoId && (
                        <span className="font-mono text-[10px] text-stone-500">ID: {currentVideoId}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(watchUrl)}
                    className="p-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white text-xs transition-colors"
                    title="লিংক কপি করুন"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all shadow-md shadow-red-600/20"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>ইউটিউব অ্যাপে খুলুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Embedded Player */}
              {currentVideoId ? (
                <div ref={ytPlayerBoxRef} className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-stone-800 shadow-2xl">
                  <iframe
                    key={`yt-${currentVideoId}-${refreshKey}`}
                    src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`}
                    title="YouTube Video Player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-stone-900 border border-stone-800 text-stone-400 space-y-2">
                  <Disc3 className="w-8 h-8 text-red-500 mx-auto animate-spin" />
                  <p className="text-sm">ইউটিউব ভিডিও বা গানের লিংক উপরে দিয়ে সার্চ করুন।</p>
                </div>
              )}

              {/* T-Series & Copyright Restricted Fallback Card */}
              <div className="p-4 rounded-2xl bg-stone-900/90 border border-amber-500/30 text-stone-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs sm:text-sm font-bold text-amber-300">
                      কপিরাইট সীমাবদ্ধতা ও নিরবচ্ছিন্ন শোনার নিশ্চয়তা:
                    </h4>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      অনেক অফিসিয়াল মিউজিক লেবেল (যেমন T-Series, Sony, VEVO) তাদের গানের ভিডিও অন্য ওয়েবসাইটে সরাসরি এম্বেড প্লেব্যাক বন্ধ রাখে। সেজন্য নিচের যে কোনো বিকল্প দিয়ে মুহূর্তে গানটি চালানো সম্ভব:
                    </p>
                  </div>
                </div>

                {/* Direct Action Launchers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <a
                    href={watchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs transition-all shadow-md shadow-red-600/25"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>ইউটিউব ও ভিডিও শুনুন</span>
                  </a>

                  <a
                    href={musicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-stone-800 to-stone-750 hover:bg-stone-700 text-stone-100 font-semibold text-xs border border-stone-700 transition-all shadow-md"
                  >
                    <Headphones className="w-4 h-4 text-rose-400" />
                    <span>YouTube Music (অডিও)</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      handleFetchLyrics(currentSongTitle, undefined, currentVideoId, true);
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:brightness-110 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>লিরিক্স ও গানটির অর্থ</span>
                  </button>
                </div>
              </div>

              {/* Verified YouTube Videos List inside App */}
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                      <Youtube className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        ইউটিউব থেকে আসল ও ভেরিফাইড ভিডিও/গান
                      </h4>
                      <p className="text-[11px] text-stone-400">
                        অ্যাপের ভেতরে সরাসরি চালাতে যেকোনো গানে ক্লিক করুন
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearchYouTube(ytSearchTerm || currentSongTitle);
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={ytSearchTerm}
                      onChange={(e) => setYtSearchTerm(e.target.value)}
                      placeholder="অন্য কোনো গান বা শিল্পী..."
                      className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-700 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-red-500 w-full sm:w-56"
                    />
                    <button
                      type="submit"
                      disabled={isYtSearching}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isYtSearching ? '...' : 'খুঁজুন'}</span>
                    </button>
                  </form>
                </div>

                {isYtSearching ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-stone-400">ইউটিউব থেকে আসল লিঙ্ক সংগ্রহ করা হচ্ছে...</p>
                  </div>
                ) : ytVideos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {ytVideos.map((video) => (
                      <div
                        key={video.videoId}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-950/80 hover:bg-stone-850 border border-stone-800 transition-all group"
                      >
                        <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-black shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.videoId}/0.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-5 h-5 text-white fill-current drop-shadow-md" />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <h5 className="text-xs font-semibold text-white truncate leading-tight" title={video.title}>
                            {video.title}
                          </h5>
                          <p className="text-[11px] text-stone-400 truncate">
                            {video.author}
                          </p>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setNavVideoId(video.videoId);
                                setNavVideoTitle(video.title);
                                pushHistory({
                                  tab: 'youtube',
                                  urlOrQuery: video.url,
                                  videoId: video.videoId,
                                  videoTitle: video.title,
                                });
                                browserContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                ytPlayerBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }}
                              className="px-2 py-0.5 rounded-md bg-red-600 hover:bg-red-500 text-white font-medium text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>এখানে চালান</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                musicPlayer.playVideoId(video.videoId, video.title, { autoPlay: true });
                              }}
                              className="px-2 py-0.5 rounded-md bg-stone-800 hover:bg-stone-750 text-stone-200 text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="ব্যাকগ্রাউন্ড প্লেয়ারে চালান"
                            >
                              <Music className="w-2.5 h-2.5 text-rose-400" />
                              <span>প্লেয়ারে</span>
                            </button>
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded-md bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-white text-[10px] transition-colors"
                              title="সরাসরি ইউটিউবে দেখুন"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-stone-400 space-y-2">
                    <Disc3 className="w-6 h-6 text-red-500/50 mx-auto" />
                    <p>অন্য কোনো গান খুঁজতে উপরের বক্সে গানের নাম লিখে "খুঁজুন" চাপুন।</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE SEARCH RESULTS WITH SEARCH FILTERS */}
          {activeTab === 'search' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* 🎯 SEARCH FILTERS SECTION */}
              <div className="p-3 sm:p-3.5 bg-stone-900/95 rounded-2xl border border-stone-800 shadow-md backdrop-blur-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Search Filters (সার্চ ফিল্টার)</span>
                        <span className="hidden sm:inline text-[10px] font-normal text-stone-400">
                          • টার্গেটেড রিসার্চ ও রেজাল্ট মোড
                        </span>
                      </h4>
                    </div>
                  </div>

                  {/* Filter Toggle Buttons Group */}
                  <div className="grid grid-cols-4 sm:flex items-center gap-1 p-1 bg-stone-950 rounded-xl border border-stone-800">
                    {/* 1. ALL */}
                    <button
                      type="button"
                      onClick={() => handleFilterChange('all')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        searchFilter === 'all'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                      }`}
                      title="সকল সামগ্রিক রেজাল্ট (ওয়েব, তথ্য ও মিডিয়া)"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>All</span>
                    </button>

                    {/* 2. IMAGES */}
                    <button
                      type="button"
                      onClick={() => handleFilterChange('images')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        searchFilter === 'images'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                      }`}
                      title="ছবি, ডায়াগ্রাম ও ভিজ্যুয়াল ফলাফল"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Images</span>
                      {searchData?.imageResults && searchData.imageResults.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          searchFilter === 'images' ? 'bg-white/25 text-white' : 'bg-stone-800 text-stone-400'
                        }`}>
                          {searchData.imageResults.length}
                        </span>
                      )}
                    </button>

                    {/* 3. NEWS */}
                    <button
                      type="button"
                      onClick={() => handleFilterChange('news')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        searchFilter === 'news'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                      }`}
                      title="তাজা সংবাদ, হেডলাইন ও প্রেস রিপোর্ট"
                    >
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>News</span>
                      {searchData?.newsResults && searchData.newsResults.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          searchFilter === 'news' ? 'bg-white/25 text-white' : 'bg-stone-800 text-stone-400'
                        }`}>
                          {searchData.newsResults.length}
                        </span>
                      )}
                    </button>

                    {/* 4. ACADEMIC */}
                    <button
                      type="button"
                      onClick={() => handleFilterChange('academic')}
                      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        searchFilter === 'academic'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                      }`}
                      title="গবেষণাপত্র, স্কলার জার্নাল ও সাইটেশন"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Academic</span>
                      {searchData?.academicResults && searchData.academicResults.length > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          searchFilter === 'academic' ? 'bg-white/25 text-white' : 'bg-stone-800 text-stone-400'
                        }`}>
                          {searchData.academicResults.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mx-auto ${
                    searchFilter === 'images' ? 'border-rose-500' :
                    searchFilter === 'news' ? 'border-emerald-500' :
                    searchFilter === 'academic' ? 'border-amber-500' : 'border-blue-500'
                  }`} />
                  <p className="text-sm text-stone-400">
                    {searchFilter === 'images' ? 'গুগল ইমেজ ও ভিজ্যুয়াল মিডিয়া সার্চ করা হচ্ছে...' :
                     searchFilter === 'news' ? 'সাম্প্রতিক সংবাদ ও ব্রেকিং হেডলাইন সংগ্রহ করা হচ্ছে...' :
                     searchFilter === 'academic' ? 'গবেষণাপত্র ও স্কলার ডেটাবেজ অনুসন্ধান করা হচ্ছে...' :
                     'গুগল থেকে রিয়েল-টাইম তথ্য এবং লিঙ্ক খোঁজা হচ্ছে...'}
                  </p>
                </div>
              ) : searchData ? (
                <>
                  {/* Instant Answer / AI Summary (Visible across all filter modes for quick context) */}
                  {searchData.instantAnswer && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-stone-900 to-stone-900 border border-blue-500/30 shadow-md space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {searchFilter === 'images' ? 'Visual Search Summary' :
                             searchFilter === 'news' ? 'Breaking News Overview' :
                             searchFilter === 'academic' ? 'Academic Research Overview' :
                             'Google Search Instant Overview'}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {searchFilter}
                        </span>
                      </div>
                      <p className="text-sm text-stone-200 leading-relaxed">
                        {searchData.instantAnswer}
                      </p>
                    </div>
                  )}

                  {/* 🖼️ FILTER VIEW: IMAGES */}
                  {searchFilter === 'images' && (
                    <div className="space-y-4 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" />
                          <span>ইমেজ ও ভিজ্যুয়াল রেজাল্ট ({(searchData.imageResults || []).length}):</span>
                        </h4>
                        <a
                          href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchData.query || inputUrlOrQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Google Images এ সম্পূর্ণ গ্যালারি</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {searchData.imageResults && searchData.imageResults.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {searchData.imageResults.map((img, i) => (
                            <div
                              key={i}
                              className="group rounded-xl bg-stone-900 border border-stone-800 hover:border-rose-500/50 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                            >
                              <div
                                onClick={() => setSelectedPreviewImage(img)}
                                className="relative aspect-video w-full bg-stone-950 overflow-hidden cursor-pointer"
                              >
                                <img
                                  src={img.imageUrl}
                                  alt={img.title}
                                  loading="lazy"
                                  onError={(e) => {
                                    // Fallback to placeholder if external image fails hotlinking
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=75';
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPreviewImage(img);
                                    }}
                                    className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs"
                                    title="বড় করে দেখুন"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleInsertReference(img.title, img.imageUrl, `ছবি: ${img.title} (${img.source})`);
                                    }}
                                    className="p-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs"
                                    title="চ্যাটে ছবি যোগ করুন"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="p-2.5 space-y-1">
                                <h5 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-rose-300 transition-colors" title={img.title}>
                                  {img.title}
                                </h5>
                                <div className="flex items-center justify-between text-[10px] text-stone-400">
                                  <span className="truncate max-w-[100px]">{img.source || img.domain}</span>
                                  <a
                                    href={img.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-rose-400 inline-flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
                          <ImageIcon className="w-8 h-8 text-stone-600 mx-auto" />
                          <p className="text-xs text-stone-400">
                            নির্দিষ্ট ছবি সরাসরি খুঁজতে Google Images ব্যবহার করুন।
                          </p>
                          <a
                            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchData.query || inputUrlOrQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                          >
                            <span>Google Images খুলুন</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 📰 FILTER VIEW: NEWS */}
                  {searchFilter === 'news' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                          <Newspaper className="w-4 h-4" />
                          <span>সাম্প্রতিক সংবাদ ও প্রেস রিপোর্ট ({(searchData.newsResults || []).length}):</span>
                        </h4>
                        <a
                          href={`https://news.google.com/search?q=${encodeURIComponent(searchData.query || inputUrlOrQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Google News পোর্টাল</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {searchData.newsResults && searchData.newsResults.length > 0 ? (
                        <div className="space-y-3">
                          {searchData.newsResults.map((news, i) => (
                            <div
                              key={i}
                              className="p-4 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/40 transition-all space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                    {news.source || news.domain}
                                  </span>
                                  {news.timeAgo && (
                                    <span className="text-[11px] text-stone-400 font-mono">
                                      {news.timeAgo}
                                    </span>
                                  )}
                                </div>
                                <a
                                  href={news.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-stone-400 hover:text-emerald-400 transition-colors"
                                  title="সংবাদপত্রের মূল ওয়েবসাইটে পড়ুন"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveUrl(news.url);
                                  setActiveTab('web');
                                  pushHistory({
                                    tab: 'web',
                                    urlOrQuery: news.url,
                                  });
                                }}
                                className="text-sm sm:text-base font-bold text-white hover:text-emerald-300 text-left block transition-colors cursor-pointer"
                              >
                                {news.title}
                              </button>

                              <p className="text-xs text-stone-300 leading-relaxed">
                                {news.snippet}
                              </p>

                              <div className="flex items-center gap-2 pt-2 border-t border-stone-800">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveUrl(news.url);
                                    setActiveTab('web');
                                    pushHistory({
                                      tab: 'web',
                                      urlOrQuery: news.url,
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 text-[11px] font-medium transition-colors cursor-pointer"
                                >
                                  <Globe className="w-3 h-3" />
                                  <span>এখানে পড়ুন</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInsertReference(news.title, news.url, news.snippet)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                                  title="চ্যাটে সংবাদ রেফারেন্স যোগ করুন"
                                >
                                  <Send className="w-3 h-3 text-emerald-400" />
                                  <span>চ্যাটে রেফারেন্স পাঠান</span>
                                </button>
                                <a
                                  href={news.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-200 text-[11px] transition-colors ml-auto"
                                >
                                  <span>মূল উৎস</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
                          <Newspaper className="w-8 h-8 text-stone-600 mx-auto" />
                          <p className="text-xs text-stone-400">এই বিষয়ের তাজা খবর সরাসরি গুগল নিউজে অনুসন্ধান করুন।</p>
                          <a
                            href={`https://news.google.com/search?q=${encodeURIComponent(searchData.query || inputUrlOrQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                          >
                            <span>Google News খুলুন</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🎓 FILTER VIEW: ACADEMIC */}
                  {searchFilter === 'academic' && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4" />
                          <span>গবেষণাপত্র, থিসিস ও একাডেমিক প্রকাশনা ({(searchData.academicResults || []).length}):</span>
                        </h4>
                        <a
                          href={`https://scholar.google.com/scholar?q=${encodeURIComponent(searchData.query || inputUrlOrQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Google Scholar এ আরও খুঁজুন</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {searchData.academicResults && searchData.academicResults.length > 0 ? (
                        <div className="space-y-3">
                          {searchData.academicResults.map((paper, i) => (
                            <div
                              key={i}
                              className="p-4 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/40 transition-all space-y-2.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {paper.journal && (
                                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                      {paper.journal}
                                    </span>
                                  )}
                                  {paper.year && (
                                    <span className="px-1.5 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[10px] font-mono">
                                      {paper.year}
                                    </span>
                                  )}
                                  {paper.citationsCount && (
                                    <span className="text-[10px] text-stone-400 font-mono">
                                      Citations: {paper.citationsCount}
                                    </span>
                                  )}
                                </div>
                                <a
                                  href={paper.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-stone-400 hover:text-amber-400 transition-colors"
                                  title="গবেষণাপত্র খুলুন"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>

                              <a
                                href={paper.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm sm:text-base font-bold text-blue-400 hover:text-blue-300 hover:underline text-left block transition-colors"
                              >
                                {paper.title}
                              </a>

                              {paper.authors && (
                                <p className="text-xs font-medium text-emerald-400">
                                  লেখকগণ: {paper.authors}
                                </p>
                              )}

                              <p className="text-xs text-stone-300 leading-relaxed font-sans">
                                {paper.snippet}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-800">
                                {paper.pdfUrl && (
                                  <a
                                    href={paper.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/35 text-amber-300 text-[11px] font-semibold transition-colors"
                                  >
                                    <FileText className="w-3 h-3 text-amber-400" />
                                    <span>PDF / পেপার পড়ুন</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const citation = `> 📄 **${paper.title}**\n> *Authors:* ${paper.authors || 'N/A'} | *Journal/Year:* ${paper.journal || ''} (${paper.year || ''})\n> [গবেষণাপত্র লিংক](${paper.url})\n> \n> **সারসংক্ষেপ:** ${paper.snippet}\n`;
                                    if (onInsertIntoChat) {
                                      onInsertIntoChat(citation);
                                      setInsertedFeedback('একাডেমিক সাইটেশন চ্যাটে যোগ হয়েছে!');
                                      setTimeout(() => setInsertedFeedback(null), 2500);
                                    } else {
                                      navigator.clipboard.writeText(citation);
                                      setInsertedFeedback('সাইটেশন কপি হয়েছে!');
                                      setTimeout(() => setInsertedFeedback(null), 2500);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                                  title="একাডেমিক সাইটেশন চ্যাটে পাঠান"
                                >
                                  <Send className="w-3 h-3 text-amber-400" />
                                  <span>সাইটেশন চ্যাটে পাঠান</span>
                                </button>
                                <a
                                  href={`https://scholar.google.com/scholar?q=${encodeURIComponent(paper.title)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-stone-400 hover:text-stone-200 text-[11px] transition-colors ml-auto"
                                >
                                  <span>Google Scholar</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
                          <GraduationCap className="w-8 h-8 text-stone-600 mx-auto" />
                          <p className="text-xs text-stone-400">Google Scholar এ পিয়ার-রিভিউড গবেষণাপত্র ও জার্নাল খুঁজুন।</p>
                          <a
                            href={`https://scholar.google.com/scholar?q=${encodeURIComponent(searchData.query || inputUrlOrQuery)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
                          >
                            <span>Google Scholar খুলুন</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 🌐 FILTER VIEW: ALL (Comprehensive Standard Mode) */}
                  {searchFilter === 'all' && (
                    <>
                      {/* Knowledge Card if available */}
                      {searchData.knowledgeCard && (
                        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-750 shadow-md space-y-3">
                          <div>
                            <h3 className="text-base font-bold text-white">
                              {searchData.knowledgeCard.title}
                            </h3>
                            {searchData.knowledgeCard.subtitle && (
                              <p className="text-xs text-blue-400 font-medium">
                                {searchData.knowledgeCard.subtitle}
                              </p>
                            )}
                          </div>
                          {searchData.knowledgeCard.description && (
                            <p className="text-xs text-stone-300 leading-relaxed">
                              {searchData.knowledgeCard.description}
                            </p>
                          )}
                          {searchData.knowledgeCard.fields && searchData.knowledgeCard.fields.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800 text-xs">
                              {searchData.knowledgeCard.fields.map((f, i) => (
                                <div key={i}>
                                  <span className="text-stone-400 font-medium">{f.label}: </span>
                                  <span className="text-stone-200 font-semibold">{f.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* YouTube Music Quick Launcher in Search */}
                      {searchData.youtubeMedia && searchData.youtubeMedia.videoId && (
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/40 to-stone-900 border border-red-500/30 flex items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0">
                              <Youtube className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                {searchData.youtubeMedia.title || currentSongTitle}
                              </h4>
                              <p className="text-[11px] text-stone-400 truncate">
                                {searchData.youtubeMedia.artist || 'অফিসিয়াল মিউজিক ভিডিও'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (searchData.youtubeMedia?.videoId) {
                                  setNavVideoId(searchData.youtubeMedia.videoId);
                                  setNavVideoTitle(searchData.youtubeMedia.title);
                                  setActiveTab('youtube');
                                  pushHistory({
                                    tab: 'youtube',
                                    urlOrQuery: `https://www.youtube.com/watch?v=${searchData.youtubeMedia.videoId}`,
                                    videoId: searchData.youtubeMedia.videoId,
                                    videoTitle: searchData.youtubeMedia.title,
                                  });
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>এখানে চালান</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Targeted Filter Preview Shortcuts Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleFilterChange('images')}
                          className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-850 border border-stone-800 hover:border-rose-500/40 text-left transition-all group flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white group-hover:text-rose-300">Images গ্যালারি</p>
                              <p className="text-[10px] text-stone-400">ছবি ও ফটো দেখুন</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-rose-400 transition-colors" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFilterChange('news')}
                          className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/40 text-left transition-all group flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                              <Newspaper className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white group-hover:text-emerald-300">News হেডলাইন</p>
                              <p className="text-[10px] text-stone-400">তাজা খবর ও রিপোর্ট</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-emerald-400 transition-colors" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFilterChange('academic')}
                          className="p-2.5 rounded-xl bg-stone-900/80 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white group-hover:text-amber-300">Academic পেপার</p>
                              <p className="text-[10px] text-stone-400">গবেষণাপত্র ও থিসিস</p>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-400 transition-colors" />
                        </button>
                      </div>

                      {/* Organic Search Results List */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-semibold uppercase text-stone-400 tracking-wider">
                          সার্চ রেজাল্ট ({searchData.results.length}):
                        </h4>
                        {searchData.results.map((res, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 transition-colors group space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-stone-400 font-mono truncate">
                                {res.domain || new URL(res.url).hostname}
                              </span>
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-stone-400 group-hover:text-blue-400 transition-colors shrink-0"
                                title="নতুন ট্যাবে খুলুন"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveUrl(res.url);
                                setActiveTab('web');
                                pushHistory({
                                  tab: 'web',
                                  urlOrQuery: res.url,
                                });
                              }}
                              className="text-sm font-semibold text-blue-400 hover:underline block text-left cursor-pointer"
                            >
                              {res.title}
                            </button>
                            <p className="text-xs text-stone-300 leading-relaxed">
                              {res.snippet}
                            </p>
                            <div className="flex items-center gap-2 pt-1 border-t border-stone-800/80">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveUrl(res.url);
                                  setActiveTab('web');
                                  pushHistory({
                                    tab: 'web',
                                    urlOrQuery: res.url,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                <Globe className="w-3 h-3" />
                                <span>এখানে পড়ুন</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertReference(res.title, res.url, res.snippet)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white border border-stone-700/80 text-[11px] font-medium transition-colors cursor-pointer"
                                title="চ্যাটে রেফারেন্স সাইটেশন যোগ করুন"
                              >
                                <Send className="w-3 h-3 text-blue-400" />
                                <span>চ্যাটে পাঠান</span>
                              </button>
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-stone-400 hover:text-stone-200 text-[11px] transition-colors ml-auto"
                              >
                                <span>নতুন ট্যাবে</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <Search className="w-10 h-10 text-stone-600 mx-auto" />
                  <p className="text-sm text-stone-400">উপরে আপনার কাঙ্ক্ষিত বিষয়, ছবি বা খবর লিখে সার্চ করুন।</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LYRICS & DETAILS */}
          {activeTab === 'lyrics' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {isLyricsLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-stone-400">গানের লিরিক্স এবং অর্থ সংগ্রহ করা হচ্ছে...</p>
                </div>
              ) : lyricsData ? (
                <div className="p-5 rounded-2xl bg-stone-900 border border-purple-500/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {lyricsData.title}
                      </h3>
                      {lyricsData.artist && (
                        <p className="text-xs text-purple-400 font-medium">{lyricsData.artist}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(lyricsData.lyricsText)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'কপি হয়েছে' : 'লিরিক্স কপি'}</span>
                    </button>
                  </div>
                  <div className="prose prose-invert prose-stone max-w-none text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                    <Markdown>{lyricsData.lyricsText}</Markdown>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <FileText className="w-10 h-10 text-stone-600 mx-auto" />
                  <p className="text-sm text-stone-400">গানের লিরিক্স দেখতে উপরে গানের নাম দিয়ে সার্চ করুন।</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: GOOGLE RESOURCES & WORKSPACE HUB */}
          {activeTab === 'resources' && (
            <div className="max-w-4xl mx-auto space-y-4 flex-1">
              {/* Resources Header Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/30 shadow-md space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                        <span>গুগল রিসোর্স হাব ও ওয়ার্কস্পেস</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          হোস্টিং সক্রিয় ও প্রস্তুত
                        </span>
                      </h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        লাইভ হোস্টিংয়ে গুগল ড্রাইভ, ডক্স, শিটস, ম্যাপস, ট্রান্সলেট ও সার্চ নির্বিঘ্নে ব্যবহারের অল-ইন-ওয়ান কেন্দ্র
                      </p>
                    </div>
                  </div>

                  {onOpenGoogleDrive && (
                    <button
                      type="button"
                      onClick={onOpenGoogleDrive}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>ইন-অ্যাপ ড্রাইভ খুলুন</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Search across Google Services */}
              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>গুগল রিসোর্সে তাৎক্ষণিক সার্চ করুন:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputUrlOrQuery}
                    onChange={(e) => setInputUrlOrQuery(e.target.value)}
                    placeholder="কী খুঁজতে চান? লিখুন (যেমন: বাংলাদেশ ইতিহাস, বাংলা লিরিক্স, গুগল শিট)..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(inputUrlOrQuery || 'Google Search', true);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:outline-hidden text-xs text-stone-100 placeholder-stone-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearch(inputUrlOrQuery || 'Google Search', true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    গুগলে খুঁজুন
                  </button>
                </div>
              </div>

              {/* Google Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {googleResourcesList.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 transition-all flex flex-col justify-between group space-y-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-xl ${res.bg} ${res.textColor} shrink-0`}>
                        <res.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                          {res.title}
                        </h4>
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5 leading-relaxed">
                          {res.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-stone-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          if (res.action === 'drive' && onOpenGoogleDrive) {
                            onOpenGoogleDrive();
                          } else if (res.action === 'youtube') {
                            setActiveTab('youtube');
                          } else {
                            setActiveUrl(res.url);
                            setActiveTab('web');
                            pushHistory({
                              tab: 'web',
                              urlOrQuery: res.url,
                            });
                          }
                        }}
                        className="flex-1 py-1 px-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 hover:text-white text-[11px] font-medium transition-colors text-center cursor-pointer"
                      >
                        {res.primaryActionLabel || 'ব্রাউজারে খুলুন'}
                      </button>

                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-stone-200 text-[11px] transition-colors"
                        title="নতুন ট্যাবে খুলুন"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleInsertReference(res.title, res.url, res.description)}
                        className="p-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-400 hover:text-blue-400 text-[11px] transition-colors cursor-pointer"
                        title="চ্যাটে লিঙ্ক পাঠান"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: WEB READER & PROXY BROWSER */}
          {activeTab === 'web' && (
            <div className="max-w-4xl mx-auto space-y-3 flex-1 flex flex-col min-h-0">
              {/* Web Header Toolbar */}
              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                    HTTPS
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-stone-200 truncate" title={activeUrl}>
                      {activeUrl}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {/* View Mode Switcher */}
                  <div className="flex items-center rounded-xl bg-stone-950 p-0.5 border border-stone-800">
                    <button
                      type="button"
                      onClick={() => setWebViewMode('proxy')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                        webViewMode === 'proxy'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>লাইভ ওয়েব</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWebViewMode('reader')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                        webViewMode === 'reader'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>রিডার ভিউ</span>
                    </button>
                  </div>

                  {/* Actions */}
                  <button
                    type="button"
                    onClick={() => {
                      setRefreshKey((k) => k + 1);
                      if (webViewMode === 'reader') loadReaderContent(activeUrl);
                    }}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white transition-colors cursor-pointer"
                    title="রিলোড / রিফ্রেশ"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeUrl)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white transition-colors cursor-pointer"
                    title="লিঙ্ক কপি করুন"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertReference(readerData?.title || activeUrl, activeUrl)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-blue-400 hover:text-blue-300 border border-stone-700 hover:border-blue-500/40 text-xs font-medium transition-colors cursor-pointer"
                    title="চলমান চ্যাটে এই লিঙ্ক ও রেফারেন্স যোগ করুন"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">চ্যাটে রেফারেন্স</span>
                  </button>
                  <a
                    href={activeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                    title="নতুন ট্যাবে খুলুন"
                  >
                    <span>নতুন ট্যাবে খুলুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Mode 1: Live Web View through Server Proxy (Bypasses X-Frame-Options) */}
              {webViewMode === 'proxy' && (
                <div className="space-y-2 flex-1 flex flex-col">
                  <div className="h-[460px] sm:h-[520px] w-full rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 relative shadow-inner">
                    <iframe
                      key={`web-proxy-${activeUrl}-${refreshKey}`}
                      src={`/api/proxy?url=${encodeURIComponent(activeUrl)}`}
                      title="Web Proxy Viewer"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      className="w-full h-full border-0 bg-white"
                    />
                  </div>

                  {/* Informational Proxy Notice */}
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-400">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>
                        ইন-অ্যাপ ক্লাউড প্রক্সি সক্রিয়: যেকোনো ওয়েবসাইটের X-Frame-Options ও ফ্রেম ব্লকিং দূর করে সরাসরি অ্যাপের ভেতরে রেন্ডার করা হচ্ছে।
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setWebViewMode('reader')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-[11px] border border-emerald-500/20 transition-colors cursor-pointer"
                      >
                        স্মার্ট রিডার ভিউ 📖
                      </button>
                      <a
                        href={activeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>সরাসরি সাইট</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode 2: Clean Reader View */}
              {webViewMode === 'reader' && (
                <div className="p-5 rounded-2xl bg-stone-900 border border-emerald-500/30 space-y-4 shadow-lg min-h-[420px]">
                  {isReaderLoading ? (
                    <div className="py-20 text-center space-y-3">
                      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs text-stone-400">ওয়েব পেজের টেক্সট বিশ্লেষণ ও এক্সট্র্যাক্ট করা হচ্ছে...</p>
                    </div>
                  ) : readerData ? (
                    <div className="space-y-4">
                      {/* Reader Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                            {readerData.title}
                          </h3>
                          <p className="text-xs text-emerald-400 font-mono mt-0.5">{readerData.domain}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={handleToggleSpeakReader}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                              isReaderSpeaking
                                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {isReaderSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            <span>{isReaderSpeaking ? 'থামান' : 'পড়ে শোনান'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(readerData.content)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs transition-colors cursor-pointer"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copied ? 'কপি হয়েছে' : 'টেক্সট কপি'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setWebViewMode('proxy')}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors cursor-pointer"
                          >
                            লাইভ ওয়েব দেখুন
                          </button>
                        </div>
                      </div>

                      {/* Clean Text Content */}
                      <div className="prose prose-invert prose-stone max-w-none text-xs sm:text-sm text-stone-200 leading-relaxed font-sans whitespace-pre-line space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {readerData.content}
                      </div>
                    </div>
                  ) : (
                    <div className="py-16 text-center space-y-3">
                      <BookOpen className="w-10 h-10 text-stone-600 mx-auto" />
                      <p className="text-sm text-stone-400">ওয়েব পেজের টেক্সট পাওয়া যায়নি।</p>
                      <button
                        type="button"
                        onClick={() => setWebViewMode('proxy')}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        লাইভ ব্রাউজারে দেখুন
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Browser Footer */}
        <div className="px-4 py-2 bg-stone-950 border-t border-stone-800 text-[11px] text-stone-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>ইন-অ্যাপ মিনি গুগল ওয়েব ব্রাউজার ও মিউজিক প্লেয়ার</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-stone-500 text-[10px]">
              শর্টকাট: Alt+← (Back) / Alt+→ (Forward) / F5 (Refresh)
            </span>
            <span className="font-mono text-[10px] text-stone-400">Google Grounded Live Web</span>
          </div>
        </div>
      </div>

      {/* 🖼️ High-Resolution Image Lightbox Preview Modal */}
      {selectedPreviewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            className="bg-stone-900 border border-stone-750 text-stone-100 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {selectedPreviewImage.title}
                </h4>
                <p className="text-xs text-stone-400 truncate">
                  উৎস: {selectedPreviewImage.source || selectedPreviewImage.domain}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewImage(null)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Preview Box */}
            <div className="p-2 sm:p-4 bg-black flex-1 flex items-center justify-center overflow-hidden min-h-[280px]">
              <img
                src={selectedPreviewImage.imageUrl}
                alt={selectedPreviewImage.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Action Toolbar */}
            <div className="p-3 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleInsertReference(
                      selectedPreviewImage.title,
                      selectedPreviewImage.imageUrl,
                      `ছবি রেফারেন্স: [${selectedPreviewImage.title}](${selectedPreviewImage.imageUrl})`
                    );
                    setSelectedPreviewImage(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>চ্যাটে ছবি পাঠান</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(selectedPreviewImage.imageUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white text-xs transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>ইমেজ লিঙ্ক কপি</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedPreviewImage.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-300 hover:text-white text-xs transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>মূল ছবি দেখুন</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={selectedPreviewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                >
                  <span>ওয়েব পেজ খুলুন</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
