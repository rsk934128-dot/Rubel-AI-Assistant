import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Database,
  Cloud,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  HardDrive,
  Activity,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  getPendingSyncQueue,
  getLastFirestoreSyncTime,
  setLastFirestoreSyncTime,
  formatBengaliTimeAgo,
  toBengaliNumber,
  syncPendingToFirestore,
} from '../lib/indexedDb';
import { ChatSession } from '../types';

export interface SyncStatusPanelProps {
  onSyncComplete?: (count: number) => void;
  className?: string;
  isCompact?: boolean;
}

export const SyncStatusPanel: React.FC<SyncStatusPanelProps> = ({
  onSyncComplete,
  className = '',
  isCompact = false,
}) => {
  const { user, isSyncing: authIsSyncing, setIsSyncing } = useAuth();
  const isOnline = useOnlineStatus();

  const [pendingSessions, setPendingSessions] = useState<ChatSession[]>([]);
  const [totalPendingMessages, setTotalPendingMessages] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(() => getLastFirestoreSyncTime());
  const [relativeTimeText, setRelativeTimeText] = useState<string>('লোড হচ্ছে...');
  const [isSyncingNow, setIsSyncingNow] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Refresh pending queue and last sync timestamp
  const refreshStatus = useCallback(async () => {
    try {
      const queue = await getPendingSyncQueue();
      setPendingSessions(queue);
      const totalMsgs = queue.reduce((acc, curr) => acc + (curr.messages ? curr.messages.length : 0), 0);
      setTotalPendingMessages(totalMsgs);

      const latestTime = getLastFirestoreSyncTime();
      setLastSyncTime(latestTime);
      setRelativeTimeText(formatBengaliTimeAgo(latestTime));
    } catch (err) {
      console.warn('Failed to refresh sync status:', err);
    }
  }, []);

  // Initial load & periodic tick for relative time
  useEffect(() => {
    refreshStatus();

    // Update relative time every 10 seconds (e.g. 1 minute ago -> 2 minutes ago)
    const interval = setInterval(() => {
      const latestTime = getLastFirestoreSyncTime();
      setLastSyncTime(latestTime);
      setRelativeTimeText(formatBengaliTimeAgo(latestTime));
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshStatus]);

  // Listen to storage events in case another tab or component updates sync time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rubel_ai_last_firestore_sync') {
        const val = e.newValue ? parseInt(e.newValue, 10) : null;
        setLastSyncTime(val);
        setRelativeTimeText(formatBengaliTimeAgo(val));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleManualSync = async () => {
    if (!isOnline) {
      setSyncStatusMsg({
        type: 'error',
        text: '⚠️ আপনি বর্তমানে অফলাইনে আছেন। ইন্টারনেট সংযোগ ফিরে এলে সিঙ্ক করুন।',
      });
      return;
    }

    if (!user) {
      setSyncStatusMsg({
        type: 'info',
        text: 'ℹ️ ফায়ারস্টোর ক্লাউডে সিঙ্ক করার জন্য অনুগ্রহ করে আপনার গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন করুন।',
      });
      return;
    }

    try {
      setIsSyncingNow(true);
      setIsSyncing?.(true);
      setSyncStatusMsg({
        type: 'info',
        text: 'ফায়ারস্টোরে লোকাল মেসেজ সিঙ্ক করা হচ্ছে...',
      });

      const res = await syncPendingToFirestore(user.uid);
      setLastFirestoreSyncTime();
      await refreshStatus();

      if (res.syncedCount > 0) {
        setSyncStatusMsg({
          type: 'success',
          text: `✅ সফলভাবে ${toBengaliNumber(res.syncedCount)}টি সেশন ফায়ারস্টোরে সিঙ্ক হয়েছে!`,
        });
        onSyncComplete?.(res.syncedCount);
      } else {
        setSyncStatusMsg({
          type: 'success',
          text: '✅ লোকাল ডাটাবেজের সমস্ত বার্তা ইতোমধ্যে ফায়ারস্টোরের সাথে সিঙ্কড রয়েছে।',
        });
      }
    } catch (err: any) {
      console.error('Manual sync failed:', err);
      setSyncStatusMsg({
        type: 'error',
        text: `সিঙ্ক ব্যর্থ হয়েছে: ${err.message || 'সার্ভার সমস্যা'}`,
      });
    } finally {
      setIsSyncingNow(false);
      setIsSyncing?.(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  const isSyncing = isSyncingNow || authIsSyncing;

  if (isCompact) {
    return (
      <div className={`p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-850 border border-stone-200 dark:border-stone-750 flex items-center justify-between gap-3 text-xs ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            pendingSessions.length > 0 
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }`}>
            <Database className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 font-bold truncate">
              <span>পেন্ডিং মেসেজ: {toBengaliNumber(totalPendingMessages)}টি</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                pendingSessions.length > 0
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              }`}>
                {pendingSessions.length > 0 ? 'সিঙ্ক অপেক্ষমান' : 'সিঙ্কড'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
              সর্বশেষ সিঙ্ক: {relativeTimeText}
            </p>
          </div>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSyncing || (!isOnline && pendingSessions.length === 0)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs transition active:scale-95 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>সিঙ্ক</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/90 shadow-md overflow-hidden text-stone-900 dark:text-stone-100 ${className}`}>
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                ডাটাবেজ ও ক্লাউড সিঙ্ক স্ট্যাটাস
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                IndexedDB ↔ Firestore
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              লোকাল ডিভাইস ডাটাবেজ এবং ক্লাউড ফায়ারস্টোরের দ্বিমুখী সিঙ্ক পর্যবেক্ষণ
            </p>
          </div>
        </div>

        {/* Network & Live State Badge */}
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span>অনলাইন (Cloud Active)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span>অফলাইন (Local Mode)</span>
              </>
            )}
          </div>

          <button
            onClick={refreshStatus}
            title="স্ট্যাটাস রিফ্রেশ করুন"
            className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Pending Messages in Local DB */}
          <div className={`p-4 rounded-2xl border transition-all ${
            pendingSessions.length > 0
              ? 'bg-gradient-to-br from-amber-50/70 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-300 dark:border-amber-700'
              : 'bg-gradient-to-br from-stone-50 to-emerald-50/40 dark:from-stone-900 dark:to-emerald-950/20 border-stone-200 dark:border-stone-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-500" />
                লোকাল পেন্ডিং মেসেজ
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                pendingSessions.length > 0
                  ? 'bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              }`}>
                {pendingSessions.length > 0 ? 'সিঙ্ক অপেক্ষমান' : 'সব সিঙ্কড'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-extrabold tracking-tight">
                {toBengaliNumber(totalPendingMessages)}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400">
                টি বার্তা ({toBengaliNumber(pendingSessions.length)}টি সেশনে)
              </span>
            </div>

            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
              {pendingSessions.length > 0
                ? 'ডিভাইস অফলাইনে থাকা অবস্থায় লিখিত বার্তাগুলো লোকাল IndexedDB-তে নিরাপদে সংরক্ষিত রয়েছে।'
                : 'আপনার লোকাল ডিভাইসের সকল বার্তা ফায়ারস্টোরের সাথে শতভাগ হালনাগাদ (In Sync) রয়েছে।'}
            </p>
          </div>

          {/* Card 2: Last Firestore Sync Time */}
          <div className="p-4 rounded-2xl border bg-gradient-to-br from-stone-50 to-blue-50/40 dark:from-stone-900 dark:to-blue-950/20 border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" />
                সর্বশেষ ফায়ারস্টোর সিঙ্ক
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                লাইভ ট্র্যাকার
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
                {relativeTimeText}
              </span>
            </div>

            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              {lastSyncTime
                ? `টাইমস্ট্যাম্প: ${new Date(lastSyncTime).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • ${new Date(lastSyncTime).toLocaleDateString('bn-BD')}`
                : 'এখনো পর্যন্ত কোনো ক্লাউড সিঙ্ক সম্পন্ন করা হয়নি।'}
            </p>
          </div>
        </div>

        {/* Pending Items Preview List (if any) */}
        {pendingSessions.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-850 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                সিঙ্কের অপেক্ষায় থাকা সেশনসমূহ ({toBengaliNumber(pendingSessions.length)}টি):
              </span>
              <span className="text-[10px] font-normal text-amber-800 dark:text-amber-300">
                IndexedDB Store: pending_sync
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
              {pendingSessions.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/80 dark:bg-stone-900/80 text-xs border border-amber-200/60 dark:border-amber-900/50"
                >
                  <span className="font-medium truncate max-w-xs">{s.title || 'নামহীন কথোপকথন'}</span>
                  <span className="text-[11px] text-stone-500 shrink-0">
                    {toBengaliNumber(s.messages?.length || 0)}টি বার্তা
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Status Banner Notification */}
        {syncStatusMsg && (
          <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition animate-in fade-in ${
            syncStatusMsg.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
              : syncStatusMsg.type === 'error'
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
              : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
          }`}>
            <span className="shrink-0">
              {syncStatusMsg.type === 'success' ? '✓' : syncStatusMsg.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span className="flex-1">{syncStatusMsg.text}</span>
            <button
              onClick={() => setSyncStatusMsg(null)}
              className="p-1 hover:bg-black/10 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Database & Cloud Technical Metadata Info */}
        <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-850/60 border border-stone-200 dark:border-stone-800 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              ফায়ারস্টোর ডাটাবেজ প্রজেক্ট:
            </span>
            <span className="font-mono text-stone-900 dark:text-stone-100 font-semibold truncate max-w-xs">
              ai-studio-rubelaiassistant-6e4d0f54-7757-4834-88a3-02c5088f5574
            </span>
          </div>

          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 font-medium">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-500" />
              লোকাল ডাটাবেজ স্টোর:
            </span>
            <span className="font-mono text-stone-900 dark:text-stone-100">
              IndexedDB: RubelAI_ChatDB (v1)
            </span>
          </div>

          <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              ব্যবহারকারী অ্যাকাউন্ট:
            </span>
            <span className="text-stone-900 dark:text-stone-100 font-semibold">
              {user ? (user.displayName || user.email) : 'অতিথি মোড (লগইন করা নেই)'}
            </span>
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ইন্টারনেট পুনঃসংযোগ পেলে ব্যাকগ্রাউন্ডে স্বয়ংক্রিয় সিঙ্ক হয়</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing || !isOnline}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই ফায়ারস্টোরে সিঙ্ক করুন'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
