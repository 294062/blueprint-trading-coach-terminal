import { Candle, Timeframe, TimeframeAnalysis, MultiTimeframeAlignment } from '../types/trading';

/**
 * Calculates Exponential Moving Average (EMA) for an array of numbers
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  if (data.length < period) {
    // Fill with simple running average if not enough points
    const result: number[] = [];
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
      result.push(sum / (i + 1));
    }
    return result;
  }

  const multiplier = 2 / (period + 1);
  const ema: number[] = new Array(data.length);

  // Initial SMA for first 'period' elements
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
    ema[i] = sum / (i + 1);
  }

  // Calculate subsequent EMAs
  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema;
}

/**
 * Gets the designated filter period for each timeframe according to the user's updated rules:
 * - D1: EMA 20 (Macro filter)
 * - H4: EMA 50 (Local-trend filter)
 * - H1: EMA 200 (Execution filter)
 * - M15: EMA 200 (Execution filter)
 */
export function getFilterPeriodForTimeframe(tf: Timeframe): { period: number; name: string; role: string } {
  switch (tf) {
    case 'D1':
      return { period: 20, name: 'EMA 20', role: 'Macro Filter' };
    case 'H4':
      return { period: 50, name: 'EMA 50', role: 'Local-Trend Filter' };
    case 'H1':
      return { period: 200, name: 'EMA 200', role: 'Intermediate Filter' };
    case 'M15':
      return { period: 200, name: 'EMA 200', role: 'Execution Filter' };
  }
}

/**
 * Analyzes a single timeframe's candles with EMA 2, EMA 5, and its specific filter EMA
 */
export function analyzeTimeframe(
  tf: Timeframe,
  candles: Candle[],
  pipSize: number
): TimeframeAnalysis {
  const filterConfig = getFilterPeriodForTimeframe(tf);
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1] || 0;

  const ema2Series = calculateEMA(closes, 2);
  const ema5Series = calculateEMA(closes, 5);
  const filterSeries = calculateEMA(closes, filterConfig.period);

  const len = closes.length;
  const ema2 = ema2Series[len - 1] || currentPrice;
  const ema5 = ema5Series[len - 1] || currentPrice;
  const filterValue = filterSeries[len - 1] || currentPrice;

  // Crossover check (EMA 2 vs EMA 5)
  let crossoverState: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NONE' = 'NONE';
  let crossoverCandleAgo = 0;

  for (let i = len - 1; i >= Math.max(1, len - 10); i--) {
    const prevEma2 = ema2Series[i - 1];
    const prevEma5 = ema5Series[i - 1];
    const currEma2 = ema2Series[i];
    const currEma5 = ema5Series[i];

    if (prevEma2 <= prevEma5 && currEma2 > currEma5) {
      crossoverState = 'BULLISH_CROSS';
      crossoverCandleAgo = len - 1 - i;
      break;
    } else if (prevEma2 >= prevEma5 && currEma2 < currEma5) {
      crossoverState = 'BEARISH_CROSS';
      crossoverCandleAgo = len - 1 - i;
      break;
    }
  }

  // Filter Alignment
  const isAboveFilter = currentPrice >= filterValue;
  const distanceToFilterPips = (currentPrice - filterValue) / pipSize;

  // Timeframe Bias Determination:
  // Bullish: Price > Filter AND EMA 2 > EMA 5
  // Bearish: Price < Filter AND EMA 2 < EMA 5
  let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  let statusDescription = '';

  if (isAboveFilter && ema2 >= ema5) {
    bias = 'BULLISH';
    statusDescription = `Bullish: Above ${filterConfig.name} & EMA 2 > 5`;
  } else if (!isAboveFilter && ema2 <= ema5) {
    bias = 'BEARISH';
    statusDescription = `Bearish: Below ${filterConfig.name} & EMA 2 < 5`;
  } else if (isAboveFilter && ema2 < ema5) {
    bias = 'NEUTRAL';
    statusDescription = `Neutral pullback: Above ${filterConfig.name} but EMA 2 < 5`;
  } else {
    bias = 'NEUTRAL';
    statusDescription = `Neutral bounce: Below ${filterConfig.name} but EMA 2 > 5`;
  }

  return {
    timeframe: tf,
    filterName: filterConfig.name,
    filterPeriod: filterConfig.period,
    filterValue,
    ema2,
    ema5,
    lastClose: currentPrice,
    crossoverState,
    crossoverCandleAgo,
    isAboveFilter,
    distanceToFilterPips,
    bias,
    statusDescription,
  };
}

/**
 * Evaluates the full Multi-Timeframe Alignment across D1 → H4 → H1 → M15
 * Requires AT LEAST 3 timeframes aligned in the same direction to permit signal/execution.
 */
export function evaluateMultiTimeframeAlignment(
  analysisMap: Record<Timeframe, TimeframeAnalysis>
): MultiTimeframeAlignment {
  const hierarchy: ['D1', 'H4', 'H1', 'M15'] = ['D1', 'H4', 'H1', 'M15'];

  let bullishCount = 0;
  let bearishCount = 0;

  hierarchy.forEach(tf => {
    if (analysisMap[tf].bias === 'BULLISH') bullishCount++;
    if (analysisMap[tf].bias === 'BEARISH') bearishCount++;
  });

  const isBullishAligned = bullishCount >= 3;
  const isBearishAligned = bearishCount >= 3;

  let activeDirection: 'BUY' | 'SELL' | 'STAND_ASIDE' = 'STAND_ASIDE';
  let alignedCount = 0;
  let alignedTimeframes: Timeframe[] = [];

  if (isBullishAligned) {
    activeDirection = 'BUY';
    alignedCount = bullishCount;
    alignedTimeframes = hierarchy.filter(tf => analysisMap[tf].bias === 'BULLISH');
  } else if (isBearishAligned) {
    activeDirection = 'SELL';
    alignedCount = bearishCount;
    alignedTimeframes = hierarchy.filter(tf => analysisMap[tf].bias === 'BEARISH');
  } else {
    activeDirection = 'STAND_ASIDE';
    alignedCount = Math.max(bullishCount, bearishCount);
    alignedTimeframes = [];
  }

  const canExecute = activeDirection !== 'STAND_ASIDE' && alignedCount >= 3;

  let alignmentLabel = '';
  let verdictReason = '';

  if (canExecute) {
    const tfList = alignedTimeframes.join(' → ');
    if (alignedCount === 4) {
      alignmentLabel = '4/4 FULL BLUEPRINT CONFLUENCE (A+)';
      verdictReason = `All 4 timeframes aligned (${tfList}). Maximum institutional conviction setup.`;
    } else {
      alignmentLabel = `3/4 CONFLUENCE (${tfList})`;
      verdictReason = `Satisfies the 3-Timeframe rule (${tfList} aligned). Valid mechanical entry authorized.`;
    }
  } else {
    alignmentLabel = 'LOCKOUT: INSUFFICIENT CONFLUENCE';
    verdictReason = `Only ${alignedCount}/4 timeframes agree. Blueprint requires at least 3 aligned timeframes (e.g. D1 → H4 → H1 and/or M15). 75% of capital destruction occurs in unaligned chop.`;
  }

  return {
    hierarchy,
    analysis: analysisMap,
    bullishCount,
    bearishCount,
    alignedCount,
    requiredCount: 3,
    activeDirection,
    alignedTimeframes,
    canExecute,
    alignmentLabel,
    verdictReason,
  };
}
