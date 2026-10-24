import React from 'react';
import {
  MessageSquare,
  Cpu,
  Mail,
  ShieldCheck,
  Menu,
} from 'lucide-react';

export interface MobileBottomNavProps {
  onOpenMobilePrograms: () => void;
  onOpenEmailComposer: () => void;
  onOpenCitizenServices: () => void;
  onToggleSidebar: () => void;
  onScrollToChat: () => void;
  hasActiveMessages?: boolean;
  isInputFocused?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenMobilePrograms,
  onOpenEmailComposer,
  onOpenCitizenServices,
  onToggleSidebar,
  onScrollToChat,
  hasActiveMessages = false,
  isInputFocused = false,
}) => {
  return (
    <nav
      id="mobile-bottom-navigation-bar"
      aria-label="Mobile Bottom Navigation"
      className={`md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-stone-200/90 dark:border-stone-800/90 pb-[env(safe-area-inset-bottom,4px)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] transition-all duration-200 transform ${
        isInputFocused ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="grid grid-cols-5 items-center h-14 max-w-md mx-auto px-1">
        {/* Chat / Messages Button */}
        <button
          id="mobile-nav-chat-btn"
          type="button"
          onClick={onScrollToChat}
          className="flex flex-col items-center justify-center py-1 text-stone-600 dark:text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 transition-all min-h-[48px] cursor-pointer group"
          title="চ্যাটে যান"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {hasActiveMessages && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5 leading-none">
            চ্যাট
          </span>
        </button>

        {/* All Programs Hub Button */}
        <button
          id="mobile-nav-programs-btn"
          type="button"
          onClick={onOpenMobilePrograms}
          className="flex flex-col items-center justify-center py-1 text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all min-h-[48px] cursor-pointer group"
          title="সকল প্রোগ্রাম ও টুলকিট খুলুন"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Cpu className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-0.5 leading-none text-emerald-700 dark:text-emerald-300">
            প্রোগ্রাম
          </span>
        </button>

        {/* Email Composer Button */}
        <button
          id="mobile-nav-email-btn"
          type="button"
          onClick={onOpenEmailComposer}
          className="flex flex-col items-center justify-center py-1 text-stone-600 dark:text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 active:scale-95 transition-all min-h-[48px] cursor-pointer group"
          title="প্রফেশনাল ইমেইল ড্রাফটার"
        >
          <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5 leading-none">
            ইমেইল
          </span>
        </button>

        {/* Citizen Services Button */}
        <button
          id="mobile-nav-citizen-btn"
          type="button"
          onClick={onOpenCitizenServices}
          className="flex flex-col items-center justify-center py-1 text-stone-600 dark:text-stone-400 hover:text-teal-600 dark:hover:text-teal-400 active:scale-95 transition-all min-h-[48px] cursor-pointer group"
          title="A-Z জনসেবা ও জরুরি হটলাইন"
        >
          <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5 leading-none">
            জনসেবা
          </span>
        </button>

        {/* Sidebar Menu & History Button */}
        <button
          id="mobile-nav-menu-btn"
          type="button"
          onClick={onToggleSidebar}
          className="flex flex-col items-center justify-center py-1 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 active:scale-95 transition-all min-h-[48px] cursor-pointer group"
          title="মেনু ও চ্যাট হিস্টোরি"
        >
          <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-medium tracking-tight mt-0.5 leading-none">
            মেনু
          </span>
        </button>
      </div>
    </nav>
  );
};
