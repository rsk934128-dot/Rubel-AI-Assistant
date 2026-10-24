import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Download,
  Layers, 
  Code2, 
  PenTool, 
  Search, 
  GraduationCap, 
  Compass, 
  Sparkles,
  X,
  Server,
  Cpu,
  Cloud,
  LogIn,
  Share2,
  Shield,
  ShieldCheck,
  Bot,
  HardDrive,
  Music,
  Globe,
  CheckCircle2,
  ChevronRight,
  Filter,
  Volume2,
  Gauge,
  Crown,
  Pin,
  PinOff,
  Mail,
  FolderGit2,
  Users,
  BarChart3,
  TrendingUp,
  Scan,
  Eye,
  Youtube,
  Smartphone,
} from 'lucide-react';
import { ChatSession, AssistantMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { AppLogo } from './AppLogo';
import { useAuth } from '../context/AuthContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useMiniBrowser } from '../context/MiniBrowserContext';
import { UniversalTab } from './UniversalAppsConnectModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onExportSession?: (session: ChatSession, e: React.MouseEvent) => void;
  onTogglePinSession?: (id: string, e: React.MouseEvent) => void;
  onOpenArchitecture: () => void;
  onOpenHostingDiagnostic?: () => void;
  onOpenCitizenServices?: () => void;
  onOpenFreelanceAgent?: () => void;
  onOpenUniversalApps?: (tab?: UniversalTab) => void;
  onOpenMetrics?: () => void;
  onOpenGoogleDrive?: () => void;
  onOpenTTSSettings?: () => void;
  onOpenFounderProfile?: () => void;
  onOpenGeminiAuth?: () => void;
  onOpenVisionStudio?: () => void;
  onOpenYouTube?: () => void;
  onOpenEmailComposer?: () => void;
  onOpenShare?: (config?: { shareType?: 'app' | 'session' }) => void;
  onOpenShareReceiver?: () => void;
  onOpenRubelNetManager?: () => void;
  onOpenTradingBot?: () => void;
  onOpenAndroidApk?: () => void;
  onSelectMode: (mode: AssistantMode) => void;
  currentMode: AssistantMode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onExportSession,
  onTogglePinSession,
  onOpenArchitecture,
  onOpenHostingDiagnostic,
  onOpenCitizenServices,
  onOpenFreelanceAgent,
  onOpenUniversalApps,
  onOpenMetrics,
  onOpenGoogleDrive,
  onOpenTTSSettings,
  onOpenFounderProfile,
  onOpenGeminiAuth,
  onOpenVisionStudio,
  onOpenYouTube,
  onOpenEmailComposer,
  onOpenShare,
  onOpenShareReceiver,
  onOpenRubelNetManager,
  onOpenTradingBot,
  onOpenAndroidApk,
  onSelectMode,
  currentMode,
}) => {
  const { user, signIn } = useAuth();
  const musicPlayer = useMusicPlayer();
  const miniBrowser = useMiniBrowser();
  const [activeTab, setActiveTab] = useState<'programs' | 'history'>('programs');
  const [historySearchQuery, setHistorySearchQuery] = useState('');

  const filteredSessions = sessions.filter((s) => {
    if (!historySearchQuery.trim()) return true;
    const query = historySearchQuery.toLowerCase();
    const titleMatch = (s.title || '').toLowerCase().includes(query);
    const messageMatch = s.messages.some((m) => (m.text || '').toLowerCase().includes(query));
    return titleMatch || messageMatch;
  });

  const pinnedSessions = filteredSessions
    .filter((s) => s.isPinned)
    .sort((a, b) => (b.pinnedAt || b.updatedAt) - (a.pinnedAt || a.updatedAt));

  const unpinnedSessions = filteredSessions
    .filter((s) => !s.isPinned)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const renderSessionItem = (s: ChatSession) => {
    const isActive = s.id === activeSessionId;
    const isPinned = Boolean(s.isPinned);

    return (
      <div
        key={s.id}
        id={`sidebar-session-${s.id}`}
        onClick={() => {
          onSelectSession(s.id);
          if (window.innerWidth < 768) onClose();
        }}
        className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
          isActive
            ? isPinned
              ? 'bg-amber-100/90 dark:bg-amber-950/80 font-semibold text-amber-950 dark:text-amber-100 shadow-xs border border-amber-400 dark:border-amber-600'
              : 'bg-white dark:bg-stone-800 font-semibold text-stone-900 dark:text-stone-100 shadow-xs border border-stone-300 dark:border-stone-700'
            : isPinned
            ? 'bg-amber-50/60 dark:bg-amber-950/30 text-stone-800 dark:text-stone-200 border border-amber-200/70 dark:border-amber-900/50 hover:bg-amber-100/60 dark:hover:bg-amber-900/40'
            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {isPinned ? (
            <Pin className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-500" />
          ) : (
            <MessageSquare
              className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-500' : 'text-stone-400'}`}
            />
          )}
          <div className="min-w-0">
            <span className="truncate block font-medium">
              {s.title || 'নতুন কথোপকথন'}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 font-normal">
              <span>{s.messages.length}টি বার্তা</span>
              {isPinned && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">• পিন করা</span>
              )}
            </div>
          </div>
          {s.isGeneratingTitle && (
            <span title="শিরোনাম তৈরি হচ্ছে..." className="shrink-0 inline-flex items-center">
              <Sparkles className="w-3 h-3 text-emerald-500 animate-spin" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {onTogglePinSession && (
            <button
              id={`sidebar-pin-btn-${s.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinSession(s.id, e);
              }}
              title={isPinned ? 'চ্যাট আনপিন করুন' : 'শীর্ষে পিন করুন'}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isPinned
                  ? 'text-amber-600 hover:text-stone-400 bg-amber-500/10'
                  : 'text-stone-400 hover:text-amber-500 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          )}

          {s.messages.length > 0 && onExportSession && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExportSession(s, e);
              }}
              title="PDF বা JSON এক্সপোর্ট"
              className="p-1 text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSession(s.id, e);
            }}
            title="মুছে ফেলুন"
            className="p-1 text-stone-400 hover:text-rose-500 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const modesList: Array<{ id: AssistantMode; label: string; desc: string; icon: any; color: string }> = [
    { id: 'citizen', label: 'জনসেবা ও A-Z সমাধান', desc: 'হটলাইন, ঠিকানা, এনআইডি ও দরখাস্ত', icon: ShieldCheck, color: 'text-teal-600 dark:text-teal-400' },
    { id: 'coding', label: 'কোডিং ও ডেভেলপমেন্ট', desc: 'Python, JS, React, AI কোড জেনারেটর', icon: Code2, color: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'writing', label: 'লেখালেখি ও অনুবাদ', desc: 'অফিসিয়াল দরখাস্ত, জিডি, ইমেইল, অনুচ্ছেদ', icon: PenTool, color: 'text-amber-600 dark:text-amber-400' },
    { id: 'research', label: 'গবেষণা ও ফ্যাক্ট-চেক', desc: 'Google Search লাইভ ডাটা ভেরিফিকেশন', icon: Search, color: 'text-blue-600 dark:text-blue-400' },
    { id: 'learning', label: 'পড়াশোনা ও কনসেপ্ট', desc: 'সহজ ভাষায় জটিল বিষয়ের ব্যাখ্যা', icon: GraduationCap, color: 'text-purple-600 dark:text-purple-400' },
    { id: 'general', label: 'সাধারণ মোড (General)', desc: 'দৈনন্দিন সকল কাজের স্মার্ট উত্তর', icon: Sparkles, color: 'text-stone-600 dark:text-stone-400' },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 w-[85vw] max-w-xs sm:w-80 md:w-80 bg-stone-50 dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'
        } shrink-0`}
      >
        {/* Brand Banner */}
        <div className="p-3.5 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between bg-white dark:bg-stone-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <AppLogo size={32} withGlow={true} />
            <div>
              <span className="text-xs font-black text-stone-900 dark:text-stone-100 tracking-tight leading-none block">
                AI Assistant Studio
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 3.8 Flash • ক্লাউড রেডি
              </span>
            </div>
          </div>
          <button
            id="sidebar-close-btn"
            onClick={onClose}
            className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 md:hidden rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="সাইডবার বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Primary Action Button */}
        <div className="p-3 pb-2 border-b border-stone-200/70 dark:border-stone-800/70 shrink-0 bg-stone-100/50 dark:bg-stone-900/50">
          <button
            id="sidebar-new-chat-btn"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-sm transition-all cursor-pointer group"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
            <span>নতুন কথোপকথন (New Chat)</span>
          </button>
        </div>

        {/* Top Segmented Tab Switcher (Programs vs History) */}
        <div className="px-3 pt-2 pb-1 shrink-0 bg-stone-100/40 dark:bg-stone-900/40">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-xs font-semibold">
            <button
              type="button"
              id="sidebar-tab-programs"
              onClick={() => setActiveTab('programs')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'programs'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>সকল প্রোগ্রাম</span>
            </button>

            <button
              type="button"
              id="sidebar-tab-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-300 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>চ্যাট হিস্ট্রি ({sessions.length})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body: Contains either all programs or chat history */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3.5 text-xs">
          {activeTab === 'programs' ? (
            /* =================== TAB 1: ALL PROGRAMS & TOOLS =================== */
            <div className="space-y-3">
              {/* Category 1: AI Agents & Specialized Toolkits */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1 mb-1.5 flex items-center gap-1">
                  <span>⚡ এআই প্রোগ্রাম ও টুলকিট</span>
                </p>
                <div className="space-y-1.5">
                  {/* Universal Inbound Share Hub (Receive Files, Photos, Links, Notes) */}
                  {onOpenShareReceiver && (
                    <button
                      id="sidebar-prog-share-receiver"
                      onClick={() => {
                        onOpenShareReceiver();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent hover:from-emerald-500/25 border border-emerald-500/30 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Share2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              বহিরাগত শেয়ার হাব (ইনপুট)
                            </p>
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase">
                              New
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                            ফাইল, ফটো, সোশ্যাল লিংক ও লেখা আনুন
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* RubelNet Firebase Manager Sovereign Grid */}
                  {onOpenRubelNetManager && (
                    <button
                      id="sidebar-prog-rubelnet-manager"
                      onClick={() => {
                        onOpenRubelNetManager();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-stone-900 border border-emerald-500/40 text-left transition-all group cursor-pointer shadow-2xs hover:border-emerald-400"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-white truncate">
                              RubelNet Firebase Manager
                            </p>
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-stone-950 uppercase">
                              Grid 🛡️
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-400 truncate">
                            The Sovereign Grid for Firebase
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Universal Apps, Gmail & Messaging Hub */}
                  {onOpenUniversalApps && (
                    <button
                      id="sidebar-prog-universal-apps"
                      onClick={() => {
                        onOpenUniversalApps('apps');
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-transparent hover:from-blue-500/25 border border-blue-500/30 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              সকল অ্যাপস, জিমেইল ও মেসেজ
                            </p>
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-500 text-white uppercase">
                              Hub
                            </span>
                          </div>
                          <p className="text-[10px] text-blue-700 dark:text-blue-400 truncate">
                            Gmail, WhatsApp, SMS, Drive, Maps ওপেন
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Professional Email Composer & Drafter */}
                  {onOpenEmailComposer && (
                    <button
                      id="sidebar-prog-email-composer"
                      onClick={() => {
                        onOpenEmailComposer();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-transparent hover:from-teal-500/25 border border-teal-500/30 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              প্রফেশনাল ইমেইল কম্পোজার
                            </p>
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-teal-600 text-white uppercase">
                              Draft
                            </span>
                          </div>
                          <p className="text-[10px] text-teal-700 dark:text-teal-400 truncate">
                            বাংলা ও ইংরেজিতে ড্রাফট, এক্সপোর্ট ও কপি
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* GitHub Flagship Hub (rsk934128-dot) */}
                  {onOpenUniversalApps && (
                    <button
                      id="sidebar-prog-github-hub"
                      onClick={() => {
                        onOpenUniversalApps('github');
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-purple-50/90 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/70 border border-purple-300/60 dark:border-purple-800/60 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <FolderGit2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-purple-950 dark:text-purple-200 truncate">
                            GitHub হাব (rsk934128-dot)
                          </p>
                          <p className="text-[10px] text-purple-700/90 dark:text-purple-400/90 truncate">
                            শেখ ফরিদের ১৩৯+ রিপোজিটরি ও কোডিং
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* People Connect & Networking Directory */}
                  {onOpenUniversalApps && (
                    <button
                      id="sidebar-prog-people-hub"
                      onClick={() => {
                        onOpenUniversalApps('people');
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/90 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-300/60 dark:border-indigo-800/60 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                            মানুষের সাথে কানেক্ট ও কন্টাক্ট বুক
                          </p>
                          <p className="text-[10px] text-indigo-700/90 dark:text-indigo-400/90 truncate">
                            ১-ক্লিক কল, WhatsApp, জিমেইল ও কন্টাক্টস
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* ForTrade Pro Trading Terminal (PWA) */}
                  <button
                    id="sidebar-prog-fortrade-terminal"
                    onClick={() => {
                      miniBrowser.openBrowser('https://fortrade-pro-trading-terminal-dev-d-nine.vercel.app/?source=pwa', 'web');
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent hover:from-emerald-500/25 border border-emerald-500/30 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                            ForTrade Pro ট্রেডিং টার্মিনাল
                          </p>
                          <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase">
                            PWA
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                          লাইভ ফরেক্স, স্টক ও ক্রিপ্টো ট্রেডিং চার্ট
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* GitHub Android APK Release Hub */}
                  {onOpenAndroidApk && (
                    <button
                      id="sidebar-prog-android-apk"
                      onClick={() => {
                        onOpenAndroidApk();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-transparent hover:from-emerald-600/25 border border-emerald-500/40 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              GitHub Android APK রিলিজ
                            </p>
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white uppercase">
                              APK
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                            অটোমেটেড GitHub Actions বিল্ড ও ডাউনলোড
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Freelance Agent */}
                  {onOpenFreelanceAgent && (
                    <button
                      id="sidebar-prog-freelance-agent"
                      onClick={() => {
                        onOpenFreelanceAgent();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent hover:from-emerald-500/20 border border-emerald-500/30 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Bot className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              ২৪/৭ রিমোট জব এআই এজেন্ট
                            </p>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          </div>
                          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate">
                            Upwork/Remote জব মূল্যায়ন ও প্রপোজাল
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Citizen Services */}
                  {onOpenCitizenServices && (
                    <button
                      id="sidebar-prog-citizen"
                      onClick={() => {
                        onOpenCitizenServices();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-teal-50/90 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800/60 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-teal-950 dark:text-teal-200 truncate">
                            A-Z জনসেবা ও তথ্য নির্দেশিকা
                          </p>
                          <p className="text-[10px] text-teal-700/90 dark:text-teal-400/90 truncate">
                            হটলাইন, ঠিকানা, এনআইডি ও দরখাস্ত
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* AI-Vision Studio 1.0 (Founder Sheikh Farid) */}
                  {onOpenVisionStudio && (
                    <button
                      id="sidebar-prog-vision-studio"
                      onClick={() => {
                        onOpenVisionStudio();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/90 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-300/60 dark:border-emerald-800/60 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Scan className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 truncate">
                            AI-Vision Studio 1.0 👁️
                          </p>
                          <p className="text-[10px] text-emerald-700/90 dark:text-emerald-400/90 truncate">
                            অবজেক্ট ডিটেকশন, OCR ও স্কেচ-টু-কোড
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Google Drive Workspace */}
                  {onOpenGoogleDrive && (
                    <button
                      id="sidebar-prog-drive"
                      onClick={() => {
                        onOpenGoogleDrive();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/90 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-300/60 dark:border-amber-800/60 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-amber-950 dark:text-amber-200 truncate">
                            Google Drive ক্লাউড স্টুডিও
                          </p>
                          <p className="text-[10px] text-amber-700/90 dark:text-amber-400/90 truncate">
                            ফাইল ইম্পোর্ট ও সোর্স কোড বিশ্লেষণ
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* YouTube Studio & Channel Hub */}
                  {onOpenYouTube && (
                    <button
                      id="sidebar-prog-youtube"
                      onClick={() => {
                        onOpenYouTube();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-red-50/90 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 border border-red-300/60 dark:border-red-800/60 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Youtube className="w-4 h-4 fill-current" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-red-950 dark:text-red-200 truncate">
                            YouTube স্টুডিও ও চ্যানেল
                          </p>
                          <p className="text-[10px] text-red-700/90 dark:text-red-400/90 truncate">
                            ভিডিও, প্লেলিস্ট, মেট্রিক্স ও এআই এসইও
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Recharts Data Visualization & Metrics Dashboard */}
                  {onOpenMetrics && (
                    <button
                      id="sidebar-prog-metrics"
                      onClick={() => {
                        onOpenMetrics();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/90 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/60 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                              মেট্রিক্স ও অ্যানালিটিক্স
                            </p>
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-indigo-500 text-white uppercase">
                              Charts
                            </span>
                          </div>
                          <p className="text-[10px] text-indigo-700/90 dark:text-indigo-400/90 truncate">
                            চ্যাট গ্রাফ, গিটহাব ও পারফরম্যান্স ডেটা
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Architecture Blueprint */}
                  <button
                    id="sidebar-prog-architecture"
                    onClick={() => {
                      onOpenArchitecture();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800/80 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-stone-800 dark:bg-stone-700 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                          AI আর্কিটেকচার ব্লুপ্রিন্ট
                        </p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                          Claude ও ChatGPT-এর মতো অ্যাপ বানানোর গাইড
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Real-time Screen Analysis Trading Bot */}
                  {onOpenTradingBot && (
                    <button
                      id="sidebar-prog-trading-bot"
                      onClick={() => {
                        onOpenTradingBot();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-green-500/15 hover:from-emerald-500/25 hover:to-green-500/25 border border-emerald-500/40 text-left transition-all group cursor-pointer shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-stone-950 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs font-bold">
                          <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-emerald-950 dark:text-emerald-200 truncate">
                              ট্রেডিং এআই বট 📊
                            </p>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500 text-stone-950 uppercase animate-pulse">
                              LIVE
                            </span>
                          </div>
                          <p className="text-[10px] text-emerald-700/90 dark:text-emerald-400/90 truncate">
                            রিয়েল-টাইম স্ক্রিন এনালাইসিস ও বাই/সেল
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Hosting & AI Diagnostics */}
                  {onOpenHostingDiagnostic && (
                    <button
                      id="sidebar-prog-hosting"
                      onClick={() => {
                        onOpenHostingDiagnostic();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 border border-emerald-300/50 dark:border-emerald-800/50 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Server className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 truncate">
                            হোস্টিং ও সার্ভার ডায়াগনস্টিক
                          </p>
                          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                            এআই API হেলথ চেক ও কোটা সমাধান
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* YouTube Music Studio */}
                  <button
                    id="sidebar-prog-youtube-music"
                    onClick={() => {
                      if (musicPlayer.currentTrack) {
                        musicPlayer.expandPlayer();
                      } else {
                        musicPlayer.playVideoId('jfKfPfyJRdk', 'Lofi Girl - Chill Beats to Code & Study');
                      }
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-red-50/70 hover:bg-red-100/80 dark:bg-red-950/30 dark:hover:bg-red-950/60 border border-red-300/50 dark:border-red-800/50 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-red-950 dark:text-red-200 truncate">
                            ইউটিউব অটো-কন্টিনিউয়াস গান 🎵
                          </p>
                          <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-red-600 text-white uppercase">
                            Auto
                          </span>
                        </div>
                        <p className="text-[10px] text-red-700/80 dark:text-red-400/80 truncate">
                          একের পর এক গান, সময় অনুযায়ী আপডেট ও হিস্ট্রি
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Mini Google Browser */}
                  <button
                    id="sidebar-prog-mini-browser"
                    onClick={() => {
                      miniBrowser.openBrowser();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 border border-blue-300/50 dark:border-blue-800/50 text-left transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-950 dark:text-blue-200 truncate">
                          মিনি গুগল ওয়েব ব্রাউজার
                        </p>
                        <p className="text-[10px] text-blue-700/80 dark:text-blue-400/80 truncate">
                          লাইভ ওয়েব সার্চ ও রেফারেন্স
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Text-to-Speech Speed & Voice Settings */}
                  {onOpenTTSSettings && (
                    <button
                      id="sidebar-prog-tts-settings"
                      onClick={() => {
                        onOpenTTSSettings();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/80 dark:bg-purple-950/30 dark:hover:bg-purple-950/60 border border-purple-300/50 dark:border-purple-800/50 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-purple-950 dark:text-purple-200 truncate flex items-center gap-1.5">
                            <span>পড়ার গতি ও ভয়েস কন্ট্রোল</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300">TTS</span>
                          </p>
                          <p className="text-[10px] text-purple-700/80 dark:text-purple-400/80 truncate">
                            সহকারীর উত্তর পড়ার গতি ও কণ্ঠ সেটিংস
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Founder & Super Admin Profile */}
                  {onOpenFounderProfile && (
                    <button
                      id="sidebar-prog-founder-profile"
                      onClick={() => {
                        onOpenFounderProfile();
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-300/60 dark:border-amber-800/60 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Crown className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-amber-950 dark:text-amber-200 truncate flex items-center gap-1.5">
                            <span>ডিজিটাল স্মার্ট প্রোফাইল আইডি কার্ড</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">VERIFIED</span>
                          </p>
                          <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate">
                            শেখ ফরিদ (Sheikh Farid) • আইডি তৈরি ও আপডেট
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}

                  {/* Share App Modal */}
                  {onOpenShare && (
                    <button
                      id="sidebar-prog-share"
                      onClick={() => {
                        onOpenShare({ shareType: 'app' });
                        if (window.innerWidth < 768) onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-300/50 dark:border-emerald-800/50 text-left transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                          <Share2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 truncate">
                            সোশ্যাল মিডিয়ায় শেয়ার করুন
                          </p>
                          <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate">
                            WhatsApp, FB, লিঙ্ক ও QR কোড
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category 2: Assistant Modes */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 px-1 mb-1.5">
                  🎯 অ্যাসিস্ট্যান্ট মোডসমূহ (Modes)
                </p>
                <div className="space-y-1">
                  {modesList.map((m) => {
                    const Icon = m.icon;
                    const isActive = currentMode === m.id;
                    return (
                      <button
                        key={m.id}
                        id={`sidebar-mode-item-${m.id}`}
                        onClick={() => {
                          onSelectMode(m.id);
                          if (window.innerWidth < 768) onClose();
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                          isActive
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-semibold shadow-xs'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400 dark:text-emerald-600' : m.color}`} />
                          <div className="min-w-0">
                            <span className="block truncate">{m.label}</span>
                            <span className={`block text-[10px] truncate ${isActive ? 'text-stone-300 dark:text-stone-600' : 'text-stone-400'}`}>
                              {m.desc}
                            </span>
                          </div>
                        </div>
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PWA Install */}
              <div className="pt-1">
                <PWAInstallButton variant="sidebar" />
              </div>
            </div>
          ) : (
            /* =================== TAB 2: CHAT SESSIONS HISTORY =================== */
            <div className="space-y-2.5">
              {/* Search filter for history */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="পূর্ববর্তী চ্যাট খুঁজুন..."
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-hidden focus:border-emerald-500 text-stone-900 dark:text-stone-100"
                />
                {historySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Sessions List */}
              <div className="space-y-3">
                {filteredSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-stone-500 dark:text-stone-400">
                    {historySearchQuery ? 'কোনো চ্যাট খুঁজে পাওয়া যায়নি।' : 'কোনো পূর্ববর্তী চ্যাট নেই। নতুন চ্যাট শুরু করুন!'}
                  </div>
                ) : (
                  <>
                    {/* Pinned Sessions Section */}
                    {pinnedSessions.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 px-1 pb-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>পিন করা চ্যাট ({pinnedSessions.length})</span>
                        </div>
                        <div className="space-y-1">
                          {pinnedSessions.map((s) => renderSessionItem(s))}
                        </div>
                      </div>
                    )}

                    {/* Unpinned / Recent Sessions Section */}
                    {unpinnedSessions.length > 0 && (
                      <div className="space-y-1">
                        {pinnedSessions.length > 0 && (
                          <div className="flex items-center gap-1.5 px-1 pt-1 pb-0.5 text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                            <span>সাম্প্রতিক চ্যাট ({unpinnedSessions.length})</span>
                          </div>
                        )}
                        <div className="space-y-1">
                          {unpinnedSessions.map((s) => renderSessionItem(s))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Google Gemini & Firebase Cloud Sync Card */}
        <div className="p-3 border-t border-stone-200 dark:border-stone-800 shrink-0 bg-stone-100/60 dark:bg-stone-900/60">
          {user ? (
            <button
              type="button"
              id="sidebar-gemini-user-profile-btn"
              onClick={() => onOpenGeminiAuth && onOpenGeminiAuth()}
              className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/70 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/30 dark:hover:from-blue-950/60 dark:hover:to-indigo-950/50 border border-blue-200/80 dark:border-blue-900/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-blue-500 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-stone-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-blue-950 dark:text-blue-100 truncate">
                      {user.displayName || 'Google Gemini'}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-extrabold">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                    {user.email}
                  </p>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform shrink-0" />
              </div>
            </button>
          ) : (
            <button
              id="sidebar-gemini-login-btn"
              type="button"
              onClick={() => onOpenGeminiAuth ? onOpenGeminiAuth() : signIn('standard')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-700 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1">
                    Google Gemini লগইন
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400">
                    ক্লাউডে চ্যাট ও হিস্ট্রি সিঙ্ক রাখুন
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-blue-600 transition-colors" />
            </button>
          )}
        </div>

        {/* Footer specs & Identity */}
        <div className="px-3.5 py-2.5 bg-stone-200/50 dark:bg-stone-950/70 border-t border-stone-200 dark:border-stone-800 text-[10px] text-stone-500 dark:text-stone-400 space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700 dark:text-stone-300">কোম্পানি / প্ল্যাটফর্ম:</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">AI Assistant & Coding Studio</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700 dark:text-stone-300">ডেভেলপমেন্ট:</span>
            <span className="text-stone-600 dark:text-stone-400">সফটওয়্যার ইঞ্জিনিয়ারিং টিম</span>
          </div>
          <div className="flex items-center justify-between pt-0.5 border-t border-stone-200/60 dark:border-stone-800/60">
            <span className="flex items-center gap-1 font-mono">
              <Cpu className="w-3 h-3 text-emerald-500" />
              Engine:
            </span>
            <span className="font-semibold text-stone-700 dark:text-stone-300">Gemini 3.8 Flash</span>
          </div>
        </div>
      </aside>
    </>
  );
};
