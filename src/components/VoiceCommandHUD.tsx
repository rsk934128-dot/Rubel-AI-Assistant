import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
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
  CheckCircle2,
  X
} from 'lucide-react';
import { VoiceCommandDefinition } from '../types/voiceCommands';

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

interface VoiceCommandHUDProps {
  command: VoiceCommandDefinition | null;
  transcript: string;
  onDismiss: () => void;
}

export const VoiceCommandHUD: React.FC<VoiceCommandHUDProps> = ({
  command,
  transcript,
  onDismiss,
}) => {
  useEffect(() => {
    if (!command) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 4000);
    return () => clearTimeout(timer);
  }, [command, onDismiss]);

  if (!command) return null;

  const IconComponent = ICON_MAP[command.icon] || Sparkles;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed top-16 md:top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-auto max-w-[92vw] sm:max-w-md w-full"
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-emerald-500/40 shadow-2xl shadow-emerald-500/20 p-3.5 text-white">
          {/* Subtle glowing accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <IconComponent className="w-5 h-5 text-white" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center text-slate-950 border-2 border-slate-900">
                <CheckCircle2 className="w-3 h-3 text-slate-950" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ভয়েস কমান্ড সম্পন্ন
                </span>
                <span className="text-xs text-slate-400 truncate">
                  {command.nameEn}
                </span>
              </div>
              <p className="text-sm font-semibold text-emerald-200 truncate mt-0.5">
                {command.nameBn}
              </p>
              {transcript && (
                <p className="text-[11px] text-slate-400 italic truncate mt-0.5">
                  &ldquo;{transcript}&rdquo;
                </p>
              )}
            </div>

            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close HUD"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
