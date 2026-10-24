import React, { useState } from 'react';
import { Download, Smartphone, X, Check, Laptop, Sparkles, HelpCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppLogo } from './AppLogo';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running in standalone PWA mode, don't show prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const buttonContent = () => {
    if (installSuccess) {
      return (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs">ইনস্টল সম্পন্ন!</span>
        </>
      );
    }

    if (variant === 'sidebar') {
      return (
        <button
          id="pwa-install-sidebar-btn"
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all group ${className}`}
          title="অ্যাপটি ডিভাইসে ইনস্টল করুন"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Download className="w-4 h-4 shrink-0 text-emerald-500 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="font-semibold leading-tight">অ্যাপ ইনস্টল করুন</span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">PWA Web App</span>
            </div>
          </div>
          <Sparkles className="w-3 h-3 text-emerald-500/70 shrink-0" />
        </button>
      );
    }

    // Default header style
    return (
      <button
        id="pwa-install-header-btn"
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${className}`}
        title="অ্যাপটি আপনার কম্পিউটার বা মোবাইলে ইনস্টল করুন (PWA)"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">ইনস্টল</span>
        <span className="text-[10px] font-normal opacity-90 hidden md:inline">• PWA</span>
      </button>
    );
  };

  return (
    <>
      {buttonContent()}

      {/* Guided Modal for iOS Safari or Manual Installation Guidance */}
      {showGuideModal && (
        <div
          id="pwa-install-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-6 text-stone-800 dark:text-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <AppLogo size={48} withGlow={true} />
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">
                    AI Assistant ইনস্টল করুন
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Progressive Web App (PWA) সুবিধা
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                aria-label="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Benefits List */}
            <div className="mt-4 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/70 dark:border-stone-700/60 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>ব্রাউজার অ্যাড্রেস বার ছাড়া ফুল-স্ক্রিন অ্যাপ উইন্ডো</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>অফলাইন ক্যাশ ও দ্রুত অ্যাপ লোডিং সুবিধা</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>ডেস্কটপ ও মোবাইলের হোম স্ক্রিনে সরাসরি শর্টকাট</span>
              </div>
            </div>

            {/* Device-specific Steps */}
            <div className="mt-4 space-y-3 text-xs">
              {isIOS ? (
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>iPhone / iPad এ ইনস্টল করার নিয়ম:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-xs opacity-90 pl-1">
                    <li>Safari ব্রাউজারের নিচের <strong>Share</strong> (শেয়ার) আইকনে ট্যাপ করুন।</li>
                    <li>মেনুটি নিচে স্ক্রল করে <strong>Add to Home Screen</strong> এ ট্যাপ করুন।</li>
                    <li>উপরে <strong>Add</strong> বাটনে চাপলেই হোম স্ক্রিনে যুক্ত হবে।</li>
                  </ol>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-stone-900 dark:text-white">
                    <Laptop className="w-4 h-4 text-emerald-500" />
                    <span>Chrome / Edge / Android এ ইনস্টল করার উপায়:</span>
                  </div>
                  <p className="text-stone-600 dark:text-stone-300">
                    ব্রাউজারের অ্যাড্রেস বারের ডানপাশে থাকা <strong>Install (ইনস্টল)</strong> আইকনে ক্লিক করুন অথবা মেনু (৩ ডট) থেকে <strong>Install AI Assistant</strong> নির্বাচন করুন।
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex gap-2">
              {isInstallable && (
                <button
                  onClick={async () => {
                    await install();
                    setShowGuideModal(false);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl font-medium text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  এখনই ইনস্টল করুন
                </button>
              )}
              <button
                onClick={() => setShowGuideModal(false)}
                className="py-2.5 px-4 rounded-xl font-medium text-xs bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
