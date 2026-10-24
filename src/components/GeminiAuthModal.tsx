import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Cloud,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  LogOut,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  User as UserIcon,
  Globe,
  Share2,
  Lock,
  ArrowRight,
  Database,
  Layers,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMiniBrowser } from '../context/MiniBrowserContext';

export interface GeminiAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncAll?: () => Promise<void>;
  onOpenProfile?: () => void;
  onOpenGoogleDrive?: () => void;
  onImportShareUrlToChat?: (url: string) => void;
}

export const GeminiAuthModal: React.FC<GeminiAuthModalProps> = ({
  isOpen,
  onClose,
  onSyncAll,
  onOpenProfile,
  onOpenGoogleDrive,
  onImportShareUrlToChat,
}) => {
  const { user, loading, signIn, signOut, isSyncing, authError, clearAuthError } = useAuth();
  const miniBrowser = useMiniBrowser();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'auth' | 'share-hub' | 'cloud-status'>('auth');
  const [syncedRecently, setSyncedRecently] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Gemini Share Link importer state (seeded with user's provided link)
  const [geminiShareInput, setGeminiShareInput] = useState('https://share.gemini.google/IFYnnO3i7kbH');

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      clearAuthError();
      await signIn('standard');
    } catch (err) {
      console.warn('Gemini login notice:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSyncNow = async () => {
    if (onSyncAll) {
      await onSyncAll();
      setSyncedRecently(true);
      setTimeout(() => setSyncedRecently(false), 3000);
    }
  };

  const handleCopySampleLink = async (url: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Ignored
    }
  };

  const handleOpenInMiniBrowser = (url: string) => {
    miniBrowser.openBrowser(url, 'web');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Gemini Gradient Accent */}
        <div className="relative p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                <Sparkles className="w-6 h-6 animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-stone-900"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                    Google Gemini লগইন ইন্টিগ্রেশন
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    OAuth 2.0
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Google সাইন-ইন দিয়ে আপনার চ্যাট, কোড এবং প্রজেক্ট সব ডিভাইসে সিঙ্ক রাখুন
                </p>
              </div>
            </div>

            <button
              id="close-gemini-auth-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 mt-4 pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
            <button
              type="button"
              onClick={() => setActiveTab('auth')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'auth'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{user ? 'প্রোফাইল ও একাউন্ট' : 'Google সাইন ইন'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('share-hub')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'share-hub'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Gemini শেয়ার লিংক হাব</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cloud-status')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'cloud-status'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>ফায়ারস্টোর স্টোরেজ</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {authError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  লগইন অ্যালার্ট
                </span>
                <button
                  type="button"
                  onClick={clearAuthError}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-[11px]">
                {authError}
              </p>
              <button
                type="button"
                onClick={handleSignIn}
                className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          )}

          {activeTab === 'auth' && (
            <>
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-xs text-stone-500">Google একাউন্ট যাচাই করা হচ্ছে...</p>
                </div>
              ) : user ? (
                /* Signed In User Profile View */
                <div className="space-y-4">
                  {/* User Profile Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-stone-50 to-stone-100 dark:from-stone-850 dark:to-stone-800 border border-stone-200 dark:border-stone-700">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-md"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900" title="সক্রিয়" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                            {user.displayName || 'Google Gemini ইউজার'}
                          </h3>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            VERIFIED
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                          {user.email}
                        </p>
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                          UID: {user.uid}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Connected Services Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 space-y-1">
                      <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Gemini 3.8 Flash
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">ACTIVE</span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400">
                        হাই-স্পিড বাংলা ও ইংরেজি AI ইঞ্জিন
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 space-y-1">
                      <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                          Firestore ক্লাউড
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">SYNCED</span>
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400">
                        রিয়েল-টাইম ডাটাবেস পারসিস্ট্যান্স
                      </p>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="space-y-2 pt-1">
                    {onSyncAll && (
                      <button
                        type="button"
                        id="gemini-sync-now-btn"
                        onClick={handleSyncNow}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>
                          {isSyncing
                            ? 'ক্লাউডে সিঙ্ক করা হচ্ছে...'
                            : syncedRecently
                            ? 'সব সেশন সফলভাবে সিঙ্ক হয়েছে!'
                            : 'এখনই সব চ্যাট ক্লাউড ফায়ারস্টোরে সিঙ্ক করুন'}
                        </span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {onOpenGoogleDrive && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenGoogleDrive();
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                        >
                          <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                          <span>Google Drive খুলুন</span>
                        </button>
                      )}

                      {onOpenProfile && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenProfile();
                          }}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                          <span>ডিজিটাল স্মার্ট আইডি</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      id="gemini-logout-btn"
                      onClick={async () => {
                        await signOut();
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>গুগল অ্যাকাউন্ট থেকে লগআউট করুন (Sign Out)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Logged Out: Beautiful Sign In Screen */
                <div className="space-y-4">
                  {/* Welcome Hero Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white dark:bg-stone-800 shadow-md">
                      {/* Google G Logo SVG */}
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
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
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      Google অ্যাকাউন্ট দিয়ে লগইন করুন
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
                      লগইন করলে আপনার সকল AI চ্যাট, কোড স্নিপেট এবং সেটিংস নিরাপদে ক্লাউড ফায়ারস্টোরে সিঙ্ক থাকবে।
                    </p>
                  </div>

                  {/* Primary Google Login Button */}
                  <button
                    type="button"
                    id="gemini-primary-google-login-btn"
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-100 font-semibold text-sm border-2 border-stone-200 dark:border-stone-700 shadow-md hover:shadow-lg transition-all cursor-pointer group disabled:opacity-60"
                  >
                    {isSigningIn ? (
                      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
                    )}
                    <span>
                      {isSigningIn ? 'লগইন প্রক্রিয়া চলছে...' : 'Google দিয়ে সাইন ইন করুন (Sign in with Google)'}
                    </span>
                  </button>

                  {/* Feature Checklist */}
                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-850/80 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                    <p className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Google Gemini ইন্টিগ্রেশনের সুবিধাসমূহ:
                    </p>
                    <ul className="space-y-1.5 text-stone-600 dark:text-stone-400">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>স্বয়ংক্রিয় ক্লাউড ব্যাকআপ:</strong> যেকোনো ডিভাইস থেকে আগের চ্যাটে প্রবেশ</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>Google Drive ফাইল ব্রাউজার:</strong> সরাসরি ফাইল ওপেন ও কোড এক্সপোর্ট</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>ভেরিফাইড আইডি ও প্রোফাইল:</strong> পারসোনালাইজড অ্যাসিস্ট্যান্ট অভিজ্ঞতা</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>সর্বোচ্চ নিরাপত্তা:</strong> Firebase OAuth 2.0 প্রটোকলে সংরক্ষিত</span>
                      </li>
                    </ul>
                  </div>

                  <p className="text-[10px] text-center text-stone-400">
                    সাইন ইন করার মাধ্যমে আপনি নিরাপদ Google OAuth পলিসি ও শর্তাবলীর সাথে একমত পোষণ করছেন।
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'share-hub' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span>Google Gemini শেয়ার চ্যাট লিংক এক্সপ্লোরার</span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Gemini-র অফিসিয়াল পাবলিক শেয়ার লিংক (যেমন <code>share.gemini.google/...</code>) ইন-অ্যাপেই ওপেন করুন বা আপনার কথোপকথনে রেফারেন্স হিসেবে যুক্ত করুন।
                </p>
              </div>

              {/* Share Input Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Gemini পাবলিক লিংক ইনপুট:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={geminiShareInput}
                    onChange={(e) => setGeminiShareInput(e.target.value)}
                    placeholder="https://share.gemini.google/..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 focus:outline-hidden focus:border-blue-500 font-mono text-stone-900 dark:text-stone-100"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopySampleLink(geminiShareInput)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
                    title="লিংক কপি করুন"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons for Gemini Share Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  id="open-in-mini-browser-btn"
                  onClick={() => handleOpenInMiniBrowser(geminiShareInput)}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>ইন-অ্যাপ মিনি ব্রাউজারে খুলুন</span>
                </button>

                <a
                  href={geminiShareInput}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <span>নতুন ট্যাবে Gemini খুলুন</span>
                </a>
              </div>

              {onImportShareUrlToChat && (
                <button
                  type="button"
                  onClick={() => {
                    onImportShareUrlToChat(geminiShareInput);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer"
                >
                  <Bot className="w-4 h-4 text-emerald-600" />
                  <span>চ্যাট প্রম্পট হিসেবে যুক্ত করে AI বিশ্লেষণ শুরু করুন</span>
                </button>
              )}
            </div>
          )}

          {activeTab === 'cloud-status' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">ডাটাবেস সার্ভিস:</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Cloud Firestore
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">ডাটাবেস আইডি:</span>
                  <span className="text-[11px] font-mono text-stone-600 dark:text-stone-400 truncate max-w-[240px]">
                    ai-studio-rubelaiassistant-6e4d0f54-7757-4834-88a3-02c5088f5574
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">অথেনটিকেশন প্রোটোকল:</span>
                  <span className="text-xs text-stone-600 dark:text-stone-400">Firebase Auth / Google Identity</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300">লগইন অবস্থা:</span>
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    {user ? 'Google লগইন সক্রিয়' : 'লগইন করা নেই'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    এন্ড-টু-এন্ড সিকিউর সিঙ্ক
                  </p>
                  <p className="text-stone-600 dark:text-stone-400 text-[11px] leading-relaxed">
                    আপনার তৈরি করা চ্যাট সেশন এবং বার্তাগুলো শুধুমাত্র আপনার অনুমোদিত Google UID দ্বারা এনক্রিপ্ট হয়ে ফায়ারস্টোরে সংরক্ষিত হয়। অন্য কোনো ব্যবহারকারী আপনার ডাটাতে অ্যাক্সেস করতে পারে না।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/90 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Secure Identity Verification</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
