import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Code2, 
  PenTool, 
  GraduationCap, 
  Search, 
  Compass, 
  Layers, 
  ArrowRight,
  Terminal,
  Cpu,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Download,
  Share2,
  Pin,
  PinOff,
  Globe,
  BarChart3,
  Mail,
  TrendingUp,
} from 'lucide-react';
import { TradingScreenBotModal } from './components/TradingScreenBotModal';
import { FloatingTradingHUD } from './components/FloatingTradingHUD';
import { TradingSignal, ExecutedTrade, TradingBotSettings } from './types/tradingBot';
import { ProjectMetricsModal } from './components/ProjectMetricsModal';
import { ChatMessage, ChatSession, AssistantMode } from './types';
import { QUICK_PROMPTS } from './data/prompts';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CodePreviewModal } from './components/CodePreviewModal';
import { ExportModal } from './components/ExportModal';
import { EmailComposerModal } from './components/EmailComposerModal';
import { ShareModal } from './components/ShareModal';
import { HostingDiagnosticModal } from './components/HostingDiagnosticModal';
import { CitizenServicesModal } from './components/CitizenServicesModal';
import { FreelanceAgentModal } from './components/FreelanceAgentModal';
import { LiveLocationModal } from './components/LiveLocationModal';
import { callDirectGeminiStream, generateDirectSessionTitle, isDirectGeminiAvailable } from './lib/directGemini';
import { useLiveLocation } from './hooks/useLiveLocation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppLogo } from './components/AppLogo';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import { MusicPlayerModal } from './components/MusicPlayerModal';
import { MiniBrowserProvider } from './context/MiniBrowserContext';
import { MiniGoogleBrowserModal } from './components/MiniGoogleBrowserModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { TTSSettingsModal } from './components/TTSSettingsModal';
import { FounderProfileModal } from './components/FounderProfileModal';
import { VisionStudioModal } from './components/VisionStudio/VisionStudioModal';
import { YouTubeModal } from './components/YouTubeModal';
import { LandingPageVideoShowcase } from './components/LandingPageVideoShowcase';
import { UniversalAppsConnectModal, UniversalTab } from './components/UniversalAppsConnectModal';
import { MobileProgramsHubModal } from './components/MobileProgramsHubModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { UniversalShareReceiverModal } from './components/UniversalShareReceiverModal';
import { RubelNetFirebaseManagerModal } from './components/RubelNetFirebaseManagerModal';
import { GeminiAuthModal } from './components/GeminiAuthModal';
import { AndroidApkReleaseModal } from './components/AndroidApkReleaseModal';
import { ScrollNavigationButtons } from './components/ScrollNavigationButtons';
import { GlobalDropZone } from './components/GlobalDropZone';
import { parseIncomingShareParams, InboundSharedContent } from './utils/shareUtils';
import { useAuth } from './context/AuthContext';
import { saveSessionToCloud, loadSessionsFromCloud, deleteSessionFromCloud } from './lib/firebase';
import workspaceHeroImg from './assets/images/ai_workspace_hero_1790066671032.jpg';
import apiArchitectureImg from './assets/images/api_architecture_graphic_1790066692425.jpg';

const STORAGE_KEY = 'ai_studio_chat_sessions_v1';
const THEME_KEY = 'ai_studio_theme_mode';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to html document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [darkMode]);

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved sessions', e);
    }
    const initialSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'নতুন কথোপকথন',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      mode: 'general',
      enableSearch: true,
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || 'session-1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [architectureModalOpen, setArchitectureModalOpen] = useState(false);
  const [hostingModalOpen, setHostingModalOpen] = useState(false);
  const [citizenModalOpen, setCitizenModalOpen] = useState(false);
  const [freelanceAgentModalOpen, setFreelanceAgentModalOpen] = useState(false);
  const [liveLocationModalOpen, setLiveLocationModalOpen] = useState(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [ttsSettingsModalOpen, setTtsSettingsModalOpen] = useState(false);
  const [founderProfileModalOpen, setFounderProfileModalOpen] = useState(false);
  const [geminiAuthModalOpen, setGeminiAuthModalOpen] = useState(false);
  const [visionStudioOpen, setVisionStudioOpen] = useState(false);
  const [youTubeModalOpen, setYouTubeModalOpen] = useState(false);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [mobileProgramsHubOpen, setMobileProgramsHubOpen] = useState(false);
  const [androidApkModalOpen, setAndroidApkModalOpen] = useState(false);
  const [isChatInputFocused, setIsChatInputFocused] = useState(false);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [emailComposerConfig, setEmailComposerConfig] = useState<{
    recipient?: string;
    subject?: string;
    body?: string;
    language?: 'bn' | 'en';
  }>({});

  // Inbound Web Share Target and External Content Ingest state
  const [shareReceiverOpen, setShareReceiverOpen] = useState(false);
  const [rubelNetManagerOpen, setRubelNetManagerOpen] = useState(false);
  const [incomingSharedItem, setIncomingSharedItem] = useState<InboundSharedContent | null>(null);
  const [sharedAlertToast, setSharedAlertToast] = useState<string | null>(null);

  // Real-Time Trading Screen Bot State (Quotex, Pocket Option, Binance AI Vision Bot)
  const [tradingBotModalOpen, setTradingBotModalOpen] = useState(false);
  const [floatingHUDOpen, setFloatingHUDOpen] = useState(false);
  const [tradingSignal, setTradingSignal] = useState<TradingSignal | null>(null);
  const [virtualBalance, setVirtualBalance] = useState<number>(() => {
    const saved = localStorage.getItem('trading_bot_balance_v1');
    return saved ? Number(saved) : 10000;
  });
  const [activeTrades, setActiveTrades] = useState<ExecutedTrade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<ExecutedTrade[]>(() => {
    try {
      const saved = localStorage.getItem('trading_bot_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [tradingBotSettings, setTradingBotSettings] = useState<TradingBotSettings>(() => {
    try {
      const saved = localStorage.getItem('trading_bot_settings_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      platform: 'Quotex',
      market: 'EUR/USD (OTC)',
      timeframe: '1m',
      strategy: 'Price Action & Candlestick Patterns',
      autoScanInterval: 10,
      autoTrade: false,
      minConfidenceThreshold: 80,
      tradeAmount: 25,
      voiceAlerts: true,
      webhookUrl: '',
      overlayOpacity: 0.92,
    };
  });
  const [isAnalyzingTrading, setIsAnalyzingTrading] = useState(false);

  useEffect(() => {
    localStorage.setItem('trading_bot_balance_v1', String(virtualBalance));
  }, [virtualBalance]);

  useEffect(() => {
    localStorage.setItem('trading_bot_history_v1', JSON.stringify(tradeHistory));
  }, [tradeHistory]);

  useEffect(() => {
    localStorage.setItem('trading_bot_settings_v1', JSON.stringify(tradingBotSettings));
  }, [tradingBotSettings]);

  const handleHUDTrade = (action: 'BUY' | 'SELL') => {
    const amount = tradingBotSettings.tradeAmount || 25;
    if (virtualBalance < amount) return;
    setVirtualBalance((prev) => prev - amount);
    const newTrade: ExecutedTrade = {
      id: 'trade-' + Date.now(),
      timestamp: Date.now(),
      action,
      platform: tradingBotSettings.platform,
      market: tradingBotSettings.market,
      amount,
      entryConfidence: tradingSignal?.confidence || 82,
      durationSeconds: 60,
      remainingSeconds: 60,
      status: 'OPEN',
      pnl: 0,
      pattern: tradingSignal?.pattern || 'HUD 1-Click Execution',
    };
    setActiveTrades((prev) => [...prev, newTrade]);
  };

  // Detect incoming share target parameters from URL (PWA Web Share Target)
  useEffect(() => {
    try {
      const search = window.location.search;
      if (!search) return;
      const params = new URLSearchParams(search);
      const parsed = parseIncomingShareParams(params);
      if (parsed) {
        setIncomingSharedItem(parsed);
        setShareReceiverOpen(true);
        setSharedAlertToast('বহিরাগত প্ল্যাটফর্ম থেকে তথ্য পাওয়া গেছে!');
        setTimeout(() => setSharedAlertToast(null), 5000);
        // Clean URL search parameters without reloading page
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {
      console.warn('Error reading incoming share parameters:', e);
    }
  }, []);

  // Global clipboard paste listener for external images and links
  useEffect(() => {
    const handleWindowPaste = (e: ClipboardEvent) => {
      // Check if image file was pasted
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          const sizeFormatted =
            file.size < 1024 * 1024
              ? `${(file.size / 1024).toFixed(1)} KB`
              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          const reader = new FileReader();
          reader.onload = (event) => {
            setIncomingSharedItem({
              type: 'photo',
              fileName: file.name || 'ক্লিপবোর্ড_ছবি.png',
              fileSize: sizeFormatted,
              mimeType: file.type,
              fileDataUrl: event.target?.result as string,
            });
            setShareReceiverOpen(true);
            setSharedAlertToast('ক্লিপবোর্ড থেকে ছবি শেয়ার হাবে যুক্ত হয়েছে');
            setTimeout(() => setSharedAlertToast(null), 4000);
          };
          reader.readAsDataURL(file);
          return;
        }
      }

      // If user isn't typing in an input and pasted an external URL
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable);
      if (!isInput && e.clipboardData) {
        const text = e.clipboardData.getData('text/plain');
        if (text && text.trim().length > 8) {
          const clean = text.trim();
          if (clean.startsWith('http://') || clean.startsWith('https://')) {
            setIncomingSharedItem({
              type: 'link',
              url: clean,
            });
            setShareReceiverOpen(true);
          }
        }
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, []);

  const handleOpenEmailComposer = (config?: {
    recipient?: string;
    subject?: string;
    body?: string;
    language?: 'bn' | 'en';
  }) => {
    if (config) {
      setEmailComposerConfig(config);
    }
    setEmailComposerOpen(true);
  };

  const [universalAppsModalConfig, setUniversalAppsModalConfig] = useState<{
    isOpen: boolean;
    tab: UniversalTab;
  }>({
    isOpen: false,
    tab: 'apps',
  });

  const handleOpenUniversalApps = (tab: UniversalTab = 'apps') => {
    setUniversalAppsModalConfig({
      isOpen: true,
      tab,
    });
  };

  const locationState = useLiveLocation();
  const [sessionToExport, setSessionToExport] = useState<ChatSession | null>(null);

  const handleImportDriveFile = (content: string, fileName: string) => {
    setInput((prev) => {
      const header = `[Google Drive File: ${fileName}]\n`;
      return prev ? `${prev}\n\n${header}${content}` : `${header}${content}`;
    });
  };
  const [shareModalConfig, setShareModalConfig] = useState<{
    isOpen: boolean;
    title?: string;
    text?: string;
    url?: string;
    sessionId?: string;
    shareType?: 'session' | 'app' | 'message';
  }>({
    isOpen: false,
  });

  const handleOpenShareModal = (config?: {
    title?: string;
    text?: string;
    url?: string;
    sessionId?: string;
    shareType?: 'session' | 'app' | 'message';
  }) => {
    setShareModalConfig({
      isOpen: true,
      title: config?.title || activeSession?.title || 'AI Assistant & Coding Studio',
      text: config?.text,
      url: config?.url,
      sessionId: config?.sessionId || activeSession?.id,
      shareType: config?.shareType || 'session',
    });
  };

  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; code: string; language: string }>({
    isOpen: false,
    code: '',
    language: 'html',
  });

  const { user, setIsSyncing } = useAuth();

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Chat scroll position state for top/bottom navigation buttons
  const [chatScrollState, setChatScrollState] = useState({
    canScroll: false,
    isNearTop: true,
    isNearBottom: true,
    scrollPercentage: 0,
  });

  // Active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const mode = activeSession?.mode || 'general';
  const enableSearch = activeSession?.enableSearch ?? false;

  // Persist sessions locally
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Sync with Firestore when user logs in
  useEffect(() => {
    if (!user) return;
    let isCancelled = false;

    const syncFromFirestore = async () => {
      try {
        setIsSyncing(true);
        const cloudSessions = await loadSessionsFromCloud(user.uid);
        if (isCancelled) return;

        if (cloudSessions && cloudSessions.length > 0) {
          // Merge cloud sessions with local sessions by ID, keeping newest
          setSessions((prevLocal) => {
            const map = new Map<string, ChatSession>();
            prevLocal.forEach((s) => map.set(s.id, s));
            cloudSessions.forEach((cs) => {
              const existing = map.get(cs.id);
              if (!existing || cs.updatedAt >= existing.updatedAt) {
                map.set(cs.id, cs);
              }
            });
            return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
          });
        } else {
          // If cloud has no sessions, upload current local non-empty sessions
          for (const s of sessions) {
            if (s.messages.length > 0) {
              await saveSessionToCloud(user.uid, s);
            }
          }
        }
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes('offline') || msg.includes('Could not reach') || msg.includes('unavailable')) {
          console.info('Initial cloud sync deferred: Firestore operating in offline cache mode.');
        } else {
          console.error('Failed to sync sessions with Firestore:', err);
        }
      } finally {
        if (!isCancelled) setIsSyncing(false);
      }
    };

    syncFromFirestore();

    return () => {
      isCancelled = true;
    };
  }, [user?.uid]);

  // Auto-sync active session to Firestore when it changes (debounced)
  useEffect(() => {
    if (!user || !activeSession || activeSession.messages.length === 0) return;

    const timer = setTimeout(() => {
      saveSessionToCloud(user.uid, activeSession).catch((err: any) => {
        const msg = err?.message || String(err);
        if (msg.includes('offline') || msg.includes('Could not reach') || msg.includes('unavailable')) {
          console.info('Auto-sync deferred: Firestore is operating in offline mode.');
        } else {
          console.error('Auto-sync to Firestore failed:', err);
        }
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, activeSession?.updatedAt, activeSession?.messages.length]);

  const handleSyncAll = async () => {
    if (!user) return;
    try {
      setIsSyncing(true);
      for (const s of sessions) {
        if (s.messages.length > 0) {
          await saveSessionToCloud(user.uid, s);
        }
      }
      const cloudSessions = await loadSessionsFromCloud(user.uid);
      if (cloudSessions && cloudSessions.length > 0) {
        setSessions(cloudSessions);
      }
    } catch (e) {
      console.error('Manual sync error', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Scroll calculation and navigation handlers for top and bottom navigation buttons
  const handleChatScroll = () => {
    const container = chatScrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const maxScroll = scrollHeight - clientHeight;
    const canScroll = maxScroll > 40;
    const isNearTop = scrollTop <= 35;
    const isNearBottom = maxScroll - scrollTop <= 45;
    const scrollPercentage =
      maxScroll > 0
        ? Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)))
        : 0;

    setChatScrollState({
      canScroll,
      isNearTop,
      isNearBottom,
      scrollPercentage,
    });
  };

  const handleScrollToTop = () => {
    chatScrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToBottom = () => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom on message update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    const timer = setTimeout(() => {
      handleChatScroll();
    }, 150);
    return () => clearTimeout(timer);
  }, [activeSession?.messages]);

  // Update scroll state when active session changes or window resizes
  useEffect(() => {
    const handleResize = () => handleChatScroll();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => handleChatScroll(), 150);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [activeSessionId]);

  // Update active session property helper
  const updateActiveSession = (updater: (s: ChatSession) => ChatSession) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          return updater({ ...s, updatedAt: Date.now() });
        }
        return s;
      })
    );
  };

  const setMode = (newMode: AssistantMode) => {
    updateActiveSession((s) => ({ ...s, mode: newMode }));
  };

  const setEnableSearch = (valOrFn: boolean | ((prev: boolean) => boolean)) => {
    updateActiveSession((s) => {
      const nextVal = typeof valOrFn === 'function' ? valOrFn(s.enableSearch) : valOrFn;
      return { ...s, enableSearch: nextVal };
    });
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: 'session-' + Date.now(),
      title: 'নতুন কথোপকথন',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      mode: 'general',
      enableSearch: true,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleClearChat();
      return;
    }
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
    if (user) {
      deleteSessionFromCloud(user.uid, id).catch((err) => console.error('Cloud delete error:', err));
    }
  };

  const handleTogglePinSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const isNowPinned = !s.isPinned;
          const updatedSession: ChatSession = {
            ...s,
            isPinned: isNowPinned,
            pinnedAt: isNowPinned ? Date.now() : undefined,
            updatedAt: Date.now(),
          };
          if (user) {
            saveSessionToCloud(user.uid, updatedSession).catch((err) =>
              console.error('Cloud pin update error:', err)
            );
          }
          return updatedSession;
        }
        return s;
      })
    );
  };

  const handleClearChat = () => {
    if (window.confirm('আপনি কি এই চ্যাটের সব মেসেজ মুছে ফেলতে চান?')) {
      updateActiveSession((s) => ({
        ...s,
        messages: [],
        title: 'নতুন কথোপকথন',
      }));
    }
  };

  const handleExportChat = (targetSession?: ChatSession) => {
    const session = targetSession || activeSession;
    if (!session || session.messages.length === 0) return;
    setSessionToExport(session);
    setExportModalOpen(true);
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);

    // mark streaming message as stopped
    updateActiveSession((s) => ({
      ...s,
      messages: s.messages.map((m) => (m.isStreaming ? { ...m, isStreaming: false } : m)),
    }));
  };

  /**
   * Helper function that triggers after the first user-assistant turn
   * to automatically generate a descriptive, concise title for the session
   * based on the conversation context using the AI.
   */
  const generateSessionTitle = async (
    targetSessionId: string,
    userText: string,
    assistantText: string,
    sessionMode: AssistantMode
  ) => {
    if (!userText || !assistantText || !targetSessionId) return;

    // Indicate that the title is being generated by AI
    setSessions((prev) =>
      prev.map((s) => (s.id === targetSessionId ? { ...s, isGeneratingTitle: true } : s))
    );

    try {
      let conciseTitle = '';
      try {
        const response = await fetch('/api/session/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: userText,
            assistantMessage: assistantText.slice(0, 1000),
            mode: sessionMode,
          }),
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            const data = await response.json();
            if (data?.title && typeof data.title === 'string' && data.title.trim()) {
              conciseTitle = data.title.trim();
            }
          }
        }
      } catch {
        // server request failed, will use direct fallback
      }

      if (!conciseTitle) {
        conciseTitle = await generateDirectSessionTitle(userText);
      }

      if (conciseTitle) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id === targetSessionId) {
              return {
                ...s,
                title: conciseTitle,
                isGeneratingTitle: false,
                updatedAt: Date.now(),
              };
            }
            return s;
          })
        );
        return;
      }
    } catch (err) {
      console.warn('Auto-title generation failed, keeping fallback title:', err);
    } finally {
      setSessions((prev) =>
        prev.map((s) => (s.id === targetSessionId ? { ...s, isGeneratingTitle: false } : s))
      );
    }
  };

  const executeChatStream = async (
    updatedMessages: ChatMessage[],
    promptText: string,
    assistantMsgId: string,
    isFirstTurn = false,
    targetSessionId?: string
  ) => {
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let useDirectFallback = false;
      let response: Response | null = null;

      // When hosted, containers may cold-start or proxy may briefly pause.
      // We perform an automatic fast-retry on transient 5xx errors before failing.
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
              prompt: promptText,
              enableSearch,
              mode,
            }),
            signal: controller.signal,
          });

          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html') || response.status === 404) {
            if (isDirectGeminiAvailable()) {
              useDirectFallback = true;
            }
            break;
          }

          if (response.status >= 500 && response.status <= 504) {
            if (attempt === 1) {
              await new Promise((r) => setTimeout(r, 1200));
              continue;
            }
            if (isDirectGeminiAvailable()) {
              useDirectFallback = true;
              break;
            }
          }
          break;
        } catch (networkErr: any) {
          if (controller.signal.aborted) throw networkErr;
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          if (isDirectGeminiAvailable()) {
            useDirectFallback = true;
            break;
          }
          throw networkErr;
        }
      }

      // If server is not responding (static deployment without Node backend), run direct Gemini client
      if (useDirectFallback) {
        let accumulatedText = '';
        let accumulatedGrounding: any[] = [];
        let searchQueries: string[] = [];

        await callDirectGeminiStream({
          messages: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
          prompt: promptText,
          enableSearch,
          mode,
          signal: controller.signal,
          onChunk: (textChunk) => {
            accumulatedText += textChunk;
            updateActiveSession((s) => ({
              ...s,
              messages: s.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, text: accumulatedText, error: undefined, isStreaming: true } : m
              ),
            }));
          },
          onGrounding: (grounding) => {
            if (grounding?.groundingChunks) {
              accumulatedGrounding = grounding.groundingChunks;
            } else if (Array.isArray(grounding)) {
              accumulatedGrounding = grounding;
            }
          },
          onSearchQueries: (queries) => {
            searchQueries = queries;
          },
        });

        const finalAssistantText = accumulatedText || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি। পুনরায় চেষ্টা করুন।';
        updateActiveSession((s) => ({
          ...s,
          updatedAt: Date.now(),
          messages: s.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  text: finalAssistantText,
                  isStreaming: false,
                  groundingChunks: accumulatedGrounding.length > 0 ? accumulatedGrounding : undefined,
                  searchQueries: searchQueries.length > 0 ? searchQueries : undefined,
                }
              : m
          ),
        }));

        if (isFirstTurn && accumulatedText.trim() && (targetSessionId || activeSessionId)) {
          generateSessionTitle(targetSessionId || activeSessionId, promptText, finalAssistantText, mode);
        }
        return;
      }

      if (!response) {
        throw new Error('সার্ভার থেকে কোনো রেসপন্স পাওয়া যায়নি।');
      }

      if (!response.ok) {
        let errorMsg = `HTTP ত্রুটি ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMsg = errorData.error;
          }
        } catch {
          if (response.status === 404) {
            errorMsg = 'সার্ভার অ্যান্ডপয়েন্ট পাওয়া যায়নি (HTTP 404)। আপনি কি স্ট্যাটিক হোস্টিংয়ে আছেন? হোস্টিং গাইড চেক করুন।';
          } else if (response.status === 500) {
            errorMsg = 'ক্লাউড সার্ভার বা প্রক্সি সংযোগ সাময়িকভাবে ব্যাহত হয়েছে (HTTP 500)। কন্টেইনার প্রস্তুত হলে আবার স্বাভাবিক হয়ে যাবে। নিচের "পুনরায় চেষ্টা করুন" বাটনে ক্লিক করুন।';
          } else if (response.status === 502 || response.status === 503 || response.status === 504) {
            errorMsg = 'হোস্টিং সার্ভার সাময়িকভাবে রেসপন্স করছে না (HTTP ' + response.status + ')। কন্টেইনার স্টার্ট হতে কয়েক সেকেন্ড সময় নিতে পারে।';
          } else if (response.status === 429) {
            errorMsg = 'এআই কোটা সীমা (Rate Limit 429) সাময়িকভাবে শেষ হয়েছে। অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করে পুনরায় চেষ্টা করুন।';
          }
        }
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let accumulatedGrounding: any[] = [];
      let searchQueries: string[] = [];

      let hasReceivedError = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            let data: any;
            try {
              data = JSON.parse(dataStr);
            } catch {
              continue;
            }

            if (data.error) {
              hasReceivedError = true;
              updateActiveSession((s) => ({
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        isStreaming: false,
                        error: data.error,
                      }
                    : m
                ),
              }));
              return;
            }

            if (data.text) {
              accumulatedText += data.text;
              updateActiveSession((s) => ({
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, text: accumulatedText, error: undefined } : m
                ),
              }));
            }
            if (data.groundingChunks) {
              accumulatedGrounding = data.groundingChunks;
            }
            if (data.searchQueries) {
              searchQueries = data.searchQueries;
            }
          }
        }
      }

      if (!hasReceivedError) {
        const finalAssistantText = accumulatedText || 'দুঃখিত, কোনো উত্তর পাওয়া যায়নি। পুনরায় চেষ্টা করুন।';
        // Finish streaming
        updateActiveSession((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  text: finalAssistantText,
                  isStreaming: false,
                  groundingChunks: accumulatedGrounding,
                  searchQueries,
                }
              : m
          ),
        }));

        // Trigger helper function after first user-assistant turn to automatically generate a descriptive AI title
        if (isFirstTurn && accumulatedText.trim() && targetSessionId) {
          generateSessionTitle(targetSessionId, promptText, finalAssistantText, mode);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Error in chat stream:', err);
        updateActiveSession((s) => ({
          ...s,
          messages: s.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  error: err.message || 'একটি ত্রুটি ঘটেছে। দয়া করে সেটিংস থেকে GEMINI_API_KEY চেক করুন।',
                }
              : m
          ),
        }));
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = (textOverride || input).trim();
    if (!textToSend || isGenerating) return;

    setInput('');

    const userMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now(),
      mode,
    };

    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      mode,
    };

    // Check if this will be the first user-assistant turn
    const isFirstTurn = activeSession.messages.length === 0;
    const currentSessionId = activeSession.id;

    // Temporary title while streaming the first message
    const newTitle = isFirstTurn
      ? textToSend.length > 28
        ? textToSend.slice(0, 28) + '...'
        : textToSend
      : activeSession.title;

    // Append user & assistant messages
    const updatedMessages = [...activeSession.messages, userMessage];
    updateActiveSession((s) => ({
      ...s,
      title: newTitle,
      messages: [...updatedMessages, initialAssistantMessage],
    }));

    await executeChatStream(updatedMessages, textToSend, assistantMsgId, isFirstTurn, currentSessionId);
  };

  const handleEditAndResend = async (messageId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;

    // If currently generating, abort the ongoing stream first
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const msgIndex = activeSession.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const originalMsg = activeSession.messages[msgIndex];
    const editedUserMessage: ChatMessage = {
      ...originalMsg,
      text: trimmed,
      timestamp: Date.now(),
    };

    // Truncate conversation history up to before this message, then add edited message
    const priorHistory = activeSession.messages.slice(0, msgIndex);
    const updatedMessages = [...priorHistory, editedUserMessage];

    const assistantMsgId = 'msg-' + (Date.now() + 1);
    const initialAssistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      text: '',
      timestamp: Date.now(),
      isStreaming: true,
      mode,
    };

    const isFirstTurn = msgIndex === 0;
    const currentSessionId = activeSession.id;

    // Update title if it was the first message
    const newTitle = isFirstTurn
      ? trimmed.length > 28
        ? trimmed.slice(0, 28) + '...'
        : trimmed
      : activeSession.title;

    updateActiveSession((s) => ({
      ...s,
      title: newTitle,
      messages: [...updatedMessages, initialAssistantMessage],
    }));

    await executeChatStream(updatedMessages, trimmed, assistantMsgId, isFirstTurn, currentSessionId);
  };

  const handleRetryLastMessage = () => {
    // Find the last user message
    const lastUserMsg = [...activeSession.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg && lastUserMsg.text) {
      handleSendMessage(lastUserMsg.text);
    }
  };

  return (
    <MusicPlayerProvider>
      <MiniBrowserProvider>
        <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased">
        {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onExportSession={(s) => handleExportChat(s)}
        onTogglePinSession={handleTogglePinSession}
        onOpenArchitecture={() => setArchitectureModalOpen(true)}
        onOpenHostingDiagnostic={() => setHostingModalOpen(true)}
        onOpenCitizenServices={() => setCitizenModalOpen(true)}
        onOpenFreelanceAgent={() => setFreelanceAgentModalOpen(true)}
        onOpenUniversalApps={handleOpenUniversalApps}
        onOpenMetrics={() => setMetricsModalOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onOpenTTSSettings={() => setTtsSettingsModalOpen(true)}
        onOpenFounderProfile={() => setFounderProfileModalOpen(true)}
        onOpenGeminiAuth={() => setGeminiAuthModalOpen(true)}
        onOpenVisionStudio={() => setVisionStudioOpen(true)}
        onOpenYouTube={() => setYouTubeModalOpen(true)}
        onOpenEmailComposer={() => handleOpenEmailComposer()}
        onOpenShare={handleOpenShareModal}
        onOpenShareReceiver={() => setShareReceiverOpen(true)}
        onOpenRubelNetManager={() => setRubelNetManagerOpen(true)}
        onOpenTradingBot={() => setTradingBotModalOpen(true)}
        onOpenAndroidApk={() => setAndroidApkModalOpen(true)}
        onSelectMode={setMode}
        currentMode={mode}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        <Header
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          onOpenArchitecture={() => setArchitectureModalOpen(true)}
          onOpenHostingDiagnostic={() => setHostingModalOpen(true)}
          onOpenCitizenServices={() => setCitizenModalOpen(true)}
          onOpenFreelanceAgent={() => setFreelanceAgentModalOpen(true)}
          onOpenUniversalApps={handleOpenUniversalApps}
          onOpenMetrics={() => setMetricsModalOpen(true)}
          onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
          onOpenTTSSettings={() => setTtsSettingsModalOpen(true)}
          onOpenFounderProfile={() => setFounderProfileModalOpen(true)}
          onOpenGeminiAuth={() => setGeminiAuthModalOpen(true)}
          onOpenVisionStudio={() => setVisionStudioOpen(true)}
          onOpenYouTube={() => setYouTubeModalOpen(true)}
          onOpenEmailComposer={() => handleOpenEmailComposer()}
          onOpenMobilePrograms={() => setMobileProgramsHubOpen(true)}
          onOpenShareReceiver={() => setShareReceiverOpen(true)}
          onOpenRubelNetManager={() => setRubelNetManagerOpen(true)}
          onOpenTradingBot={() => setTradingBotModalOpen(true)}
          onOpenAndroidApk={() => setAndroidApkModalOpen(true)}
          onNewChat={handleNewChat}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
          onOpenShareModal={handleOpenShareModal}
          onSyncAll={handleSyncAll}
          mode={mode}
          enableSearch={enableSearch}
          hasMessages={activeSession?.messages.length > 0}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          activeSessionTitle={activeSession?.title}
          isGeneratingTitle={activeSession?.isGeneratingTitle}
          activeSessionId={activeSession?.id}
          isPinned={Boolean(activeSession?.isPinned)}
          onTogglePin={() => handleTogglePinSession(activeSession.id)}
        />

        {/* Scrollable messages container */}
        <div 
          ref={chatScrollContainerRef}
          onScroll={handleChatScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
        >
          {activeSession.messages.length === 0 ? (
            <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
              {/* Hero Banner */}
              <div className="text-center space-y-4">
                <div className="flex justify-center pb-1">
                  <AppLogo size={76} withGlow={true} />
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Claude ও Gemini-সক্ষম বাংলা ও ইংরেজি স্মার্ট অ্যাসিস্ট্যান্ট</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
                  কীভাবে সাহায্য করতে পারি?
                </h2>
                <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed">
                  কোডিং ও সফটওয়্যার ডেভেলপমেন্ট, লেখালেখি, মাইক্রোফোনে বাংলা/ইংরেজি ভয়েস কমান্ড এবং Google Search গ্রাউন্ডিং সহ রিয়েল-টাইম গবেষণা—যেকোনো প্রশ্ন লিখুন বা মুখে বলুন।
                </p>

                {/* Google Gemini Authentication Status Banner */}
                {user ? (
                  <div 
                    onClick={() => setGeminiAuthModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                    title="Google Gemini অ্যাকাউন্ট ড্যাশবোর্ড খুলুন"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Gemini সংযুক্ত: {user.displayName || user.email}</span>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                ) : (
                  <div className="max-w-xl mx-auto p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/90 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-200/80 dark:border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5 text-left min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          Google Gemini লগইন
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-extrabold">
                            ক্লাউড সিঙ্ক
                          </span>
                        </h4>
                        <p className="text-[11px] text-stone-600 dark:text-stone-400 truncate">
                          গুগল দিয়ে সাইন ইন করে সব ডিভাইসে চ্যাট ও কোড নিরাপদে ব্যাকআপ রাখুন
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="hero-google-signin-btn"
                      onClick={() => setGeminiAuthModalOpen(true)}
                      className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 font-bold text-xs shadow-xs hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>গুগল দিয়ে লগইন</span>
                    </button>
                  </div>
                )}

                {/* Hero Quick Share & Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    id="hero-trading-bot-btn"
                    onClick={() => setTradingBotModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:brightness-110 active:scale-98 text-white font-black text-xs shadow-md transition-all cursor-pointer group"
                    title="রিয়েল-টাইম স্ক্রিন এনালাইসিস ট্রেডিং এআই বট (Quotex, Pocket Option, Binance Buy/Sell Signals)"
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                    <span>ট্রেডিং এআই বট (Screen Bot) 📊</span>
                  </button>

                  <button
                    id="hero-universal-apps-btn"
                    onClick={() => handleOpenUniversalApps('apps')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:brightness-110 active:scale-98 text-white font-semibold text-xs shadow-md transition-all cursor-pointer group"
                    title="সকল অ্যাপস ওপেন, জিমেইল, মেসেজিং ও GitHub কানেক্টর হাব"
                  >
                    <Globe className="w-4 h-4 text-blue-200 group-hover:scale-110 transition-transform" />
                    <span>সকল অ্যাপস, জিমেইল ও কানেক্ট হাব</span>
                  </button>

                  <button
                    id="hero-metrics-btn"
                    onClick={() => setMetricsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 active:scale-98 text-white font-semibold text-xs shadow-md transition-all cursor-pointer group"
                    title="Recharts চালিত চ্যাট ও প্রজেক্ট মেট্রিক্স অ্যানালিটিক্স ড্যাশবোর্ড"
                  >
                    <BarChart3 className="w-4 h-4 text-purple-200 group-hover:scale-110 transition-transform" />
                    <span>মেট্রিক্স ও অ্যানালিটিক্স (Charts)</span>
                  </button>

                  <button
                    id="hero-freelance-agent-btn"
                    onClick={() => setFreelanceAgentModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-98 text-white font-semibold text-xs shadow-md transition-all cursor-pointer group"
                    title="২৪ ঘণ্টা স্বয়ংক্রিয় রিমোট জব ও ফ্রিল্যান্স এআই এজেন্ট স্টুডিও"
                  >
                    <Bot className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                    <span>২৪/৭ রিমোট জব এআই এজেন্ট</span>
                  </button>

                  <button
                    id="hero-citizen-hub-btn"
                    onClick={() => setCitizenModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-semibold text-xs shadow-md transition-all cursor-pointer group"
                    title="মোবাইল নম্বর ডিরেক্টরি, ঠিকানা ও এ টু জেড জনসেবা নির্দেশিকা"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-200 group-hover:scale-110 transition-transform" />
                    <span>A-Z জনসেবা ও তথ্য নির্দেশিকা</span>
                  </button>

                  <button
                    id="hero-email-composer-btn"
                    onClick={() => handleOpenEmailComposer()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:brightness-110 active:scale-98 text-white font-semibold text-xs shadow-md transition-all cursor-pointer group"
                    title="প্রফেশনাল ইমেইল কম্পোজার (বাংলা ও ইংরেজি ইমেইল ড্রাফট, এডিট, এক্সপোর্ট ও কপি)"
                  >
                    <Mail className="w-4 h-4 text-teal-200 group-hover:scale-110 transition-transform" />
                    <span>ইমেইল ড্রাফটার (Email Composer)</span>
                  </button>

                  <button
                    id="hero-share-app-btn"
                    onClick={() =>
                      handleOpenShareModal({
                        title: 'AI Assistant & Coding Studio',
                        text: 'বাংলা ও ইংরেজি ভাষার স্মার্ট এআই কোডিং ও চ্যাট সহকারী — কোডিং, লেখালেখি, ক্লাউড স্টোরেজ ও সার্চ সুবিধা। এখনই পরখ করুন!',
                        shareType: 'app',
                      })
                    }
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs shadow-md transition-all cursor-pointer group"
                    title="বিভিন্ন মিডিয়া প্ল্যাটফর্মে অ্যাপটি শেয়ার করুন"
                  >
                    <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>অ্যাপটি সোশ্যাল মিডিয়ায় শেয়ার করুন</span>
                  </button>

                  <button
                    id="hero-architecture-btn"
                    onClick={() => setArchitectureModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs border border-stone-200 dark:border-stone-750 transition-colors"
                  >
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>AI আর্কিটেকচার গাইড</span>
                  </button>
                </div>
              </div>

              {/* YouTube Music & Video In-App Fullscreen Studio (No chat required) */}
              <LandingPageVideoShowcase onSendToChat={(p) => handleSendMessage(p)} />

              {/* Visual Studio Showcase Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-md bg-stone-950 group">
                <img
                  src={workspaceHeroImg}
                  alt="AI Coding Studio Workspace"
                  referrerPolicy="no-referrer"
                  className="w-full h-44 sm:h-56 object-cover object-center opacity-85 group-hover:scale-102 group-hover:opacity-95 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent flex flex-col justify-end p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-stone-950 flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3 h-3" />
                      AI Studio Active
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      কোডিং • ক্লাউড সিঙ্ক • ফুল-স্ট্যাক
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    আপনার বুদ্ধিমান প্রোগ্রামিং ও ক্রিয়েটিভ অ্যাসিস্ট্যান্ট
                  </h3>
                  <p className="text-xs text-stone-300 max-w-xl line-clamp-1 mt-0.5">
                    রিয়েল-টাইম Gemini 3.8 Flash, ফায়ারস্টোর ক্লাউড সিঙ্ক এবং ইন্টেলিজেন্ট কোড জেনারেটর
                  </p>
                </div>
              </div>

              {/* Architecture Blueprint Feature Card */}
              <div
                onClick={() => setArchitectureModalOpen(true)}
                className="cursor-pointer group p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white shadow-lg border border-stone-700/80 hover:border-emerald-500/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-400 text-stone-950 font-bold">
                      আর্কিটেকচার গাইড
                    </span>
                    <h3 className="text-base font-bold flex items-center gap-1.5 group-hover:text-emerald-300 transition-colors truncate">
                      <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                      Claude বা ChatGPT-এর মতো নিজস্ব AI অ্যাপ কীভাবে বানাবেন?
                    </h3>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
                    কোটি টাকার GPU ছাড়াই বর্তমান LLM API (Google Gemini, Claude), Express ব্যাকএন্ড, React ফ্রন্টএন্ড এবং Vector DB/RAG দিয়ে কয়েক সপ্তাহেই কাজ চালানোর মতো ফুল-ফাংশনাল AI প্রোডাক্ট লঞ্চ করার বিস্তারিত রোডম্যাপ।
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <img
                    src={apiArchitectureImg}
                    alt="AI Cloud Architecture Preview"
                    referrerPolicy="no-referrer"
                    className="w-20 h-14 sm:w-28 sm:h-16 rounded-xl object-cover border border-emerald-500/40 shadow-xs hidden sm:block"
                  />
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs transition-colors shrink-0">
                    <span>ব্লুপ্রিন্ট দেখুন</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Citizen Services & Everyday Helper Feature Card */}
              <div
                onClick={() => setCitizenModalOpen(true)}
                className="cursor-pointer group p-5 rounded-2xl bg-gradient-to-r from-teal-950 via-stone-900 to-emerald-950 text-white shadow-lg border border-teal-600/50 hover:border-teal-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-teal-400 text-stone-950 font-bold">
                      A-Z জনসেবা ও তথ্য কেন্দ্র
                    </span>
                    <h3 className="text-base font-bold flex items-center gap-1.5 group-hover:text-teal-300 transition-colors truncate">
                      <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                      মোবাইল নাম্বার, ঠিকানা, পরিচয় যাচাই ও মানুষের দৈনন্দিন কাজ সহজ করার টুলকিট
                    </h3>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed max-w-2xl">
                    জাতীয় জরুরি হটলাইন (৯৯৯, ৩৩৩, ১০৯, ১০৬, ১৬১২২), পোস্টকোড ফাইন্ডার, এনআইডি ও *১৬০০১# সিম মালিকানা যাচাই নির্দেশিকা, এবং মোবাইল হারানো বা ছুটির জন্য আনুষ্ঠানিক দরখাস্ত ও জিডি (GD) প্রস্তুতকারক।
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 text-xs font-semibold border border-teal-500/40 backdrop-blur-xs transition-colors shrink-0">
                  <span>টুলকিট খুলুন</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Quick Prompts Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                    রেডিমেড প্রম্পট ও ফিচার (Quick Starters)
                  </h3>
                  <span className="text-[11px] text-stone-600 dark:text-stone-400">ক্লিক করে সরাসরি শুরু করুন</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSendMessage(p.prompt)}
                      className="group/card text-left p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            {p.titleBn}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover/card:text-emerald-500 group-hover/card:translate-x-0.5 transition-all" />
                        </div>
                        <h4 className="text-xs font-bold text-stone-800 dark:text-stone-100 group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400">
                          {p.titleEn}
                        </h4>
                        <p className="text-[11px] text-stone-700 dark:text-stone-300 line-clamp-2 leading-relaxed">
                          {p.prompt}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-[10px] text-stone-600 dark:text-stone-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>{p.descriptionBn}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 6 Core Pillars Info Bar */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-3">
                  অ্যাসিস্ট্যান্টের ৬টি প্রধান কাজের ক্ষেত্র
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60">
                    <Code2 className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">কোডিং</span>
                    <span className="text-[10px] text-stone-600 dark:text-stone-400">Python, JS, React</span>
                  </div>
                  <div 
                    onClick={() => setCitizenModalOpen(true)}
                    className="p-2.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 cursor-pointer hover:bg-teal-100 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-teal-600 dark:text-teal-400" />
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">জনসেবা ও A-Z</span>
                    <span className="text-[10px] text-teal-700 dark:text-teal-300">হটলাইন, ঠিকানা, এনআইডি</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60">
                    <PenTool className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">লেখা ও অনুবাদ</span>
                    <span className="text-[10px] text-stone-600 dark:text-stone-400">জিডি, আবেদন, ইমেইল</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60">
                    <GraduationCap className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">শেখা ও কনসেপ্ট</span>
                    <span className="text-[10px] text-stone-600 dark:text-stone-400">সহজ ভাষায় ব্যাখ্যা</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60">
                    <Search className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">গুগল সার্চ</span>
                    <span className="text-[10px] text-stone-600 dark:text-stone-400">লাইভ ডাটা গ্রাউন্ডিং</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/60">
                    <Compass className="w-4 h-4 mx-auto mb-1 text-rose-500" />
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">পরামর্শ ও টুলস</span>
                    <span className="text-[10px] text-stone-600 dark:text-stone-400">লাইভ জিপিএস ও ম্যাপ</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Session Meta & Quick Export Sub-header */}
              <div className="sticky top-0 z-10 px-4 py-2.5 bg-stone-50/90 dark:bg-stone-900/90 backdrop-blur-xs border-b border-stone-200/70 dark:border-stone-800/70 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-stone-800 dark:text-stone-200 truncate">
                    {activeSession.title}
                  </span>
                  <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
                    {activeSession.messages.length}টি বার্তা
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="chat-subbar-pin-btn"
                    onClick={(e) => handleTogglePinSession(activeSession.id, e)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 shadow-2xs cursor-pointer ${
                      activeSession.isPinned
                        ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/70 hover:bg-amber-200/80'
                        : 'bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-750 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                    title={activeSession.isPinned ? 'সাইডবারে চ্যাট আনপিন করুন' : 'সাইডবারে শীর্ষে পিন করুন'}
                  >
                    {activeSession.isPinned ? (
                      <>
                        <PinOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>আনপিন</span>
                      </>
                    ) : (
                      <>
                        <Pin className="w-3.5 h-3.5 text-amber-500" />
                        <span>পিন করুন</span>
                      </>
                    )}
                  </button>

                  <button
                    id="chat-subbar-share-btn"
                    onClick={() =>
                      handleOpenShareModal({
                        title: activeSession.title,
                        text: `${activeSession.title} - AI Assistant & Coding Studio চ্যাট সেশন`,
                        sessionId: activeSession.id,
                        shareType: 'session',
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-stone-850 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-750 transition-colors shrink-0 shadow-2xs cursor-pointer"
                    title="এই সেশনটি সোশ্যাল মিডিয়ায় শেয়ার করুন"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>শেয়ার করুন</span>
                  </button>

                  <button
                    id="chat-subbar-export-btn"
                    onClick={() => handleExportChat(activeSession)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 transition-colors shrink-0 shadow-2xs cursor-pointer"
                    title="এই সেশনটি PDF বা JSON ফাইলে সংরক্ষণ করুন"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF / JSON এক্সপোর্ট</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-stone-100 dark:divide-stone-800/40">
                {activeSession.messages.map((message) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    onPreviewCode={(code, language) =>
                      setPreviewModal({ isOpen: true, code, language })
                    }
                    onSelectPrompt={(p) => handleSendMessage(p)}
                    onRetry={handleRetryLastMessage}
                    onOpenHostingGuide={() => setHostingModalOpen(true)}
                    onEditMessage={handleEditAndResend}
                    onShareMessage={(text) =>
                      handleOpenShareModal({
                        title: 'AI সহকারী রেসপন্স',
                        text: text.slice(0, 200) + '...',
                        sessionId: activeSession.id,
                        shareType: 'message',
                      })
                    }
                    isGenerating={isGenerating}
                  />
                ))}
                <div ref={messagesEndRef} className="h-20 sm:h-28 md:h-36" />
              </div>
            </div>
          )}
        </div>

        {/* Scroll to Top & Bottom Navigation Floating Buttons (নিচে ও উপরে স্ক্রল করার বাটন) */}
        <ScrollNavigationButtons
          onScrollToTop={handleScrollToTop}
          onScrollToBottom={handleScrollToBottom}
          isNearTop={chatScrollState.isNearTop}
          isNearBottom={chatScrollState.isNearBottom}
          canScroll={chatScrollState.canScroll}
          scrollPercentage={chatScrollState.scrollPercentage}
          className="bottom-28 sm:bottom-32 right-3.5 sm:right-6 md:right-8"
        />

        {/* Input Bar with bottom padding for mobile sticky nav */}
        <div className={`transition-all duration-200 shrink-0 relative z-20 ${
          isChatInputFocused
            ? 'pb-1'
            : 'pb-[calc(3.75rem+env(safe-area-inset-bottom,8px))] md:pb-0'
        }`}>
          <ChatInput
            input={input}
            setInput={setInput}
            onSend={(text) => handleSendMessage(text)}
            onStop={handleStopGenerating}
            isGenerating={isGenerating}
            enableSearch={enableSearch}
            setEnableSearch={setEnableSearch}
            mode={mode}
            setMode={setMode}
            onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
            onOpenShareReceiver={() => setShareReceiverOpen(true)}
            onFocus={() => setIsChatInputFocused(true)}
            onBlur={() => setIsChatInputFocused(false)}
          />
        </div>
      </div>

      {/* Architecture Guide Modal */}
      <ArchitectureModal
        isOpen={architectureModalOpen}
        onClose={() => setArchitectureModalOpen(false)}
        onSelectPrompt={(p) => handleSendMessage(p)}
      />

      {/* Code Sandbox Preview Modal */}
      <CodePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        code={previewModal.code}
        language={previewModal.language}
      />

      {/* Export Modal (PDF, JSON, Markdown) */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => {
          setExportModalOpen(false);
          setSessionToExport(null);
        }}
        session={sessionToExport || activeSession}
      />

      {/* Share Modal for Multiple Media Platforms */}
      <ShareModal
        isOpen={shareModalConfig.isOpen}
        onClose={() => setShareModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={shareModalConfig.title}
        text={shareModalConfig.text}
        url={shareModalConfig.url}
        sessionId={shareModalConfig.sessionId}
        shareType={shareModalConfig.shareType}
      />

      {/* Hosting and Gemini AI Diagnostic Modal */}
      <HostingDiagnosticModal
        isOpen={hostingModalOpen}
        onClose={() => setHostingModalOpen(false)}
      />

      {/* Citizen & Everyday Services Hub Modal */}
      <CitizenServicesModal
        isOpen={citizenModalOpen}
        onClose={() => setCitizenModalOpen(false)}
        onSendToChat={(p) => handleSendMessage(p)}
        onOpenLiveLocation={() => {
          setCitizenModalOpen(false);
          setLiveLocationModalOpen(true);
        }}
      />

      {/* Autonomous 24/7 Remote Freelance AI Agent Modal */}
      <FreelanceAgentModal
        isOpen={freelanceAgentModalOpen}
        onClose={() => setFreelanceAgentModalOpen(false)}
        onSendToChat={(p) => handleSendMessage(p)}
      />

      {/* Live Location & GPS Modal */}
      <LiveLocationModal
        isOpen={liveLocationModalOpen}
        onClose={() => setLiveLocationModalOpen(false)}
        locationState={locationState}
        onSendToChat={(p) => handleSendMessage(p)}
        onOpenShareModal={handleOpenShareModal}
      />

      {/* Fullscreen & Floating YouTube In-App Music Player */}
      <MusicPlayerModal
        onAskAIAboutSong={(prompt) => handleSendMessage(prompt)}
        onOpenShareModal={handleOpenShareModal}
      />

      {/* Google Drive Workspace Modal */}
      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        onImportToChat={handleImportDriveFile}
        activeSessionTitle={activeSession?.title}
        activeSessionContent={
          activeSession?.messages
            ? activeSession.messages
                .map((m) => `### ${m.role === 'user' ? '👤 ব্যবহারকারী' : '🤖 এআই'}\n\n${m.text}\n`)
                .join('\n---\n\n')
            : ''
        }
      />

      {/* In-App Mini Google Web Browser & Music Player Modal */}
      <MiniGoogleBrowserModal
        activeSession={activeSession}
        onInsertIntoChat={(text) => {
          setInput((prev) => (prev ? `${prev}\n\n${text}` : text));
        }}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
      />

      {/* Text-to-Speech Engine Speed & Voice Settings Modal */}
      <TTSSettingsModal
        isOpen={ttsSettingsModalOpen}
        onClose={() => setTtsSettingsModalOpen(false)}
      />

      {/* Founder & Super Admin Profile Modal */}
      <FounderProfileModal
        isOpen={founderProfileModalOpen}
        onClose={() => setFounderProfileModalOpen(false)}
      />

      {/* AI-Vision Studio 1.0 (Founder Sheikh Farid) */}
      <VisionStudioModal
        isOpen={visionStudioOpen}
        onClose={() => setVisionStudioOpen(false)}
        onSendToChat={(prompt) => handleSendMessage(prompt)}
        onPreviewCode={(code, lang) => setPreviewModal({ isOpen: true, code, language: lang })}
      />

      {/* YouTube Studio & Channel Hub Modal */}
      <YouTubeModal
        isOpen={youTubeModalOpen}
        onClose={() => setYouTubeModalOpen(false)}
        onSendToChat={(prompt) => handleSendMessage(prompt)}
      />

      {/* Universal Apps Launcher, Gmail & Messaging Hub Modal */}
      <UniversalAppsConnectModal
        isOpen={universalAppsModalConfig.isOpen}
        onClose={() => setUniversalAppsModalConfig((prev) => ({ ...prev, isOpen: false }))}
        initialTab={universalAppsModalConfig.tab}
        onSendToChat={(prompt) => handleSendMessage(prompt)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onOpenEmailComposer={() => handleOpenEmailComposer()}
      />

      {/* Professional Email Composer & Drafter Modal */}
      <EmailComposerModal
        isOpen={emailComposerOpen}
        onClose={() => setEmailComposerOpen(false)}
        initialRecipient={emailComposerConfig.recipient}
        initialSubject={emailComposerConfig.subject}
        initialBody={emailComposerConfig.body}
        initialLanguage={emailComposerConfig.language}
        onSendToChat={(prompt) => handleSendMessage(prompt)}
      />

      {/* Recharts Project Metrics & Chat History Analytics Modal */}
      <ProjectMetricsModal
        isOpen={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
        sessions={sessions}
        activeSessionId={activeSession?.id}
        onSelectSession={setActiveSessionId}
      />

      {/* Mobile Sticky Thumb Navigation Bar */}
      <MobileBottomNav
        onOpenMobilePrograms={() => setMobileProgramsHubOpen(true)}
        onOpenEmailComposer={() => handleOpenEmailComposer()}
        onOpenCitizenServices={() => setCitizenModalOpen(true)}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onScrollToChat={() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          const textarea = document.getElementById('chat-textarea-input');
          if (textarea) textarea.focus();
        }}
        hasActiveMessages={activeSession?.messages.length > 0}
        isInputFocused={isChatInputFocused}
      />

      {/* Mobile Programs & All Tools Hub Modal */}
      <MobileProgramsHubModal
        isOpen={mobileProgramsHubOpen}
        onClose={() => setMobileProgramsHubOpen(false)}
        onOpenEmailComposer={() => handleOpenEmailComposer()}
        onOpenUniversalApps={handleOpenUniversalApps}
        onOpenCitizenServices={() => setCitizenModalOpen(true)}
        onOpenFreelanceAgent={() => setFreelanceAgentModalOpen(true)}
        onOpenMetrics={() => setMetricsModalOpen(true)}
        onOpenLiveLocation={() => setLiveLocationModalOpen(true)}
        onOpenArchitecture={() => setArchitectureModalOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onOpenTTSSettings={() => setTtsSettingsModalOpen(true)}
        onOpenFounderProfile={() => setFounderProfileModalOpen(true)}
        onOpenVisionStudio={() => setVisionStudioOpen(true)}
        onOpenYouTube={() => setYouTubeModalOpen(true)}
        onOpenExportChat={() => handleExportChat(activeSession)}
        onOpenShareModal={handleOpenShareModal}
        onOpenShareReceiver={() => setShareReceiverOpen(true)}
        onOpenRubelNetManager={() => setRubelNetManagerOpen(true)}
        onOpenTradingBot={() => setTradingBotModalOpen(true)}
        onOpenAndroidApk={() => setAndroidApkModalOpen(true)}
      />

      {/* GitHub Android APK Release Hub Modal */}
      <AndroidApkReleaseModal
        isOpen={androidApkModalOpen}
        onClose={() => setAndroidApkModalOpen(false)}
      />

      {/* Global Drop Zone for Files, Photos, Links from other apps */}
      <GlobalDropZone
        onDropItem={(item) => {
          setIncomingSharedItem(item);
          setShareReceiverOpen(true);
          setSharedAlertToast('ড্রপ করা আইটেম সফলভাবে শেয়ার হাবে যুক্ত হয়েছে');
          setTimeout(() => setSharedAlertToast(null), 4000);
        }}
      />

      {/* Universal Inbound Share & Content Receiver Modal */}
      <UniversalShareReceiverModal
        isOpen={shareReceiverOpen}
        onClose={() => {
          setShareReceiverOpen(false);
          setIncomingSharedItem(null);
        }}
        initialSharedItem={incomingSharedItem}
        onInsertToChat={(prompt, autoSend) => {
          if (autoSend) {
            handleSendMessage(prompt);
          } else {
            setInput((prev) => (prev ? `${prev}\n\n${prompt}` : prompt));
          }
        }}
      />

      {/* RubelNet Firebase Manager Sovereign Grid Command Center Modal */}
      <RubelNetFirebaseManagerModal
        isOpen={rubelNetManagerOpen}
        onClose={() => setRubelNetManagerOpen(false)}
        onSendToChat={(prompt) => handleSendMessage(prompt)}
      />

      {/* Google Gemini Authentication & Integration Hub Modal */}
      <GeminiAuthModal
        isOpen={geminiAuthModalOpen}
        onClose={() => setGeminiAuthModalOpen(false)}
        onSyncAll={handleSyncAll}
        onOpenProfile={() => setFounderProfileModalOpen(true)}
        onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        onImportShareUrlToChat={(shareUrl) => {
          handleSendMessage(`Google Gemini চ্যাট বিশ্লেষণ ও সামারি:\n${shareUrl}\n\nঅনুগ্রহ করে এই Gemini চ্যাট সেশনের মূল আলোচনা ও বিষয়বস্তু ব্যাখ্যা করুন।`);
        }}
      />

      {/* Real-Time Screen Analysis Trading AI Bot Studio Modal */}
      <TradingScreenBotModal
        isOpen={tradingBotModalOpen}
        onClose={() => setTradingBotModalOpen(false)}
        onOpenFloatingHUD={() => {
          setTradingBotModalOpen(false);
          setFloatingHUDOpen(true);
        }}
        currentSignal={tradingSignal}
        onSignalUpdate={(sig) => setTradingSignal(sig)}
        virtualBalance={virtualBalance}
        onUpdateBalance={(bal) => setVirtualBalance(bal)}
        activeTrades={activeTrades}
        onUpdateActiveTrades={(trades) => setActiveTrades(trades)}
        tradeHistory={tradeHistory}
        onUpdateTradeHistory={(hist) => setTradeHistory(hist)}
        settings={tradingBotSettings}
        onUpdateSettings={(s) => setTradingBotSettings(s)}
        isAnalyzing={isAnalyzingTrading}
        setIsAnalyzing={(val) => setIsAnalyzingTrading(val)}
      />

      {/* Always-on-top Floating Trading HUD (স্ক্রিনের উপর ভাসমান লাইভ সিগন্যাল ও বাই/সেল বাটন) */}
      <FloatingTradingHUD
        isOpen={floatingHUDOpen}
        onClose={() => setFloatingHUDOpen(false)}
        onExpand={() => {
          setFloatingHUDOpen(false);
          setTradingBotModalOpen(true);
        }}
        signal={tradingSignal}
        isAnalyzing={isAnalyzingTrading}
        onScanNow={() => {
          setFloatingHUDOpen(false);
          setTradingBotModalOpen(true);
        }}
        onBuy={() => handleHUDTrade('BUY')}
        onSell={() => handleHUDTrade('SELL')}
        autoTrade={tradingBotSettings.autoTrade}
        onToggleAutoTrade={() =>
          setTradingBotSettings((prev) => ({ ...prev, autoTrade: !prev.autoTrade }))
        }
        autoScan={tradingBotSettings.autoScanInterval > 0}
        onToggleAutoScan={() =>
          setTradingBotSettings((prev) => ({
            ...prev,
            autoScanInterval: prev.autoScanInterval > 0 ? 0 : 10,
          }))
        }
        virtualBalance={virtualBalance}
        activeTrades={activeTrades}
        overlayOpacity={tradingBotSettings.overlayOpacity}
        onChangeOpacity={(opacity) =>
          setTradingBotSettings((prev) => ({ ...prev, overlayOpacity: opacity }))
        }
        voiceAlerts={tradingBotSettings.voiceAlerts}
        onToggleVoice={() =>
          setTradingBotSettings((prev) => ({ ...prev, voiceAlerts: !prev.voiceAlerts }))
        }
        marketName={tradingBotSettings.market}
      />

      {/* Inbound Share Toast Notification */}
      {sharedAlertToast && (
        <div className="fixed top-16 right-4 z-50 p-3 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-3 border border-emerald-400">
          <Share2 className="w-4 h-4 shrink-0 animate-pulse" />
          <span>{sharedAlertToast}</span>
          <button
            onClick={() => setSharedAlertToast(null)}
            className="p-1 hover:bg-white/20 rounded-lg text-white/90 hover:text-white cursor-pointer ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
    </MiniBrowserProvider>
  </MusicPlayerProvider>
  );
}
