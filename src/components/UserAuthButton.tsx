import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CloudCheck, 
  LogOut, 
  User as UserIcon, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface UserAuthButtonProps {
  onSyncAll?: () => Promise<void>;
  onOpenProfile?: () => void;
  onOpenGeminiAuth?: () => void;
  compact?: boolean;
}

export const UserAuthButton: React.FC<UserAuthButtonProps> = ({ 
  onSyncAll, 
  onOpenProfile, 
  onOpenGeminiAuth,
  compact = false 
}) => {
  const { user, loading, signIn, signOut, isSyncing, authError, clearAuthError } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [syncedRecently, setSyncedRecently] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = async () => {
    if (onSyncAll) {
      await onSyncAll();
      setSyncedRecently(true);
      setTimeout(() => setSyncedRecently(false), 3000);
    }
  };

  const handleClickLogin = () => {
    if (onOpenGeminiAuth) {
      onOpenGeminiAuth();
    } else {
      clearAuthError();
      signIn('standard').catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-800 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <div className="relative">
        <button
          id="firebase-google-login-btn"
          type="button"
          onClick={handleClickLogin}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-stone-50 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
          title="Google অ্যাকাউন্ট দিয়ে Gemini লগইন করুন এবং চ্যাট ক্লাউডে সিঙ্ক রাখুন"
        >
          {/* Authentic Google G Logo */}
          <svg className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
          <span className="font-medium text-stone-900 dark:text-stone-100">
            {compact ? 'লগইন' : 'Gemini লগইন'}
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            Google
          </span>
        </button>

        {authError && (
          <div className="absolute right-0 top-full mt-2 w-72 p-3 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 shadow-xl z-50 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                লগইন নোটিফিকেশন
              </span>
              <button
                type="button"
                onClick={clearAuthError}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold p-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
              {authError}
            </p>
            <button
              type="button"
              onClick={() => {
                clearAuthError();
                signIn('standard').catch(() => {});
              }}
              className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="user-profile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer"
        title={`${user.displayName || user.email} (Google Gemini কানেক্টেড)`}
      >
        <div className="relative">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-7 h-7 rounded-full object-cover border border-blue-500 shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl z-50 p-3 space-y-3">
          {/* User info with Gemini Accent */}
          <div className="flex items-center gap-2.5 pb-2.5 border-b border-stone-100 dark:border-stone-800">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-10 h-10 rounded-full object-cover border border-blue-500"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  {user.displayName || 'Google Gemini ইউজার'}
                </p>
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* Gemini Account Hub button */}
          {onOpenGeminiAuth && (
            <button
              id="dropdown-open-gemini-auth-btn"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenGeminiAuth();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-950/60 dark:via-indigo-950/50 dark:to-purple-950/60 text-blue-950 dark:text-blue-100 border border-blue-200/80 dark:border-blue-800/80 transition-all cursor-pointer shadow-2xs"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Google Gemini একাউন্ট হাব</span>
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </button>
          )}

          {/* Smart Profile ID Launcher inside Dropdown */}
          {onOpenProfile && (
            <button
              id="dropdown-open-profile-id-btn"
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenProfile();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-50 to-amber-100/70 hover:from-amber-100 hover:to-amber-200 dark:from-amber-950/60 dark:to-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 transition-all cursor-pointer shadow-2xs"
            >
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>🪪 ডিজিটাল স্মার্ট আইডি কার্ড</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                ACTIVE
              </span>
            </button>
          )}

          {/* Cloud Sync Status */}
          <div className="px-2.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-medium">
              <CloudCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>ফায়ারস্টোর ক্লাউড সিঙ্ক</span>
            </div>
            {isSyncing ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            ) : syncedRecently ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </div>

          {/* Sync Button */}
          {onSyncAll && (
            <button
              id="user-sync-chats-btn"
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সব চ্যাট সিঙ্ক করুন'}</span>
            </button>
          )}

          {/* Sign Out Button */}
          <button
            id="user-signout-btn"
            type="button"
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট (Sign Out)</span>
          </button>
        </div>
      )}
    </div>
  );
};
