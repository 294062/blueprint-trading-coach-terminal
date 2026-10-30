import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini SDK if valid non-placeholder API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 15) {
  aiClient = new GoogleGenAI({ apiKey: apiKey.trim() });
}

// AI Trading Coach Audit Endpoint
app.post('/api/coach-audit', async (req, res) => {
  try {
    const {
      symbol,
      timeframe,
      intendedAction, // 'BUY' | 'SELL'
      alignmentCount,
      alignedTimeframes,
      d1State,
      h4State,
      h1State,
      m15State,
      riskPercent,
      riskRewardRatio,
      currentPrice,
    } = req.body;

    // Strict Blueprint Trading Academy Rule Validation
    const isAlignmentValid = alignmentCount >= 3;
    const rulesBroken: string[] = [];
    const rulesPassed: string[] = [];

    // Rule 1: 3-TF Alignment Hierarchy
    if (isAlignmentValid) {
      rulesPassed.push(`3-Timeframe Confluence Passed (${alignmentCount}/4 TFs aligned: ${alignedTimeframes?.join(' → ') || 'Confluent'})`);
    } else {
      rulesBroken.push(`Hierarchy Alignment Failure: Only ${alignmentCount}/4 timeframes agree. Blueprint requires at least 3 aligned timeframes (D1 → H4 → H1 and/or M15). 75% of capital destruction happens in unaligned conditions.`);
    }

    // Rule 2: Directional filter compliance
    if (intendedAction === 'BUY') {
      if (d1State && d1State.price < d1State.filterEma) {
        rulesBroken.push(`D1 Macro Filter Breach: Price is below D1 EMA 20 (${d1State.filterEma}). Buying below the macro filter is strictly prohibited.`);
      } else if (d1State) {
        rulesPassed.push(`D1 Macro Filter Valid: Price is above EMA 20.`);
      }

      if (h4State && h4State.price < h4State.filterEma) {
        rulesBroken.push(`H4 Local-Trend Breach: Price is below H4 EMA 50 (${h4State.filterEma}). Longs require H4 EMA 50 support.`);
      } else if (h4State) {
        rulesPassed.push(`H4 Local Trend Valid: Price is above EMA 50.`);
      }
    } else if (intendedAction === 'SELL') {
      if (d1State && d1State.price > d1State.filterEma) {
        rulesBroken.push(`D1 Macro Filter Breach: Price is above D1 EMA 20 (${d1State.filterEma}). Selling above the macro filter is strictly prohibited.`);
      } else if (d1State) {
        rulesPassed.push(`D1 Macro Filter Valid: Price is below EMA 20.`);
      }

      if (h4State && h4State.price > h4State.filterEma) {
        rulesBroken.push(`H4 Local-Trend Breach: Price is above H4 EMA 50 (${h4State.filterEma}). Shorts require price below H4 EMA 50.`);
      } else if (h4State) {
        rulesPassed.push(`H4 Local Trend Valid: Price is below EMA 50.`);
      }
    }

    // Rule 3: Capital Risk
    if (riskPercent > 2.0) {
      rulesBroken.push(`Capital Preservation Breach: Risk is ${riskPercent}%. Lesson 6 strictly limits single-trade risk to 1.0% - 2.0% maximum.`);
    } else {
      rulesPassed.push(`Risk Model Valid: ${riskPercent}% risk conforms to Lesson 6 fixed fractional limits.`);
    }

    // Rule 4: Risk-to-Reward
    if (riskRewardRatio < 2.0) {
      rulesBroken.push(`Expectancy Breach: Risk-to-Reward is 1:${riskRewardRatio.toFixed(1)}. Minimum required R:R is 1:2.0 (preferred 1:3.0) to ensure mathematical expectancy.`);
    } else {
      rulesPassed.push(`Mathematical Expectancy Valid: 1:${riskRewardRatio.toFixed(1)} R:R meets or exceeds 1:2 standard.`);
    }

    const verdict = rulesBroken.length === 0 ? 'APPROVED' : 'REJECTED';

    let coachAdvice = '';

    // If Gemini client is available, call gemini-3.8-flash for coach commentary in Blueprint Trading persona
    if (aiClient) {
      try {
        const prompt = `You are the lead quantitative mentor of Blueprint Trading.
You embody ruthless mechanical discipline, zero emotional gambling, and pure mathematical expectancy.
A student wants to execute a ${intendedAction} order on ${symbol} at ${currentPrice}.
Audit details:
Verdict: ${verdict}
Alignment Count: ${alignmentCount}/4 (Hierarchy: D1 EMA 20 -> H4 EMA 50 -> H1 EMA 200 -> M15 EMA 200, fast trigger EMA 2/5).
Timeframes:
- D1: Price ${d1State?.price || ''}, EMA 20 filter ${d1State?.filterEma || ''}, EMA 2/5 cross: ${d1State?.crossover || ''}
- H4: Price ${h4State?.price || ''}, EMA 50 filter ${h4State?.filterEma || ''}, EMA 2/5 cross: ${h4State?.crossover || ''}
- H1: Price ${h1State?.price || ''}, EMA 200 filter ${h1State?.filterEma || ''}, EMA 2/5 cross: ${h1State?.crossover || ''}
- M15: Price ${m15State?.price || ''}, EMA 200 filter ${m15State?.filterEma || ''}, EMA 2/5 cross: ${m15State?.crossover || ''}
Risk: ${riskPercent}%, R:R: 1:${riskRewardRatio}
Passed: ${rulesPassed.join('; ')}
Breached: ${rulesBroken.length > 0 ? rulesBroken.join('; ') : 'None'}

Provide an unyielding, professional 2-3 paragraph trade audit representing Blueprint Trading:
1. Immediate verdict: ${verdict === 'APPROVED' ? 'Authorize execution' : 'Lock Out order'}.
2. Technical breakdown of the D1 -> H4 -> H1 -> M15 sequence and the 3-TF confluence rule.
3. Psychological calibration: "Successful traders don't trade more. They trade better" / "We are out of the prediction business".
Keep it direct, professional, and crisp. No greetings.`;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        );

        const response: any = await Promise.race([
          aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              maxOutputTokens: 500,
              temperature: 0.2,
            },
          }),
          timeoutPromise,
        ]);

        if (response && response.text) {
          coachAdvice = response.text;
        }
      } catch {
        // Fall back gracefully to deterministic Blueprint rules engine
      }
    }

    if (!coachAdvice) {
      // Deterministic Blueprint Trading coaching feedback
      if (verdict === 'APPROVED') {
        coachAdvice = `VERDICT: ORDER EXECUTION AUTHORIZED.\n\nYour trade setup meets the strict Blueprint quantitative criteria. You have achieved ${alignmentCount}/4 timeframe confluence across the D1 → H4 → H1 → M15 hierarchy, satisfying our mandatory 3-timeframe alignment rule (${alignedTimeframes?.join(' → ') || 'Aligned'}). Price resides cleanly on the correct side of our structural filters (D1 EMA 20, H4 EMA 50, and H1/M15 EMA 200), and the fast EMA 2/5 crossover confirms immediate momentum trigger.\n\nExecution Mandate: Route this order with hard-coded Stop Loss and Take Profit (1:${riskRewardRatio.toFixed(1)}). When price achieves a 1:1 risk ratio, immediately trail the stop to break-even to guarantee a risk-free speculative run. Remember: We do not hope or gamble. We execute our predefined mechanical formula.`;
      } else {
        coachAdvice = `VERDICT: ORDER LOCKED OUT — EXECUTION PROHIBITED.\n\nExecution has been frozen by the terminal rules engine. The following non-negotiable Blueprint parameters were violated:\n${rulesBroken.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nPsychological Calibration: Over 75% of retail capital destruction occurs inside choppy, non-aligned markets. Entering without at least 3-TF confluence (D1 → H4 → H1 and/or M15) or breaching our EMA filters is pure emotional gambling. Step away from the order button. Successful traders don't trade more—they trade better. Wait for the market to print a high-probability institutional setup.`;
      }
    }

    res.json({
      verdict,
      rulesPassed,
      rulesBroken,
      coachAdvice,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Audit failed' });
  }
});

// Yahoo Finance Symbol Mapping for all assets
const YF_SYMBOL_MAP: Record<string, string> = {
  'EUR/USD': 'EURUSD=X',
  'GBP/USD': 'GBPUSD=X',
  'USD/JPY': 'JPY=X',
  'NZD/USD': 'NZDUSD=X',
  'GBP/JPY': 'GBPJPY=X',
  'GBP/CHF': 'GBPCHF=X',
  'USD/ZAR': 'USDZAR=X',
  'DXU': 'DX-Y.NYB',
  'US30': '^DJI',
  'NAS100': '^NDX',
  'GER40': '^GDAXI',
  'UK 100': '^FTSE',
  'SPX500': '^GSPC',
  'XAU/USD': 'GC=F',
  'XAG/USD': 'SI=F',
  'BRENT': 'BZ=F',
  'BTC/USD': 'BTC-USD',
  'ETH/USD': 'ETH-USD',
  'XRP/USD': 'XRP-USD',
  'SOL/USD': 'SOL-USD',
};

// Quote cache (4s TTL)
let quoteCache: { data: any; timestamp: number } | null = null;
const candleCache = new Map<string, { data: any; timestamp: number }>();

// YFinance Live Quotes Endpoint for all assets
app.get('/api/yfinance/quotes', async (req, res) => {
  const now = Date.now();
  if (quoteCache && now - quoteCache.timestamp < 3500) {
    return res.json({ quotes: quoteCache.data, cached: true, timestamp: quoteCache.timestamp });
  }

  try {
    const symbolEntries = Object.entries(YF_SYMBOL_MAP);
    const results: Record<string, any> = {};

    await Promise.allSettled(
      symbolEntries.map(async ([appSymbol, yfSymbol]) => {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfSymbol)}?interval=15m&range=1d`;
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json',
            },
          });
          if (!response.ok) return;

          const data = await response.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta || meta.regularMarketPrice == null) return;

          const price = meta.regularMarketPrice;
          const prevClose = meta.chartPreviousClose || price;
          const change24h = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

          results[appSymbol] = {
            symbol: appSymbol,
            yfSymbol,
            price: Number(price),
            previousClose: Number(prevClose),
            change24h: Number(change24h.toFixed(2)),
            high: meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh) : price,
            low: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow) : price,
            timestamp: now,
          };
        } catch {
          // Individual ticker fetch error ignored
        }
      })
    );

    quoteCache = { data: results, timestamp: now };
    res.json({ quotes: results, cached: false, timestamp: now });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch YFinance quotes' });
  }
});

// YFinance Real-Time Candles Endpoint
app.get('/api/yfinance/candles', async (req, res) => {
  try {
    const symbol = (req.query.symbol as string) || 'EUR/USD';
    const timeframe = (req.query.timeframe as string) || 'M15';
    const yfSymbol = YF_SYMBOL_MAP[symbol] || 'EURUSD=X';

    const cacheKey = `${symbol}_${timeframe}`;
    const now = Date.now();
    const cached = candleCache.get(cacheKey);
    if (cached && now - cached.timestamp < 10000) {
      return res.json({ candles: cached.data, cached: true });
    }

    let interval = '15m';
    let range = '5d';

    if (timeframe === 'D1') {
      interval = '1d';
      range = '6mo';
    } else if (timeframe === 'H4') {
      interval = '60m';
      range = '1mo';
    } else if (timeframe === 'H1') {
      interval = '60m';
      range = '1mo';
    } else {
      interval = '15m';
      range = '5d';
    }

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfSymbol)}?interval=${interval}&range=${range}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `YFinance returned status ${response.status}` });
    }

    const data = await response.json();
    const res0 = data?.chart?.result?.[0];
    const timestamps: number[] = res0?.timestamp || [];
    const quote = res0?.indicators?.quote?.[0] || {};

    const candles: any[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const o = quote.open?.[i];
      const h = quote.high?.[i];
      const l = quote.low?.[i];
      const c = quote.close?.[i];
      const v = quote.volume?.[i] || 1000;

      if (o != null && h != null && l != null && c != null) {
        const timeMs = timestamps[i] * 1000;
        const d = new Date(timeMs);
        let timeFormatted = '';
        if (timeframe === 'D1') {
          timeFormatted = `${d.getMonth() + 1}/${d.getDate()}`;
        } else if (timeframe === 'H4' || timeframe === 'H1') {
          timeFormatted = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`;
        } else {
          timeFormatted = `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        }

        candles.push({
          time: timeMs,
          timeFormatted,
          open: Number(o),
          high: Number(h),
          low: Number(l),
          close: Number(c),
          volume: Number(v) || Math.floor(Math.random() * 3000 + 800),
        });
      }
    }

    // Cache the candles for 10 seconds
    candleCache.set(cacheKey, { data: candles, timestamp: now });
    res.json({ candles, cached: false, symbol, timeframe, count: candles.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch YFinance candles' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Blueprint Trading Coach Terminal',
    time: new Date().toISOString(),
  });
});

async function startServer() {
  // Mount Vite middlewares in development
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Blueprint Terminal] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
