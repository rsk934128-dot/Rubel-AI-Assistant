import React, { useState } from 'react';
import {
  X,
  Search,
  Mail,
  TrendingUp,
  Globe,
  Bot,
  ShieldCheck,
  BarChart3,
  HardDrive,
  Layers,
  Youtube,
  Volume2,
  Crown,
  Server,
  FolderGit2,
  Users,
  MapPin,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useMiniBrowser } from '../context/MiniBrowserContext';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { UniversalTab } from './UniversalAppsConnectModal';

export interface MobileProgramsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEmailComposer: () => void;
  onOpenUniversalApps: (tab?: UniversalTab) => void;
  onOpenMetrics: () => void;
  onOpenFreelanceAgent: () => void;
  onOpenCitizenServices: () => void;
  onOpenLiveLocation: () => void;
  onOpenGoogleDrive: () => void;
  onOpenArchitecture: () => void;
  onOpenTTSSettings: () => void;
  onOpenFounderProfile: () => void;
  onOpenHostingDiagnostic: () => void;
}

interface ProgramCategory {
  title: string;
  items: Array<{
    id: string;
    title: string;
    badge?: string;
    badgeColor?: string;
    description: string;
    icon: any;
    iconBg: string;
    iconColor: string;
    action: () => void;
  }>;
}

export const MobileProgramsModal: React.FC<MobileProgramsModalProps> = ({
  isOpen,
  onClose,
  onOpenEmailComposer,
  onOpenUniversalApps,
  onOpenMetrics,
  onOpenFreelanceAgent,
  onOpenCitizenServices,
  onOpenLiveLocation,
  onOpenGoogleDrive,
  onOpenArchitecture,
  onOpenTTSSettings,
  onOpenFounderProfile,
  onOpenHostingDiagnostic,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const miniBrowser = useMiniBrowser();
  const musicPlayer = useMusicPlayer();

  if (!isOpen) return null;

  const handleProgramClick = (action: () => void) => {
    onClose();
    action();
  };

  const categories: ProgramCategory[] = [
    {
      title: '⚡ যোগাযোগ ও প্রফেশনাল ড্রাফটিং',
      items: [
        {
          id: 'prog-email',
          title: 'প্রফেশনাল ইমেইল কম্পোজার',
          badge: 'Draft & Export',
          badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300',
          description: 'বাংলা ও ইংরেজিতে নির্ভুল ইমেইল ড্রাফট, এডিটিং, এক্সপোর্ট ও ১-ক্লিক কপি',
          icon: Mail,
          iconBg: 'bg-teal-600',
          iconColor: 'text-white',
          action: onOpenEmailComposer,
        },
        {
          id: 'prog-universal-apps',
          title: 'সকল অ্যাপস ও কানেক্ট হাব',
          badge: 'All-in-One',
          badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
          description: 'Gmail, WhatsApp, ForTrade Pro, GitHub, Drive ও Maps সরাসরি ওপেন',
          icon: Globe,
          iconBg: 'bg-blue-600',
          iconColor: 'text-white',
          action: () => onOpenUniversalApps('apps'),
        },
        {
          id: 'prog-people-contacts',
          title: 'কন্টাক্ট বুক ও পিপল ডিরেক্টরি',
          badge: 'Contacts',
          badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
          description: '১-ক্লিক কল, WhatsApp মেসেজ, জিমেইল ও গুরুত্বপূর্ণ ফোন নম্বর বুক',
          icon: Users,
          iconBg: 'bg-indigo-600',
          iconColor: 'text-white',
          action: () => onOpenUniversalApps('people'),
        },
      ],
    },
    {
      title: '📈 ফিন্যান্স, ট্রেডিং ও ডেভেলপমেন্ট',
      items: [
        {
          id: 'prog-fortrade',
          title: 'ForTrade Pro ট্রেডিং টার্মিনাল',
          badge: 'Trading PWA',
          badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
          description: 'লাইভ ফরেক্স, স্টক ও ক্রিপ্টো চার্ট, টেকনিক্যাল ইন্ডিকেটর ও ট্রেডিং এক্সিকিউশন',
          icon: TrendingUp,
          iconBg: 'bg-gradient-to-br from-emerald-600 to-teal-700',
          iconColor: 'text-white',
          action: () => {
            miniBrowser.openBrowser('https://fortrade-pro-trading-terminal-dev-d-nine.vercel.app/?source=pwa', 'web');
          },
        },
        {
          id: 'prog-github-hub',
          title: 'GitHub রিপোজিটরি হাব',
          badge: 'rsk934128-dot',
          badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
          description: 'শেখ ফরিদের ১৩৯+ ওপেন সোর্স প্রজেক্ট, গিট ক্লোন ও সোর্স কোড ব্রাউজার',
          icon: FolderGit2,
          iconBg: 'bg-purple-600',
          iconColor: 'text-white',
          action: () => onOpenUniversalApps('github'),
        },
        {
          id: 'prog-architecture',
          title: 'AI আর্কিটেকচার ব্লুপ্রিন্ট',
          badge: 'Blueprint',
          badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
          description: 'Claude বা ChatGPT-এর মতো নিজস্ব ফুল-স্ট্যাক AI অ্যাপ বানানোর রোডম্যাপ',
          icon: Layers,
          iconBg: 'bg-stone-800 dark:bg-stone-700',
          iconColor: 'text-amber-400',
          action: onOpenArchitecture,
        },
      ],
    },
    {
      title: '🤖 স্মার্ট এআই সার্ভিসেস ও জনসেবা',
      items: [
        {
          id: 'prog-freelance',
          title: '২৪/৭ রিমোট জব এআই এজেন্ট',
          badge: 'Autonomous',
          badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
          description: 'Upwork ও Remote জব ম্যাচিং, কভার লেটার ও ক্লায়েন্ট প্রপোজাল তৈরি',
          icon: Bot,
          iconBg: 'bg-emerald-600',
          iconColor: 'text-white',
          action: onOpenFreelanceAgent,
        },
        {
          id: 'prog-citizen',
          title: 'A-Z জনসেবা ও তথ্য নির্দেশিকা',
          badge: 'Govt & Citizen',
          badgeColor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300',
          description: 'জরুরি হটলাইন (৯৯৯, ৩৩৩), পোস্টকোড ফাইন্ডার, এনআইডি ও দরখাস্ত/জিডি রাইটার',
          icon: ShieldCheck,
          iconBg: 'bg-teal-600',
          iconColor: 'text-white',
          action: onOpenCitizenServices,
        },
        {
          id: 'prog-location',
          title: 'লাইভ লোকেশন ও জিপিএস নির্দেশিকা',
          badge: 'GPS Maps',
          badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
          description: 'রিয়েল-টাইম অক্ষাংশ-দ্রাঘিমাংশ, ঠিকানা ও গুগল ম্যাপস সরাসরি শেয়ার',
          icon: MapPin,
          iconBg: 'bg-rose-600',
          iconColor: 'text-white',
          action: onOpenLiveLocation,
        },
      ],
    },
    {
      title: '📊 ক্লাউড, অ্যানালিটিক্স ও মিডিয়া স্টুডিও',
      items: [
        {
          id: 'prog-metrics',
          title: 'প্রজেক্ট মেট্রিক্স ও অ্যানালিটিক্স',
          badge: 'Recharts',
          badgeColor: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
          description: 'চ্যাট পরিসংখ্যান, টোকেন গ্রাফ, গিটহাব ও রিয়েল-টাইম পারফরম্যান্স চার্ট',
          icon: BarChart3,
          iconBg: 'bg-indigo-600',
          iconColor: 'text-white',
          action: onOpenMetrics,
        },
        {
          id: 'prog-drive',
          title: 'Google Drive ক্লাউড স্টুডিও',
          badge: 'Cloud Sync',
          badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
          description: 'গুগল ড্রাইভ ফাইল ব্রাউজার ও সরাসরি সোর্স কোড এআই চ্যাটে ইম্পোর্ট',
          icon: HardDrive,
          iconBg: 'bg-amber-600',
          iconColor: 'text-white',
          action: onOpenGoogleDrive,
        },
        {
          id: 'prog-browser',
          title: 'মিনি গুগল ওয়েব ব্রাউজার',
          badge: 'Web & Search',
          badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
          description: 'অ্যাপের ভেতরেই লাইভ গুগল সার্চ, উইকিপিডিয়া ও ওয়েব সাইট ব্রাউজিং',
          icon: Globe,
          iconBg: 'bg-blue-600',
          iconColor: 'text-white',
          action: () => miniBrowser.openBrowser(),
        },
        {
          id: 'prog-music',
          title: 'ইউটিউব গান ও মিডিয়া স্টুডিও',
          badge: 'Media',
          badgeColor: 'bg-red-500/15 text-red-700 dark:text-red-300',
          description: 'ইন-অ্যাপ ব্যাকগ্রাউন্ড মিউজিক প্লেয়ার, কোডিং ও স্টাডি বিটস',
          icon: Youtube,
          iconBg: 'bg-red-600',
          iconColor: 'text-white',
          action: () => {
            if (musicPlayer.currentTrack) {
              musicPlayer.expandPlayer();
            } else {
              musicPlayer.playTrack({
                videoId: 'jfKfPfyJRdk',
                title: 'Lofi Girl - Chill Beats to Code & Study To',
                originalUrl: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
                searchQuery: 'Lofi Girl',
              });
            }
          },
        },
        {
          id: 'prog-tts',
          title: 'সহকারীর পড়ার গতি ও কণ্ঠ (TTS)',
          badge: 'Voice Engine',
          badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-300',
          description: 'বাংলা ও ইংরেজি টেক্সট-টু-স্পিচ পড়ার গতি ও কণ্ঠ সেটিংস',
          icon: Volume2,
          iconBg: 'bg-purple-600',
          iconColor: 'text-white',
          action: onOpenTTSSettings,
        },
        {
          id: 'prog-founder',
          title: 'প্রতিষ্ঠাতা ও সুপার অ্যাডমিন প্রোফাইল',
          badge: 'Founder',
          badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
          description: 'শেখ ফরিদ — সফটওয়্যার আর্কিটেক্ট ও হোটেল আল শেখ ফরিদ (সিরাজগঞ্জ)',
          icon: Crown,
          iconBg: 'bg-amber-600',
          iconColor: 'text-white',
          action: onOpenFounderProfile,
        },
        {
          id: 'prog-hosting',
          title: 'হোস্টিং ও সার্ভার ডায়াগনস্টিক',
          badge: 'Diagnostics',
          badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
          description: 'Gemini 3.8 Flash এপিআই হেলথ চেক ও ক্লাউড রান স্ট্যাটাস',
          icon: Server,
          iconBg: 'bg-emerald-700',
          iconColor: 'text-white',
          action: onOpenHostingDiagnostic,
        },
      ],
    },
  ];

  // Filter items by search query
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          !searchQuery.trim() ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div
      id="mobile-programs-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="mobile-programs-modal-content"
        className="relative w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="flex sm:hidden justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
        </div>

        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/80 dark:bg-stone-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>সকল প্রোগ্রাম ও টুলকিট</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                  Mobile Hub
                </span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                এক স্পর্শে যেকোনো প্রোগ্রাম ওপেন করুন
              </p>
            </div>
          </div>

          <button
            id="close-mobile-programs-btn"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input for Quick Finding */}
        <div className="p-3.5 border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-100/50 dark:bg-stone-900/40 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="যেকোনো প্রোগ্রাম বা টুল খুঁজুন (যেমন: ইমেইল, ট্রেডিং, জিমেইল, হটলাইন)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Programs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center space-y-2 text-stone-500 dark:text-stone-400">
              <Search className="w-8 h-8 mx-auto opacity-30" />
              <p className="font-semibold text-sm">কোনো প্রোগ্রাম খুঁজে পাওয়া যায়নি</p>
              <p className="text-xs">অন্য শব্দ বা বাংলায় লিখে সার্চ করুন।</p>
            </div>
          ) : (
            filteredCategories.map((cat, cIdx) => (
              <div key={cIdx} className="space-y-2.5">
                <h3 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider px-1">
                  {cat.title}
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        id={item.id}
                        type="button"
                        onClick={() => handleProgramClick(item.action)}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-stone-50/90 dark:bg-stone-800/60 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-stone-200/80 dark:border-stone-700/80 hover:border-emerald-500/40 text-left transition-all group cursor-pointer active:scale-98 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                                {item.title}
                              </h4>
                              {item.badge && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${item.badgeColor || 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200'} shrink-0`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mt-0.5 leading-snug">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="w-7 h-7 rounded-lg bg-stone-200/60 dark:bg-stone-700/60 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                          <ChevronRight className="w-4 h-4 text-stone-500 dark:text-stone-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 shrink-0">
          <span>📱 মোবাইল টাচ স্ক্রিন অপটিমাইজড</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 font-semibold text-stone-800 dark:text-stone-200 cursor-pointer transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
