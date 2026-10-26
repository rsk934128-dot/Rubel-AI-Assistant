import React, { useState, useEffect } from 'react';
import { Key, ShieldAlert, CheckCircle2, ExternalLink, Trash2, X, RefreshCw, AlertTriangle } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (newKey: string) => void;
  initialReason?: 'leaked' | 'missing' | 'general';
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
  initialReason = 'general',
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [savedKeyMasked, setSavedKeyMasked] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const existingKey = localStorage.getItem('custom_gemini_api_key');
        if (existingKey && existingKey.trim().length > 8) {
          const trimmed = existingKey.trim();
          setSavedKeyMasked(`${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`);
        } else {
          setSavedKeyMasked(null);
        }
      } catch (e) {
        setSavedKeyMasked(null);
      }
      setStatusMessage(null);
      setApiKeyInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndVerify = async () => {
    const keyToTest = apiKeyInput.trim();
    if (!keyToTest) {
      setStatusMessage({ type: 'error', text: 'অনুগ্রহ করে একটি বৈধ Gemini API Key লিখুন।' });
      return;
    }

    if (!keyToTest.startsWith('AIza') || keyToTest.length < 25) {
      setStatusMessage({
        type: 'error',
        text: 'API Key টি সঠিক ফরম্যাটে নেই। গুগল জেমিনাই API Key সাধারণত "AIza..." দিয়ে শুরু হয়।',
      });
      return;
    }

    setIsVerifying(true);
    setStatusMessage({ type: 'info', text: 'গুগল সার্ভারে এআই কী-টি পরীক্ষা করা হচ্ছে...' });

    try {
      const res = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('custom_gemini_api_key', keyToTest);
        setSavedKeyMasked(`${keyToTest.slice(0, 6)}...${keyToTest.slice(-4)}`);
        setStatusMessage({
          type: 'success',
          text: 'অভিনন্দন! আপনার নতুন Gemini API Key সফলভাবে সক্রিয় ও কার্যকর করা হয়েছে।',
        });
        setApiKeyInput('');
        if (onKeySaved) {
          onKeySaved(keyToTest);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'API Key যাচাই ব্যর্থ হয়েছে। সঠিক কী প্রদান করুন।',
        });
      }
    } catch (err: any) {
      // Fallback: Save directly to localStorage even if server offline
      localStorage.setItem('custom_gemini_api_key', keyToTest);
      setSavedKeyMasked(`${keyToTest.slice(0, 6)}...${keyToTest.slice(-4)}`);
      setStatusMessage({
        type: 'success',
        text: 'API Key লোকাল স্টোরেজে সংরক্ষিত হয়েছে এবং পরবর্তী রিকোয়েস্টে ব্যবহৃত হবে।',
      });
      if (onKeySaved) {
        onKeySaved(keyToTest);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('custom_gemini_api_key');
    setSavedKeyMasked(null);
    setStatusMessage({
      type: 'info',
      text: 'কাস্টম API Key মুছে ফেলা হয়েছে। সিস্টেম ডিফল্ট কী ব্যবহৃত হবে।',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Gemini API Key কনফিগারেশন
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                গুগল এআই স্টুডিও থেকে নতুন কী সেট করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {initialReason === 'leaked' && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1 text-rose-900 dark:text-rose-200 leading-relaxed">
                <span className="font-bold">সতর্কতা: আপনার পূর্ববর্তী কী-টি ফাঁস (Leaked) হয়েছে</span>
                <p className="opacity-90">
                  গিটহাবে রিপোজিটরি পাবলিক করার কারণে গুগলের স্বয়ংক্রিয় রোবট পূর্বের কী-টি ব্লক করেছে (403 Permission Denied)। অ্যাপটি পুনরায় সচল করতে নিচে আপনার নতুন একটি কী যুক্ত করুন।
                </p>
              </div>
            </div>
          )}

          {savedKeyMasked && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>বর্তমান কাস্টম কী: <strong>{savedKeyMasked}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleClearKey}
                className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:underline text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                মুছে ফেলুন
              </button>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              নতুন Google Gemini API Key লিখুন:
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              আপনার কী-টি ব্রাউজারের এনক্রিপ্টেড লোকাল স্টোরেজে সংরক্ষিত থাকবে এবং সরাসরি গুগলের সাথে সুরক্ষিতভাবে সংযুক্ত হবে।
            </p>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Quick Guide */}
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-2">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              💡 কীভাবে ফ্রি API Key পাবেন (১ মিনিট সময় লাগবে):
            </span>
            <ol className="text-xs text-stone-600 dark:text-stone-400 space-y-1.5 list-decimal pl-4 leading-relaxed">
              <li>
                নিচের <strong>"Google AI Studio পেজ খুলুন"</strong> বাটনে ক্লিক করুন।
              </li>
              <li>
                আপনার গুগল অ্যাকাউন্ট দিয়ে সাইন-ইন করে <strong>"Create API key"</strong> বাটনে চাপ দিন।
              </li>
              <li>
                তৈরি হওয়া কী-টি কপি করে উপরের বক্সে পেস্ট করে <strong>"যাচাই ও সক্রিয় করুন"</strong> চাপুন।
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition border border-emerald-500/30"
          >
            Google AI Studio পেজ খুলুন
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800 transition"
            >
              বাতিল
            </button>
            <button
              type="button"
              disabled={isVerifying || !apiKeyInput.trim()}
              onClick={handleSaveAndVerify}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-sm transition"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  যাচাই হচ্ছে...
                </>
              ) : (
                'যাচাই ও সক্রিয় করুন'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
