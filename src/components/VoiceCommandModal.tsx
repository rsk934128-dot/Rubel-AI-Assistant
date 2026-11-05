import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mic, 
  MicOff, 
  Search, 
  Play, 
  Sparkles, 
  TrendingUp, 
  Trash2, 
  Plus, 
  Download, 
  Code2, 
  PenTool, 
  GraduationCap, 
  ShieldCheck, 
  Moon, 
  Sun, 
  HardDrive, 
  Youtube, 
  Eye, 
  Layers, 
  BarChart3, 
  Bot, 
  Smartphone, 
  Volume2, 
  Menu, 
  Globe, 
  ChevronUp, 
  ChevronDown, 
  Terminal,
  HelpCircle,
  Check,
  Languages
} from 'lucide-react';
import { 
  VOICE_COMMANDS_REGISTRY, 
  VoiceCommandDefinition, 
  VoiceCommandId 
} from '../types/voiceCommands';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  TrendingUp,
  Trash2,
  Plus,
  Download,
  Code2,
  PenTool,
  Search,
  GraduationCap,
  ShieldCheck,
  Moon,
  Sun,
  HardDrive,
  Youtube,
  Eye,
  Layers,
  BarChart3,
  Bot,
  Smartphone,
  Volume2,
  Menu,
  Globe,
  ChevronUp,
  ChevronDown,
  Terminal,
  Sparkles,
};

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerCommand: (commandId: VoiceCommandId) => void;
  isListening: boolean;
  onToggleListening: () => void;
  voiceLang: 'bn-BD' | 'en-US';
  onSetVoiceLang: (lang: 'bn-BD' | 'en-US') => void;
  interimTranscript?: string;
}

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({
  isOpen,
  onClose,
  onTriggerCommand,
  isListening,
  onToggleListening,
  voiceLang,
  onSetVoiceLang,
  interimTranscript,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testedId, setTestedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', labelBn: 'সব কমান্ড', labelEn: 'All' },
    { id: 'trading', labelBn: '📈 ট্রেডিং বট', labelEn: 'Trading' },
    { id: 'chat', labelBn: '💬 চ্যাট ও সেশন', labelEn: 'Chat' },
    { id: 'modes', labelBn: '🎯 অ্যাসিস্ট্যান্ট মোড', labelEn: 'Modes' },
    { id: 'system', labelBn: '⚙️ সিস্টেম ও থিম', labelEn: 'System' },
    { id: 'tools', labelBn: '🛠️ টুলস ও হাব', labelEn: 'Tools' },
  ];

  const filteredCommands = VOICE_COMMANDS_REGISTRY.filter((cmd) => {
    const matchesCategory = selectedCategory === 'all' || cmd.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      cmd.nameBn.toLowerCase().includes(term) ||
      cmd.nameEn.toLowerCase().includes(term) ||
      cmd.examples.some((ex) => ex.toLowerCase().includes(term)) ||
      cmd.descriptionBn.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  const handleTest = (cmdId: VoiceCommandId) => {
    setTestedId(cmdId);
    onTriggerCommand(cmdId);
    setTimeout(() => setTestedId(null), 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100"
        >
          {/* Header Banner */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    ভয়েস-টু-কমান্ড অ্যাক্সেসিবিলিটি
                  </h2>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-400 text-slate-950">
                    Voice HUD
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-indigo-100 mt-0.5">
                  মুখে বাংলায় বা ইংরেজিতে বলুন &mdash; অ্যাপ তাৎক্ষণিক সরাসরি অ্যাকশন সম্পন্ন করবে
                </p>
              </div>
            </div>

            {/* Voice Listener Bar */}
            <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleListening}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md ${
                    isListening
                      ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse shadow-rose-500/40 ring-2 ring-rose-300'
                      : 'bg-white text-indigo-950 hover:bg-indigo-50 shadow-white/20'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      ভয়েস লিসেনিং চলছে (থামান)
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      লাইভ ভয়েস লিসেনিং শুরু করুন
                    </>
                  )}
                </button>

                {/* Language Switcher */}
                <button
                  onClick={() => onSetVoiceLang(voiceLang === 'bn-BD' ? 'en-US' : 'bn-BD')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/15 hover:bg-white/25 text-white transition-colors"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>ভাষা: {voiceLang === 'bn-BD' ? 'বাংলা (bn-BD)' : 'English (en-US)'}</span>
                </button>
              </div>

              {interimTranscript && (
                <div className="flex items-center gap-2 text-xs text-white/90 bg-black/25 px-3 py-1 rounded-lg backdrop-blur-sm truncate max-w-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="truncate">&ldquo;{interimTranscript}&rdquo;</span>
                </div>
              )}
            </div>
          </div>

          {/* Search & Categories */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="কমান্ড খুঁজুন (যেমন: ট্রেডিং বট, ক্লিয়ার, ডার্ক মোড)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.labelBn}
                </button>
              ))}
            </div>
          </div>

          {/* Commands List Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {filteredCommands.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto mb-2 text-slate-400 opacity-60" />
                <p className="text-sm">কোনো ভয়েস কমান্ড খুঁজে পাওয়া যায়নি</p>
                <p className="text-xs text-slate-500 mt-1">অন্য কোনো কি-ওয়ার্ড দিয়ে অনুসন্ধান করুন</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredCommands.map((cmd) => {
                  const Icon = ICON_MAP[cmd.icon] || Sparkles;
                  const isTested = testedId === cmd.id;

                  return (
                    <div
                      key={cmd.id}
                      className="group relative p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                {cmd.nameBn}
                              </h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {cmd.nameEn}
                              </p>
                            </div>
                          </div>

                          {/* Quick Test Trigger Button */}
                          <button
                            onClick={() => handleTest(cmd.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              isTested
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-200'
                            }`}
                            title="এই কমান্ডটি সরাসরি টেস্ট করুন"
                          >
                            {isTested ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                সম্পন্ন!
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                টেস্ট
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                          {cmd.descriptionBn}
                        </p>
                      </div>

                      {/* Example Spoken Triggers */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                          কী বলবেন (উদাহরণ):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cmd.examples.map((ex, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700"
                            >
                              &ldquo;{ex}&rdquo;
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              💡 <strong>টিপস:</strong> আপনি চ্যাট বক্সে কথা বলার সময়েও এই কমান্ডগুলো স্বয়ংক্রিয়ভাবে শনাক্ত ও পরিচালিত হবে।
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
