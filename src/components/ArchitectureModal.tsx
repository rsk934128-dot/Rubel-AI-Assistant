import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Cpu, 
  Database, 
  Server, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Cloud,
  AlertTriangle,
  RefreshCw,
  Key,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { ARCHITECTURE_GUIDE } from '../data/prompts';
import apiArchitectureImg from '../assets/images/api_architecture_graphic_1790066692425.jpg';
import clusterTrainingImg from '../assets/images/ai_cluster_training_1790066706334.jpg';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'path1' | 'path2' | 'hosting'>('hosting');
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [healthData, setHealthData] = useState<{
    status: string;
    hasApiKey: boolean;
    port?: number;
    nodeEnv?: string;
    time?: string;
    latencyMs?: number;
  } | null>(null);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setDiagnosticsLoading(true);
    setDiagnosticError(null);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const end = performance.now();
      if (res.status === 404) {
        throw new Error('সার্ভার এন্ডপয়েন্ট পাওয়া যায়নি (HTTP 404 Not Found)। ব্যাকএন্ড Express সার্ভার চালু নেই।');
      }
      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText || 'সার্ভার ত্রুটি'}`);
        }
        throw new Error('সার্ভার থেকে JSON এর বদলে HTML পাওয়া গেছে।');
      }
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      setHealthData({
        ...data,
        latencyMs: Math.round(end - start),
      });
    } catch (err: any) {
      setDiagnosticError(err?.message || 'সার্ভার রেসপন্স করছে না বা এন্ডপয়েন্ট অনুপস্থিত।');
      setHealthData(null);
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="architecture-modal-backdrop"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        id="architecture-modal-container"
        className="bg-white dark:bg-stone-900 border-0 sm:border border-stone-200 dark:border-stone-800 rounded-none sm:rounded-2xl max-w-3xl w-full h-full sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-0 sm:my-6 text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80 shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                {ARCHITECTURE_GUIDE.titleBn}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-700 dark:text-stone-300 truncate">
                {ARCHITECTURE_GUIDE.subtitleBn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold transition-all cursor-pointer shadow-xs border border-stone-300/60 dark:border-stone-700/60"
              title="চ্যাটে ফিরে যান (Back)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ফিরে যান</span>
            </button>
            <button
              id="close-architecture-modal-btn"
              onClick={onClose}
              className="p-2 text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 px-6 pt-3 bg-stone-50/50 dark:bg-stone-900/40 gap-3">
          <button
            id="tab-path1-btn"
            onClick={() => setActiveTab('path1')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'path1'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            পথ ১: বিদ্যমান LLM দিয়ে অ্যাপ (বাস্তবসম্মত)
          </button>
          <button
            id="tab-path2-btn"
            onClick={() => setActiveTab('path2')}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'path2'
                ? 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300'
                : 'border-transparent text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            পথ ২: নিজস্ব LLM ট্রেইনিং (রিসার্চ)
          </button>
          <button
            id="tab-hosting-btn"
            onClick={() => {
              setActiveTab('hosting');
              if (!healthData && !diagnosticsLoading) {
                runDiagnostics();
              }
            }}
            className={`pb-3 px-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'hosting'
                ? 'border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <Cloud className="w-4 h-4" />
            হোস্টিং ও এআই ডায়াগনস্টিকস
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'path1' ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                    কেন সফটওয়্যার ইঞ্জিনিয়ারদের জন্য এটি সেরা?
                  </p>
                  <p className="text-emerald-800/90 dark:text-emerald-300/90 text-xs mt-1 leading-relaxed">
                    হাজার কোটি টাকা বা GPU ক্লাস্টার ছাড়াই বর্তমান শক্তিশালী LLM (Gemini, Claude, GPT) এর API ব্যবহার করে কয়েক সপ্তাহেই ফুল-ফাংশনাল AI প্রোডাক্ট বা স্টার্টআপ লঞ্চ করা সম্ভব।
                  </p>
                </div>
              </div>

              {/* Architecture 3D Visual Diagram */}
              <div className="relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm bg-stone-950 group">
                <img
                  src={apiArchitectureImg}
                  alt="API-First Cloud AI Architecture"
                  referrerPolicy="no-referrer"
                  className="w-full h-44 sm:h-52 object-cover object-center group-hover:scale-102 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <p className="text-xs font-bold text-white tracking-wide">
                      মডার্ন ক্লাউড এআই আর্কিটেকচার (Client UI + Express Backend + Gemini API + Firestore)
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Flow */}
              <div className="p-4 rounded-xl bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700/60">
                <p className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3">
                  আর্কিটেকচারাল ডাটা ফ্লো
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">Frontend (UI)</span>
                    <span className="text-[11px] text-stone-500">React / Next.js</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">Backend API</span>
                    <span className="text-[11px] text-stone-500">Express / FastAPI</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">RAG / Grounding</span>
                    <span className="text-[11px] text-stone-500">Google Search / Vector DB</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <span className="font-semibold block text-stone-800 dark:text-stone-200">LLM Brain</span>
                    <span className="text-[11px] text-stone-500">Gemini / Claude API</span>
                  </div>
                </div>
              </div>

              {/* Detailed steps */}
              <div className="space-y-3">
                {ARCHITECTURE_GUIDE.path1.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {step.title}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                        {step.tech}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'path2' ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 flex items-start gap-3">
                <Cpu className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-200">
                    কারা এই পথ বেছে নিবে?
                  </p>
                  <p className="text-indigo-800/90 dark:text-indigo-300/90 text-xs mt-1 leading-relaxed">
                    AI গবেষক, ডেটা সায়েন্টিস্ট বা যারা মডেলের অভ্যন্তরীণ মেকানিজম (Weight, Attention Matrix, Loss Optimization) নিয়ে হাতে-কলমে শিখতে চান।
                  </p>
                </div>
              </div>

              {/* GPU Cluster 3D Visual */}
              <div className="relative overflow-hidden rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm bg-stone-950 group">
                <img
                  src={clusterTrainingImg}
                  alt="AI Supercomputing & Deep Learning Cluster"
                  referrerPolicy="no-referrer"
                  className="w-full h-44 sm:h-52 object-cover object-center group-hover:scale-102 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent flex items-end p-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    <p className="text-xs font-bold text-white tracking-wide">
                      ডিপ লার্নিং সুপারকম্পিউটিং ও কাস্টম এলএলএম মডেল ট্রেইনিং ইনফ্রাস্ট্রাকচার
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {ARCHITECTURE_GUIDE.path2.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {step.title}
                      </h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                        {step.tech}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Diagnostics Box */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      লাইভ সার্ভার ও জেমিনি এপিআই ডায়াগনস্টিকস
                    </h3>
                  </div>
                  <button
                    onClick={runDiagnostics}
                    disabled={diagnosticsLoading}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${diagnosticsLoading ? 'animate-spin' : ''}`} />
                    <span>{diagnosticsLoading ? 'যাচাই হচ্ছে...' : 'স্ট্যাটাস টেস্ট'}</span>
                  </button>
                </div>

                <div className="mt-3 p-3 rounded-lg bg-white dark:bg-stone-900 border border-amber-200/60 dark:border-amber-900/40 text-xs">
                  {diagnosticsLoading ? (
                    <p className="text-stone-600 dark:text-stone-300 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      সার্ভার এন্ডপয়েন্ট (/api/health) এর সাথে যোগাযোগ করা হচ্ছে...
                    </p>
                  ) : diagnosticError ? (
                    <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">সার্ভার সংযোগ ত্রুটি:</p>
                        <p className="text-[11px] text-rose-500 dark:text-rose-300 mt-0.5">{diagnosticError}</p>
                        <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
                          পরামর্শ: আপনি যদি শুধুমাত্র স্ট্যাটিক ফাইল হোস্ট করে থাকেন (যেমন GitHub Pages), তবে Express সার্ভার চালু থাকবে না। ফুলস্ট্যাক Node.js হোস্টিং নিশ্চিত করুন।
                        </p>
                      </div>
                    </div>
                  ) : healthData ? (
                    <div className="space-y-1.5 text-stone-700 dark:text-stone-300">
                      <div className="flex items-center justify-between">
                        <span>সার্ভার স্ট্যাটাস:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> সক্রিয় (Online)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Gemini API Key:</span>
                        <span className={`font-semibold flex items-center gap-1 ${healthData.hasApiKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {healthData.hasApiKey ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> সংযুক্ত (Configured)
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5" /> অনুপস্থিত (Missing GEMINI_API_KEY)
                            </>
                          )}
                        </span>
                      </div>
                      {healthData.port && (
                        <div className="flex items-center justify-between">
                          <span>লিসেনিং পোর্ট (PORT):</span>
                          <span className="font-mono text-stone-900 dark:text-stone-100">{healthData.port}</span>
                        </div>
                      )}
                      {healthData.latencyMs !== undefined && (
                        <div className="flex items-center justify-between">
                          <span>ল্যাটেন্সি (Latency):</span>
                          <span className="font-mono text-stone-900 dark:text-stone-100">{healthData.latencyMs} ms</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-stone-600 dark:text-stone-300">
                      "স্ট্যাটাস টেস্ট" বাটনে ক্লিক করে বর্তমান সার্ভার ও জেমিনি সংযোগের লাইভ অবস্থা পরীক্ষা করুন।
                    </p>
                  )}
                </div>
              </div>

              {/* Troubleshooting Guide Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  হোস্টিং করার পর এআই কাজ না করার মূল ৪টি কারণ ও সমাধান:
                </h4>

                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
                    <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-center font-bold">1</span>
                    হোস্টিং ড্যাশবোর্ডে GEMINI_API_KEY সেট না করা
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                    নিরাপত্তার স্বার্থে <code className="bg-stone-100 dark:bg-stone-700 px-1 py-0.5 rounded text-[11px]">.env</code> ফাইল গিটে পুশ করা হয় না। তাই ক্লাউড হোস্টিং প্ল্যাটফর্মের (যেমন Render, Cloud Run, Vercel, Railway) <strong>Settings &rarr; Environment Variables</strong>-এ গিয়ে <code className="font-mono text-amber-600 dark:text-amber-400">GEMINI_API_KEY</code> নামে আপনার জেমিনি এপিআই কি যোগ করুন।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
                    <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-center font-bold">2</span>
                    ফুলস্ট্যাক নোড সার্ভারের বদলে স্ট্যাটিক হোস্টিং করা
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                    এই প্রজেক্টটি একটি ফুলস্ট্যাক অ্যাপ্লিকেশন যাতে Express.js সার্ভার (<code className="bg-stone-100 dark:bg-stone-700 px-1 py-0.5 rounded text-[11px]">server.ts</code>) দিয়ে এআই স্ট্রিমিং ও সিকিউর প্রক্সি হ্যান্ডেল করা হয়। আপনি যদি শুধু <code className="bg-stone-100 dark:bg-stone-700 px-1 py-0.5 rounded text-[11px]">dist/</code> ফোল্ডার গিটহাব পেজেস বা সাধারণ স্ট্যাটিক সার্ভারে হোস্ট করেন, তবে <code className="font-mono text-rose-500">/api/chat/stream</code> পাওয়া যাবে না (404 Error)। তাই Node.js সমর্থিত হোস্টিং (Google Cloud Run, Render, VPS) ব্যবহার করুন।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center font-bold">3</span>
                    ডায়নামিক পোর্ট (PORT) বাইন্ডিং (সমাধান করা হয়েছে ✓)
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                    হোস্টিং প্রোভাইডাররা স্বয়ংক্রিয়ভাবে একটি পোর্ট নির্ধারণ করে দেয় (<code className="font-mono text-emerald-600 dark:text-emerald-400">process.env.PORT</code>)। আগে পোর্ট ৩০০০ ফিক্সড ছিল, যা এখন আপডেট করা হয়েছে যাতে ক্লাউড রানের 8080 বা রেন্ডারের নির্ধারিত পোর্টে ব্যাকএন্ড নিজে থেকেই মসৃণভাবে চালু হয়।
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800/40">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-center font-bold">4</span>
                    CORS ও স্টার্ট স্ক্রিপ্ট কনফিগারেশন (সমাধান করা হয়েছে ✓)
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">
                    সার্ভারে ক্রস-অরিজিন CORS হেডার যোগ করা হয়েছে এবং <code className="bg-stone-100 dark:bg-stone-700 px-1 py-0.5 rounded text-[11px]">package.json</code>-এর স্টার্ট কমান্ড <code className="font-mono text-indigo-600 dark:text-indigo-400">"start": "node server.ts"</code> হিসেবে কনফিগার করা হয়েছে।
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/80">
          <p className="text-xs text-stone-700 dark:text-stone-300">
            এই অ্যাপটি পথ ১-এর একটি বাস্তব ও কর্মক্ষম উদাহরণ (React + Express + Gemini + Google Search)।
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 text-stone-800 dark:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>চ্যাটে ফিরে যান (Back)</span>
            </button>
            {onSelectPrompt && (
              <button
                id="ask-assistant-about-arch-btn"
                onClick={() => {
                  onSelectPrompt('তুমি কীভাবে তৈরি হয়েছ এবং একজন ডেভেলপার হিসেবে আমি কীভাবে তোমার মতো একটি ফুল-স্ট্যাক AI অ্যাসিস্ট্যান্ট প্রজেক্ট স্ক্র্যাচ থেকে শুরু করতে পারি? স্টেপ-বাই-স্টেপ গাইড দাও।');
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span>বিস্তারিত গাইড জিজ্ঞাসা করো</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
