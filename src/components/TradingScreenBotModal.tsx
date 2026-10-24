import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Monitor,
  Camera,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  DollarSign,
  ShieldCheck,
  Zap,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  Layers,
  History,
  AlertTriangle,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  TradingSignal,
  ExecutedTrade,
  TradingBotSettings,
} from '../types/tradingBot';

interface TradingScreenBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFloatingHUD: () => void;
  currentSignal: TradingSignal | null;
  onSignalUpdate: (signal: TradingSignal) => void;
  virtualBalance: number;
  onUpdateBalance: (balance: number) => void;
  activeTrades: ExecutedTrade[];
  onUpdateActiveTrades: (trades: ExecutedTrade[]) => void;
  tradeHistory: ExecutedTrade[];
  onUpdateTradeHistory: (history: ExecutedTrade[]) => void;
  settings: TradingBotSettings;
  onUpdateSettings: (settings: TradingBotSettings) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (val: boolean) => void;
}

export const TradingScreenBotModal: React.FC<TradingScreenBotModalProps> = ({
  isOpen,
  onClose,
  onOpenFloatingHUD,
  currentSignal,
  onSignalUpdate,
  virtualBalance,
  onUpdateBalance,
  activeTrades,
  onUpdateActiveTrades,
  tradeHistory,
  onUpdateTradeHistory,
  settings,
  onUpdateSettings,
  isAnalyzing,
  setIsAnalyzing,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);
  const [autoScanCountdown, setAutoScanCountdown] = useState<number>(settings.autoScanInterval);
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'settings'>('live');
  const [tradeAmountInput, setTradeAmountInput] = useState<number>(settings.tradeAmount || 25);
  const [durationInput, setDurationInput] = useState<number>(60); // 60s
  const [webhookTestStatus, setWebhookTestStatus] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoScanTimerRef = useRef<any>(null);

  // Play audio voice alert
  const playVoiceAlert = useCallback(
    (text: string) => {
      if (!settings.voiceAlerts || !text) return;
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'bn-BD';
          utterance.rate = 1.05;
          window.speechSynthesis.speak(utterance);
        } else {
          // Fallback to server TTS
          const audio = new Audio(`/api/tts?text=${encodeURIComponent(text)}&lang=bn`);
          audio.play().catch(() => {});
        }
      } catch (e) {
        console.warn('Voice alert error:', e);
      }
    },
    [settings.voiceAlerts]
  );

  // Start Screen Capture
  const startScreenCapture = async () => {
    setScreenShareError(null);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('আপনার ব্রাউজারে স্ক্রিন শেয়ার সাপোর্ট করছে না। আপনি চার্ট স্ক্রিনশট পেস্ট বা আপলোড করতে পারেন।');
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          cursor: 'always',
        } as any,
        audio: false,
      });

      setStream(mediaStream);
      setIsScreenSharing(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }

      // Handle user stopping screen share from browser banner
      mediaStream.getVideoTracks()[0].onended = () => {
        setIsScreenSharing(false);
        setStream(null);
      };
    } catch (err: any) {
      console.warn('Screen capture cancelled or failed:', err);
      if (err.name !== 'NotAllowedError') {
        setScreenShareError(err?.message || 'স্ক্রিন শেয়ার চালু করা যায়নি।');
      }
    }
  };

  const stopScreenCapture = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsScreenSharing(false);
  };

  // Capture frame from video or fallback image
  const captureCurrentFrame = (): string | null => {
    if (manualImagePreview) {
      return manualImagePreview;
    }

    if (!videoRef.current || !canvasRef.current || !isScreenSharing) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.85);
  };

  // Perform AI Chart Analysis
  const performAnalysis = useCallback(async () => {
    const frameBase64 = captureCurrentFrame();
    if (!frameBase64) {
      if (!isScreenSharing && !manualImagePreview) {
        setScreenShareError('দয়া করে প্রথমে ট্রেডিং স্ক্রিন শেয়ার করুন বা চার্টের স্ক্রিনশট দিন।');
      }
      return;
    }

    setIsAnalyzing(true);
    setScreenShareError(null);

    try {
      const response = await fetch('/api/trading-bot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: frameBase64,
          platform: settings.platform,
          market: settings.market,
          timeframe: settings.timeframe,
          strategy: settings.strategy,
        }),
      });

      const data = await response.json();
      if (!data.success || !data.analysis) {
        throw new Error(data.error || 'এনালাইসিস সম্পন্ন করা যায়নি।');
      }

      const sig: TradingSignal = {
        action: data.analysis.action || 'HOLD',
        confidence: Number(data.analysis.confidence) || 75,
        trend: data.analysis.trend || 'SIDEWAYS',
        pattern: data.analysis.pattern || 'Chart Pattern',
        indicators: Array.isArray(data.analysis.indicators) ? data.analysis.indicators : [],
        supportLevel: data.analysis.supportLevel,
        resistanceLevel: data.analysis.resistanceLevel,
        timeframeRecommended: data.analysis.timeframeRecommended || '1 Minute',
        riskLevel: data.analysis.riskLevel || 'LOW',
        reasonBn: data.analysis.reasonBn || '',
        reasonEn: data.analysis.reasonEn || '',
        suggestedEntry: data.analysis.suggestedEntry,
        stopLoss: data.analysis.stopLoss,
        takeProfit: data.analysis.takeProfit,
        audioAlertBn: data.analysis.audioAlertBn,
        timestamp: Date.now(),
      };

      onSignalUpdate(sig);

      // Trigger audio alert
      if (sig.audioAlertBn) {
        playVoiceAlert(sig.audioAlertBn);
      }

      // Check Auto-Trade Trigger
      if (
        settings.autoTrade &&
        (sig.action === 'BUY' || sig.action === 'SELL') &&
        sig.confidence >= settings.minConfidenceThreshold
      ) {
        executeTrade(sig.action, sig);
      }

      // Trigger Webhook if configured
      if (settings.webhookUrl) {
        fetch('/api/trading-bot/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: settings.webhookUrl,
            payload: {
              event: 'TRADING_SIGNAL',
              signal: sig,
              platform: settings.platform,
              market: settings.market,
              timestamp: Date.now(),
            },
          }),
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error('Trading analysis error:', err);
      setScreenShareError(err?.message || 'এনালাইসিসে ত্রুটি হয়েছে।');
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    isScreenSharing,
    manualImagePreview,
    settings,
    onSignalUpdate,
    playVoiceAlert,
    setIsAnalyzing,
  ]);

  // Execute Simulated Trade
  const executeTrade = (action: 'BUY' | 'SELL', signalSource?: TradingSignal) => {
    const amount = Number(tradeAmountInput) || 25;
    if (virtualBalance < amount) {
      alert('ডেমো ব্যালেন্স অপর্যাপ্ত! অনুগ্রহ করে ব্যালেন্স বাড়ান।');
      return;
    }

    const newBalance = virtualBalance - amount;
    onUpdateBalance(newBalance);

    const sig = signalSource || currentSignal;
    const newTrade: ExecutedTrade = {
      id: 'trade-' + Date.now(),
      timestamp: Date.now(),
      action,
      platform: settings.platform,
      market: settings.market,
      amount,
      entryConfidence: sig?.confidence || 80,
      durationSeconds: durationInput,
      remainingSeconds: durationInput,
      status: 'OPEN',
      pnl: 0,
      pattern: sig?.pattern || '1-Click Execution',
    };

    onUpdateActiveTrades([...activeTrades, newTrade]);
  };

  // Active Trades countdown ticker
  useEffect(() => {
    if (activeTrades.length === 0) return;

    const interval = setInterval(() => {
      onUpdateActiveTrades(
        activeTrades.map((t) => {
          if (t.remainingSeconds <= 1) {
            // Trade finished! Calculate outcome based on probability
            const isWin = Math.random() * 100 <= Math.min(94, Math.max(60, t.entryConfidence));
            const payoutRatio = 0.85; // 85% binary payout
            const pnl = isWin ? t.amount * payoutRatio : -t.amount;
            const updatedTrade: ExecutedTrade = {
              ...t,
              remainingSeconds: 0,
              status: isWin ? 'WON' : 'LOST',
              pnl,
            };

            // Add back payout to balance if won
            if (isWin) {
              onUpdateBalance(virtualBalance + t.amount + pnl);
            }

            // Move to history
            onUpdateTradeHistory([updatedTrade, ...tradeHistory]);
            return updatedTrade;
          }
          return { ...t, remainingSeconds: t.remainingSeconds - 1 };
        }).filter((t) => t.remainingSeconds > 0)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTrades, virtualBalance, tradeHistory, onUpdateActiveTrades, onUpdateBalance, onUpdateTradeHistory]);

  // Auto-Scan interval countdown and runner
  useEffect(() => {
    if (settings.autoScanInterval <= 0 || !isScreenSharing) {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
      return;
    }

    autoScanTimerRef.current = setInterval(() => {
      setAutoScanCountdown((prev) => {
        if (prev <= 1) {
          performAnalysis();
          return settings.autoScanInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    };
  }, [settings.autoScanInterval, isScreenSharing, performAnalysis]);

  // Paste screenshot from clipboard (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            setManualImagePreview(event.target?.result as string);
            setIsScreenSharing(false);
          };
          reader.readAsDataURL(file);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Test Webhook
  const handleTestWebhook = async () => {
    if (!settings.webhookUrl) return;
    setWebhookTestStatus('টেস্ট পাঠানো হচ্ছে...');
    try {
      const res = await fetch('/api/trading-bot/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: settings.webhookUrl,
          payload: {
            event: 'PING_TEST',
            message: 'Rubel AI Trading Bot Webhook is online!',
            timestamp: Date.now(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookTestStatus('সফলভাবে কানেক্ট হয়েছে! (Status 200)');
      } else {
        setWebhookTestStatus(`ব্যর্থ: ${data.error || 'Server rejected'}`);
      }
    } catch (e: any) {
      setWebhookTestStatus(`ত্রুটি: ${e?.message}`);
    }
  };

  if (!isOpen) return null;

  const currentAction = currentSignal?.action || 'HOLD';
  const confidence = currentSignal?.confidence || 0;

  // Win rate stats
  const completedTrades = tradeHistory;
  const wonTrades = completedTrades.filter((t) => t.status === 'WON').length;
  const winRate = completedTrades.length > 0 ? Math.round((wonTrades / completedTrades.length) * 100) : 0;
  const totalPnL = completedTrades.reduce((acc, t) => acc + t.pnl, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-stone-950 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-stone-900 via-stone-900 to-emerald-950/60 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-stone-950 font-bold shadow-md shadow-emerald-950/80">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  রিয়েল-টাইম স্ক্রিন এনালাইসিস ট্রেডিং এআই বট
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                  LIVE AI VISION
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">
                Quotex, Pocket Option, Binance বা TradingView চার্ট রিয়েল-টাইম স্ক্যান করে নিখুঁত Buy/Sell সিগন্যাল প্রদান
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Always on top floating HUD mode trigger */}
            <button
              type="button"
              id="switch-to-floating-hud-btn"
              onClick={onOpenFloatingHUD}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              title="স্ক্রিনের উপর সবসময় ভাসমান রাখুন (Picture-in-Picture / Floating HUD)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">স্ক্রিনে ভাসমান রাখুন (HUD)</span>
              <span className="sm:hidden">HUD</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-stone-900/60 border-b border-stone-800/80 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('live')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'live'
                  ? 'bg-emerald-500 text-stone-950 shadow-sm'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
              }`}
            >
              লাইভ স্ক্যান ও বাই/সেল
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-stone-950 shadow-sm'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>ট্রেড হিস্টোরি ({completedTrades.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-emerald-500 text-stone-950 shadow-sm'
                  : 'bg-stone-850 hover:bg-stone-800 text-stone-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>সেটিংস ও অটোমেশন</span>
            </button>
          </div>

          {/* Virtual Balance Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>ডেমো ব্যালেন্স:</span>
              <span className="text-white">${virtualBalance.toFixed(2)}</span>
            </div>
            <button
              type="button"
              onClick={() => onUpdateBalance(10000)}
              title="ব্যালেন্স $10,000 এ রিসেট করুন"
              className="text-[10px] text-stone-400 hover:text-white underline cursor-pointer"
            >
              রিসেট
            </button>
          </div>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {activeTab === 'live' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Screen Stream & Capture */}
              <div className="lg:col-span-7 space-y-4">
                {/* Screen Share Viewport Container */}
                <div className="relative rounded-2xl bg-black border border-stone-800 overflow-hidden aspect-video flex items-center justify-center group shadow-inner">
                  {/* Real Live Video */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-contain ${isScreenSharing ? 'block' : 'hidden'}`}
                  />

                  {/* Manual Upload Preview */}
                  {manualImagePreview && !isScreenSharing && (
                    <img
                      src={manualImagePreview}
                      alt="Uploaded Chart"
                      className="w-full h-full object-contain"
                    />
                  )}

                  {/* Canvas for processing */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Empty state when no screen is connected */}
                  {!isScreenSharing && !manualImagePreview && (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-3xl bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-400">
                        <Monitor className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white">
                          কোনো ট্রেডিং স্ক্রিন কানেক্টেড নেই
                        </h4>
                        <p className="text-xs text-stone-400 max-w-sm mx-auto">
                          নিচের বাটনে ক্লিক করে আপনার Quotex, Pocket Option, Binance বা TradingView এর উইন্ডো/ট্যাবটি সিলেক্ট করুন।
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          id="start-screen-share-btn"
                          onClick={startScreenCapture}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>ট্রেডিং স্ক্রিন শেয়ার ও কানেক্ট করুন</span>
                        </button>
                        <label className="px-3.5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 font-semibold text-xs cursor-pointer transition-colors">
                          <span>ছবি আপলোড (Ctrl+V)</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const r = new FileReader();
                                r.onload = (ev) => {
                                  setManualImagePreview(ev.target?.result as string);
                                  setIsScreenSharing(false);
                                };
                                r.readAsDataURL(f);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Top Overlay Badges */}
                  {(isScreenSharing || manualImagePreview) && (
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-md">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>
                            {isScreenSharing ? 'লাইভ স্ক্রিন স্ট্রিম' : 'স্ট্যাটিক স্ক্রিনশট'}
                          </span>
                        </span>
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-black/70 backdrop-blur-md text-stone-300 border border-stone-700">
                          {settings.market} • {settings.platform}
                        </span>
                      </div>

                      <div className="pointer-events-auto flex items-center gap-1.5">
                        {isScreenSharing && (
                          <button
                            type="button"
                            onClick={stopScreenCapture}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-600/80 hover:bg-red-600 text-white shadow-md transition-colors cursor-pointer"
                          >
                            স্টপ
                          </button>
                        )}
                        {manualImagePreview && (
                          <button
                            type="button"
                            onClick={() => setManualImagePreview(null)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 shadow-md transition-colors cursor-pointer"
                          >
                            মুছুন
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Scanning Scanner Animation Overlay */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-emerald-950/30 backdrop-blur-2xs flex flex-col items-center justify-center space-y-2 pointer-events-none">
                      <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                      <p className="text-xs font-bold text-emerald-300 tracking-wide animate-pulse">
                        ক্যান্ডেলস্টিক ও সাপোর্ট-রেজিস্ট্যান্স এনালাইসিস চলছে...
                      </p>
                    </div>
                  )}
                </div>

                {/* Stream Controls & Instant Trigger Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="scan-now-button"
                      onClick={performAnalysis}
                      disabled={isAnalyzing || (!isScreenSharing && !manualImagePreview)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isAnalyzing ? 'এনালাইসিস চলছে...' : 'এখনই স্ক্যান ও এনালাইসিস করুন'}</span>
                    </button>

                    {!isScreenSharing && (
                      <button
                        type="button"
                        onClick={startScreenCapture}
                        className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 font-semibold text-xs border border-stone-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>কানেক্ট স্ক্রিন</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {settings.autoScanInterval > 0 && isScreenSharing && (
                      <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-blue-400" />
                        <span>অটো-স্ক্যান:</span>
                        <span className="font-mono font-bold text-blue-400">
                          {autoScanCountdown}s
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...settings,
                          voiceAlerts: !settings.voiceAlerts,
                        })
                      }
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        settings.voiceAlerts
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-stone-850 text-stone-400 border-stone-750'
                      }`}
                      title={settings.voiceAlerts ? 'ভয়েস অ্যালার্ট সক্রিয়' : 'ভয়েস অ্যালার্ট বন্ধ'}
                    >
                      {settings.voiceAlerts ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {screenShareError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{screenShareError}</span>
                  </div>
                )}
              </div>

              {/* Right Column: AI Signal & Trade Execution */}
              <div className="lg:col-span-5 space-y-4">
                {/* Live Decision Card */}
                <div
                  className={`p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                    currentAction === 'BUY'
                      ? 'bg-gradient-to-br from-emerald-950/80 via-stone-900 to-stone-950 border-emerald-500/60 shadow-xl shadow-emerald-950/60'
                      : currentAction === 'SELL'
                      ? 'bg-gradient-to-br from-rose-950/80 via-stone-900 to-stone-950 border-rose-500/60 shadow-xl shadow-rose-950/60'
                      : 'bg-gradient-to-br from-stone-900 to-stone-950 border-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                        এআই সিগন্যাল ফলাফল
                      </span>
                      {currentSignal?.trend && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                          {currentSignal.trend}
                        </span>
                      )}
                    </div>
                    {currentSignal?.timestamp && (
                      <span className="text-[10px] text-stone-500 font-mono">
                        {new Date(currentSignal.timestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {/* Main Action Header */}
                  <div className="py-4 flex items-center justify-between">
                    <div>
                      <h4
                        className={`text-2xl sm:text-3xl font-black tracking-tight ${
                          currentAction === 'BUY'
                            ? 'text-emerald-400'
                            : currentAction === 'SELL'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {currentAction === 'BUY'
                          ? 'BUY (CALL) 🟢'
                          : currentAction === 'SELL'
                          ? 'SELL (PUT) 🔴'
                          : 'HOLD / অপেক্ষা করুন 🟡'}
                      </h4>
                      <p className="text-xs font-bold text-white mt-1">
                        {currentSignal?.pattern || 'চার্ট স্ক্যান করে প্যাটার্ন শনাক্ত করুন'}
                      </p>
                    </div>

                    {confidence > 0 && (
                      <div className="text-right">
                        <div className="text-2xl font-black font-mono text-white">
                          {confidence}%
                        </div>
                        <span className="text-[10px] text-stone-400 uppercase font-semibold">
                          উইন রেট সম্ভাবনা
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rationale in Bengali */}
                  {currentSignal?.reasonBn ? (
                    <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-stone-200 leading-relaxed space-y-1">
                      <p className="font-semibold text-emerald-400 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>ট্রেডিং ব্যাখ্যা ও যুক্তি:</span>
                      </p>
                      <p>{currentSignal.reasonBn}</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-stone-900/50 border border-stone-800/60 text-xs text-stone-400 italic">
                      স্ক্রিন শেয়ার করে "এখনই স্ক্যান করুন" বাটনে চাপ দিন। এআই চার্টের ক্যান্ডেলস্টিক পরীক্ষা করে বিস্তারিত যুক্তি তুলে ধরবে।
                    </div>
                  )}

                  {/* Levels & Indicator Badges */}
                  {currentSignal && (
                    <div className="grid grid-cols-2 gap-2 pt-3 text-[11px]">
                      <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                        <span className="text-stone-400 block text-[10px]">সাপোর্ট জোন:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {currentSignal.supportLevel || 'N/A'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                        <span className="text-stone-400 block text-[10px]">রেজিস্ট্যান্স জোন:</span>
                        <span className="font-mono font-bold text-rose-400">
                          {currentSignal.resistanceLevel || 'N/A'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                        <span className="text-stone-400 block text-[10px]">প্রস্তাবিত সময় (Expiry):</span>
                        <span className="font-bold text-indigo-300">
                          {currentSignal.timeframeRecommended || '1 Minute'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-stone-900/60 border border-stone-800">
                        <span className="text-stone-400 block text-[10px]">ঝুঁকি লেভেল (Risk):</span>
                        <span className={`font-bold ${currentSignal.riskLevel === 'LOW' ? 'text-emerald-400' : currentSignal.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-amber-400'}`}>
                          {currentSignal.riskLevel}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 1-Click Interactive Trading Desk */}
                <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>১-ক্লিক ট্রেড এক্সিকিউশন ডেক</span>
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      মার্কেট: {settings.market}
                    </span>
                  </div>

                  {/* Trade Parameters Input */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">
                        ট্রেড পরিমাণ ($ USD):
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="5000"
                          value={tradeAmountInput}
                          onChange={(e) => setTradeAmountInput(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 font-mono font-bold text-white focus:outline-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">
                        ট্রেড ডুরেশন (Expiry):
                      </label>
                      <select
                        value={durationInput}
                        onChange={(e) => setDurationInput(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-semibold focus:outline-emerald-500 cursor-pointer"
                      >
                        <option value={30}>৩০ সেকেন্ড (Turbo)</option>
                        <option value={60}>১ মিনিট (60s Standard)</option>
                        <option value={120}>২ মিনিট</option>
                        <option value={300}>৫ মিনিট</option>
                      </select>
                    </div>
                  </div>

                  {/* Tactile Big Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      id="main-buy-call-btn"
                      onClick={() => executeTrade('BUY')}
                      className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-500 hover:brightness-110 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/70 transition-all cursor-pointer group"
                    >
                      <TrendingUp className="w-5 h-5 stroke-[3] group-hover:-translate-y-0.5 transition-transform" />
                      <span>BUY (CALL) 🟢</span>
                    </button>

                    <button
                      type="button"
                      id="main-sell-put-btn"
                      onClick={() => executeTrade('SELL')}
                      className="py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 hover:brightness-110 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/70 transition-all cursor-pointer group"
                    >
                      <TrendingDown className="w-5 h-5 stroke-[3] group-hover:translate-y-0.5 transition-transform" />
                      <span>SELL (PUT) 🔴</span>
                    </button>
                  </div>

                  {/* Active Positions */}
                  {activeTrades.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-stone-800">
                      <span className="text-[11px] font-bold text-stone-300 block">
                        চলমান সক্রিয় ট্রেডস ({activeTrades.length}):
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {activeTrades.map((t) => (
                          <div
                            key={t.id}
                            className="p-2.5 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-between text-xs font-mono"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.action === 'BUY'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {t.action}
                              </span>
                              <span className="text-white">${t.amount}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-stone-400 text-[11px]">
                                {t.remainingSeconds}s বাকি
                              </span>
                              <div className="w-16 bg-stone-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full transition-all duration-1000"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      (t.remainingSeconds / t.durationSeconds) * 100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trade History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Stats overview banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-xs text-stone-400 block">মোট সম্পন্ন ট্রেড</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {completedTrades.length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-xs text-stone-400 block">উইন রেট (Win Rate)</span>
                  <span className="text-xl font-bold font-mono text-emerald-400">
                    {winRate}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-xs text-stone-400 block">বিজয়ী ট্রেডস (Won)</span>
                  <span className="text-xl font-bold font-mono text-emerald-300">
                    {wonTrades}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800">
                  <span className="text-xs text-stone-400 block">নেট প্রফিট (P&L)</span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* History Table */}
              {completedTrades.length === 0 ? (
                <div className="text-center py-12 text-stone-500 text-sm">
                  এখনো কোনো সম্পন্ন ট্রেড নেই। লাইভ স্ক্যান থেকে Buy বা Sell ট্রেড করুন।
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-stone-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-900 text-stone-400 text-[11px] uppercase border-b border-stone-800">
                      <tr>
                        <th className="px-4 py-3">সময়</th>
                        <th className="px-4 py-3">অ্যাকশন</th>
                        <th className="px-4 py-3">মার্কেট</th>
                        <th className="px-4 py-3">পরিমাণ</th>
                        <th className="px-4 py-3">আস্থা</th>
                        <th className="px-4 py-3">ফলাফল</th>
                        <th className="px-4 py-3 text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 font-mono">
                      {completedTrades.map((t) => (
                        <tr key={t.id} className="hover:bg-stone-900/40">
                          <td className="px-4 py-3 text-stone-400 font-sans">
                            {new Date(t.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.action === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {t.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-300 font-sans">
                            {t.market}
                          </td>
                          <td className="px-4 py-3 text-white">
                            ${t.amount}
                          </td>
                          <td className="px-4 py-3 text-stone-300">
                            {t.entryConfidence}%
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.status === 'WON'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {t.status === 'WON' ? 'WIN 🏆' : 'LOSS'}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 text-right font-bold ${
                              t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {t.pnl >= 0 ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Settings & Automation Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto text-xs">
              {/* Platform & Market Choice */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
                <h4 className="font-bold text-white text-sm">ট্রেডিং প্ল্যাটফর্ম ও পেয়ার</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-stone-400 block mb-1">ট্রেডিং প্ল্যাটফর্ম:</label>
                    <select
                      value={settings.platform}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, platform: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-semibold cursor-pointer"
                    >
                      <option value="Quotex">Quotex (বাইনারি অপশন)</option>
                      <option value="Pocket Option">Pocket Option (পকেট অপশন)</option>
                      <option value="Binance">Binance (Crypto Spot/Futures)</option>
                      <option value="TradingView">TradingView (চার্ট এনালাইসিস)</option>
                      <option value="Olymp Trade">Olymp Trade</option>
                      <option value="MetaTrader MT4/5">MetaTrader 4 / 5</option>
                      <option value="Exness / Forex">Exness / Forex</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-400 block mb-1">কারেন্সি পেয়ার / মার্কেট:</label>
                    <input
                      type="text"
                      value={settings.market}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, market: e.target.value })
                      }
                      placeholder="e.g. EUR/USD (OTC), BTC/USDT"
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-stone-400 block mb-1">ক্যান্ডেলস্টিক টাইমফ্রেম:</label>
                    <select
                      value={settings.timeframe}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, timeframe: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-semibold cursor-pointer"
                    >
                      <option value="30s">30 Seconds</option>
                      <option value="1m">1 Minute (Default)</option>
                      <option value="2m">2 Minutes</option>
                      <option value="5m">5 Minutes</option>
                      <option value="15m">15 Minutes</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-400 block mb-1">প্রধান স্ট্র্যাটেজি:</label>
                    <select
                      value={settings.strategy}
                      onChange={(e) =>
                        onUpdateSettings({ ...settings, strategy: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-semibold cursor-pointer"
                    >
                      <option value="Price Action & Candlestick Patterns">Price Action & Candlestick Patterns</option>
                      <option value="Support & Resistance Reversals">Support & Resistance Reversals</option>
                      <option value="RSI & Stochastic Oversold/Overbought">RSI & Stochastic Oversold/Overbought</option>
                      <option value="Trend Continuation & Breakouts">Trend Continuation & Breakouts</option>
                      <option value="1-Minute Scalping">1-Minute Scalping</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Automation Rules */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-4">
                <h4 className="font-bold text-white text-sm">অটো-স্ক্যান ও অটো-ট্রেড রুলস</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block">স্বয়ংক্রিয় স্ক্যান ইন্টারভাল:</span>
                      <span className="text-stone-400 text-[11px]">নির্দিষ্ট সময় পরপর চার্ট স্ক্যান হবে</span>
                    </div>
                    <select
                      value={settings.autoScanInterval}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          autoScanInterval: Number(e.target.value),
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-stone-950 border border-stone-800 text-white font-semibold cursor-pointer"
                    >
                      <option value={0}>ম্যানুয়াল (কোনো অটো-স্ক্যান নয়)</option>
                      <option value={5}>প্রতি ৫ সেকেন্ড</option>
                      <option value={10}>প্রতি ১০ সেকেন্ড</option>
                      <option value={15}>প্রতি ১৫ সেকেন্ড</option>
                      <option value={30}>প্রতি ৩০ সেকেন্ড</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                    <div>
                      <span className="font-semibold text-white block">স্বয়ংক্রিয় ট্রেডিং (Auto-Trade):</span>
                      <span className="text-stone-400 text-[11px]">আস্থা সীমা পার হলে স্বয়ংক্রিয়ভাবে ট্রেড এক্সিকিউট হবে</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoTrade}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          autoTrade: e.target.checked,
                        })
                      }
                      className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                    />
                  </div>

                  {settings.autoTrade && (
                    <div className="flex items-center justify-between pl-4 text-stone-300">
                      <span>নূন্যতম আস্থা সীমা (Min Confidence):</span>
                      <div className="flex items-center gap-2 font-mono">
                        <input
                          type="range"
                          min="70"
                          max="95"
                          step="1"
                          value={settings.minConfidenceThreshold}
                          onChange={(e) =>
                            onUpdateSettings({
                              ...settings,
                              minConfidenceThreshold: Number(e.target.value),
                            })
                          }
                          className="w-24 accent-emerald-500"
                        />
                        <span className="text-emerald-400 font-bold">{settings.minConfidenceThreshold}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* External Webhook integration */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Webhook কানেক্টর (টেলিগ্রাম / ব্রোকার বট)</h4>
                  <span className="text-[10px] text-stone-400">ঐচ্ছিক</span>
                </div>
                <p className="text-stone-400 text-[11px]">
                  আপনার নিজস্ব টেলিগ্রাম অ্যালার্ট বট, ডিসকর্ড বা Quotex/Pocket Option অটোমেশন স্ক্রিপ্টের Webhook URL দিলে প্রতি সিগন্যালে স্বয়ংক্রিয় JSON রিকোয়েস্ট চলে যাবে।
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={settings.webhookUrl}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, webhookUrl: e.target.value })
                    }
                    placeholder="https://api.telegram.org/... অথবা আপনার Webhook URL"
                    className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    disabled={!settings.webhookUrl}
                    className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-white font-bold cursor-pointer transition-colors disabled:opacity-40"
                  >
                    টেস্ট
                  </button>
                </div>
                {webhookTestStatus && (
                  <p className="text-[11px] text-emerald-400 font-mono">
                    {webhookTestStatus}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
