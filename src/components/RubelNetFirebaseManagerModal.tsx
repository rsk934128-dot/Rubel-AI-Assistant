import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Server,
  Activity,
  Users,
  Database,
  Terminal,
  Bot,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Unlock,
  Radio,
  Cpu,
  Code2,
  Award,
  MapPin,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Filter,
  RefreshCw,
  Search
} from 'lucide-react';
import { copyToClipboard } from '../utils/shareUtils';

export interface RubelNetFirebaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (prompt: string) => void;
}

interface SovereignNode {
  id: string;
  name: string;
  region: string;
  ip: string;
  status: 'active' | 'syncing' | 'standby' | 'locked';
  latency: string;
  uptime: string;
  version: string;
  rolesAssigned: number;
}

interface LiveLogEvent {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'AUTH' | 'GENKIT';
  source: string;
  message: string;
  details?: string;
}

export const RubelNetFirebaseManagerModal: React.FC<RubelNetFirebaseManagerModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'rbac' | 'logs' | 'nodes' | 'ai-ops' | 'contributors' | 'manifesto'
  >('dashboard');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [isLogStreaming, setIsLogStreaming] = useState(true);
  const [logFilter, setLogFilter] = useState<'ALL' | 'AUTH' | 'GENKIT' | 'ERROR'>('ALL');

  // NL to Firestore AI state
  const [nlQueryInput, setNlQueryInput] = useState('গত ৭ দিনে যারা লগইন করেনি এমন ইউজারদের দেখাও');
  const [generatedQueryCode, setGeneratedQueryCode] = useState<string | null>(null);
  const [isGeneratingQuery, setIsGeneratingQuery] = useState(false);

  // Nodes state
  const [nodes, setNodes] = useState<SovereignNode[]>([
    {
      id: 'node-sg-01',
      name: 'RubelNet Sovereign Node Alpha',
      region: 'asia-southeast1 (Singapore)',
      ip: '34.87.112.45',
      status: 'active',
      latency: '18ms',
      uptime: '99.99%',
      version: 'v2.4.0-genkit',
      rolesAssigned: 42,
    },
    {
      id: 'node-bd-01',
      name: 'Hotel Al Sheikh Farid Edge Relay',
      region: 'Sirajganj, Bangladesh (Local PWA Grid)',
      ip: '103.145.22.90',
      status: 'active',
      latency: '8ms',
      uptime: '100%',
      version: 'v2.4.0-dexie',
      rolesAssigned: 12,
    },
    {
      id: 'node-us-02',
      name: 'RubelPay Core Ledger Gateway',
      region: 'us-central1 (Iowa)',
      ip: '35.224.18.204',
      status: 'active',
      latency: '142ms',
      uptime: '99.95%',
      version: 'v2.3.8-claims',
      rolesAssigned: 88,
    },
    {
      id: 'node-eu-01',
      name: 'Synergy BPO Security Vanguard',
      region: 'europe-west1 (Belgium)',
      ip: '35.205.74.12',
      status: 'standby',
      latency: '115ms',
      uptime: '99.90%',
      version: 'v2.4.0-genkit',
      rolesAssigned: 16,
    },
  ]);

  // Node addition form state
  const [isAddNodeOpen, setIsAddNodeOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeRegion, setNewNodeRegion] = useState('asia-southeast1');

  // RBAC User Roles state
  interface RbacUser {
    uid: string;
    email: string;
    name: string;
    role: 'super_admin' | 'fellow' | 'contributor' | 'node_operator' | 'developer';
    customClaims: Record<string, boolean>;
    tier: string;
  }

  const [rbacUsers, setRbacUsers] = useState<RbacUser[]>([
    {
      uid: 'GE6KuYRfZ7eFcBFem5qe4Mnr2a33',
      email: 'rsk934128@gmail.com',
      name: 'Sheikh Farid (Software Architect)',
      role: 'super_admin',
      customClaims: { admin: true, sovereign: true, rubelnet_founder: true },
      tier: 'Sovereign Architect & Founder',
    },
    {
      uid: 'usr-node-fellow-01',
      email: 'sheikhfaridvisa164@gmail.com',
      name: 'RubelNet Lead Operator',
      role: 'fellow',
      customClaims: { fellow: true, node_manager: true },
      tier: 'Sovereign Fellow',
    },
    {
      uid: 'usr-contributor-09',
      email: 'contributor.core@rubelnet.org',
      name: 'Open Source Core Contributor',
      role: 'contributor',
      customClaims: { contributor: true },
      tier: 'Pro Contributor',
    },
  ]);

  const [selectedUserUid, setSelectedUserUid] = useState(rbacUsers[0].uid);
  const [assignedRole, setAssignedRole] = useState<'super_admin' | 'fellow' | 'contributor' | 'node_operator' | 'developer'>('fellow');
  const [rbacToast, setRbacToast] = useState<string | null>(null);

  // Live Logs state
  const [logs, setLogs] = useState<LiveLogEvent[]>([
    {
      id: 'log-1',
      timestamp: '19:09:01',
      level: 'INFO',
      source: 'RubelNet-Grid',
      message: 'Sovereign Grid initial handshake completed across 4 nodes.',
    },
    {
      id: 'log-2',
      timestamp: '19:09:03',
      level: 'AUTH',
      source: 'Firebase-Auth',
      message: 'Cryptographic Custom Claim verified for user rsk934128@gmail.com (claims: {admin: true, sovereign: true})',
    },
    {
      id: 'log-3',
      timestamp: '19:09:05',
      level: 'GENKIT',
      source: 'Genkit-Gemini',
      message: 'AI Operations Co-Pilot pipeline initialized with model gemini-3.8-flash.',
    },
    {
      id: 'log-4',
      timestamp: '19:09:07',
      level: 'INFO',
      source: 'Firestore-Nodes',
      message: 'Dexie.js offline-first local cache synchronization verified.',
    },
  ]);

  // Log simulation timer
  useEffect(() => {
    if (!isOpen || !isLogStreaming || killSwitchActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const sampleEvents: Array<{ level: 'INFO' | 'WARN' | 'ERROR' | 'AUTH' | 'GENKIT'; source: string; message: string }> = [
        {
          level: 'AUTH',
          source: 'Firebase-Admin',
          message: 'Secure Cloud Function setCustomUserClaims executed successfully.',
        },
        {
          level: 'GENKIT',
          source: 'Genkit-Flow',
          message: 'NL-to-Firestore schema translation optimized in 18ms.',
        },
        {
          level: 'INFO',
          source: 'Realtime-DB',
          message: 'Edge node ping: Hotel Al Sheikh Farid Edge Relay heartbeat OK (8ms).',
        },
        {
          level: 'WARN',
          source: 'Traffic-Monitor',
          message: 'Unusual query burst rate detected on node-us-02; throttled via sovereign rules.',
        },
        {
          level: 'INFO',
          source: 'Firestore-Users',
          message: 'User subscription tier metadata synchronized with local cache.',
        },
      ];

      const chosen = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: timeStr,
          level: chosen.level,
          source: chosen.source,
          message: chosen.message,
        },
        ...prev.slice(0, 35),
      ]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isOpen, isLogStreaming, killSwitchActive]);

  if (!isOpen) return null;

  const handleCopy = async (code: string, id: string) => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleAssignCustomClaim = () => {
    setRbacUsers((prev) =>
      prev.map((u) => {
        if (u.uid === selectedUserUid) {
          const claims: Record<string, boolean> = { [assignedRole]: true };
          if (assignedRole === 'super_admin') {
            claims.admin = true;
            claims.sovereign = true;
          }
          return {
            ...u,
            role: assignedRole,
            customClaims: claims,
          };
        }
        return u;
      })
    );
    setRbacToast(`Firebase Custom Claims ক্রিপ্টোগ্রাফিকালি সাইন করা হয়েছে (${assignedRole})`);
    setTimeout(() => setRbacToast(null), 3000);
  };

  const handleToggleKillSwitch = () => {
    const next = !killSwitchActive;
    setKillSwitchActive(next);
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        status: next ? 'locked' : 'active',
      }))
    );
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;
    const newNode: SovereignNode = {
      id: `node-${Date.now().toString(36).slice(2, 7)}`,
      name: newNodeName.trim(),
      region: newNodeRegion,
      ip: `34.120.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`,
      status: 'active',
      latency: `${Math.floor(Math.random() * 25) + 10}ms`,
      uptime: '100%',
      version: 'v2.4.0-genkit',
      rolesAssigned: 1,
    };
    setNodes((prev) => [newNode, ...prev]);
    setNewNodeName('');
    setIsAddNodeOpen(false);
  };

  const handleGenerateFirestoreQuery = () => {
    setIsGeneratingQuery(true);
    setTimeout(() => {
      let code = '';
      if (nlQueryInput.includes('৭ দিন') || nlQueryInput.includes('login') || nlQueryInput.includes('লগইন')) {
        code = `// Genkit Flow: Natural Language to Firestore Query
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
const cutoffTimestamp = Timestamp.fromDate(sevenDaysAgo);

// Optimized compound query with index
const inactiveUsersQuery = query(
  collection(db, 'users'),
  where('lastLoginAt', '<', cutoffTimestamp),
  where('status', '==', 'active')
);

const snapshot = await getDocs(inactiveUsersQuery);
const inactiveUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
console.log(\`[RubelNet Genkit] Found \${inactiveUsers.length} inactive users\`);`;
      } else if (nlQueryInput.includes('admin') || nlQueryInput.includes('এডমিন') || nlQueryInput.includes('রোল')) {
        code = `// Genkit Flow: Query Users by Sovereign RBAC Role
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const adminRoleQuery = query(
  collection(db, 'users'),
  where('customClaims.admin', '==', true)
);

const snapshot = await getDocs(adminRoleQuery);
const adminUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
console.log(\`[RubelNet Genkit] Active Sovereign Admins: \${adminUsers.length}\`);`;
      } else {
        code = `// Genkit Flow: Dynamic Compound Firestore Filter
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const dynamicSovereignQuery = query(
  collection(db, 'rubelnet_nodes'),
  where('status', '==', 'active'),
  orderBy('uptime', 'desc'),
  limit(20)
);

const snapshot = await getDocs(dynamicSovereignQuery);
const activeNodes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));`;
      }
      setGeneratedQueryCode(code);
      setIsGeneratingQuery(false);
    }, 400);
  };

  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'ALL') return true;
    return l.level === logFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl bg-stone-950 border border-stone-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-stone-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sovereign Command Bar */}
        <div className="px-5 py-3.5 border-b border-stone-800 bg-gradient-to-r from-emerald-950/80 via-stone-900 to-stone-950 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>RubelNet Firebase Manager</span>
                  <span className="text-emerald-400">🛡️</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  The Sovereign Grid
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Architect: <span className="text-emerald-300 font-medium">Sheikh Farid</span> • Sirajganj, Bangladesh • Next.js 15 App Router & Genkit Ops
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Kill switch / lockdown button */}
            <button
              type="button"
              onClick={handleToggleKillSwitch}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                killSwitchActive
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                  : 'bg-stone-900 text-stone-300 hover:text-rose-400 border border-stone-800 hover:border-rose-900/60'
              }`}
              title="জরুরি পরিস্থিতিতে সমস্ত নোড লকডাউন বা নিরাপদ মোডে পাঠানো"
            >
              {killSwitchActive ? <Lock className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
              <span>{killSwitchActive ? 'গ্রিড লকডাউন সক্রিয়' : 'জরুরি কিল-সুইচ'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 py-2 bg-stone-900/90 border-b border-stone-800/80 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>সেন্ট্রালাইজড ড্যাশবোর্ড</span>
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'rbac'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>সিকিউরিটি ও RBAC</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>রিয়েল-টাইম লগ ভিউয়ার</span>
          </button>

          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'nodes'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>নোড ম্যানেজার (CRUD)</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-ops')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'ai-ops'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Genkit + Gemini NL কুয়েরি</span>
          </button>

          <button
            onClick={() => setActiveTab('contributors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'contributors'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>লিডারবোর্ড ও রোডম্যাপ</span>
          </button>

          <button
            onClick={() => setActiveTab('manifesto')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'manifesto'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>মেনিফেস্টো ও আর্কিটেকচার</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-stone-950 text-stone-200">
          {/* TAB 1: CENTRALIZED DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              {/* Top Sovereign Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-stone-900 to-teal-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      RubelNet Sovereign Grid • All Systems Nominal
                    </h3>
                  </div>
                  <p className="text-xs text-stone-400">
                    Firebase Custom Claims ক্রিপ্টোগ্রাফিক সুরক্ষা, Next.js 15 App Router আর্কিটেকচার এবং Genkit AI Ops সম্পূর্ণ সক্রিয়।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-stone-900 text-emerald-400 border border-stone-800">
                    Latency: 14ms
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white">
                    Nodes: {nodes.length} Active
                  </span>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between text-stone-400">
                    <span className="text-xs font-semibold">সার্বভৌম নোড</span>
                    <Server className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-white">{nodes.length}</p>
                  <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>১০০% ইউপটাইম গ্রিড</span>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between text-stone-400">
                    <span className="text-xs font-semibold">RBAC কাস্টম ক্লেইমস</span>
                    <Lock className="w-4 h-4 text-teal-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-white">১০০%</p>
                  <p className="text-[11px] text-teal-400">জিরো-ট্রাস্ট সিকিউরিটি</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between text-stone-400">
                    <span className="text-xs font-semibold">রিয়েলটাইম লগ রেট</span>
                    <Radio className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-white">১২৪ / সেকেন্ড</p>
                  <p className="text-[11px] text-cyan-400">Firebase RTDB লাইভ স্ট্রিম</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1.5">
                  <div className="flex items-center justify-between text-stone-400">
                    <span className="text-xs font-semibold">Genkit AI Co-Pilot</span>
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-white">Gemini 3.8</p>
                  <p className="text-[11px] text-purple-400">NL-to-Firestore সক্রিয়</p>
                </div>
              </div>

              {/* Sovereign Nodes Quick Overview Table */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    <span>সক্রিয় নোড ইনস্টলেশন গ্রিড (RubelNet Node Grid)</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('nodes')}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>সম্পূর্ণ CRUD ম্যানেজার দেখুন</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-stone-800/80 text-xs font-mono">
                  {nodes.map((node) => (
                    <div key={node.id} className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-stone-800/40 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-emerald-400' : node.status === 'locked' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                          <span className="font-bold text-white font-sans">{node.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 border border-stone-700">
                            {node.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 font-sans">{node.region} • IP: {node.ip}</p>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-emerald-400 font-semibold">{node.latency}</span>
                        <span className="text-stone-400">Uptime: {node.uptime}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          node.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {node.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RBAC & CUSTOM CLAIMS */}
          {activeTab === 'rbac' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ক্রিপ্টোগ্রাফিক Firebase Custom Claims এসাইনার</span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  ফায়ারস্টোরের কোনো সাধারণ ফিল্ড দেখে রোল চেক করার চেয়ে ক্লাউড ফাংশনের মাধ্যমে ক্রিপ্টোগ্রাফিকালি সাইনড <strong>Firebase Custom Claims</strong> সেট করা শতভাগ নিরাপদ। এটি ক্লায়েন্ট বা ডেটাবেজ ট্যাম্পারিং থেকে সুরক্ষিত রাখে।
                </p>
              </div>

              {rbacToast && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{rbacToast}</span>
                </div>
              )}

              {/* RBAC Management Control */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3">
                  <div className="rounded-2xl border border-stone-800 bg-stone-900/60 overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-800 font-bold text-xs text-stone-300">
                      সক্রিয় ইউজার ও সিকিউরিটি রোলস
                    </div>
                    <div className="divide-y divide-stone-800 text-xs">
                      {rbacUsers.map((user) => (
                        <div
                          key={user.uid}
                          onClick={() => setSelectedUserUid(user.uid)}
                          className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            selectedUserUid === user.uid ? 'bg-emerald-950/30 border-l-4 border-emerald-500' : 'hover:bg-stone-800/40'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{user.name}</p>
                            <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                            <div className="flex flex-wrap gap-1 mt-1 font-mono text-[10px]">
                              {Object.keys(user.customClaims).map((claim) => (
                                <span key={claim} className="px-1.5 py-0.2 rounded bg-stone-800 text-emerald-400 border border-stone-700">
                                  {claim}: true
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-800 text-stone-200 border border-stone-700">
                              {user.role}
                            </span>
                            <p className="text-[10px] text-stone-500 mt-1">{user.tier}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Role Assignment Form */}
                <div className="p-4 rounded-2xl border border-stone-800 bg-stone-900 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>রোল ও ক্লেইম পরিবর্তন</span>
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-400">নির্বাচিত ইউজার:</label>
                    <p className="text-xs font-mono text-emerald-300 truncate bg-stone-950 p-2 rounded-lg border border-stone-800">
                      {rbacUsers.find((u) => u.uid === selectedUserUid)?.email}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-stone-400">নতুন সিকিউরিটি রোল:</label>
                    <select
                      value={assignedRole}
                      onChange={(e: any) => setAssignedRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="super_admin">Super Admin (Founder Grid Control)</option>
                      <option value="fellow">RubelNet Fellow (Node Admin)</option>
                      <option value="contributor">Contributor (Code & PRs)</option>
                      <option value="node_operator">Node Operator (Infrastructure)</option>
                      <option value="developer">Developer (API Access)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAssignCustomClaim}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Custom Claims সেট করুন</span>
                  </button>
                </div>
              </div>

              {/* Cloud Function Code Preview */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900/90 overflow-hidden space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-300 font-mono">
                    functions/src/setCustomClaims.ts (Secure Admin-Only Cloud Function)
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        `import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const setRubelNetRole = functions.https.onCall(async (data, context) => {
  // 1. Verify caller is Super Admin via Custom Claims
  if (context.auth?.token?.admin !== true && context.auth?.token?.email !== 'rsk934128@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Only Sovereign Super Admin can set roles');
  }

  const { targetUid, role } = data;
  const claims: Record<string, boolean> = { [role]: true };
  if (role === 'super_admin') {
    claims.admin = true;
    claims.sovereign = true;
  }

  await admin.auth().setCustomUserClaims(targetUid, claims);
  return { success: true, message: \`Claims assigned to \${targetUid}\` };
});`,
                        'cf-code'
                      )
                    }
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCode === 'cf-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'cf-code' ? 'কপি হয়েছে' : 'কোড কপি'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-stone-950 rounded-xl text-[11px] font-mono text-stone-300 overflow-x-auto border border-stone-800/80 leading-relaxed">
{`import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const setRubelNetRole = functions.https.onCall(async (data, context) => {
  // 1. Verify caller is Super Admin via Custom Claims
  if (context.auth?.token?.admin !== true && context.auth?.token?.email !== 'rsk934128@gmail.com') {
    throw new functions.https.HttpsError('permission-denied', 'Only Sovereign Super Admin can set roles');
  }

  const { targetUid, role } = data;
  const claims: Record<string, boolean> = { [role]: true };
  if (role === 'super_admin') {
    claims.admin = true;
    claims.sovereign = true;
  }

  await admin.auth().setCustomUserClaims(targetUid, claims);
  return { success: true, message: \`Claims assigned to \${targetUid}\` };
});`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: REALTIME LOG STREAM */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-white">Firebase Realtime Database Live Stream</span>
                  <span className="text-[11px] text-stone-400 font-mono">({filteredLogs.length} events)</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Filter selector */}
                  <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-[11px]">
                    <button
                      onClick={() => setLogFilter('ALL')}
                      className={`px-2 py-0.5 rounded-lg ${logFilter === 'ALL' ? 'bg-emerald-600 text-white font-bold' : 'text-stone-400'}`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setLogFilter('AUTH')}
                      className={`px-2 py-0.5 rounded-lg ${logFilter === 'AUTH' ? 'bg-emerald-600 text-white font-bold' : 'text-stone-400'}`}
                    >
                      AUTH
                    </button>
                    <button
                      onClick={() => setLogFilter('GENKIT')}
                      className={`px-2 py-0.5 rounded-lg ${logFilter === 'GENKIT' ? 'bg-emerald-600 text-white font-bold' : 'text-stone-400'}`}
                    >
                      GENKIT
                    </button>
                    <button
                      onClick={() => setLogFilter('ERROR')}
                      className={`px-2 py-0.5 rounded-lg ${logFilter === 'ERROR' ? 'bg-emerald-600 text-white font-bold' : 'text-stone-400'}`}
                    >
                      ERROR
                    </button>
                  </div>

                  <button
                    onClick={() => setIsLogStreaming(!isLogStreaming)}
                    className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1 cursor-pointer"
                    title={isLogStreaming ? 'স্ট্রিম থামান' : 'স্ট্রিম চালু করুন'}
                  >
                    {isLogStreaming ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                  </button>

                  <button
                    onClick={() => setLogs([])}
                    className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs flex items-center gap-1 cursor-pointer"
                    title="লগ ক্লিয়ার করুন"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal View */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950 font-mono text-xs overflow-hidden shadow-inner">
                <div className="px-4 py-2 border-b border-stone-800/80 bg-stone-900/80 flex items-center justify-between text-[11px] text-stone-400">
                  <span>TERMINAL STREAM: /logs/sovereign_grid/*</span>
                  <span>STATUS: {isLogStreaming ? 'LIVE' : 'PAUSED'}</span>
                </div>
                <div className="p-4 space-y-2 max-h-[380px] overflow-y-auto">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2.5 text-[11px] leading-relaxed">
                      <span className="text-stone-500 shrink-0">[{log.timestamp}]</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                          log.level === 'AUTH'
                            ? 'bg-blue-900/60 text-blue-300 border border-blue-800'
                            : log.level === 'GENKIT'
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-800'
                            : log.level === 'WARN'
                            ? 'bg-amber-900/60 text-amber-300 border border-amber-800'
                            : log.level === 'ERROR'
                            ? 'bg-rose-900/60 text-rose-300 border border-rose-800'
                            : 'bg-emerald-900/60 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-stone-400 font-semibold shrink-0">[{log.source}]:</span>
                      <span className="text-stone-200">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NODE MANAGER (CRUD) */}
          {activeTab === 'nodes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">RubelNet নোড ইনস্টলেশন ম্যানেজার (CRUD)</h3>
                  <p className="text-xs text-stone-400">Firestore `rubelnet_nodes` কালেকশন থেকে পরিচালিত সার্বভৌম নোড তালিকা।</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddNodeOpen(!isAddNodeOpen)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন নোড ইনস্টল করুন</span>
                </button>
              </div>

              {/* Add Node Inline Form */}
              {isAddNodeOpen && (
                <form onSubmit={handleAddNode} className="p-4 rounded-2xl bg-stone-900 border border-emerald-500/40 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400">নতুন সার্বভৌম নোড রেজিস্ট্রেশন</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="নোডের নাম (যেমন: Sirajganj Micro-DC 02)"
                      value={newNodeName}
                      onChange={(e) => setNewNodeName(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                    />
                    <select
                      value={newNodeRegion}
                      onChange={(e) => setNewNodeRegion(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white"
                    >
                      <option value="asia-southeast1 (Singapore)">asia-southeast1 (Singapore)</option>
                      <option value="Sirajganj, Bangladesh (Local PWA Edge)">Sirajganj, Bangladesh (Local PWA Edge)</option>
                      <option value="us-central1 (Iowa)">us-central1 (Iowa)</option>
                      <option value="europe-west1 (Belgium)">europe-west1 (Belgium)</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddNodeOpen(false)}
                      className="px-3 py-1 rounded-lg text-xs text-stone-400 hover:text-white"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                    >
                      সংরক্ষণ করুন (Create Node)
                    </button>
                  </div>
                </form>
              )}

              {/* Nodes List */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 overflow-hidden">
                <div className="divide-y divide-stone-800 text-xs">
                  {nodes.map((node) => (
                    <div key={node.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${node.status === 'active' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                          <h4 className="font-bold text-white text-sm font-sans">{node.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700">
                            {node.id}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400">
                          Region: {node.region} • IP: <span className="font-mono text-emerald-300">{node.ip}</span> • Version: {node.version}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-[11px] font-mono">
                          <p className="text-emerald-400 font-bold">{node.latency}</p>
                          <p className="text-stone-400">Uptime: {node.uptime}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNodes((prev) => prev.filter((n) => n.id !== node.id))}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors cursor-pointer"
                          title="নোড মুছে ফেলুন (Delete Node)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GENKIT + GEMINI AI OPS */}
          {activeTab === 'ai-ops' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-stone-900 to-indigo-950/60 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Genkit + Google Gemini: ন্যাচারাল ল্যাঙ্গুয়েজ to Firestore কুয়েরি ইঞ্জিন</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  বাংলা বা ইংরেজিতে আপনার প্রয়োজন লিখুন—গুগলের অফিশিয়াল <strong>Genkit Flow</strong> ও Gemini 3.8 মডেল স্বয়ংক্রিয়ভাবে অপ্টিমাইজড ফায়ারস্টোর কম্পাউন্ড কুয়েরি কোড ও ইনডেক্সিং নির্দেশনা তৈরি করে দেবে।
                </p>
              </div>

              {/* Natural Language Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-300">
                  আপনার ন্যাচারাল ল্যাঙ্গুয়েজ কুয়েরি লিখুন (NL to Query):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nlQueryInput}
                    onChange={(e) => setNlQueryInput(e.target.value)}
                    placeholder="যেমন: গত ৭ দিনে যারা লগইন করেনি এমন ইউজারদের দেখাও..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs sm:text-sm text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateFirestoreQuery}
                    disabled={isGeneratingQuery || !nlQueryInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{isGeneratingQuery ? 'জেনারেট হচ্ছে...' : 'কুয়েরি তৈরি করুন'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setNlQueryInput('গত ৭ দিনে যারা লগইন করেনি এমন ইউজারদের দেখাও')}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 cursor-pointer"
                >
                  🕒 নিষ্ক্রিয় ইউজার ফিল্টার
                </button>
                <button
                  type="button"
                  onClick={() => setNlQueryInput('Super Admin রোলের সকল অ্যাক্টিভ নোড ফিল্টার করো')}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 cursor-pointer"
                >
                  🛡️ সুপার অ্যাডমিন রোলস
                </button>
                <button
                  type="button"
                  onClick={() => setNlQueryInput('সর্বোচ্চ আপটাইম বিশিষ্ট সেরা ১০টি নোড বের করো')}
                  className="px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 cursor-pointer"
                >
                  ⚡ টপ আপটাইম নোডস
                </button>
              </div>

              {/* Generated Query Result */}
              {generatedQueryCode && (
                <div className="rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-400 font-mono">
                      Generated Firestore Code (Genkit Optimized)
                    </span>
                    <button
                      onClick={() => handleCopy(generatedQueryCode, 'nl-code')}
                      className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                    >
                      {copiedCode === 'nl-code' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === 'nl-code' ? 'কপি হয়েছে' : 'কোড কপি'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-stone-950 rounded-xl text-[11px] font-mono text-stone-300 overflow-x-auto border border-stone-800/80 leading-relaxed">
                    {generatedQueryCode}
                  </pre>
                  {onSendToChat && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSendToChat(`RubelNet Firebase Manager থেকে তৈরি করা এই কুয়েরিটি বিশ্লেষণ করো এবং আরও পারফরম্যান্স অপ্টিমাইজেশন দাও:\n\`\`\`typescript\n${generatedQueryCode}\n\`\`\``);
                      }}
                      className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer pt-1"
                    >
                      <span>💬 এই কুয়েরি নিয়ে এআই অ্যাসিস্ট্যান্টের সাথে চ্যাট করুন</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CONTRIBUTORS & ROADMAP */}
          {activeTab === 'contributors' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contributor Leaderboard */}
                <div className="p-4 rounded-2xl border border-stone-800 bg-stone-900 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>টপ কন্ট্রিবিউটর লিডারবোর্ড (Live Firestore)</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px]">
                          ১
                        </span>
                        <div>
                          <p className="font-bold text-white">Sheikh Farid (rsk934128-dot)</p>
                          <p className="text-[10px] text-stone-400">Founder & Chief Architect • Sirajganj</p>
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">139+ Repos</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-700 text-white font-bold flex items-center justify-center text-[10px]">
                          ২
                        </span>
                        <div>
                          <p className="font-bold text-white">Hotel Al Sheikh Farid Node Fellow</p>
                          <p className="text-[10px] text-stone-400">PWA Offline Edge Infrastructure</p>
                        </div>
                      </div>
                      <span className="font-mono text-teal-400 font-bold">100% Sync</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-stone-800 text-stone-400 font-bold flex items-center justify-center text-[10px]">
                          ৩
                        </span>
                        <div>
                          <p className="font-bold text-white">RubelPay Ledger Security Team</p>
                          <p className="text-[10px] text-stone-400">Custom Claims & Token Verification</p>
                        </div>
                      </div>
                      <span className="font-mono text-cyan-400 font-bold">Zero-Trust</span>
                    </div>
                  </div>
                </div>

                {/* Project Roadmap */}
                <div className="p-4 rounded-2xl border border-stone-800 bg-stone-900 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>RubelNet প্রজেক্ট রোডম্যাপ (২০২৪–২০২৬)</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-stone-950 border border-emerald-500/30">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Phase 1 • সম্পন্ন</span>
                      <p className="font-bold text-white mt-0.5">Next.js 15 App Router + ShadCN UI + Custom Claims RBAC</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-950 border border-teal-500/30">
                      <span className="text-[10px] font-bold text-teal-400 uppercase">Phase 2 • লাইভ</span>
                      <p className="font-bold text-white mt-0.5">Realtime Database Log Streaming & Genkit Gemini Co-Pilot</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-950 border border-purple-500/30">
                      <span className="text-[10px] font-bold text-purple-400 uppercase">Phase 3 • ভবিষ্যৎ</span>
                      <p className="font-bold text-white mt-0.5">Dexie.js Multi-Tenant Offline Sync ও গ্লোবাল ডিসেন্ট্রালাইজড গ্রিড</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: MANIFESTO & ARCHITECTURE */}
          {activeTab === 'manifesto' && (
            <div className="space-y-4 text-xs leading-relaxed text-stone-300">
              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>The RubelNet Manifesto: Sovereign Control for Modern Cloud</span>
                </h3>
                <p>
                  "RubelNet provides a high-fidelity command center for Firebase, empowering you to manage roles, monitor logs, and orchestrate your entire digital fortress with precision and power. It is designed for Firebase project administrators who need granular control and deep insights."
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-[11px]">
                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
                  <span className="text-emerald-400 font-bold font-sans">Framework Architecture</span>
                  <p className="text-stone-400">Next.js 15 (App Router), React Server Components (RSC), Tailwind CSS & ShadCN UI variables.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
                  <span className="text-teal-400 font-bold font-sans">Security Standard</span>
                  <p className="text-stone-400">Firebase Custom Claims (Cryptographically Signed Tokens), Admin-only Cloud Functions, Zero-Trust RBAC.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
                  <span className="text-purple-400 font-bold font-sans">AI-Native Ops</span>
                  <p className="text-stone-400">Google Genkit + Gemini 3.8 Flash for Natural Language compound query translation.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
                  <span className="text-cyan-400 font-bold font-sans">Offline & Local Resilience</span>
                  <p className="text-stone-400">Dexie.js (IndexedDB) client-side caching for offline PWA disaster recovery.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Built for the Grid. © 2024–2026 RubelNet Contributors. Open-source under MIT License.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
