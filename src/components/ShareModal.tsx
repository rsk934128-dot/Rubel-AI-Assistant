import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  Globe, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { shareToPlatform, triggerNativeShare, copyToClipboard, getAppShareUrl, ShareOptions } from '../utils/shareUtils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  text?: string;
  url?: string;
  sessionId?: string;
  shareType?: 'session' | 'app' | 'message';
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title = 'AI Assistant & Coding Studio',
  text,
  url,
  sessionId,
  shareType = 'session',
}) => {
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  if (!isOpen) return null;

  const targetUrl = url || getAppShareUrl(sessionId);
  const shareTitle = title || 'AI Assistant & Coding Studio';
  const shareText = text || `${shareTitle} - বাংলা ও ইংরেজি আধুনিক এআই সহকারী`;

  const options: ShareOptions = {
    title: shareTitle,
    text: shareText,
    url: targetUrl,
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(targetUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const platforms = [
    {
      id: 'whatsapp' as const,
      name: 'WhatsApp',
      color: '#25D366',
      bgColor: 'hover:bg-[#25D366]/10 dark:hover:bg-[#25D366]/20 border-stone-200 dark:border-stone-800 hover:border-[#25D366]/50',
      icon: (
        <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.588-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.072.043.419-.101.824z" />
        </svg>
      ),
    },
    {
      id: 'facebook' as const,
      name: 'Facebook',
      color: '#1877F2',
      bgColor: 'hover:bg-[#1877F2]/10 dark:hover:bg-[#1877F2]/20 border-stone-200 dark:border-stone-800 hover:border-[#1877F2]/50',
      icon: (
        <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.82 0-1.666.17-2.12.597-.487.457-.604 1.18-.604 2.298v1.087h3.819l-.519 3.667h-3.3v7.98H9.101z" />
        </svg>
      ),
    },
    {
      id: 'twitter' as const,
      name: 'X (Twitter)',
      color: '#0f1419',
      bgColor: 'hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600',
      icon: (
        <svg className="w-4 h-4 fill-stone-900 dark:fill-stone-100" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      id: 'linkedin' as const,
      name: 'LinkedIn',
      color: '#0A66C2',
      bgColor: 'hover:bg-[#0A66C2]/10 dark:hover:bg-[#0A66C2]/20 border-stone-200 dark:border-stone-800 hover:border-[#0A66C2]/50',
      icon: (
        <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
    {
      id: 'telegram' as const,
      name: 'Telegram',
      color: '#229ED9',
      bgColor: 'hover:bg-[#229ED9]/10 dark:hover:bg-[#229ED9]/20 border-stone-200 dark:border-stone-800 hover:border-[#229ED9]/50',
      icon: (
        <svg className="w-4 h-4 fill-[#229ED9]" viewBox="0 0 24 24">
          <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.197 1.006.128.828.936z" />
        </svg>
      ),
    },
    {
      id: 'messenger' as const,
      name: 'Messenger',
      color: '#0084FF',
      bgColor: 'hover:bg-[#0084FF]/10 dark:hover:bg-[#0084FF]/20 border-stone-200 dark:border-stone-800 hover:border-[#0084FF]/50',
      icon: (
        <svg className="w-4 h-4 fill-[#0084FF]" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.082.3 2.228.464 3.443.464 6.627 0 12-4.974 12-11.111C24 4.974 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.259 5.888-3.259-6.559 6.963z" />
        </svg>
      ),
    },
    {
      id: 'reddit' as const,
      name: 'Reddit',
      color: '#FF4500',
      bgColor: 'hover:bg-[#FF4500]/10 dark:hover:bg-[#FF4500]/20 border-stone-200 dark:border-stone-800 hover:border-[#FF4500]/50',
      icon: (
        <svg className="w-4 h-4 fill-[#FF4500]" viewBox="0 0 24 24">
          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .616-.32 1.157-.796 1.467.01.12.016.24.016.36 0 2.477-2.88 4.486-6.434 4.486-3.554 0-6.434-2.009-6.434-4.486 0-.12.006-.24.016-.36-.476-.31-.796-.851-.796-1.467 0-.968.786-1.754 1.754-1.754.477 0 .899.182 1.207.491 1.194-.856 2.85-1.418 4.674-1.488l.8-3.747 2.597.547a1.248 1.248 0 0 1 1.247-1.195z" />
        </svg>
      ),
    },
    {
      id: 'email' as const,
      name: 'Email',
      color: '#6B7280',
      bgColor: 'hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600',
      icon: <Mail className="w-4 h-4 text-stone-600 dark:text-stone-300" />,
    },
  ];

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(targetUrl)}`;

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="share-modal-card"
        className="w-full max-w-lg bg-white dark:bg-stone-900 border-t sm:border border-stone-200 dark:border-stone-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-950/40 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                বিভিন্ন মিডিয়া প্ল্যাটফর্মে শেয়ার করুন
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {shareType === 'message'
                  ? 'এই গুরুত্বপূর্ণ উত্তর বা কোডটি সোশ্যাল মিডিয়ায় শেয়ার করুন'
                  : shareType === 'session'
                  ? 'বর্তমান চ্যাট সেশনটি সহকর্মী বা বন্ধুদের সাথে শেয়ার করুন'
                  : 'AI Assistant & Coding Studio অ্যাপটি বন্ধুদের আমন্ত্রণ জানান'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all cursor-pointer shadow-xs border border-stone-200 dark:border-stone-700"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              id="close-share-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Share Preview Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-stone-50 to-emerald-950/10 dark:from-stone-950/80 dark:to-emerald-950/20 border border-emerald-500/30 space-y-2.5 shadow-sm">
            <div className="flex items-center gap-3">
              <img
                src="/logo-share.png"
                alt="App Logo"
                className="w-14 h-14 rounded-xl border border-emerald-500/40 object-cover shrink-0 shadow-md bg-stone-900"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3 h-3" />
                    {shareType === 'message' ? 'AI রেসপন্স' : 'Rubel AI Studio'}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ সোশ্যাল লোগো যুক্ত
                  </span>
                </div>
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  {shareTitle}
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2 mt-0.5">
                  {shareText}
                </p>
              </div>
            </div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 bg-black/5 dark:bg-white/5 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
              <span>ফেসবুক, হোয়াটসঅ্যাপ ও টেলিগ্রামে শেয়ার করলে এই লোগোটি সুন্দরভাবে প্রদর্শিত হবে।</span>
            </div>
          </div>

          {/* Media Platforms Grid */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>মিডিয়া প্ল্যাটফর্ম সিলেক্ট করুন</span>
              <span className="text-[10px] text-stone-500 font-normal">এক ক্লিকে সরাসরি পোস্ট</span>
            </h4>
            <div className="grid grid-cols-4 gap-2.5">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  id={`share-btn-${p.id}`}
                  onClick={() => shareToPlatform(p.id, options)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border bg-white dark:bg-stone-850 transition-all group ${p.bgColor} shadow-2xs`}
                  title={`${p.name}-এ শেয়ার করুন`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    {p.icon}
                  </div>
                  <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>সরাসরি লিঙ্ক কপি</span>
              {copied && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  ক্লিপবোর্ডে কপি হয়েছে!
                </span>
              )}
            </label>
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-950/70">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="flex-1 bg-transparent text-xs text-stone-700 dark:text-stone-300 px-2 py-1 outline-hidden select-all font-mono truncate"
              />
              <button
                id="modal-copy-link-btn"
                onClick={handleCopy}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>কপি করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Native Device Share & QR Code Actions */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-2">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                id="modal-native-share-btn"
                onClick={() => triggerNativeShare(options)}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>ডিভাইসের নেটিভ মেনু (সব অ্যাপ)</span>
              </button>
            )}

            <button
              id="toggle-qr-code-btn"
              onClick={() => setShowQrCode((prev) => !prev)}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
              <span>{showQrCode ? 'QR কোড লুকান' : 'QR কোড স্ক্যান'}</span>
            </button>
          </div>

          {/* QR Code Panel */}
          {showQrCode && (
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/70 border border-stone-200 dark:border-stone-800 flex flex-col items-center text-center space-y-2 animate-in fade-in">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-stone-200">
                <img
                  src={qrImageUrl}
                  alt="QR Code"
                  className="w-36 h-36 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                স্মার্টফোনের ক্যামেরা দিয়ে স্ক্যান করে সরাসরি চ্যাট ওপেন করুন
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
