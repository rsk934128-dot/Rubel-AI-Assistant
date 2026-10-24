export type TradingAction = 'BUY' | 'SELL' | 'HOLD';
export type MarketTrend = 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TradingSignal {
  action: TradingAction;
  confidence: number;
  trend: MarketTrend;
  pattern: string;
  indicators: string[];
  supportLevel?: string;
  resistanceLevel?: string;
  timeframeRecommended: string;
  riskLevel: RiskLevel;
  reasonBn: string;
  reasonEn: string;
  suggestedEntry?: string;
  stopLoss?: string;
  takeProfit?: string;
  audioAlertBn?: string;
  timestamp?: number;
}

export interface ExecutedTrade {
  id: string;
  timestamp: number;
  action: 'BUY' | 'SELL';
  platform: string;
  market: string;
  amount: number;
  entryConfidence: number;
  durationSeconds: number;
  remainingSeconds: number;
  status: 'OPEN' | 'WON' | 'LOST';
  pnl: number;
  pattern: string;
}

export interface TradingBotSettings {
  platform: string;
  market: string;
  timeframe: string;
  strategy: string;
  autoScanInterval: number; // 0 = manual, 5, 10, 15, 30
  autoTrade: boolean;
  minConfidenceThreshold: number; // e.g. 80%
  tradeAmount: number;
  voiceAlerts: boolean;
  webhookUrl: string;
  overlayOpacity: number;
}
