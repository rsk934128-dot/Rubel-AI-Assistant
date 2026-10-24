import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="pwa-offline-indicator"
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-500/95 text-stone-950 px-3.5 py-2 text-xs font-semibold shadow-xl backdrop-blur border border-amber-400/50 animate-bounce"
    >
      <WifiOff className="w-4 h-4 text-stone-900 shrink-0" />
      <div className="flex flex-col">
        <span>অফলাইন মোড — সংরক্ষিত তথ্য প্রদর্শিত হচ্ছে</span>
        <span className="text-[10px] opacity-85 font-normal">Offline Mode • Local cache available</span>
      </div>
    </div>
  );
};
