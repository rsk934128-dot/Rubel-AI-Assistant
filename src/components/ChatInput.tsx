import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Send, 
  Square, 
  Globe, 
  Code2, 
  PenTool, 
  GraduationCap, 
  Search, 
  Sparkles,
  Paperclip,
  X,
  Mic,
  MicOff,
  Languages,
  AlertCircle,
  ShieldCheck,
  Youtube,
  Play,
  Maximize2,
  HardDrive,
  Loader2,
  Check,
  Share2
} from 'lucide-react';
import { AssistantMode } from '../types';
import { useMediaRecorderVoice, VoiceLanguage } from '../hooks/useMediaRecorderVoice';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { useMiniBrowser } from '../context/MiniBrowserContext';
import { extractYouTubeVideoId } from '../utils/youtube';
import { AudioFrequencyWave } from './AudioFrequencyWave';
import { WordCharCounter } from './WordCharCounter';

interface ChatInputProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  onSend: (textOverride?: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  enableSearch: boolean;
  setEnableSearch: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  mode: AssistantMode;
  setMode: (mode: AssistantMode) => void;
  onOpenGoogleDrive?: () => void;
  onOpenShareReceiver?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  enableSearch,
  setEnableSearch,
  mode,
  setMode,
  onOpenGoogleDrive,
  onOpenShareReceiver,
  onFocus,
  onBlur,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicPlayer = useMusicPlayer();
  const miniBrowser = useMiniBrowser();
  const detectedYouTubeId = extractYouTubeVideoId(input);

  const [voiceLang, setVoiceLang] = useState<VoiceLanguage>('bn-BD');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const {
    isRecording,
    isTranscribing,
    recordingDuration,
    audioLevel,
    frequencyData,
    errorMessage,
    setErrorMessage,
    isHoldMode,
    stopRecording,
    cancelRecording,
    handleHoldStart,
    handleHoldEnd,
    toggleRecording,
  } = useMediaRecorderVoice({
    language: voiceLang,
    onTranscriptSuccess: (transcript) => {
      setInput((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed} ${transcript}` : transcript;
      });
      setSuccessToast('ভয়েস সফলভাবে টেক্সটে রূপান্তরিত হয়েছে!');
      setTimeout(() => setSuccessToast(null), 3500);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 60);
    },
    onError: (err) => {
      console.warn('Voice recording error:', err);
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(newHeight, 48)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && input.trim()) {
        if (isRecording) stopRecording();
        onSend();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    if (file.type.startsWith('image/')) {
      setInput(
        (prev) =>
          `${prev ? prev + '\n\n' : ''}[সংযুক্ত ছবি: ${file.name} (${sizeFormatted})]\nএই ছবির মূল দৃশ্যপট, টেক্সট (OCR), অবজেক্ট ও প্রাসঙ্গিক তথ্য বিস্তারিত বাংলায় বিশ্লেষণ করো এবং দরকারী পরামর্শ দাও:`
      );
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setInput(
          (prev) =>
            `${prev ? prev + '\n\n' : ''}[ফাইল: ${file.name} (${sizeFormatted})]\n\`\`\`\n${text.slice(0, 12000)}\n\`\`\`\nএই ফাইলের কোড/তথ্য বিস্তারিত বিশ্লেষণ করো:`
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const modeButtons: Array<{ id: AssistantMode; label: string; icon: any }> = [
    { id: 'general', label: 'সাধারণ', icon: Sparkles },
    { id: 'citizen', label: 'জনসেবা ও A-Z সমাধান', icon: ShieldCheck },
    { id: 'coding', label: 'কোডিং ও ডেভেলপমেন্ট', icon: Code2 },
    { id: 'writing', label: 'লেখালেখি ও অনুবাদ', icon: PenTool },
    { id: 'research', label: 'গবেষণা ও ফ্যাক্ট-চেক', icon: Search },
    { id: 'learning', label: 'পড়াশোনা ও কনসেপ্ট', icon: GraduationCap },
  ];

  return (
    <div className="border-t border-stone-200/80 dark:border-stone-800/80 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-3 pt-2 pb-3.5 sm:px-6 md:px-8 md:pt-2.5 md:pb-6 lg:pb-7 transition-all shrink-0">
      <div className="max-w-4xl mx-auto space-y-2">
        {/* Error notification if microphone is blocked or failed */}
        {errorMessage && (
          <div
            id="voice-mic-error-banner"
            className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/60 rounded text-amber-700 dark:text-amber-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Success toast after voice transcription */}
        {successToast && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 shadow-xs">
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* AI Audio Transcribing Banner */}
        {isTranscribing && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-400/40 dark:border-emerald-800/60 text-xs text-emerald-700 dark:text-emerald-300 shadow-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">জেমিনি এআই দিয়ে অডিও ট্রান্সক্রাইব হচ্ছে... (AI transcribing speech to text)</span>
          </div>
        )}

        {/* Active MediaRecorder Recording Status Bar with Timer and Cancel */}
        {isRecording && (
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-400/40 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 shadow-xs animate-pulse">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
              </span>
              <span className="font-bold tracking-wider font-mono">
                00:{String(recordingDuration).padStart(2, '0')}
              </span>
              <span className="text-stone-400 hidden sm:inline">|</span>
              <span className="font-medium text-[11px] text-stone-700 dark:text-stone-300">
                {isHoldMode ? 'চেপে ধরে কথা বলুন (ছেড়ে দিলে টেক্সট হবে)' : 'কথা বলা শেষে সম্পন্ন বা স্টপ চাপুন'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cancelRecording}
                className="px-2 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                title="রেকর্ডিং বাতিল করুন"
              >
                <X className="w-3 h-3 text-stone-500" />
                <span>বাতিল</span>
              </button>
              <button
                type="button"
                onClick={stopRecording}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition-colors"
                title="রেকর্ডিং সমাপ্ত করে ট্রান্সক্রাইব করুন"
              >
                <Check className="w-3 h-3" />
                <span>সম্পন্ন</span>
              </button>
            </div>
          </div>
        )}

        {/* Real-time Visual Audio Frequency Wave Visualizer Animation */}
        <AudioFrequencyWave
          frequencyData={frequencyData}
          audioLevel={audioLevel}
          isListening={isRecording}
          language={voiceLang}
          interimText={isHoldMode ? "চেপে ধরে কথা বলুন, ছেড়ে দিলে ট্রান্সক্রাইব হবে..." : "কথা বলা শেষ হলে স্টপ বাটনে ক্লিক করুন..."}
          onStop={stopRecording}
          onSend={() => {
            stopRecording();
          }}
          onLanguageChange={(newLang) => setVoiceLang(newLang)}
        />

        {/* Mode & Tool Toggles */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            {modeButtons.map((btn) => {
              const Icon = btn.icon;
              const isActive = mode === btn.id;
              return (
                <button
                  key={btn.id}
                  id={`mode-btn-${btn.id}`}
                  onClick={() => setMode(btn.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>

          {/* Google Search Grounding toggle */}
          <button
            id="toggle-search-grounding-btn"
            onClick={() => setEnableSearch((prev: boolean) => !prev)}
            title="Google Search ডেটা দিয়ে রিয়েল-টাইম তথ্য পাওয়ার জন্য সক্রিয় করুন"
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium shrink-0 border transition-all ${
              enableSearch
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'
            }`}
          >
            <Globe className={`w-3.5 h-3.5 ${enableSearch ? 'text-blue-600 dark:text-blue-400' : 'text-stone-400'}`} />
            <span>Google Search: {enableSearch ? 'সক্রিয় (ON)' : 'বন্ধ (OFF)'}</span>
          </button>
        </div>

        {/* Instant Detected YouTube Link Chip */}
        {detectedYouTubeId && (
          <div className="mb-2.5 p-2.5 rounded-xl bg-gradient-to-r from-red-600/15 via-rose-600/10 to-transparent border border-red-500/40 flex flex-wrap items-center justify-between gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="p-1 rounded-md bg-red-600 text-white shrink-0 shadow-xs">
                <Youtube className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">
                ইউটিউব ভিডিও লিঙ্ক শনাক্ত হয়েছে (ID: {detectedYouTubeId})
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  musicPlayer.playVideoId(detectedYouTubeId, 'ইউটিউব ভিডিও / গান', {
                    autoPlay: true,
                    startMinimized: true,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-emerald-300 font-semibold text-xs border border-emerald-500/40 transition-all cursor-pointer"
                title="চ্যাট চালিয়ে যান, গান ব্যাকগ্রাউন্ডে চলবে"
              >
                <span>ব্যাকগ্রাউন্ডে চালান</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  musicPlayer.playVideoId(detectedYouTubeId, 'ইউটিউব ভিডিও / গান', {
                    autoPlay: true,
                    startMinimized: false,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>ফুলস্ক্রিন প্লেয়ার</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Text Box Container */}
        <div className={`relative rounded-2xl border bg-white dark:bg-stone-950 shadow-xs transition-all flex flex-col ${
          isRecording 
            ? 'border-rose-500 dark:border-rose-500 ring-2 ring-rose-500/30 shadow-[0_0_16px_rgba(244,63,94,0.25)]'
            : 'border-stone-300 dark:border-stone-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20'
        }`}>
          <textarea
            id="chat-textarea-input"
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              onFocus?.();
            }}
            onBlur={() => {
              onBlur?.();
            }}
            placeholder={
              isRecording
                ? 'কথা বলুন... আপনার কণ্ঠস্বর রেকর্ড হচ্ছে এবং ছেড়ে দিলে টেক্সট আকারে রূপান্তর হবে...'
                : 'গান বা ইউটিউব ভিডিও লিঙ্ক, ওয়েবসাইট সন্ধান, কোডিং বা যেকোনো প্রশ্ন লিখুন...'
            }
            className="w-full resize-none bg-transparent px-3.5 pt-3 pb-1.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none leading-relaxed min-h-[44px]"
          />

          {/* Action Bar inside Input Card (Never absolute, guaranteed in-flow & never overflows screen) */}
          <div className="flex items-center justify-between gap-1 sm:gap-2 px-2.5 pb-2 pt-1 border-t border-stone-100/90 dark:border-stone-850/80 min-w-0">
            {/* Left Action Buttons (Scrolls gracefully if needed on tiny screens, never pushes Send button) */}
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.txt,.js,.ts,.tsx,.jsx,.py,.html,.css,.json,.md,.csv,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                id="attach-file-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="ছবি, কোড বা টেক্সট ফাইল যুক্ত করুন"
                className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Universal Share Hub Launcher Button */}
              {onOpenShareReceiver && (
                <button
                  id="chat-share-receiver-btn"
                  type="button"
                  onClick={onOpenShareReceiver}
                  title="বহিরাগত প্ল্যাটফর্ম থেকে ফাইল, ছবি, লিংক ও লেখা আনুন (Universal Share Hub)"
                  className="p-1.5 sm:p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}

              {/* Google Drive Import Button */}
              {onOpenGoogleDrive && (
                <button
                  id="chat-google-drive-btn"
                  type="button"
                  onClick={onOpenGoogleDrive}
                  title="Google Drive থেকে ফাইল বা কোড ইম্পোর্ট করুন"
                  className="p-1.5 sm:p-2 rounded-xl text-amber-500 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer shrink-0"
                >
                  <HardDrive className="w-4 h-4" />
                </button>
              )}

              {/* In-App Mini Google Browser Launcher Button */}
              <button
                id="chat-mini-google-browser-btn"
                type="button"
                onClick={() => miniBrowser.openBrowser(input.trim() || undefined)}
                title="মিনি গুগল ব্রাউজার ও লাইভ ওয়েব সার্চ খুলুন (Google Search, YouTube & Resources)"
                className="p-1.5 sm:p-2 rounded-xl text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer shrink-0"
              >
                <Globe className="w-4 h-4" />
              </button>

              {/* Hold to Record Microphone Button */}
              <div className="relative inline-flex items-center select-none shrink-0">
                {isRecording && (
                  <>
                    <span className="absolute -inset-1 rounded-xl bg-rose-500/40 animate-ping pointer-events-none" />
                    <span className="absolute -inset-2 rounded-xl bg-rose-500/20 animate-pulse blur-xs pointer-events-none" />
                  </>
                )}

                <motion.button
                  id="voice-input-mic-btn"
                  type="button"
                  onMouseDown={(e) => {
                    if (e.button === 0) handleHoldStart(e);
                  }}
                  onMouseUp={(e) => {
                    if (e.button === 0) handleHoldEnd(e);
                  }}
                  onTouchStart={(e) => {
                    handleHoldStart(e);
                  }}
                  onTouchEnd={(e) => {
                    handleHoldEnd(e);
                  }}
                  onClick={() => {
                    if (!isHoldMode) {
                      toggleRecording();
                    }
                  }}
                  disabled={isTranscribing}
                  title={
                    isRecording
                      ? 'রেকর্ডিং শেষ করতে ছেড়ে দিন বা ক্লিক করুন'
                      : isTranscribing
                      ? 'জেমিনি এআই দিয়ে ট্রান্সক্রাইব হচ্ছে...'
                      : `চেপে ধরে কথা বলুন (Hold to Record) | ক্লিক করে রেকর্ডিং শুরু করুন (${voiceLang === 'bn-BD' ? 'বাংলা' : 'English'})`
                  }
                  animate={
                    isRecording
                      ? {
                          scale: [1, 1.06, 1],
                          boxShadow: [
                            '0 0 0 0 rgba(244, 63, 94, 0.5), 0 2px 8px rgba(244, 63, 94, 0.3)',
                            '0 0 0 7px rgba(244, 63, 94, 0), 0 2px 14px rgba(244, 63, 94, 0.4)',
                            '0 0 0 0 rgba(244, 63, 94, 0.5), 0 2px 8px rgba(244, 63, 94, 0.3)',
                          ],
                        }
                      : { scale: 1, boxShadow: 'none' }
                  }
                  transition={
                    isRecording
                      ? {
                          repeat: Infinity,
                          duration: 1.2,
                          ease: 'easeInOut',
                        }
                      : { duration: 0.15 }
                  }
                  className={`relative z-10 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none touch-none shrink-0 ${
                    isRecording
                      ? 'bg-rose-600 text-white shadow-md active:bg-rose-700'
                      : isTranscribing
                      ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 active:scale-95 shadow-2xs'
                  }`}
                >
                  {isTranscribing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden xs:inline">ট্রান্সক্রাইব...</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>

                      <Mic className="w-3.5 h-3.5 animate-pulse" />
                      <span className="text-[11px]">{isHoldMode ? 'ছেড়ে দিন' : 'রেকর্ডিং'} (00:{String(recordingDuration).padStart(2, '0')})</span>

                      <div className="flex items-center gap-0.5 h-3 ml-0.5">
                        {[0.4, 0.9, 0.6, 1, 0.5].map((factor, i) => {
                          const freq = frequencyData[i * 4] || audioLevel;
                          const heightScale = Math.min(1.4, Math.max(0.35, ((freq || 20) / 45) * factor));
                          return (
                            <motion.span
                              key={i}
                              animate={{
                                scaleY: [0.35, heightScale, 0.35],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.35 + i * 0.08,
                                ease: 'easeInOut',
                              }}
                              className="w-0.5 h-3 bg-white/95 rounded-full origin-bottom"
                            />
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                      <span className="hidden sm:inline">ভয়েস (Hold)</span>
                      <span className="hidden xs:inline sm:hidden">ভয়েস</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Quick Language Toggle Pill (Bengali / English) */}
              <button
                id="voice-language-quick-toggle"
                type="button"
                onClick={() => setVoiceLang(voiceLang === 'bn-BD' ? 'en-US' : 'bn-BD')}
                title={`ভয়েস ইনপুট ভাষা: ${voiceLang === 'bn-BD' ? 'বাংলা (bn-BD)' : 'English (en-US)'} - পরিবর্তন করতে ক্লিক করুন`}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-xl text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
                  voiceLang === 'bn-BD'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800 hover:bg-blue-100'
                }`}
              >
                <Languages className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="text-[11px]">{voiceLang === 'bn-BD' ? 'বাং' : 'EN'}</span>
              </button>

              {input && (
                <button
                  id="clear-input-btn"
                  type="button"
                  onClick={() => setInput('')}
                  title="লেখা মুছুন"
                  className="p-1.5 sm:p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right Action Buttons (Anchored, shrink-0, ALWAYS 100% visible on screen) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pl-1">
              {/* Word & Character Counter Component */}
              <WordCharCounter
                text={input}
                onCleanWhitespace={(cleaned) => setInput(cleaned)}
              />

              <span className="hidden lg:inline text-[11px] text-stone-400">
                Enter পাঠাতে
              </span>

              {isGenerating ? (
                <button
                  id="stop-generating-btn"
                  type="button"
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer min-h-[40px]"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>থামাও</span>
                </button>
              ) : (
                <button
                  id="send-message-btn"
                  type="button"
                  onClick={() => {
                    if (isRecording) stopRecording();
                    onSend();
                  }}
                  disabled={!input.trim()}
                  className={`flex items-center justify-center min-w-[42px] min-h-[42px] p-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                    input.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/30 active:scale-95'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                  }`}
                  title="মেসেজ পাঠান (Send message)"
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
