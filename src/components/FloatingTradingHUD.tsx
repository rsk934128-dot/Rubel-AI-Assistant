import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Maximize2,
  X,
  Volume2,
  VolumeX,
  Zap,
  Play,
  Pause,
  Sliders,
  DollarSign,
  GripHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TradingSignal, ExecutedTrade } from '../types/tradingBot';

interface FloatingTradingHUDProps {
  isOpen: boolean;
  onClose: () => void;
  onExpand: () => void;
  signal: TradingSignal | null;
  isAnalyzing: boolean;
  onScanNow: () => void;
  onBuy: () => void;
  onSell: () => void;
  autoTrade: boolean;
  onToggleAutoTrade: () => void;
  autoScan: boolean;
  onToggleAutoScan: () => void;
  virtualBalance: number;
  activeTrades: ExecutedTrade[];
  overlayOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  voiceAlerts: boolean;
  onToggleVoice: () => void;
  marketName: string;
}

export const FloatingTradingHUD: React.FC<FloatingTradingHUDProps> = ({
  isOpen,
  onClose,
  onExpand,
  signal,
  isAnalyzing,
  onScanNow,
  onBuy,
  onSell,
  autoTrade,
  onToggleAutoTrade,
  autoScan,
  onToggleAutoScan,
  virtualBalance,
  activeTrades,
  overlayOpacity,
  onChangeOpacity,
  voiceAlerts,
  onToggleVoice,
  marketName,
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    return { x: Math.max(16, window.innerWidth - 380), y: 80 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header handle
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 360, dragRef.current.posX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 150, dragRef.current.posY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const action = signal?.action || 'HOLD';
  const confidence = signal?.confidence || 0;

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        opacity: overlayOpacity,
      }}
      className={`fixed z-[9999] w-[340px] sm:w-[360px] select-none transition-opacity duration-200 shadow-2xl rounded-2xl border border-stone-700/80 backdrop-blur-xl bg-stone-950/95 text-stone-100 ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 bg-stone-900/90 rounded-t-2xl border-b border-stone-800 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-stone-400" />
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-white tracking-wide">
            ট্রেডিং এআই HUD
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
            {marketName}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowControls((v) => !v)}
            title="সেটিংস ও অপাসিটি"
            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            title={isCollapsed ? 'বড় করুন' : 'মিনিমাইজ করুন'}
            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onExpand}
            title="ফুল স্ক্রিন ড্যাশবোর্ড খুলুন"
            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="HUD বন্ধ করুন"
            className="p-1 rounded hover:bg-red-500/20 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Settings / Controls drawer */}
      {showControls && (
        <div className="px-3.5 py-2 bg-stone-900/60 border-b border-stone-800/80 text-[11px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-stone-400">স্ক্রিন অপাসিটি (স্বচ্ছতা):</span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0.35"
                max="1"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
                className="w-24 accent-emerald-500 h-1 bg-stone-700 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-emerald-400 w-8 text-right">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onToggleVoice}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                voiceAlerts
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              {voiceAlerts ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              <span>{voiceAlerts ? 'ভয়েস অ্যালার্ট অন' : 'ভয়েস বন্ধ'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleAutoScan}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                autoScan
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{autoScan ? 'অটো-স্ক্যান অন' : 'ম্যানুয়াল স্ক্যান'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main HUD Body */}
      {!isCollapsed && (
        <div className="p-3.5 space-y-3">
          {/* Signal Indicator Box */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              action === 'BUY'
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-950/50'
                : action === 'SELL'
                ? 'bg-rose-950/70 border-rose-500/60 text-rose-200 shadow-md shadow-rose-950/50'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                  action === 'BUY'
                    ? 'bg-emerald-500 text-stone-950 animate-pulse'
                    : action === 'SELL'
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {action === 'BUY' ? (
                  <TrendingUp className="w-6 h-6 stroke-[3]" />
                ) : action === 'SELL' ? (
                  <TrendingDown className="w-6 h-6 stroke-[3]" />
                ) : (
                  <Activity className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-wider">
                    {action === 'BUY'
                      ? 'CALL / BUY 🟢'
                      : action === 'SELL'
                      ? 'PUT / SELL 🔴'
                      : 'HOLD / অপেক্ষা 🟡'}
                  </span>
                  {confidence > 0 && (
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 border border-white/10">
                      {confidence}%
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-300 line-clamp-1 max-w-[180px]">
                  {signal?.pattern || (isAnalyzing ? 'চার্ট এনালাইসিস চলছে...' : 'নতুন সিগন্যাল অপেক্ষা করছে')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onScanNow}
              disabled={isAnalyzing}
              className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[10px] font-bold border border-stone-600 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? '...' : 'স্ক্যান'}
            </button>
          </div>

          {/* Reasoning / Guidance pill */}
          {signal?.reasonBn && (
            <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800 text-[11px] text-stone-300 line-clamp-2 leading-tight">
              💡 {signal.reasonBn}
            </div>
          )}

          {/* 1-Click Interactive Buy / Sell Trigger Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              id="hud-buy-button"
              onClick={onBuy}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 stroke-[3]" />
              <span>BUY (CALL)</span>
            </button>

            <button
              type="button"
              id="hud-sell-button"
              onClick={onSell}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/60 transition-all cursor-pointer"
            >
              <TrendingDown className="w-4 h-4 stroke-[3]" />
              <span>SELL (PUT)</span>
            </button>
          </div>

          {/* Footer stats: Virtual Balance & Auto-Trade Status */}
          <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/80">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              <span>ডেমো ব্যালেন্স:</span>
              <span className="font-mono font-bold text-white">
                ${virtualBalance.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleAutoTrade}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold cursor-pointer transition-colors ${
                autoTrade
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${autoTrade ? 'bg-emerald-400 animate-ping' : 'bg-stone-500'}`} />
              <span>{autoTrade ? 'অটো-ট্রেড চালু' : 'অটো-ট্রেড বন্ধ'}</span>
            </button>
          </div>

          {/* Active Trades countdown ticker */}
          {activeTrades.length > 0 && (
            <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[10px] space-y-1">
              <div className="flex items-center justify-between text-indigo-300 font-bold">
                <span>চলমান ট্রেড ({activeTrades.length})</span>
                <span className="font-mono">
                  {activeTrades[0].remainingSeconds}s বাকি
                </span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(
                      0,
                      (activeTrades[0].remainingSeconds / activeTrades[0].durationSeconds) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
