import { Asset, Candle, Timeframe } from '../types/trading';

export const ASSET_LIST: Asset[] = [
  // Forex
  { symbol: 'EUR/USD', yfSymbol: 'EURUSD=X', name: 'Euro / US Dollar', category: 'Forex', pipSize: 0.0001, currentPrice: 1.1128, change24h: -0.03, spreadPips: 0.8, digits: 5 },
  { symbol: 'GBP/USD', yfSymbol: 'GBPUSD=X', name: 'British Pound / US Dollar', category: 'Forex', pipSize: 0.0001, currentPrice: 1.3284, change24h: -0.18, spreadPips: 1.1, digits: 5 },
  { symbol: 'USD/JPY', yfSymbol: 'JPY=X', name: 'US Dollar / Japanese Yen', category: 'Forex', pipSize: 0.01, currentPrice: 157.85, change24h: -0.04, spreadPips: 1.0, digits: 3 },
  { symbol: 'NZD/USD', yfSymbol: 'NZDUSD=X', name: 'NZ Dollar / US Dollar', category: 'Forex', pipSize: 0.0001, currentPrice: 0.5601, change24h: -1.48, spreadPips: 1.2, digits: 5 },
  { symbol: 'GBP/JPY', yfSymbol: 'GBPJPY=X', name: 'British Pound / Japanese Yen', category: 'Forex', pipSize: 0.01, currentPrice: 209.69, change24h: -0.21, spreadPips: 1.6, digits: 3 },
  { symbol: 'GBP/CHF', yfSymbol: 'GBPCHF=X', name: 'British Pound / Swiss Franc', category: 'Forex', pipSize: 0.0001, currentPrice: 1.1030, change24h: 0.11, spreadPips: 1.8, digits: 5 },
  { symbol: 'USD/ZAR', yfSymbol: 'USDZAR=X', name: 'US Dollar / SA Rand (Blueprint Benchmark)', category: 'Forex', pipSize: 0.0001, currentPrice: 16.6525, change24h: 0.20, spreadPips: 4.5, digits: 4 },

  // Indices
  { symbol: 'DXU', yfSymbol: 'DX-Y.NYB', name: 'US Dollar Index (DXY)', category: 'Indices', pipSize: 0.01, currentPrice: 102.39, change24h: 0.08, spreadPips: 0.6, digits: 2 },
  { symbol: 'US30', yfSymbol: '^DJI', name: 'Dow Jones Industrial 30', category: 'Indices', pipSize: 1.0, currentPrice: 52377.5, change24h: 0.03, spreadPips: 2.0, digits: 1 },
  { symbol: 'NAS100', yfSymbol: '^NDX', name: 'Nasdaq Tech 100', category: 'Indices', pipSize: 1.0, currentPrice: 29651.4, change24h: 1.29, spreadPips: 1.8, digits: 1 },
  { symbol: 'GER40', yfSymbol: '^GDAXI', name: 'Germany DAX 40', category: 'Indices', pipSize: 1.0, currentPrice: 25573.3, change24h: -0.07, spreadPips: 2.2, digits: 1 },
  { symbol: 'UK 100', yfSymbol: '^FTSE', name: 'FTSE 100 Index (UK100)', category: 'Indices', pipSize: 1.0, currentPrice: 10655.1, change24h: -0.29, spreadPips: 1.5, digits: 1 },
  { symbol: 'SPX500', yfSymbol: '^GSPC', name: 'S&P 500 Index', category: 'Indices', pipSize: 0.1, currentPrice: 7722.6, change24h: 0.60, spreadPips: 0.5, digits: 2 },

  // Commodities
  { symbol: 'XAU/USD', yfSymbol: 'GC=F', name: 'Spot Gold / USD', category: 'Commodities', pipSize: 0.1, currentPrice: 4067.1, change24h: -0.18, spreadPips: 2.5, digits: 2 },
  { symbol: 'XAG/USD', yfSymbol: 'SI=F', name: 'Spot Silver / USD', category: 'Commodities', pipSize: 0.01, currentPrice: 53.89, change24h: -1.14, spreadPips: 1.5, digits: 3 },
  { symbol: 'BRENT', yfSymbol: 'BZ=F', name: 'Brent Crude Oil', category: 'Commodities', pipSize: 0.01, currentPrice: 110.97, change24h: 1.43, spreadPips: 2.0, digits: 2 },

  // Crypto
  { symbol: 'BTC/USD', yfSymbol: 'BTC-USD', name: 'Bitcoin / US Dollar', category: 'Crypto', pipSize: 1.0, currentPrice: 81439.2, change24h: 0.79, spreadPips: 5.0, digits: 1 },
  { symbol: 'ETH/USD', yfSymbol: 'ETH-USD', name: 'Ethereum / US Dollar', category: 'Crypto', pipSize: 0.1, currentPrice: 2371.1, change24h: 1.01, spreadPips: 2.0, digits: 2 },
  { symbol: 'XRP/USD', yfSymbol: 'XRP-USD', name: 'Ripple / US Dollar', category: 'Crypto', pipSize: 0.0001, currentPrice: 1.3306, change24h: 0.07, spreadPips: 0.8, digits: 4 },
  { symbol: 'SOL/USD', yfSymbol: 'SOL-USD', name: 'Solana / US Dollar', category: 'Crypto', pipSize: 0.01, currentPrice: 102.97, change24h: 1.70, spreadPips: 1.2, digits: 2 },
];

/**
 * Generates realistic candlestick price action for a timeframe
 */
export function generateCandles(
  basePrice: number,
  timeframe: Timeframe,
  count = 75,
  trendDirection: 'BULLISH' | 'BEARISH' | 'CHOP' = 'BULLISH'
): Candle[] {
  const candles: Candle[] = [];

  // Volatility scale and step time based on timeframe
  let timeStepMinutes = 15;
  let volatilityPct = 0.002;

  if (timeframe === 'M15') {
    timeStepMinutes = 15;
    volatilityPct = 0.0018;
  } else if (timeframe === 'H1') {
    timeStepMinutes = 60;
    volatilityPct = 0.0035;
  } else if (timeframe === 'H4') {
    timeStepMinutes = 240;
    volatilityPct = 0.007;
  } else if (timeframe === 'D1') {
    timeStepMinutes = 1440;
    volatilityPct = 0.015;
  }

  const now = Date.now();
  const startTime = now - count * timeStepMinutes * 60 * 1000;

  let currentClose = basePrice * (trendDirection === 'BULLISH' ? 0.94 : trendDirection === 'BEARISH' ? 1.06 : 0.99);

  for (let i = 0; i < count; i++) {
    const candleTime = startTime + i * timeStepMinutes * 60 * 1000;
    const dateObj = new Date(candleTime);

    let timeFormatted = '';
    if (timeframe === 'D1') {
      timeFormatted = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
    } else if (timeframe === 'H4' || timeframe === 'H1') {
      timeFormatted = `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:00`;
    } else {
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      timeFormatted = `${dateObj.getHours()}:${minutes}`;
    }

    // Drift based on trend
    let drift = 0;
    if (trendDirection === 'BULLISH') {
      drift = (Math.random() - 0.42) * currentClose * volatilityPct;
    } else if (trendDirection === 'BEARISH') {
      drift = (Math.random() - 0.58) * currentClose * volatilityPct;
    } else {
      drift = (Math.random() - 0.5) * currentClose * volatilityPct * 0.7;
    }

    const open = currentClose;
    const close = Math.max(open * 0.7, open + drift);
    const highWick = Math.random() * currentClose * (volatilityPct * 0.8);
    const lowWick = Math.random() * currentClose * (volatilityPct * 0.8);
    const high = Math.max(open, close) + highWick;
    const low = Math.min(open, close) - lowWick;
    const volume = Math.floor(Math.random() * 5000 + 1200);

    candles.push({
      time: candleTime,
      timeFormatted,
      open,
      high,
      low,
      close,
      volume,
    });

    currentClose = close;
  }

  // Ensure last candle close is near current price
  const lastIdx = candles.length - 1;
  candles[lastIdx].close = basePrice;
  candles[lastIdx].high = Math.max(candles[lastIdx].high, basePrice);
  candles[lastIdx].low = Math.min(candles[lastIdx].low, basePrice);

  return candles;
}
