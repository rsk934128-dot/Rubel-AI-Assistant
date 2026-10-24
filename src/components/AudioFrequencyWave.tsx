import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, Activity, Volume2, Sparkles } from 'lucide-react';

interface AudioFrequencyWaveProps {
  frequencyData: number[];
  audioLevel: number;
  isListening: boolean;
  language: string;
  interimText?: string;
  onStop: () => void;
  onSend?: () => void;
  onLanguageChange?: (lang: 'bn-BD' | 'en-US') => void;
}

export const AudioFrequencyWave: React.FC<AudioFrequencyWaveProps> = ({
  frequencyData,
  audioLevel,
  isListening,
  language,
  interimText,
  onStop,
  onSend,
  onLanguageChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Smooth fluid acoustic canvas waveform
  useEffect(() => {
    if (!isListening) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Amplitude driven by real-time audioLevel
      const isVoiceActive = audioLevel > 5;
      const targetAmp = isVoiceActive ? Math.min(height * 0.42, (audioLevel / 100) * (height * 0.45) + 6) : 3.5;
      phaseRef.current += isVoiceActive ? 0.08 + (audioLevel / 500) : 0.04;

      // Draw 3 layered harmonic sine waves with glow
      const layers = [
        { color: 'rgba(244, 63, 94, 0.75)', freq: 0.018, speed: 1.0, amp: targetAmp },
        { color: 'rgba(168, 85, 247, 0.55)', freq: 0.026, speed: 1.3, amp: targetAmp * 0.75 },
        { color: 'rgba(16, 185, 129, 0.45)', freq: 0.032, speed: 0.7, amp: targetAmp * 0.5 },
      ];

      layers.forEach(({ color, freq, speed, amp }) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        const centerY = height / 2;

        for (let x = 0; x < width; x += 2) {
          // Windowing function (Hanning curve so edges taper to zero)
          const envelope = Math.sin((Math.PI * x) / width);
          const y = centerY + Math.sin(x * freq + phaseRef.current * speed) * amp * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isListening, audioLevel]);

  if (!isListening) return null;

  // Generate 28 symmetrical spectral bars
  const barCount = 28;
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Distance from center (0 = center, 1 = outermost edge)
    const centerIdx = (barCount - 1) / 2;
    const distFromCenter = Math.abs(i - centerIdx) / centerIdx;
    
    // Sample from frequencyData or fallback to audioLevel
    const freqIdx = Math.min(frequencyData.length - 1, Math.floor(distFromCenter * (frequencyData.length || 1)));
    const freqVal = frequencyData[freqIdx] !== undefined ? frequencyData[freqIdx] : audioLevel;

    // Weight center bars for speech/vocal frequencies
    const vocalWeight = 1 - distFromCenter * 0.45;
    const baseHeight = audioLevel > 4
      ? Math.max(4, Math.min(38, (freqVal * 0.35 + audioLevel * 0.25) * vocalWeight))
      : Math.max(3, 4 + Math.sin(i * 0.4) * 2.5);

    return {
      id: i,
      height: baseHeight,
      distFromCenter,
    };
  });

  const isSpeaking = audioLevel > 10;

  return (
    <div
      id="voice-frequency-wave-container"
      className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-stone-900 border border-rose-500/40 dark:border-rose-500/50 shadow-lg text-xs space-y-2.5 transition-all animate-in fade-in zoom-in-98 duration-200"
    >
      {/* Top Status & Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-500/20 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Pulsing Beacon */}
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          </span>

          <div className="flex items-center gap-1.5 min-w-0">
            <Mic className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="font-bold text-stone-100 truncate text-[11px] sm:text-xs">
              {isSpeaking ? 'কণ্ঠস্বর শনাক্ত হচ্ছে...' : 'কথা বলুন... মাইক্রোফোন সক্রিয়'}
            </span>
          </div>

          {/* Live Decibel / Level Meter */}
          <span
            className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors ${
              isSpeaking
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            <Activity className="w-2.5 h-2.5" />
            <span>সিগন্যাল: {audioLevel}%</span>
          </span>
        </div>

        {/* Language Selection & Stop/Send Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onLanguageChange && (
            <div className="flex items-center p-0.5 rounded-lg bg-stone-900/90 border border-stone-800 text-[11px]">
              <button
                type="button"
                onClick={() => onLanguageChange('bn-BD')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  language === 'bn-BD'
                    ? 'bg-rose-600 text-white font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="বাংলায় ভয়েস ইনপুট"
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en-US')}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  language === 'en-US'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title="English Voice Typing"
              >
                English
              </button>
            </div>
          )}

          {onSend && (
            <button
              type="button"
              onClick={onSend}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1"
              title="কথা শেষ হলে সরাসরি মেসেজ পাঠান"
            >
              <Sparkles className="w-3 h-3" />
              <span>পাঠান</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStop}
            className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold text-xs transition-colors border border-stone-700 cursor-pointer"
            title="ভয়েস ইনপুট থামান"
          >
            থামুন
          </button>
        </div>
      </div>

      {/* Visual Audio Frequency Spectrum Equalizer Bars & Fluid Wave Canvas */}
      <div className="relative py-1 flex flex-col items-center justify-center bg-stone-950/60 rounded-xl border border-stone-800/80 overflow-hidden px-3">
        {/* Background Fluid Harmonic Wave Canvas */}
        <canvas
          ref={canvasRef}
          width={600}
          height={48}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
        />

        {/* Dynamic Foreground Equalizer Frequency Bars */}
        <div className="relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 h-11 w-full max-w-lg mx-auto py-1">
          {bars.map((bar) => {
            // Dynamic color gradient based on distance from center
            const colorClass =
              bar.distFromCenter < 0.35
                ? 'from-rose-500 via-pink-500 to-amber-400 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                : bar.distFromCenter < 0.7
                ? 'from-purple-500 via-violet-500 to-fuchsia-400 shadow-[0_0_6px_rgba(168,85,247,0.4)]'
                : 'from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_6px_rgba(16,185,129,0.3)]';

            return (
              <span
                key={bar.id}
                className={`w-1 sm:w-1.5 rounded-full bg-gradient-to-t ${colorClass} transition-all duration-75 ease-out`}
                style={{
                  height: `${bar.height}px`,
                  opacity: Math.max(0.4, 1 - bar.distFromCenter * 0.35),
                }}
              />
            );
          })}
        </div>

        {/* Real-time Subtitle / Live Interim Transcript Box */}
        {interimText && (
          <div className="relative z-10 w-full mt-1.5 mb-1 px-3 py-1.5 rounded-lg bg-stone-900/90 border border-rose-500/30 text-xs text-stone-100 font-mono flex items-start gap-2 shadow-inner">
            <Volume2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <span className="flex-1 break-words italic">"{interimText}"</span>
          </div>
        )}
      </div>

      {/* Voice Assistant Tip */}
      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-stone-400 pt-0.5">
        <span className="flex items-center gap-1 text-stone-300">
          <span>🗣️ আপনার কণ্ঠস্বর সরাসরি টাইপ হচ্ছে।</span>
        </span>
        <span className="text-emerald-400 font-medium">
          কমান্ড: শেষে <strong>"পাঠাও"</strong> অথবা <strong>"Send"</strong> বললে স্বয়ংক্রিয়ভাবে মেসেজ চলে যাবে
        </span>
      </div>
    </div>
  );
};
