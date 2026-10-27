import React from 'react';
import { WifiOff, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  pendingCount?: number;
  onSyncNow?: () => void;
  onOpenSettings?: () => void;
  isSyncing?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  pendingCount = 0,
  onSyncNow,
  onOpenSettings,
  isSyncing = false,
}) => {
  const isOnline = useOnlineStatus();

  // If online and no pending offline changes to sync, hide the indicator
  if (isOnline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  // State 1: Device is Offline
  if (!isOnline) {
    return (
      <div
        id="pwa-offline-indicator"
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-2xl bg-amber-500/95 text-stone-950 px-4 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-300 animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-600/20 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-stone-950" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">অফলাইন মোড (IndexedDB সচল)</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-600/25 text-stone-900 font-bold flex items-center gap-1">
              <Database className="w-3 h-3" />
              লোকাল DB
            </span>
          </div>
          <span className="text-[11px] text-stone-850 font-normal">
            {pendingCount > 0
              ? `${pendingCount}টি নতুন মেসেজ IndexedDB-তে অপেক্ষমান`
              : 'চ্যাট হিস্ট্রি সম্পূর্ণ অফলাইনে দেখা যাচ্ছে'}
          </span>
        </div>
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="ml-auto px-2.5 py-1 rounded-xl bg-amber-600/25 hover:bg-amber-600/40 text-stone-950 font-bold text-[11px] transition cursor-pointer shrink-0"
          >
            সিঙ্ক স্ট্যাটাস
          </button>
        )}
      </div>
    );
  }

  // State 2: Online with pending offline items or syncing in progress
  return (
    <div
      id="pwa-sync-indicator"
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-2xl bg-emerald-700/95 text-white px-4 py-2.5 text-xs font-semibold shadow-2xl backdrop-blur-md border border-emerald-500 animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="w-8 h-8 rounded-xl bg-emerald-800/60 flex items-center justify-center shrink-0">
        <RefreshCw className={`w-4 h-4 text-emerald-200 ${isSyncing ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="font-bold">
          {isSyncing ? 'ফায়ারস্টোরে ক্লাউড সিঙ্ক হচ্ছে...' : 'ইন্টারনেট সংযুক্ত — অফলাইন ডাটা সিঙ্ক প্রস্তুত'}
        </span>
        <span className="text-[11px] text-emerald-100 font-normal">
          {pendingCount > 0 ? `IndexedDB-তে ${pendingCount}টি চ্যাট সিঙ্কের অপেক্ষায়` : 'ডাটা সিঙ্কিং সম্পন্ন'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 ml-auto shrink-0">
        {onSyncNow && pendingCount > 0 && !isSyncing && (
          <button
            onClick={onSyncNow}
            className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 active:scale-95 transition shadow-xs cursor-pointer"
          >
            এখনই সিঙ্ক করুন
          </button>
        )}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-850 text-emerald-100 font-bold text-xs transition cursor-pointer border border-emerald-600/60"
          >
            ড্যাশবোর্ড
          </button>
        )}
      </div>
    </div>
  );
};
