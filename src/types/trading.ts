export type Timeframe = 'D1' | 'H4' | 'H1' | 'M15';

export type AssetCategory = 'Forex' | 'Indices' | 'Commodities' | 'Crypto';

export interface Asset {
  symbol: string;
  name: string;
  category: AssetCategory;
  pipSize: number;
  currentPrice: number;
  change24h: number;
  spreadPips: number;
  digits: number;
  yfSymbol?: string;
}

export interface Candle {
  time: number;
  timeFormatted: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TrendRegime = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface TimeframeAnalysis {
  timeframe: Timeframe;
  filterName: string; // 'EMA 20' on D1, 'EMA 50' on H4, 'EMA 200' on H1, 'EMA 200' on M15
  filterPeriod: number;
  filterValue: number;
  ema2: number;
  ema5: number;
  lastClose: number;
  // Crossover state
  crossoverState: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NONE';
  crossoverCandleAgo: number; // how many candles ago EMA2 crossed EMA5
  // Filter alignment
  isAboveFilter: boolean;
  distanceToFilterPips: number;
  // Combined TF bias
  bias: TrendRegime;
  // Status check message
  statusDescription: string;
}

export interface MultiTimeframeAlignment {
  hierarchy: ['D1', 'H4', 'H1', 'M15'];
  analysis: Record<Timeframe, TimeframeAnalysis>;
  bullishCount: number;
  bearishCount: number;
  alignedCount: number;
  requiredCount: number; // 3
  activeDirection: 'BUY' | 'SELL' | 'STAND_ASIDE';
  alignedTimeframes: Timeframe[];
  canExecute: boolean;
  alignmentLabel: string;
  verdictReason: string;
}

export type MarkovState = 'Bullish Regime' | 'Neutral Tight' | 'Bearish Regime' | 'Volatile Wide';

export interface MarkovRegimeData {
  currentState: MarkovState;
  stateIndex: number;
  confidence: number;
  transitionMatrix: {
    from: MarkovState;
    to: Record<MarkovState, number>;
  }[];
  positionSizingMultiplier: number;
  recommendedAction: string;
}

export interface TradeOrder {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  openTime: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskPercent: number;
  riskAmount: number;
  rewardAmount: number;
  riskRewardRatio: number;
  status: 'OPEN' | 'CLOSED_PROFIT' | 'CLOSED_LOSS' | 'BREAK_EVEN';
  pnl: number;
  pnlPips: number;
  trailingBreakevenActive: boolean;
  alignedTimeframes: Timeframe[];
  notes?: string;
}

export interface AccountStats {
  balance: number;
  equity: number;
  currency: 'USD' | 'ZAR';
  exchangeRateUsdZar: number;
  dailyStartingEquity: number;
  dailyLossLimitPercent: number; // 5% hard boundary
  weeklyLossLimitPercent: number; // 10% hard boundary
  currentDailyPnl: number;
  currentDailyLossPercent: number;
  circuitBreakerTripped: boolean;
  winCount: number;
  lossCount: number;
  totalTrades: number;
}
