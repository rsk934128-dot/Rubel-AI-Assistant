import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Github,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Play,
  Cpu,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
} from 'lucide-react';
import { AppLogo } from './AppLogo';

interface AndroidApkReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkReleaseModal: React.FC<AndroidApkReleaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'workflow' | 'guide' | 'specs'>('workflow');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [versionInput, setVersionInput] = useState('v1.0.0');
  const [repoUrlInput, setRepoUrlInput] = useState('https://github.com/rubels1k994/rubel-ai-assistant');

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2500);
  };

  const tagCommands = `git tag ${versionInput}
git push origin ${versionInput}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden text-stone-800 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-stone-900 text-emerald-400 border border-stone-800">
                <Github className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight">
                  GitHub Android APK Release Hub
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Automated CI/CD
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                গিটহাব অ্যাকশনস ও ক্যাপাসিটর দিয়ে সরাসরি অ্যান্ড্রয়েড এপিকে বিল্ড ও অটো-রিলিজ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 px-6 bg-stone-100/50 dark:bg-stone-900/40">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'workflow'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Github className="w-4 h-4" />
            GitHub Release অটোমেশন
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Download className="w-4 h-4" />
            মোবাইলে ইনস্টলেশন গাইড
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'specs'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            অ্যাপ স্পেক্স ও CLI (sdkmanager)
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: WORKFLOW AUTOMATION */}
          {activeTab === 'workflow' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                    GitHub Actions Workflow প্রস্তুত ও কনফিগার করা হয়েছে
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    পাথ: <code className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">.github/workflows/android-apk-release.yml</code>
                    <br />
                    আপনি গিটহাবে কোনো ট্যাগ (যেমন <code className="text-emerald-500 font-bold">v1.0.0</code>) পুশ করলে অথবা অ্যাকশনস ট্যাব থেকে সরাসরি ক্লিক করলে স্বয়ংক্রিয়ভাবে APK কম্পাইল হয়ে GitHub Releases এবং Artifacts-এ আপলোড হয়ে যাবে।
                  </p>
                </div>
              </div>

              {/* Method 1: Push Git Tag */}
              <div className="p-4.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">1</span>
                    পদ্ধতি ১: Git Tag পুশ করে স্বয়ংক্রিয় রিলিজ তৈরি
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-stone-400 text-[11px]">ভার্সন:</span>
                    <input
                      type="text"
                      value={versionInput}
                      onChange={(e) => setVersionInput(e.target.value)}
                      className="w-20 px-2 py-0.5 text-xs rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400">
                  আপনার টার্মিনালে নিচের কমান্ড দুটি রান করলেই GitHub Actions স্বয়ংক্রিয়ভাবে APK বিল্ড সম্পন্ন করে GitHub Releases এ রিলিজ নোট সহ সংযুক্ত করবে:
                </p>

                <div className="relative rounded-xl bg-stone-900 text-stone-100 p-3.5 font-mono text-xs border border-stone-800 shadow-inner group">
                  <pre className="text-emerald-400 whitespace-pre-wrap">{tagCommands}</pre>
                  <button
                    onClick={() => handleCopy(tagCommands, 'tag-commands')}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] flex items-center gap-1.5 transition border border-stone-700"
                  >
                    {copiedText === 'tag-commands' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কমান্ড কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Method 2: 1-Click Manual Trigger from GitHub UI */}
              <div className="p-4.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/70 space-y-3">
                <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-white text-xs">
                  <span className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px]">2</span>
                  পদ্ধতি ২: GitHub Actions ওয়েব পেজ থেকে এক-ক্লিকে রান
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-stone-600 dark:text-stone-300">
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-emerald-500" />
                      ধাপ ১
                    </span>
                    <p className="text-[11px]">GitHub রিপোজিটরির <strong>Actions</strong> ট্যাবে যান।</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-teal-500" />
                      ধাপ ২
                    </span>
                    <p className="text-[11px]">বামপাশের <strong>Build & Release Android APK</strong> নির্বাচন করুন।</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-1">
                    <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      ধাপ ৩
                    </span>
                    <p className="text-[11px]"><strong>Run workflow</strong> বাটনে ক্লিক করে ২-৩ মিনিটে APK ডাউনলোড করুন!</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-2.5">
                  <a
                    href="https://github.com/rubels1k994/rubel-ai-assistant/actions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                  >
                    <Play className="w-3.5 h-3.5" />
                    GitHub Actions পেজ খুলুন
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                  <a
                    href="https://github.com/rubels1k994/rubel-ai-assistant/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    GitHub Releases পেজ দেখুন
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSTALLATION GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold">অ্যান্ড্রয়েড ফোনে সরাসরি APK ইনস্টল করার নির্দেশিকা</h4>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    যেহেতু এই এপিকে সরাসরি গিটহাব থেকে ডেভেলপ করা এবং গুগল প্লে স্টোরের বাইরে থেকে আসছে, তাই অ্যান্ড্রয়েড নিরাপত্তা ব্যবস্থার কারণে নিচের সাধারণ ধাপগুলো অনুসরণ করতে হবে:
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ১
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 dark:text-white">APK ফাইলটি ডাউনলোড করুন</h5>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                      GitHub Release পেজ থেকে <code className="font-mono text-emerald-500">Rubel-AI-Assistant-v1.0.0.apk</code> ফাইলটি আপনার ফোনে ডাউনলোড করুন।
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ২
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 dark:text-white">ফাইলটি ওপেন করে "Install" ট্যাপ করুন</h5>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                      মোবাইলের ফাইল ম্যানেজার বা ডাউনলোডেড নোটিফিকেশন থেকে ট্যাপ করুন।
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ৩
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 dark:text-white">"Install Unknown Apps" পারমিশন দিন</h5>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                      যদি ব্রাউজার বা ফাইল ম্যানেজার পারমিশন চায়, <strong>Settings &gt; Allow from this source</strong> চালু করে দিন।
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ৪
                  </div>
                  <div>
                    <h5 className="font-bold text-stone-900 dark:text-white">Google Play Protect বাইপাস (Install Anyway)</h5>
                    <p className="text-stone-500 dark:text-stone-400 text-[11px] mt-0.5">
                      Google Play Protect সতর্কবার্তা দিলে <strong>More details &gt; Install anyway</strong> চাপুন। অ্যাপটি সম্পূর্ণ নিরাপদ ও আপনার নিজস্ব প্রজেক্ট থেকে তৈরি।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APP SPECS & CONFIGURATION */}
          {activeTab === 'specs' && (
            <div className="space-y-4 animate-in fade-in duration-200 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-1">
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Application ID</span>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">com.rubel.aiassistant</div>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-1">
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Application Name</span>
                  <div className="font-bold text-stone-900 dark:text-white">Rubel AI Assistant</div>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-1">
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">Min / Target SDK</span>
                  <div className="text-stone-800 dark:text-stone-200">Android 8.0+ (Oreo) থেকে Android 15</div>
                </div>
                <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-1">
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider font-semibold">CI Runner</span>
                  <div className="text-stone-800 dark:text-stone-200">GitHub Actions (Ubuntu + Java 17 + Gradle)</div>
                </div>
              </div>

              {/* Hardware permissions included */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 space-y-2">
                <div className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  কনফিগার করা বিশেষ অ্যান্ড্রয়েড পারমিশনসমূহ:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-stone-600 dark:text-stone-300">
                  <span className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500" /> INTERNET
                  </span>
                  <span className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500" /> CAMERA (Vision AI)
                  </span>
                  <span className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500" /> RECORD_AUDIO (Voice)
                  </span>
                  <span className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500" /> ACCESS_NETWORK_STATE
                  </span>
                  <span className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500" /> VIBRATE (Haptic)
                  </span>
                  <span className="p-1.5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500" /> Firebase Sync
                  </span>
                </div>
              </div>

              {/* sdkmanager CLI Guide */}
              <div className="p-4 rounded-xl bg-stone-900 text-stone-100 border border-stone-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <Terminal className="w-4 h-4" />
                    <span>Android SDK &amp; sdkmanager সঠিক কমান্ডসমূহ:</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-sans px-2 py-0.5 rounded bg-stone-800">
                    CI / Linux Terminal
                  </span>
                </div>

                <div className="space-y-2 text-[11px] font-sans text-stone-300">
                  <p>
                    💡 <strong className="text-white">sdkmanager tools</strong> কমান্ডে পুরোনো <code className="text-amber-400 font-mono">tools</code> প্যাকেজ অবসোলেট (deprecated)। আধুনিক SDK (cmdline-tools 16.0/latest) তে নিচের কমান্ডগুলো ব্যবহার করুন:
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800">
                    <div className="text-[10px] text-stone-400 font-sans mb-1">১. সমস্ত লাইসেন্স অটো অ্যাকসেপ্ট করা:</div>
                    <code className="text-emerald-400 select-all block">
                      yes | sdkmanager --licenses
                    </code>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800">
                    <div className="text-[10px] text-stone-400 font-sans mb-1">২. প্রয়োজনীয় প্ল্যাটফর্ম ও বিল্ড-টুলস ইনস্টল করা:</div>
                    <code className="text-emerald-400 select-all block break-all">
                      sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
                    </code>
                  </div>

                  <div className="p-2.5 rounded-lg bg-stone-950 border border-stone-800">
                    <div className="text-[10px] text-stone-400 font-sans mb-1">৩. পূর্ণাঙ্গ পাথ সহ (যদি PATH-এ যুক্ত না থাকে):</div>
                    <code className="text-emerald-400 select-all block break-all">
                      /usr/local/lib/android/sdk/cmdline-tools/16.0/bin/sdkmanager --sdk_root=/usr/local/lib/android/sdk --licenses
                    </code>
                  </div>
                </div>

                <p className="text-[11px] text-stone-400 font-sans pt-1">
                  ✨ <strong>টিপস:</strong> আপনি যখন GitHub Actions-এ বিল্ড চালাবেন, তখন <code className="text-teal-400">android-actions/setup-android@v3</code> অ্যাকশন স্বয়ংক্রিয়ভাবে এই সমস্ত লাইসেন্স ও টুলস কনফিগার করে দেয়, তাই ম্যানুয়ালি কোনো কমান্ড রান করার প্রয়োজন পড়ে না।
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/70 flex items-center justify-between gap-3">
          <div className="text-[11px] text-stone-500 dark:text-stone-400 hidden sm:block">
            Rubel AI Assistant • Automated APK Builder
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleCopy(tagCommands, 'tag-footer')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 transition"
            >
              {copiedText === 'tag-footer' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>কপি হয়েছে</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Git Tag কমান্ড কপি</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
