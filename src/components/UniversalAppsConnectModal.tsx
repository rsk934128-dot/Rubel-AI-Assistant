import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  MessageSquare,
  FolderGit2,
  GitBranch,
  HardDrive,
  Youtube,
  MapPin,
  Globe,
  Users,
  UserPlus,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Search,
  Phone,
  Trash2,
  ChevronRight,
  RefreshCw,
  Star,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Share2,
  Terminal,
  Network,
  AlertCircle,
  TrendingUp,
  LineChart
} from 'lucide-react';
import { useMiniBrowser } from '../context/MiniBrowserContext';

export type UniversalTab = 'apps' | 'gmail' | 'message' | 'github' | 'people' | 'ddns';

interface UniversalAppsConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (prompt: string) => void;
  onOpenGoogleDrive?: () => void;
  onOpenEmailComposer?: () => void;
  initialTab?: UniversalTab;
}

interface SavedContact {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  github?: string;
  notes?: string;
  category: 'team' | 'client' | 'developer' | 'citizen';
}

interface GitHubRepoItem {
  id: number | string;
  name: string;
  html_url: string;
  description: string | null;
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
  updated_at?: string;
}

// Verified list of top flagship projects for rsk934128-dot (Sheikh Farid)
const DEFAULT_SHEIKH_FARID_REPOS: GitHubRepoItem[] = [
  {
    id: 1,
    name: 'DeepMind-Science-Discovery-Workbench',
    html_url: 'https://github.com/rsk934128-dot/DeepMind-Science-Discovery-Workbench',
    description: 'DeepMind Science Discovery Workbench — অত্যাধুনিক বৈজ্ঞানিক গবেষণা, প্রোটিন মডেলিং ও সিমুলেশন প্ল্যাটফর্ম।',
    language: 'TypeScript',
    stargazers_count: 5,
    updated_at: '2026-10-14',
  },
  {
    id: 2,
    name: 'Sheikh-Farid-AI-Studio-',
    html_url: 'https://github.com/rsk934128-dot/Sheikh-Farid-AI-Studio-',
    description: 'শেখ ফরিদ AI Studio — পূর্ণাঙ্গ ফুল-স্ট্যাক কৃত্রিম বুদ্ধিমত্তা সহকারী ও অটোমেটেড কোডিং স্টুডিও।',
    language: 'TypeScript',
    stargazers_count: 8,
    updated_at: '2026-10-14',
  },
  {
    id: 3,
    name: 'Sheikh-Farid-AI-Studio-Project-Hub',
    html_url: 'https://github.com/rsk934128-dot/Sheikh-Farid-AI-Studio-Project-Hub',
    description: 'শেখ ফরিদ AI Studio & Project Hub — মাল্টি-রিপোজিটরি ইকোসিস্টেম ও প্রজেক্ট কোঅর্ডিনেশন হাব।',
    language: 'TypeScript',
    stargazers_count: 4,
    updated_at: '2026-10-13',
  },
  {
    id: 4,
    name: 'Stripe-Gmail-Payment-Gateway-Hub',
    html_url: 'https://github.com/rsk934128-dot/Stripe-Gmail-Payment-Gateway-Hub',
    description: 'Stripe & Gmail Payment Gateway Hub — সিকিউর পেমেন্ট গেটওয়ে এবং অটোমেটেড জিমেইল রিসিট ডিসবার্সমেন্ট সিস্টেম।',
    language: 'JavaScript',
    stargazers_count: 6,
    updated_at: '2026-10-12',
  },
  {
    id: 5,
    name: 'AI-Assistant-Coding-Studio',
    html_url: 'https://github.com/rsk934128-dot/AI-Assistant-Coding-Studio',
    description: 'AI-Assistant-Coding-Studio — ফ্ল্যাগশিপ রিয়েল-টাইম কোডিং সহকারী, লাইভ কম্পাইলার ও ক্লাউড সিঙ্ক।',
    language: 'TypeScript',
    stargazers_count: 12,
    updated_at: '2026-10-11',
  },
  {
    id: 6,
    name: 'PayHub-Gateway-Gmail-Disbursement-PWA',
    html_url: 'https://github.com/rsk934128-dot/PayHub-Gateway-Gmail-Disbursement-PWA',
    description: 'PayHub Gateway & Gmail Disbursement PWA — অফলাইন-ফার্স্ট পেমেন্ট গেটওয়ে ও পে-রোল ম্যানেজমেন্ট।',
    language: 'TypeScript',
    stargazers_count: 7,
    updated_at: '2026-10-10',
  },
  {
    id: 7,
    name: 'No-IP-DNS-Remote-Access',
    html_url: 'https://github.com/rsk934128-dot/No-IP-DNS-Remote-Access',
    description: 'No-IP ডায়নামিক ডিএনএস ও রিমোট সার্ভার অ্যাক্সেস অটোমেশন টুলকিট।',
    language: 'Shell',
    stargazers_count: 3,
    updated_at: '2026-10-09',
  },
];

const INITIAL_CONTACTS: SavedContact[] = [
  {
    id: 'contact-sheikh-farid',
    name: 'শেখ ফরিদ (Sheikh Farid)',
    role: 'Founder & Software Architect (RubelPay)',
    email: 'sheikhfaridvisa164@gmail.com',
    phone: '+8801700000000',
    github: 'https://github.com/rsk934128-dot',
    notes: 'সিরাজগঞ্জ, বাংলাদেশ। ফ্ল্যাগশিপ প্রজেক্ট: ScrollVerse, RubelPay, Sheikh Code Exchange।',
    category: 'team',
  },
  {
    id: 'contact-emergency-999',
    name: 'জাতীয় জরুরি সেবা (National Emergency Service)',
    role: 'পুলিশ, অ্যাম্বুলেন্স ও ফায়ার সার্ভিস (999)',
    phone: '999',
    notes: 'টোল-ফ্রি ২৪ ঘণ্টা বাংলাদেশ জরুরি হেল্পলাইন।',
    category: 'citizen',
  },
  {
    id: 'contact-govt-333',
    name: 'জাতীয় তথ্য ও সেবা বাতায়ন (333)',
    role: 'সরকারি তথ্য ও সামাজিক সমস্যা প্রতিকার',
    phone: '333',
    notes: 'কল সেন্টারের মাধ্যমে সকল সরকারি দপ্তর ও সেবা সম্পর্কিত তথ্য।',
    category: 'citizen',
  },
];

export const UniversalAppsConnectModal: React.FC<UniversalAppsConnectModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
  onOpenGoogleDrive,
  onOpenEmailComposer,
  initialTab = 'apps',
}) => {
  const miniBrowser = useMiniBrowser();
  const [activeTab, setActiveTab] = useState<UniversalTab>(initialTab);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Gmail State
  const [gmailTo, setGmailTo] = useState('');
  const [gmailSubject, setGmailSubject] = useState('');
  const [gmailBody, setGmailBody] = useState('');

  // Message State
  const [msgPhone, setMsgPhone] = useState('');
  const [msgText, setMsgText] = useState('');

  // GitHub Repos State
  const [repos, setRepos] = useState<GitHubRepoItem[]>(DEFAULT_SHEIKH_FARID_REPOS);
  const [repoSearch, setRepoSearch] = useState('');
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [githubUser, setGithubUser] = useState<any>(null);

  // Contacts / People State
  const [contacts, setContacts] = useState<SavedContact[]>(() => {
    try {
      const saved = localStorage.getItem('ai_universal_contacts');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return INITIAL_CONTACTS;
  });
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<SavedContact>>({
    name: '',
    role: '',
    email: '',
    phone: '',
    github: '',
    category: 'developer',
  });

  // No-IP Dynamic DNS State
  const [ddnsHostname, setDdnsHostname] = useState('office.ddns.net');
  const [ddnsUsername, setDdnsUsername] = useState('sheikhfarid164@gmail.com');
  const [ddnsPassword, setDdnsPassword] = useState('Rubel007*#@');
  const [ddnsIp, setDdnsIp] = useState('203.38.213.22');
  const [isUpdatingDdns, setIsUpdatingDdns] = useState(false);
  const [isDetectingIp, setIsDetectingIp] = useState(false);
  const [ddnsResponse, setDdnsResponse] = useState<any>(null);

  const handleDetectMyIp = async () => {
    setIsDetectingIp(true);
    try {
      const res = await fetch('/api/ddns/my-ip');
      if (res.ok) {
        const data = await res.json();
        if (data.ip) setDdnsIp(data.ip);
      }
    } catch (e) {
      console.warn('IP detect error:', e);
    } finally {
      setIsDetectingIp(false);
    }
  };

  const handleUpdateDdns = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingDdns(true);
    setDdnsResponse(null);
    try {
      const res = await fetch('/api/ddns/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostname: ddnsHostname,
          username: ddnsUsername,
          password: ddnsPassword,
          myip: ddnsIp,
        }),
      });
      const data = await res.json();
      setDdnsResponse(data);
    } catch (err: any) {
      setDdnsResponse({
        success: false,
        code: 'error',
        messageBn: 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।',
        messageEn: err?.message || 'Network error',
      });
    } finally {
      setIsUpdatingDdns(false);
    }
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Fetch GitHub repos & user from backend
  useEffect(() => {
    let active = true;
    const fetchGitHubData = async () => {
      setIsLoadingRepos(true);
      try {
        const [userRes, reposRes] = await Promise.all([
          fetch('/api/github/user').catch(() => null),
          fetch('/api/github/repos').catch(() => null),
        ]);

        if (active && userRes && userRes.ok) {
          const userData = await userRes.json();
          setGithubUser(userData);
        }

        if (active && reposRes && reposRes.ok) {
          const reposData = await reposRes.json();
          if (Array.isArray(reposData) && reposData.length > 0) {
            setRepos(reposData);
          }
        }
      } catch (e) {
        console.warn('GitHub API fetch notice:', e);
      } finally {
        if (active) setIsLoadingRepos(false);
      }
    };

    if (isOpen && activeTab === 'github') {
      fetchGitHubData();
    }

    return () => {
      active = false;
    };
  }, [isOpen, activeTab]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name?.trim()) return;

    const contact: SavedContact = {
      id: 'contact-' + Date.now(),
      name: newContact.name.trim(),
      role: newContact.role?.trim() || 'কানেকশন / টিমমেট',
      email: newContact.email?.trim() || undefined,
      phone: newContact.phone?.trim() || undefined,
      github: newContact.github?.trim() || undefined,
      notes: newContact.notes?.trim() || undefined,
      category: newContact.category || 'developer',
    };

    const updated = [contact, ...contacts];
    setContacts(updated);
    try {
      localStorage.setItem('ai_universal_contacts', JSON.stringify(updated));
    } catch (_) {}

    setNewContact({ name: '', role: '', email: '', phone: '', github: '', category: 'developer' });
    setIsAddingContact(false);
  };

  const handleDeleteContact = (id: string) => {
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    try {
      localStorage.setItem('ai_universal_contacts', JSON.stringify(updated));
    } catch (_) {}
  };

  // Build Gmail direct web compose URL
  const buildGmailComposeUrl = () => {
    const params = new URLSearchParams();
    params.set('view', 'cm');
    params.set('fs', '1');
    if (gmailTo.trim()) params.set('to', gmailTo.trim());
    if (gmailSubject.trim()) params.set('su', gmailSubject.trim());
    if (gmailBody.trim()) params.set('body', gmailBody.trim());
    return `https://mail.google.com/mail/?${params.toString()}`;
  };

  // Build mailto URL
  const buildMailtoUrl = () => {
    const to = encodeURIComponent(gmailTo.trim());
    const su = encodeURIComponent(gmailSubject.trim());
    const body = encodeURIComponent(gmailBody.trim());
    return `mailto:${to}?subject=${su}&body=${body}`;
  };

  // Build WhatsApp send URL
  const buildWhatsAppUrl = () => {
    const cleanPhone = msgPhone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(msgText.trim());
    if (cleanPhone) {
      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    }
    return `https://api.whatsapp.com/send?text=${encoded}`;
  };

  // Build SMS URL
  const buildSmsUrl = () => {
    const cleanPhone = msgPhone.trim();
    const encoded = encodeURIComponent(msgText.trim());
    return `sms:${cleanPhone}?body=${encoded}`;
  };

  if (!isOpen) return null;

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase())) ||
      (r.language && r.language.toLowerCase().includes(repoSearch.toLowerCase()))
  );

  return (
    <div
      id="universal-apps-connect-modal"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl h-full sm:h-auto sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-3xl bg-white dark:bg-stone-900 border-0 sm:border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100">
        
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Top Header */}
        <div className="px-4 sm:px-7 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">
                  Universal Hub
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono hidden sm:inline">
                  Open Apps • Gmail • Message • GitHub • Connect
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-bold text-stone-900 dark:text-stone-100 truncate mt-0.5">
                সকল অ্যাপস ওপেন, মেসেজিং ও GitHub কানেক্টর
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
              title="বন্ধ করুন (Close)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">বন্ধ করুন</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1.5 px-4 sm:px-7 py-2.5 bg-stone-100/70 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('apps')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'apps'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-850'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>সকল অ্যাপস ওপেন ও কানেক্ট</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'gmail'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-850'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>জিমেইল ও ইমেইল পাঠান</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('message')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'message'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-850'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>মেসেজ পাঠান (WhatsApp / SMS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'github'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-850'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>GitHub (rsk934128-dot)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-mono">
              139
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('people')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'people'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-850'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>মানুষের সাথে কানেক্ট করুন</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ddns')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === 'ddns'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-850'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>No-IP DDNS আপডেট</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          
          {/* TAB 1: ALL APPS LAUNCHER & CONNECT */}
          {activeTab === 'apps' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-stone-900 to-stone-900 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
                <div>
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>স্মার্ট অল-অ্যাপস ইন্টিগ্রেশন হাব</span>
                  </h3>
                  <p className="text-xs text-stone-300 mt-0.5">
                    এক ক্লিকে যেকোনো অফিসিয়াল অ্যাপস ওপেন করুন, মিনি ব্রাউজারে চালান অথবা এআই চ্যাটে কানেক্ট করুন।
                  </p>
                </div>
                {onSendToChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSendToChat('সকল অ্যাপসের লিংক ও ব্যবহার নির্দেশিকা দিন।');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>চ্যাটে পরামর্শ নিন</span>
                  </button>
                )}
              </div>

              {/* Major Apps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Gmail */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 hover:border-rose-500/40 transition-all flex flex-col justify-between gap-4 group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
                        Google Mail
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Gmail (গুগল মেইল)
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      ইমেইল পাঠানো, ইনবক্স চেক করা, অফিসিয়াল দরখাস্ত বা ব্যবসায়িক প্রস্তাব সরাসরি পাঠান।
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('gmail')}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      কম্পোজ ও পাঠান
                    </button>
                    <a
                      href="https://mail.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors"
                      title="নতুন ট্যাবে Gmail খুলুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* 2. GitHub (rsk934128-dot) */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 hover:border-purple-500/40 transition-all flex flex-col justify-between gap-4 group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                        <FolderGit2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                        rsk934128-dot
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      GitHub (শেখ ফরিদের অফিসিয়াল হাব)
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      ১৩৯+ পাবলিক ওপেন সোর্স প্রজেক্ট, গিট ক্লোন, কোড পর্যালোচনা ও কোলাবোরেশন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('github')}
                      className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      রেপো ও প্রোফাইল দেখুন
                    </button>
                    <a
                      href="https://github.com/rsk934128-dot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors"
                      title="GitHub এ খুলুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* 3. WhatsApp */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4 group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                        WhatsApp Web
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      WhatsApp মেসেজিং ও চ্যাট
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      যেকোনো নম্বরে সরাসরি প্রি-ফিল্ড মেসেজ পাঠান অথবা বন্ধুদের সাথে চ্যাট শুরু করুন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => setActiveTab('message')}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      মেসেজ পাঠান
                    </button>
                    <a
                      href="https://web.whatsapp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors"
                      title="WhatsApp Web এ যান"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* 4. Google Drive */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 hover:border-amber-500/40 transition-all flex flex-col justify-between gap-4 group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                        Cloud Drive
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Google Drive ক্লাউড ফাইলস
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      গুগল ড্রাইভ ফাইল ব্রাউজ করুন, ডাউনলোড করুন ও সরাসরি এআই চ্যাটে ইমপোর্ট করুন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    {onOpenGoogleDrive && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenGoogleDrive();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        ইন-অ্যাপ ড্রাইভ
                      </button>
                    )}
                    <a
                      href="https://drive.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors"
                      title="Google Drive সাইটে যান"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* 5. YouTube */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 hover:border-red-500/40 transition-all flex flex-col justify-between gap-4 group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30">
                        <Youtube className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-bold">
                        Video & Music
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      YouTube সিনেমা ও মিডিয়া স্টুডিও
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      ভিডিও গান, টিউটোরিয়াল ও রিল্যাক্সিং সাউন্ড ইন-অ্যাপ ব্যাকগ্রাউন্ড প্লেয়ারে উপভোগ করুন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        miniBrowser.openBrowser('https://www.youtube.com', 'youtube');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      ইন-অ্যাপ মিডিয়া
                    </button>
                    <a
                      href="https://www.youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors"
                      title="YouTube সাইটে যান"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* 6. Facebook & Social Connect */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 hover:border-blue-500/40 transition-all flex flex-col justify-between gap-4 group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                        Social & People
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Facebook ও সোশ্যাল নেটওয়ার্কিং
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      শেখ ফরিদের অফিসিয়াল ফেসবুক প্রোফাইল ও মেসেঞ্জারে সরাসরি কানেক্ট করুন।
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <a
                      href="https://www.facebook.com/rubelrubel.rubel.98"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors text-center inline-flex items-center justify-center gap-1.5"
                    >
                      <span>ফেসবুকে কানেক্ট হন</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* 7. ForTrade Pro Trading Terminal (PWA) */}
                <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-4 group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                        Trading Terminal PWA
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                      <span>ForTrade Pro Trading Terminal</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                      ফোরট্রেড প্রো ট্রেডিং টার্মিনাল — লাইভ ফরেক্স, স্টক ও ক্রিপ্টো চার্ট, টেকনিক্যাল ইন্ডিকেটর এবং রিয়েল-টাইম মার্কেট অর্ডার ম্যানেজমেন্ট।
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        miniBrowser.openBrowser('https://fortrade-pro-trading-terminal-dev-d-nine.vercel.app/?source=pwa', 'web');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>মিনি ব্রাউজারে চালান</span>
                    </button>
                    <a
                      href="https://fortrade-pro-trading-terminal-dev-d-nine.vercel.app/?source=pwa"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 transition-colors"
                      title="নতুন ট্যাবে ForTrade Pro খুলুন"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GMAIL & EMAIL DISPATCH */}
          {activeTab === 'gmail' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                      Gmail ও অফিশিয়াল ইমেইল কম্পোজার
                    </h3>
                    {onOpenEmailComposer && (
                      <button
                        type="button"
                        id="open-full-email-composer-from-tab-btn"
                        onClick={() => {
                          onClose();
                          onOpenEmailComposer();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>পূর্ণাঙ্গ ইমেইল স্টুডিও খুলুন</span>
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-rose-800/80 dark:text-rose-300/80 mt-0.5 leading-relaxed">
                    নিচে প্রাপক, বিষয় ও বার্তা লিখুন অথবা এআই টেমপ্লেট বেছে নিন। এক ক্লিকে সরাসরি আপনার জিমেইল অ্যাপের কম্পোজ উইন্ডো ওপেন হবে এবং ড্রাফট স্বয়ংক্রিয়ভাবে ফিল হবে।
                  </p>
                </div>
              </div>

              {/* Quick Template Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  দ্রুত ইমেইল টেমপ্লেট নির্বাচন করুন:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGmailSubject('প্রজেক্ট কোলাবোরেশন ও সফটওয়্যার ডেভেলপমেন্ট প্রস্তাবনা');
                      setGmailBody('শ্রদ্ধেয় মহোদয়,\n\nআমি আপনার সাম্প্রতিক প্রজেক্ট ও কাজের পর্যালোচনা করেছি। আমাদের সফটওয়্যার টিম আপনার কাজের সাথে কোলাবোরেশন করতে আগ্রহী। সুবিধাজনক সময়ে এ বিষয়ে সংক্ষিপ্ত আলোচনার অনুরোধ জানাচ্ছি।\n\nধন্যবাদান্তে,\nশেখ ফরিদ ও টিম');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-xs font-medium transition-colors"
                  >
                    🤝 কোলাবোরেশন প্রস্তাব
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGmailSubject('সফটওয়্যার প্রজেক্ট সম্পন্ন ও ডেলিভারি রিপোর্ট');
                      setGmailBody('প্রিয় ক্লায়েন্ট,\n\nআপনার চাহিদা অনুযায়ী প্রজেক্টের সমস্ত ফিচার এবং মডিউল সফলভাবে সম্পন্ন করা হয়েছে। কোড ও লাইভ ডেমো লিঙ্ক সংযুক্ত রয়েছে। কোনো প্রশ্ন বা ফিডব্যাক থাকলে জানাবেন।\n\nবিনীত,\nডেভেলপমেন্ট টিম');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-xs font-medium transition-colors"
                  >
                    🚀 প্রজেক্ট ডেলিভারি নোট
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGmailSubject('অফিশিয়াল ছুটির আবেদন পত্র');
                      setGmailBody('বরাবর,\nউপযুক্ত কর্তৃপক্ষ,\n\nবিষয়: জরুরি প্রয়োজনে ছুটির জন্য আবেদন।\n\nমহোদয়,\nসবিনয় নিবেদন এই যে, আমার পারিবারিক জরুরি কাজের কারণে আগামী ... তারিখ হতে ... তারিখ পর্যন্ত উপস্থিত থাকা সম্ভব হবে না।\n\nঅতএব, প্রার্থনা এই যে আমাকে উক্ত দিনের ছুটি মঞ্জুর করে বাধিত করবেন।\n\nনিবেদক,\nআপনার বিশ্বস্ত');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-xs font-medium transition-colors"
                  >
                    📝 ছুটির আবেদন
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রাপকের ইমেইল (To):
                  </label>
                  <input
                    type="email"
                    value={gmailTo}
                    onChange={(e) => setGmailTo(e.target.value)}
                    placeholder="example@gmail.com, partner@company.com..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ইমেইল বিষয় (Subject):
                  </label>
                  <input
                    type="text"
                    value={gmailSubject}
                    onChange={(e) => setGmailSubject(e.target.value)}
                    placeholder="ইমেইলের মূল বিষয় লিখুন..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    ইমেইল বক্তব্য (Message Body):
                  </label>
                  <textarea
                    rows={6}
                    value={gmailBody}
                    onChange={(e) => setGmailBody(e.target.value)}
                    placeholder="এখানে আপনার সম্পূর্ণ ইমেইল বার্তা লিখুন..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 leading-relaxed font-sans"
                  />
                </div>

                {/* Dispatch Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={buildGmailComposeUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Gmail এ সরাসরি খুলুন ও পাঠান</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>

                  <a
                    href={buildMailtoUrl()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-semibold text-xs sm:text-sm transition-colors"
                  >
                    <span>ডিফল্ট মেইলে পাঠান</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const fullDraft = `To: ${gmailTo}\nSubject: ${gmailSubject}\n\n${gmailBody}`;
                      handleCopy(fullDraft, 'gmail-draft');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium cursor-pointer"
                  >
                    {copiedId === 'gmail-draft' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'gmail-draft' ? 'কপি হয়েছে' : 'ড্রাফট কপি করুন'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUICK MESSAGING (WHATSAPP & SMS) */}
          {activeTab === 'message' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-teal-950 dark:text-teal-200">
                    তাৎক্ষণিক মেসেজ প্রেরক (WhatsApp, SMS ও Telegram)
                  </h3>
                  <p className="text-xs text-teal-800/80 dark:text-teal-300/80 mt-0.5 leading-relaxed">
                    যেকোনো মোবাইল নম্বরে বা গ্রুপে মেসেজ পাঠাতে নিচে নম্বর ও বার্তা লিখুন। বাটন চাপে সাথে সাথে WhatsApp বা ফোনের SMS অ্যাপে মেসেজটি প্রস্তুত হয়ে যাবে।
                  </p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    প্রাপকের ফোন / WhatsApp নম্বর (কান্ট্রি কোড সহ):
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={msgPhone}
                      onChange={(e) => setMsgPhone(e.target.value)}
                      placeholder="+8801700000000 বা 017xxxxxxxx..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
                    মেসেজের বিষয়বস্তু (Message Content):
                  </label>
                  <textarea
                    rows={4}
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    placeholder="এখানে আপনার সংক্ষিপ্ত বা বিস্তারিত মেসেজটি লিখুন..."
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 leading-relaxed font-sans"
                  />
                </div>

                {/* Dispatch Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={buildWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp এ পাঠান</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </a>

                  <a
                    href={buildSmsUrl()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 font-semibold text-xs sm:text-sm transition-colors"
                  >
                    <Phone className="w-4 h-4 text-stone-500" />
                    <span>ফোনে SMS পাঠান</span>
                  </a>

                  <a
                    href={`https://t.me/share/url?url=&text=${encodeURIComponent(msgText.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Telegram এ পাঠান</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopy(msgText, 'msg-text')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs font-medium cursor-pointer"
                  >
                    {copiedId === 'msg-text' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'msg-text' ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GITHUB PROFILE & REPOSITORIES (https://github.com/rsk934128-dot) */}
          {activeTab === 'github' && (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-950/50 via-stone-900 to-stone-900 border border-purple-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative">
                    <img
                      src={githubUser?.avatar_url || 'https://avatars.githubusercontent.com/u/248212950?v=4'}
                      alt="Sheikh Farid GitHub Avatar"
                      className="w-16 h-16 rounded-2xl border-2 border-purple-400 shadow-lg object-cover bg-stone-950"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://avatars.githubusercontent.com/u/248212950?v=4';
                      }}
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-stone-900 flex items-center justify-center text-[10px] font-bold text-black" title="সক্রিয় ডেভেলপার">
                      ✓
                    </span>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {githubUser?.name || 'SHEIKH FARID'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[11px] border border-purple-400/30">
                        @rsk934128-dot
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 font-mono text-[10px]">
                        RubelPay
                      </span>
                    </div>
                    <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                      {githubUser?.bio || 'Founder & Independent Software Builder from Bangladesh 🇧🇩 • Building trust-first web & app solutions.'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        Sirajganj Sadar, Bangladesh
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3 text-purple-400" />
                        {githubUser?.public_repos || repos.length || 139} টি রিপোজিটরি
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  <a
                    href="https://github.com/rsk934128-dot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    <span>GitHub প্রোফাইল</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Repo Search & Filter Bar */}
              <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                <Search className="w-4 h-4 text-stone-400 ml-2.5 shrink-0" />
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder="রিপোজিটরি সার্চ করুন (যেমন: DeepMind, Studio, Stripe, PayHub)..."
                  className="w-full bg-transparent border-0 text-xs sm:text-sm text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-0 px-2 py-1.5"
                />
                {repoSearch && (
                  <button
                    type="button"
                    onClick={() => setRepoSearch('')}
                    className="p-1 rounded-lg text-stone-400 hover:text-stone-200 mr-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Repositories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 hover:border-purple-500/50 transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FolderGit2 className="w-4 h-4 text-purple-500 shrink-0" />
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {repo.name}
                          </h4>
                        </div>
                        {repo.language && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 shrink-0 border border-purple-500/20">
                            {repo.language}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {repo.description || 'শেখ ফরিদের অফিসিয়াল GitHub প্রজেক্ট ও ওপেন সোর্স কোড রিপোজিটরি।'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-stone-850">
                      <div className="flex items-center gap-1.5">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-colors"
                          title="গিটহাবে রেপো দেখুন"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>GitHub</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            const cloneCmd = `git clone ${repo.html_url}.git`;
                            handleCopy(cloneCmd, `clone-${repo.id}`);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 text-xs font-mono transition-colors cursor-pointer"
                          title="Git Clone কম্যান্ড কপি করুন"
                        >
                          {copiedId === `clone-${repo.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          <span>Clone</span>
                        </button>
                      </div>

                      {onSendToChat && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onSendToChat(`শেখ ফরিদের GitHub প্রজেক্ট "${repo.name}" (${repo.html_url}) এর কোড আর্কিটেকচার, ফিচার ও উন্নয়ন পরিকল্পনা বিশদভাবে বিশ্লেষণ করুন।`);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          title="এআই সহকারীর সাথে এই প্রজেক্ট নিয়ে কাজ শুরু করুন"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>চ্যাটে কাজ করুন</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PEOPLE & TEAM CONNECT */}
          {activeTab === 'people' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                      কানেক্টেড পিপল ও যোগাযোগ ডিরেক্টরি
                    </h3>
                    <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                      টিমমেট, ডেভেলপার ও ক্লায়েন্টদের কন্টাক্ট সংরক্ষণ করুন এবং এক ক্লিকে কল, WhatsApp, Gmail ও GitHub এ কানেক্ট করুন।
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingContact((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isAddingContact ? 'ফর্ম লুকান' : 'নতুন কন্টাক্ট যোগ করুন'}</span>
                </button>
              </div>

              {/* Add Contact Form */}
              {isAddingContact && (
                <form onSubmit={handleSaveContact} className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-stone-50 dark:bg-stone-950 space-y-3 animate-in fade-in">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                    নতুন পরিচিতি তথ্য যুক্ত করুন
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={newContact.name || ''}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="পুরো নাম *"
                      className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                    <input
                      type="text"
                      value={newContact.role || ''}
                      onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                      placeholder="পদবী / ভূমিকা (যেমন: সফটওয়্যার ইঞ্জিনিয়ার)"
                      className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                    <input
                      type="email"
                      value={newContact.email || ''}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="ইমেইল ঠিকানা"
                      className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                    <input
                      type="text"
                      value={newContact.phone || ''}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="মোবাইল / WhatsApp নম্বর"
                      className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                    <input
                      type="text"
                      value={newContact.github || ''}
                      onChange={(e) => setNewContact({ ...newContact, github: e.target.value })}
                      placeholder="GitHub লিঙ্ক বা ইউজারনেম"
                      className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                    <input
                      type="text"
                      value={newContact.notes || ''}
                      onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                      placeholder="সংক্ষিপ্ত বিবরণ বা লোকেশন"
                      className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      সংরক্ষণ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingContact(false)}
                      className="px-3 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-xs text-stone-700 dark:text-stone-300 cursor-pointer"
                    >
                      বাতিল
                    </button>
                  </div>
                </form>
              )}

              {/* Contacts List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/70 hover:border-indigo-500/40 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100">
                            {contact.name}
                          </h4>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {contact.role}
                          </p>
                        </div>
                        {contact.id !== 'contact-sheikh-farid' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-500 transition-colors"
                            title="কন্টাক্ট মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {contact.notes && (
                        <p className="text-xs text-stone-600 dark:text-stone-400 pt-1 line-clamp-2">
                          {contact.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-200 dark:border-stone-850">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors"
                          title="সরাসরি কল করুন"
                        >
                          <Phone className="w-3 h-3" />
                          <span>কল</span>
                        </a>
                      )}

                      {contact.phone && (
                        <a
                          href={`https://api.whatsapp.com/send?phone=${contact.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-semibold transition-colors"
                          title="WhatsApp এ মেসেজ দিন"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {contact.email && (
                        <button
                          type="button"
                          onClick={() => {
                            setGmailTo(contact.email || '');
                            setActiveTab('gmail');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Gmail এ ইমেইল পাঠান"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Gmail</span>
                        </button>
                      )}

                      {contact.github && (
                        <a
                          href={contact.github.startsWith('http') ? contact.github : `https://github.com/${contact.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-colors"
                          title="GitHub প্রোফাইল দেখুন"
                        >
                          <FolderGit2 className="w-3 h-3" />
                          <span>GitHub</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: NO-IP DYNAMIC DNS AUTOMATION & DIAGNOSTIC */}
          {activeTab === 'ddns' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-stone-900 to-stone-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
                <div>
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span>No-IP Dynamic DNS (DDNS) কন্ট্রোল ও ডায়াগনস্টিক</span>
                  </h3>
                  <p className="text-xs text-stone-300 mt-0.5">
                    রিমোট সার্ভার, রাউটার ও লোকাল হোস্টিংয়ের জন্য No-IP হোস্টনেম আপডেট ও স্ট্যাটাস যাচাই।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://github.com/rsk934128-dot/No-IP-DNS-Remote-Access"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-colors"
                  >
                    <FolderGit2 className="w-3.5 h-3.5" />
                    <span>No-IP Repo (rsk934128-dot)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* DDNS Form */}
              <form onSubmit={handleUpdateDdns} className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/40 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      No-IP হোস্টনেম (Hostname):
                    </label>
                    <input
                      type="text"
                      value={ddnsHostname}
                      onChange={(e) => setDdnsHostname(e.target.value)}
                      placeholder="e.g. office.ddns.net"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      টার্গেট পাবলিক IP (Target IP):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={ddnsIp}
                        onChange={(e) => setDdnsIp(e.target.value)}
                        placeholder="e.g. 203.38.213.22"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleDetectMyIp}
                        disabled={isDetectingIp}
                        className="px-3 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                        title="বর্তমান ডিভাইসের পাবলিক IP সনাক্ত করুন"
                      >
                        {isDetectingIp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'আমার IP'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      No-IP ইউজারনেম / ইমেইল / DDNS Key:
                    </label>
                    <input
                      type="text"
                      value={ddnsUsername}
                      onChange={(e) => setDdnsUsername(e.target.value)}
                      placeholder="sheikhfarid164@gmail.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                      No-IP পাসওয়ার্ড / DDNS Key Secret:
                    </label>
                    <input
                      type="password"
                      value={ddnsPassword}
                      onChange={(e) => setDdnsPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isUpdatingDdns}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 active:scale-98 text-white font-bold text-xs shadow-md shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingDdns ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Network className="w-4 h-4" />
                    )}
                    <span>{isUpdatingDdns ? 'আপডেট হচ্ছে...' : 'Dynamic DNS রেকর্ড আপডেট করুন'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const curlCmd = `curl -X GET -u "${ddnsUsername}:${ddnsPassword}" -H "User-Agent: PartnerGateway/3.2 developer@partner.com" "https://dynupdate.no-ip.com/nic/update?hostname=${ddnsHostname}&myip=${ddnsIp}"`;
                      handleCopy(curlCmd, 'curl-noip');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedId === 'curl-noip' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>cURL কমান্ড কপি করুন</span>
                  </button>
                </div>
              </form>

              {/* Response Card if available */}
              {ddnsResponse && (
                <div
                  className={`p-5 rounded-2xl border text-xs space-y-3 animate-in fade-in ${
                    ddnsResponse.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/40 text-amber-950 dark:text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {ddnsResponse.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                      <span>
                        {ddnsResponse.success
                          ? 'No-IP আপডেট সফল হয়েছে'
                          : `No-IP রেসপন্স কোড: ${ddnsResponse.code || 'ত্রুটি'}`}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                      RAW: {ddnsResponse.raw || ddnsResponse.code}
                    </span>
                  </div>

                  <p className="font-medium text-xs leading-relaxed">
                    {ddnsResponse.messageBn}
                  </p>

                  {ddnsResponse.instructions && ddnsResponse.instructions.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-white/60 dark:bg-black/30 border border-amber-500/20 space-y-1.5 mt-2">
                      <p className="font-bold text-[11px] text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                        সমাধান নির্দেশিকা (How to fix badauth):
                      </p>
                      <ul className="space-y-1 text-stone-700 dark:text-stone-300 text-[11px]">
                        {ddnsResponse.instructions.map((ins: string, idx: number) => (
                          <li key={idx}>{ins}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* cURL & Cron Reference Box */}
              <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-900 text-stone-100 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between text-stone-400 text-[11px]">
                  <span>অটোমেটেড লিনাক্স ক্রন জব (Crontab Auto-Update Script)</span>
                  <span className="text-amber-400">প্রতি ৫ মিনিটে রান</span>
                </div>
                <div className="p-3 rounded-xl bg-black/60 border border-stone-800 text-[11px] text-amber-300 overflow-x-auto whitespace-pre">
                  {`*/5 * * * * curl -s -X GET -u "${ddnsUsername}:${ddnsPassword}" -H "User-Agent: PartnerGateway/3.2 developer@partner.com" "https://dynupdate.no-ip.com/nic/update?hostname=${ddnsHostname}&myip=${ddnsIp}" > /dev/null 2>&1`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
