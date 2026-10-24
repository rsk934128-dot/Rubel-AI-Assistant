import React, { useState } from 'react';
import {
  X,
  Mail,
  Globe,
  ShieldCheck,
  Shield,
  Bot,
  BarChart3,
  MapPin,
  Layers,
  HardDrive,
  Youtube,
  Search,
  Volume2,
  Crown,
  Download,
  Share2,
  Code2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Cpu,
  Smartphone,
  ExternalLink,
  Scan,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { UniversalTab } from './UniversalAppsConnectModal';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useMiniBrowser } from '../context/MiniBrowserContext';

export interface MobileProgramsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEmailComposer: () => void;
  onOpenUniversalApps: (tab?: UniversalTab) => void;
  onOpenCitizenServices: () => void;
  onOpenFreelanceAgent: () => void;
  onOpenMetrics: () => void;
  onOpenLiveLocation: () => void;
  onOpenArchitecture: () => void;
  onOpenGoogleDrive: () => void;
  onOpenMusicPlayer?: () => void;
  onOpenMiniBrowser?: () => void;
  onOpenTTSSettings: () => void;
  onOpenFounderProfile: () => void;
  onOpenVisionStudio?: () => void;
  onOpenYouTube?: () => void;
  onOpenExportChat: () => void;
  onOpenShareModal: () => void;
  onOpenShareReceiver?: () => void;
  onOpenRubelNetManager?: () => void;
  onOpenTradingBot?: () => void;
  onOpenAndroidApk?: () => void;
}

interface ProgramItem {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  category: 'core' | 'comms' | 'citizen' | 'tools' | 'profile';
  badge: string;
  icon: any;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  action: () => void;
}

export const MobileProgramsHubModal: React.FC<MobileProgramsHubModalProps> = ({
  isOpen,
  onClose,
  onOpenEmailComposer,
  onOpenUniversalApps,
  onOpenCitizenServices,
  onOpenFreelanceAgent,
  onOpenMetrics,
  onOpenLiveLocation,
  onOpenArchitecture,
  onOpenGoogleDrive,
  onOpenMusicPlayer,
  onOpenMiniBrowser,
  onOpenTTSSettings,
  onOpenFounderProfile,
  onOpenVisionStudio,
  onOpenYouTube,
  onOpenExportChat,
  onOpenShareModal,
  onOpenShareReceiver,
  onOpenRubelNetManager,
  onOpenTradingBot,
  onOpenAndroidApk,
}) => {
  const musicPlayer = useMusicPlayer();
  const miniBrowser = useMiniBrowser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const handleLaunch = (action: () => void) => {
    onClose();
    setTimeout(() => {
      action();
    }, 120);
  };

  const programs: ProgramItem[] = [
    {
      id: 'android-apk-release',
      titleBn: 'অ্যান্ড্রয়েড এপিকে রিলিজ (GitHub) 📱',
      titleEn: 'GitHub Android APK Release Hub',
      descBn: 'GitHub Actions স্বয়ংক্রিয় CI/CD পাইপলাইনের মাধ্যমে অ্যান্ড্রয়েড APK তৈরি, রিলিজ ও ইনস্টলেশন গাইড।',
      descEn: 'Automated GitHub Actions workflow for building, tagging, releasing and installing the Android APK package.',
      category: 'tools',
      badge: 'APK CI/CD',
      icon: Smartphone,
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      colorBorder: 'border-emerald-300 dark:border-emerald-700',
      action: () => (onOpenAndroidApk ? onOpenAndroidApk() : null),
    },
    {
      id: 'trading-bot',
      titleBn: 'ট্রেডিং এআই বট 📊',
      titleEn: 'Real-Time Screen Trading Bot',
      descBn: 'Quotex, Pocket Option, Binance বা TradingView চার্ট রিয়েল-টাইম স্ক্যান করে নিখুঁত Buy/Sell সিগন্যাল ও ১-ক্লিক ট্রেড এক্সিকিউশন।',
      descEn: 'Live screen vision AI bot that reads candlestick charts and executes simulated or automated Buy/Sell signals.',
      category: 'core',
      badge: 'LIVE BOT',
      icon: TrendingUp,
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      colorBorder: 'border-emerald-300 dark:border-emerald-700',
      action: () => (onOpenTradingBot ? onOpenTradingBot() : null),
    },
    {
      id: 'vision-studio',
      titleBn: 'AI-Vision Studio 1.0 👁️',
      titleEn: 'Visual Intelligence & OCR Studio',
      descBn: 'প্রতিষ্ঠাতা শেখ ফরিদের মাল্টিমোডাল ভিশন স্টুডিও - অবজেক্ট ডিটেকশন, বাউন্ডিং বক্স, OCR, স্কেচ-টু-কোড ও বাংলা ভয়েস সিন্ক।',
      descEn: 'Multimodal vision studio with live camera snap, bounding box detection, OCR extraction, and wireframe-to-code.',
      category: 'core',
      badge: 'Vision AI',
      icon: Scan,
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      colorBorder: 'border-emerald-200 dark:border-emerald-800',
      action: () => (onOpenVisionStudio ? onOpenVisionStudio() : null),
    },
    {
      id: 'youtube-studio',
      titleBn: 'YouTube স্টুডিও ও চ্যানেল 🎬',
      titleEn: 'YouTube Channel & Video Hub',
      descBn: 'ইউটিউব চ্যানেলের ভিডিও, প্লেলিস্ট, আপলোডস, সাবস্ক্রাইবার মেট্রিক্স ও জেমিনি এআই এসইও অডিট।',
      descEn: 'Connect your YouTube channel to browse videos, view playlist contents, inspect metrics, and generate AI SEO tags.',
      category: 'core',
      badge: 'YouTube',
      icon: Youtube,
      colorBg: 'bg-red-50 dark:bg-red-950/60',
      colorText: 'text-red-600 dark:text-red-400',
      colorBorder: 'border-red-200 dark:border-red-800',
      action: () => (onOpenYouTube ? onOpenYouTube() : null),
    },
    {
      id: 'rubelnet-manager',
      titleBn: 'RubelNet Firebase Manager 🛡️',
      titleEn: 'The Sovereign Grid for Firebase',
      descBn: 'Next.js 15, Firebase Custom Claims RBAC, Realtime Log Viewer, Genkit Gemini AI, Node Manager ও Dexie.js অফলাইন সিঙ্ক।',
      descEn: 'Command center for Firebase project administrators with granular RBAC, realtime stream, and Genkit AI ops.',
      category: 'core',
      badge: 'Sovereign',
      icon: Shield,
      colorBg: 'bg-emerald-950/80 dark:bg-emerald-950/90',
      colorText: 'text-emerald-400',
      colorBorder: 'border-emerald-500/40',
      action: () => (onOpenRubelNetManager ? onOpenRubelNetManager() : null),
    },
    {
      id: 'share-receiver',
      titleBn: 'বহিরাগত প্ল্যাটফর্ম শেয়ার হাব',
      titleEn: 'Universal Inbound Share Hub',
      descBn: 'ফেসবুক, ইউটিউব, হোয়াটসঅ্যাপ, গ্যালারি বা যেকোনো অ্যাপ থেকে ফাইল, ছবি, লিংক ও লেখা সরাসরি গ্রহণ ও এআই বিশ্লেষণ।',
      descEn: 'Receive files, photos, links, and text from WhatsApp, Facebook, Gallery & Web via Web Share Target.',
      category: 'tools',
      badge: 'নতুন',
      icon: Share2,
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      colorBorder: 'border-emerald-200 dark:border-emerald-800',
      action: () => (onOpenShareReceiver ? onOpenShareReceiver() : onOpenShareModal()),
    },
    {
      id: 'email-composer',
      titleBn: 'ইমেইল কম্পোজার ও ড্রাফটার',
      titleEn: 'Professional Email Composer',
      descBn: 'বাংলা ও ইংরেজিতে নির্ভুল অফিশিয়াল ইমেইল ড্রাফট, এডিটিং, এক্সপোর্ট (.eml, .txt, .html) ও সরাসরি জিমেইল ওপেন।',
      descEn: 'Draft, polish, and export professional business emails in Bengali & English with AI assistance.',
      category: 'comms',
      badge: 'জনপ্রিয়',
      icon: Mail,
      colorBg: 'bg-teal-50 dark:bg-teal-950/60',
      colorText: 'text-teal-600 dark:text-teal-400',
      colorBorder: 'border-teal-200 dark:border-teal-800',
      action: onOpenEmailComposer,
    },
    {
      id: 'universal-apps',
      titleBn: 'সকল অ্যাপস ও কানেক্ট হাব',
      titleEn: 'Universal Apps & Gmail Connect Hub',
      descBn: 'Gmail, WhatsApp, SMS, Google Maps, শেখ ফরিদ রিপোজিটরি ও ডায়নামিক ডিএনএস রিমোট কানেকশন।',
      descEn: 'Launcher for Gmail, WhatsApp messaging, SMS, Google Maps, and Sheikh Farid repositories.',
      category: 'comms',
      badge: 'কানেক্ট',
      icon: Globe,
      colorBg: 'bg-blue-50 dark:bg-blue-950/60',
      colorText: 'text-blue-600 dark:text-blue-400',
      colorBorder: 'border-blue-200 dark:border-blue-800',
      action: () => onOpenUniversalApps('apps'),
    },
    {
      id: 'citizen-services',
      titleBn: 'A-Z জনসেবা ও জরুরি তথ্য কেন্দ্র',
      titleEn: 'Citizen Services & Emergency Directory',
      descBn: 'জাতীয় জরুরি হটলাইন (৯৯৯, ৩৩৩), পোস্টকোড ফাইন্ডার, এনআইডি ও সিম মালিকানা যাচাই এবং জিডি/দরখাস্ত ড্রাফটার।',
      descEn: 'Emergency hotlines (999, 333), postal codes, NID verification guide, and formal application writer.',
      category: 'citizen',
      badge: 'জরুরি সেবা',
      icon: ShieldCheck,
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      colorBorder: 'border-emerald-200 dark:border-emerald-800',
      action: onOpenCitizenServices,
    },
    {
      id: 'freelance-agent',
      titleBn: '২৪/৭ রিমোট জব এআই এজেন্ট',
      titleEn: 'Autonomous Remote Freelance Agent',
      descBn: 'Upwork, RemoteOK ও LinkedIn এ স্বয়ংক্রিয় জব হান্টিং, ক্লায়েন্ট প্রপোজাল তৈরি ও অটোমেটেড কোডিং ডেলিভারি।',
      descEn: 'Autonomous freelance hunting, winning proposals, and code generation workflow engine.',
      category: 'core',
      badge: 'স্বয়ংক্রিয়',
      icon: Bot,
      colorBg: 'bg-purple-50 dark:bg-purple-950/60',
      colorText: 'text-purple-600 dark:text-purple-400',
      colorBorder: 'border-purple-200 dark:border-purple-800',
      action: onOpenFreelanceAgent,
    },
    {
      id: 'project-metrics',
      titleBn: 'মেট্রিক্স ও গ্রাফ অ্যানালিটিক্স',
      titleEn: 'Project Metrics & Analytics Charts',
      descBn: 'Recharts চালিত রিয়েল-টাইম চার্ট, টোকেন খরচ, জেমিনি রেসপন্স পারফরম্যান্স ও GitHub রিপোজিটরির স্ট্যাটস।',
      descEn: 'Interactive Recharts dashboard tracking tokens, response latency, and GitHub repository metrics.',
      category: 'tools',
      badge: 'Recharts',
      icon: BarChart3,
      colorBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      colorText: 'text-indigo-600 dark:text-indigo-400',
      colorBorder: 'border-indigo-200 dark:border-indigo-800',
      action: onOpenMetrics,
    },
    {
      id: 'live-location',
      titleBn: 'লাইভ জিপিএস ও ম্যাপ লোকেশন',
      titleEn: 'Live GPS Location & Maps',
      descBn: 'ডিভাইসের লাইভ অক্ষাংশ/দ্রাঘিমাংশ, গতিবেগ নির্ণয় ও সরাসরি গুগল ম্যাপসে এক ক্লিকে দেখার সুবিধা।',
      descEn: 'Real-time GPS device coordinates, speed tracker, and Google Maps direct launcher.',
      category: 'tools',
      badge: 'জিপিএস',
      icon: MapPin,
      colorBg: 'bg-rose-50 dark:bg-rose-950/60',
      colorText: 'text-rose-600 dark:text-rose-400',
      colorBorder: 'border-rose-200 dark:border-rose-800',
      action: onOpenLiveLocation,
    },
    {
      id: 'architecture-guide',
      titleBn: 'AI আর্কিটেকচার ব্লুপ্রিন্ট',
      titleEn: 'AI Cloud Architecture Blueprint',
      descBn: 'কোটি টাকার জিপিইউ ছাড়াই Gemini API, Express ব্যাকএন্ড ও React দিয়ে নিজস্ব AI অ্যাপ তৈরির সম্পূর্ণ রোডম্যাপ।',
      descEn: 'Architectural blueprints for deploying scalable LLM products without costly GPU clusters.',
      category: 'core',
      badge: 'ব্লুপ্রিন্ট',
      icon: Layers,
      colorBg: 'bg-amber-50 dark:bg-amber-950/60',
      colorText: 'text-amber-600 dark:text-amber-400',
      colorBorder: 'border-amber-200 dark:border-amber-800',
      action: onOpenArchitecture,
    },
    {
      id: 'google-drive',
      titleBn: 'গুগল ড্রাইভ স্টোরেজ হাব',
      titleEn: 'Google Drive Cloud Storage',
      descBn: 'ক্লাউড ফাইল ভিউয়ার, ড্রাইভ ডকুমেন্ট ও কোড ফাইল সরাসরি চ্যাট বক্সে ইম্পোর্ট করার ওয়ার্কস্পেস।',
      descEn: 'Browse Google Drive files and import documentation or source code directly into chat.',
      category: 'tools',
      badge: 'ক্লাউড',
      icon: HardDrive,
      colorBg: 'bg-amber-50 dark:bg-amber-950/60',
      colorText: 'text-amber-600 dark:text-amber-400',
      colorBorder: 'border-amber-200 dark:border-amber-800',
      action: onOpenGoogleDrive,
    },
    {
      id: 'youtube-music',
      titleBn: 'ইউটিউব অটো-কন্টিনিউয়াস গান 🎵',
      titleEn: 'YouTube Auto-Continuous Player',
      descBn: 'একের পর এক গান স্বয়ংক্রিয়ভাবে চলা, সময় অনুযায়ী নতুন গান আপডেট ও পূর্বে শোনা গান পুনরায় শোনার প্লেলিস্ট।',
      descEn: 'Continuous sequential YouTube playback, dynamic time-of-day feed, and listening history replay.',
      category: 'tools',
      badge: 'অটো-প্লে',
      icon: Youtube,
      colorBg: 'bg-red-50 dark:bg-red-950/60',
      colorText: 'text-red-600 dark:text-red-400',
      colorBorder: 'border-red-200 dark:border-red-800',
      action: () => {
        if (onOpenMusicPlayer) {
          onOpenMusicPlayer();
        } else if (musicPlayer.currentTrack) {
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
      id: 'mini-browser',
      titleBn: 'মিনি গুগল ব্রাউজার ও ওয়েব',
      titleEn: 'In-App Mini Google Browser',
      descBn: 'অ্যাপ ত্যাগ না করেই গুগল সার্চ ও লাইভ ওয়েবসাইট সরাসরি ব্রাউজ করার মিনি ওয়েব ব্রাউজার।',
      descEn: 'Search Google, browse documentation, and view web pages directly inside the app.',
      category: 'tools',
      badge: 'ব্রাউজার',
      icon: Search,
      colorBg: 'bg-blue-50 dark:bg-blue-950/60',
      colorText: 'text-blue-600 dark:text-blue-400',
      colorBorder: 'border-blue-200 dark:border-blue-800',
      action: () => {
        if (onOpenMiniBrowser) {
          onOpenMiniBrowser();
        } else {
          miniBrowser.openBrowser();
        }
      },
    },
    {
      id: 'tts-settings',
      titleBn: 'ভয়েস স্পিড ও পড়ার সেটিংস',
      titleEn: 'TTS Voice Speed & Pitch Controls',
      descBn: 'সহকারীর কণ্ঠস্বর, কথা বলার গতি (Speech Rate) ও পিচ নিজের সুবিধামতো পরিবর্তন করুন।',
      descEn: 'Configure Bengali & English Text-to-Speech playback speed, voice pitch, and audio preview.',
      category: 'tools',
      badge: 'ভয়েস',
      icon: Volume2,
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      colorBorder: 'border-emerald-200 dark:border-emerald-800',
      action: onOpenTTSSettings,
    },
    {
      id: 'founder-profile',
      titleBn: 'ডিজিটাল স্মার্ট প্রোফাইল আইডি কার্ড ও এডিটর',
      titleEn: 'Digital Smart Profile ID Card & Editor',
      descBn: 'শেখ ফরিদ (Sheikh Farid)-এর অফিসিয়াল স্মার্ট আইডি কার্ড দেখুন, প্রিন্ট করুন ও নিজের প্রোফাইল আইডি তথ্য আপডেট/তৈরি করুন।',
      descEn: 'Official verified Smart Digital ID Card, credential badges, and profile ID editor studio.',
      category: 'profile',
      badge: 'স্মার্ট আইডি',
      icon: Crown,
      colorBg: 'bg-amber-50 dark:bg-amber-950/60',
      colorText: 'text-amber-600 dark:text-amber-400',
      colorBorder: 'border-amber-200 dark:border-amber-800',
      action: onOpenFounderProfile,
    },
    {
      id: 'export-chat',
      titleBn: 'চ্যাট হিস্টোরি এক্সপোর্ট',
      titleEn: 'Export Chat (PDF, JSON, MD)',
      descBn: 'বর্তমান কথোপকথন অফলাইনে ব্যবহারের জন্য ফরম্যাটেড PDF, JSON বা Markdown ফাইলে ডাউনলোড করুন।',
      descEn: 'Export conversations into clean PDFs with typography, raw JSON backup, or Markdown.',
      category: 'tools',
      badge: 'ডাউনলোড',
      icon: Download,
      colorBg: 'bg-stone-100 dark:bg-stone-800',
      colorText: 'text-stone-700 dark:text-stone-300',
      colorBorder: 'border-stone-200 dark:border-stone-700',
      action: onOpenExportChat,
    },
    {
      id: 'share-app',
      titleBn: 'সোশ্যাল মিডিয়া শেয়ারিং',
      titleEn: 'Share Studio & Links',
      descBn: 'WhatsApp, Facebook, Twitter, Telegram বা ডিভাইসের নেটিভ শেয়ার মেনুতে অ্যাপের লিঙ্ক শেয়ার করুন।',
      descEn: 'Share this intelligent studio or active conversations across all social messaging platforms.',
      category: 'tools',
      badge: 'শেয়ার',
      icon: Share2,
      colorBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      colorText: 'text-emerald-600 dark:text-emerald-400',
      colorBorder: 'border-emerald-200 dark:border-emerald-800',
      action: onOpenShareModal,
    },
  ];

  const categories = [
    { id: 'all', label: 'সব প্রোগ্রাম' },
    { id: 'comms', label: 'ইমেইল ও মেসেজিং' },
    { id: 'citizen', label: 'জনসেবা ও জরুরি' },
    { id: 'core', label: 'এআই ও এজেন্ট' },
    { id: 'tools', label: 'টুলস ও অ্যানালিটিক্স' },
    { id: 'profile', label: 'প্রোফাইল' },
  ];

  const filtered = programs.filter((p) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      p.titleBn.toLowerCase().includes(query) ||
      p.titleEn.toLowerCase().includes(query) ||
      p.descBn.toLowerCase().includes(query) ||
      p.descEn.toLowerCase().includes(query);
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  return (
    <div
      id="mobile-programs-hub-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="mobile-programs-hub-sheet"
        className="relative w-full sm:max-w-3xl h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-stone-900 border-t sm:border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100 animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                  মোবাইল হাব
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                  {programs.length}টি প্রোগ্রাম
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                সকল প্রোগ্রাম ও মোবাইল টুলকিট
              </h2>
            </div>
          </div>

          <button
            id="close-mobile-programs-hub-btn"
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রোগ্রাম খুঁজুন (যেমন: ইমেইল, জব, জনসেবা, ম্যাপ, মিউজিক)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto scrollbar-none pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[34px] flex items-center ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750 border border-stone-200/80 dark:border-stone-700/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Programs List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-500 dark:text-stone-400 space-y-2">
              <Smartphone className="w-10 h-10 mx-auto text-stone-400" />
              <p className="text-sm font-semibold">কোনো প্রোগ্রাম পাওয়া যায়নি</p>
              <p className="text-xs">অন্য শব্দ লিখে খুঁজুন অথবা ক্যাটাগরি ফিল্টার রিসেট করুন।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filtered.map((p) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.id}
                    id={`mobile-hub-program-${p.id}`}
                    type="button"
                    onClick={() => handleLaunch(p.action)}
                    className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-stone-50 dark:bg-stone-850/80 hover:bg-white dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-750/80 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs hover:shadow-md transition-all flex items-start gap-3.5 group cursor-pointer min-h-[72px] active:scale-[0.98]"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl ${p.colorBg} ${p.colorText} ${p.colorBorder} border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                          {p.badge}
                        </span>
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                        {p.titleBn}
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed mt-0.5">
                        {p.descBn}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Bar Info */}
        <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/90 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium">মোবাইল টাচ অপ্টিমাইজড ও রেসপন্সিভ</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold text-xs hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
