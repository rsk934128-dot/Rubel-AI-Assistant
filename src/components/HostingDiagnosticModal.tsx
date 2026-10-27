import React, { useState, useEffect } from 'react';
import { 
  X, 
  Server, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCw, 
  Cpu, 
  Globe, 
  Terminal, 
  HelpCircle, 
  ExternalLink,
  Copy,
  Check,
  Zap,
  Layers,
  ShieldCheck,
  Radio,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { SyncStatusPanel } from './SyncStatusPanel';

interface HealthData {
  status: string;
  hasApiKey: boolean;
  port: number;
  nodeEnv: string;
  time: string;
  supportedModels?: string[];
}

interface TestResult {
  loading: boolean;
  success?: boolean;
  latencyMs?: number;
  reply?: string;
  error?: string;
}

interface HostingDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingDiagnosticModal: React.FC<HostingDiagnosticModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'sync' | 'cloudrun' | 'render' | 'static' | 'apikey'>('status');
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult>({ loading: false });
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleClearBrowserCacheAndSW = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
    window.location.reload();
  };

  const fetchHealth = async (silent = false) => {
    if (!silent) {
      setLoadingHealth(true);
      setHealthError(null);
    }

    const endpointsToTry = [
      `/api/health?_t=${Date.now()}`,
      `/api/health`,
      `/api?_t=${Date.now()}`,
    ];

    let lastErrorMsg = '';

    for (let attempt = 1; attempt <= 4; attempt++) {
      for (const endpoint of endpointsToTry) {
        try {
          const res = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            cache: 'no-store',
          });

          const rawText = await res.text();
          let parsedData: any = null;
          try {
            parsedData = JSON.parse(rawText);
          } catch {
            if (rawText.includes('<html') || rawText.includes('<!DOCTYPE') || rawText.includes('<!doctype')) {
              lastErrorMsg = 'ক্লাউড প্রক্সি বা হোস্টিং সার্ভার সাময়িকভাবে রিলোড হচ্ছে (সার্ভার থেকে এইচটিএমএল পেজ এসেছে)।';
            }
            continue;
          }

          if (res.ok && (parsedData?.status === 'ok' || parsedData?.success || parsedData?.hasApiKey !== undefined)) {
            setHealth({
              status: parsedData.status || 'ok',
              hasApiKey: parsedData.hasApiKey !== undefined ? Boolean(parsedData.hasApiKey) : true,
              port: parsedData.port || 3000,
              nodeEnv: parsedData.nodeEnv || 'development',
              time: parsedData.time || new Date().toISOString(),
              supportedModels: parsedData.supportedModels || ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
            });
            setHealthError(null);
            setLoadingHealth(false);
            return;
          }

          if (!res.ok) {
            const rawErr = parsedData?.error || parsedData?.message;
            const errStr = typeof rawErr === 'object' ? JSON.stringify(rawErr) : (rawErr ? String(rawErr) : '');
            if (res.status === 500) {
              lastErrorMsg = `ক্লাউড প্রক্সি বা ব্যাকএন্ড সার্ভারে সংযোগ মুহূর্তের জন্য স্থগিত ছিল${errStr ? ` (${errStr})` : ''}। কন্টেইনার প্রস্তুত হলে স্বয়ংক্রিয়ভাবে সংযুক্ত হবে।`;
            } else if (res.status === 404) {
              lastErrorMsg = 'সার্ভার অ্যান্ডপয়েন্ট প্রস্তুত হচ্ছে (HTTP 404)।';
            } else {
              lastErrorMsg = `সার্ভার স্ট্যাটাস কোড: ${res.status}${errStr ? ` - ${errStr}` : ''}`;
            }
          }
        } catch (fetchErr: any) {
          lastErrorMsg = fetchErr?.message || 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।';
        }
      }

      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, attempt * 800));
      }
    }

    setHealthError(lastErrorMsg || 'ক্লাউড সার্ভার সংযোগ সাময়িকভাবে সময় নিচ্ছে। নিচের "এখনই পুনঃসংযোগ পরীক্ষা করুন" বাটনে ক্লিক করুন।');
    setLoadingHealth(false);
  };

  const runLiveTest = async () => {
    setTestResult({ loading: true });
    try {
      let res: Response | null = null;
      let rawText = '';
      let data: any = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          res = await fetch(`/api/health/test?_t=${Date.now()}`, { 
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            cache: 'no-store',
          });

          if (res.status === 405) {
            res = await fetch(`/api/health/test?_t=${Date.now()}`, { 
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
              },
              cache: 'no-store',
            });
          }

          rawText = await res.text();
          try {
            data = JSON.parse(rawText);
          } catch {
            data = null;
          }

          if (res.ok && (data?.success || data?.status === 'ok' || data?.reply)) {
            break;
          }

          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        } catch {
          if (attempt === 1) {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }

      if (!res) {
        throw new Error('সার্ভার থেকে কোনো রেসপন্স পাওয়া যায়নি।');
      }

      if (!data) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
        }
        setTestResult({
          loading: false,
          success: false,
          error: rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE') || rawText.includes('<!doctype')
            ? 'সার্ভার থেকে JSON এর বদলে HTML পেজ পাওয়া গেছে (ব্রাউজার সার্ভিস ওয়ার্কার বা ক্লাউড ক্যাশ)। নিচে "ক্যাশ ও SW রিসেট" চাপুন।'
            : `সার্ভার থেকে অবৈধ রেসপন্স পাওয়া গেছে: ${rawText.slice(0, 100) || '(খালি)'}`,
        });
        return;
      }

      const isSuccess = Boolean(data?.success || data?.status === 'ok' || data?.reply);

      if (res.ok && isSuccess) {
        setTestResult({
          loading: false,
          success: true,
          latencyMs: data.latencyMs,
          reply: data.reply || 'OK',
        });
        // If main health state was empty or in error, automatically sync it!
        if (!health) {
          fetchHealth();
        }
      } else {
        const errMessage =
          data?.error ||
          data?.rawMessage ||
          (res.status === 405
            ? 'সার্ভার মেথড অনুমোদিত নয় (HTTP 405 Method Not Allowed)।'
            : res.status === 404
            ? 'সার্ভার অ্যান্ডপয়েন্ট পাওয়া যায়নি (HTTP 404 Not Found)।'
            : `সার্ভারের সাথে সংযোগ ব্যর্থ (HTTP ${res.status}): ${typeof data === 'object' ? JSON.stringify(data) : String(data)}`);

        setTestResult({
          loading: false,
          success: false,
          latencyMs: data?.latencyMs,
          error: errMessage,
        });
      }
    } catch (err: any) {
      setTestResult({
        loading: false,
        success: false,
        error: err?.message || 'সার্ভার রেসপন্স করছে না। অনুগ্রহ করে পুনরায় চেষ্টা করুন।',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  // If a temporary health error occurred (e.g. during server restart/warmup), automatically recheck after 2.5 seconds
  useEffect(() => {
    if (!isOpen || !healthError) return;
    const timer = setTimeout(() => {
      fetchHealth(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isOpen, healthError]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      id="hosting-diagnostic-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        id="hosting-diagnostic-modal"
        className="bg-white dark:bg-stone-900 border-0 sm:border border-stone-200 dark:border-stone-800 rounded-none sm:rounded-2xl max-w-2xl w-full h-full sm:h-auto sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Server className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold tracking-tight truncate">
                হোস্টিং ও জেমিনি এআই ডায়াগনস্টিক
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 truncate">
                সার্ভার স্ট্যাটাস, এপিআই কি যাচাই এবং হোস্টিং সমাধান নির্দেশিকা
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all cursor-pointer shadow-xs border border-stone-300/60 dark:border-stone-700/60 min-h-[38px]"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              id="close-hosting-modal-btn"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 px-4 bg-stone-50/60 dark:bg-stone-900/60 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            লাইভ স্ট্যাটাস ও টেস্ট
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            সিঙ্ক স্ট্যাটাস ও DB
          </button>
          <button
            onClick={() => setActiveTab('cloudrun')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'cloudrun'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Server className="w-4 h-4" />
            Google Cloud Run
          </button>
          <button
            onClick={() => setActiveTab('render')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'render'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Render / Railway
          </button>
          <button
            onClick={() => setActiveTab('static')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'static'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Firebase / স্ট্যাটিক সতর্কতা
          </button>
          <button
            onClick={() => setActiveTab('apikey')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'apikey'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Key className="w-4 h-4" />
            API Key সেটআপ
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto space-y-5">
          {activeTab === 'sync' && (
            <SyncStatusPanel isCompact={false} />
          )}

          {activeTab === 'status' && (
            <div className="space-y-4">
              {/* Compact Sync Status Panel in Status Tab */}
              <SyncStatusPanel isCompact={true} />

              {/* Server Status Overview Card */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    সার্ভার হেলথ স্ট্যাটাস
                  </span>
                  <button
                    onClick={() => fetchHealth()}
                    disabled={loadingHealth}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
                    <span>রিফ্রেশ করুন</span>
                  </button>
                </div>

                {loadingHealth ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-stone-500">
                    <RotateCw className="w-6 h-6 animate-spin text-emerald-600" />
                    <span className="text-xs">সার্ভার স্ট্যাটাস যাচাই করা হচ্ছে...</span>
                  </div>
                ) : healthError ? (
                  <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-stone-800 dark:text-stone-200 text-xs space-y-2.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>সার্ভার ও ক্লাউড সংযোগ বিজ্ঞপ্তি</span>
                    </div>
                    <p className="leading-relaxed pl-5 text-stone-700 dark:text-stone-300">{healthError}</p>
                    <div className="pl-5 pt-1 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fetchHealth()}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>এখনই পুনঃসংযোগ পরীক্ষা করুন</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearBrowserCacheAndSW}
                        className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>ক্যাশ ও SW রিসেট</span>
                      </button>
                    </div>
                  </div>
                ) : health ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Backend Server Status */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium">Express ব্যাকএন্ড</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                        সক্রিয় (Online)
                      </span>
                    </div>

                    {/* GEMINI_API_KEY Status */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {health.hasApiKey ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <span className="text-xs font-medium">GEMINI_API_KEY</span>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          health.hasApiKey
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {health.hasApiKey ? 'পাওয়া গেছে' : 'পাওয়া যায়নি (অনুপস্থিত)'}
                      </span>
                    </div>

                    {/* Node Environment */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                      <span className="text-xs text-stone-500">এনভায়রনমেন্ট:</span>
                      <span className="text-xs font-mono font-semibold">{health.nodeEnv}</span>
                    </div>

                    {/* Port */}
                    <div className="p-2.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
                      <span className="text-xs text-stone-500">পোর্ট (PORT):</span>
                      <span className="text-xs font-mono font-semibold">{health.port}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Live Gemini Test Box */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      লাইভ এআই পিং টেস্ট (1-Click Test)
                    </h3>
                  </div>
                  <button
                    id="run-live-ai-test-btn"
                    onClick={runLiveTest}
                    disabled={testResult.loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${testResult.loading ? 'animate-spin' : ''}`} />
                    <span>{testResult.loading ? 'টেস্ট চলছে...' : 'সংযোগ পরীক্ষা করুন'}</span>
                  </button>
                </div>

                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  এই বাটনে ক্লিক করলে আপনার হোস্টেড ব্যাকএন্ড থেকে সরাসরি গুগল জেমিনি এআই-এর কাছে একটি দ্রুত টেস্ট রিকোয়েস্ট পাঠানো হবে।
                </p>

                {testResult.success !== undefined && (
                  <div
                    className={`p-3 rounded-lg border text-xs leading-relaxed ${
                      testResult.success
                        ? 'bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-rose-100/70 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>এআই সংযোগ সম্পূর্ণ সফল! (AI Responded Successfully)</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] mt-1 font-mono">
                          <span>ল্যাটেন্সি: {testResult.latencyMs}ms</span>
                          <span>উত্তর: "{testResult.reply}"</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                          <XCircle className="w-4 h-4" />
                          <span>এআই সংযোগ ব্যর্থ হয়েছে</span>
                        </div>
                        <p className="mt-1">{testResult.error}</p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={handleClearBrowserCacheAndSW}
                            className="px-2.5 py-1 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-medium text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>ক্যাশ ও সার্ভিস ওয়ার্কার রিসেট করুন</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cloudrun' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 space-y-1">
                <p className="font-bold">Google Cloud Run হোস্টিং সমাধান:</p>
                <p>
                  Google Cloud Run এ কন্টেইনার স্বয়ংক্রিয়ভাবে <strong>PORT=8080</strong> এনভায়রনমেন্ট ভেরিয়েবল প্রদান করে। আমাদের ব্যাকএন্ড এখন স্বয়ংক্রিয়ভাবে ক্লাউড রান পোর্টে লিসেন করার জন্য প্রস্তুত।
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-stone-800 dark:text-stone-200">
                  ক্লাউড রানে যা নিশ্চিত করতে হবে:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-stone-700 dark:text-stone-300">
                  <li>
                    <strong>Environment Variables:</strong> Cloud Run কনসোলে গিয়ে <code className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono font-bold">GEMINI_API_KEY</code> সেট করুন।
                  </li>
                  <li>
                    <strong>Build ও Start Script:</strong>
                    <div className="relative mt-1">
                      <pre className="p-2.5 rounded-lg bg-stone-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                        npm run build && npm start
                      </pre>
                    </div>
                  </li>
                  <li>
                    <strong>In AI Studio:</strong> AI Studio-তে অ্যাপটি রান করলে সিস্টেম স্বয়ংক্রিয়ভাবে আপনার প্রজেক্টের অনুমোদিত জেমিনি কি ইনজেক্ট করে।
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'render' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <p className="text-stone-700 dark:text-stone-300">
                Render বা Railway-তে Web Service হিসেবে ডিপ্লয় করার সময় নিচের সেটিংসগুলো দিন:
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                  <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                    ১. Build Command:
                  </span>
                  <div className="flex items-center justify-between p-2 rounded bg-stone-900 text-emerald-400 font-mono text-[11px]">
                    <code>npm run build</code>
                    <button
                      onClick={() => copyToClipboard('npm run build', 'build_cmd')}
                      className="text-stone-400 hover:text-white"
                    >
                      {copiedSnippet === 'build_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                  <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                    ২. Start Command:
                  </span>
                  <div className="flex items-center justify-between p-2 rounded bg-stone-900 text-emerald-400 font-mono text-[11px]">
                    <code>npm start</code>
                    <button
                      onClick={() => copyToClipboard('npm start', 'start_cmd')}
                      className="text-stone-400 hover:text-white"
                    >
                      {copiedSnippet === 'start_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
                  <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1">
                    ৩. Environment Variables (অবশ্যই যোগ করতে হবে):
                  </span>
                  <div className="flex items-center justify-between p-2 rounded bg-stone-900 text-emerald-400 font-mono text-[11px]">
                    <code>GEMINI_API_KEY=AIzaSy...</code>
                    <button
                      onClick={() => copyToClipboard('GEMINI_API_KEY=', 'env_cmd')}
                      className="text-stone-400 hover:text-white"
                    >
                      {copiedSnippet === 'env_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'static' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>গুরুত্বপূর্ণ: স্ট্যাটিক হোস্টিং সতর্কতা</span>
                </div>
                <p>
                  আপনি কি অ্যাপটি <strong>Firebase Hosting</strong>, <strong>GitHub Pages</strong>, বা কোনো স্ট্যাটিক ফাইল হোস্টে ডিপ্লয় করেছেন?
                </p>
                <p>
                  স্ট্যাটিক হোস্টিংয়ে শুধুমাত্র এইচটিএমএল, জাভাস্ক্রিপ্ট এবং সিএসএস থাকে—সেখানে <strong>কোনো Node.js ব্যাকএন্ড সার্ভার চলে না</strong>। জেমিনি এআই এপিআই নিরাপত্তার জন্য ক্লায়েন্ট-সাইড ব্রাউজার থেকে সরাসরি না ডেকে ব্যাকএন্ডের <code className="font-mono font-bold">/api/chat/stream</code> প্রক্সির মাধ্যমে কল করতে হয়।
                </p>
              </div>

              <div className="space-y-2 text-stone-700 dark:text-stone-300">
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  কীভাবে সমাধান করবেন?
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>Firebase App Hosting বা Cloud Run ব্যবহার করুন:</strong> সাধারণ Firebase Hosting-এর পরিবর্তে <strong>Firebase App Hosting</strong> অথবা <strong>Google Cloud Run</strong> ব্যবহার করুন যা সম্পূর্ণ Node.js ফুল-স্ট্যাক অ্যাপ সাপোর্ট করে।
                  </li>
                  <li>
                    <strong>Firebase Rewrites কনফিগারেশন:</strong> যদি Firebase Hosting ব্যবহার করতে চান, তবে <code className="font-mono font-bold">firebase.json</code>-এ <code className="font-mono">/api/**</code> রুটকে একটি Cloud Function বা Cloud Run ব্যাকএন্ডে রিরাইট করতে হবে।
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'apikey' && (
            <div className="space-y-4 text-xs leading-relaxed">
              <p className="text-stone-700 dark:text-stone-300">
                জেমিনি এআই চালানোর জন্য একটি ফ্রি Gemini API Key প্রয়োজন। নিচের ধাপগুলো অনুসরণ করে ১ মিনিটে ফ্রি কী সংগ্রহ করতে পারেন:
              </p>

              <ol className="list-decimal pl-5 space-y-3 text-stone-700 dark:text-stone-300">
                <li>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    <span>Google AI Studio API Keys পেজে প্রবেশ করুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <strong>"Create API key"</strong> বাটনে ক্লিক করে একটি নতুন Gemini API Key তৈরি করুন।
                </li>
                <li>
                  প্রাপ্ত কী-টি কপি করে আপনার হোস্টিং প্ল্যাটফর্মের (Google Cloud Run, Render, Railway ইত্যাদি) Environment Variables সেটিংসে <code className="font-mono font-bold bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">GEMINI_API_KEY</code> নামে পেস্ট করে সেভ করুন।
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>নিরাপদ সার্ভার-সাইড প্রক্সি আর্কিটেকচার</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-700 dark:hover:bg-stone-600 transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>চ্যাটে ফিরে যান (Back)</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-800 dark:text-stone-200 transition-colors cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
