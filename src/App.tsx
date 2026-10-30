/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ASSET_LIST, generateCandles } from './utils/mockData';
import { Asset, Timeframe, Candle, TradeOrder, AccountStats } from './types/trading';
import { analyzeTimeframe, evaluateMultiTimeframeAlignment } from './utils/indicators';
import { calculateMarkovRegime } from './utils/markovChain';
import { Header } from './components/Header';
import { HierarchyBanner } from './components/HierarchyBanner';
import { TimeframeMatrix } from './components/TimeframeMatrix';
import { TradingChart } from './components/TradingChart';
import { ExecutionPanel } from './components/ExecutionPanel';
import { DisciplineCoachPanel } from './components/DisciplineCoachPanel';
import { MarkovRegimePanel } from './components/MarkovRegimePanel';
import { DisciplineCoachModal } from './components/DisciplineCoachModal';
import { TradeJournal } from './components/TradeJournal';
import { RulebookModal } from './components/RulebookModal';
import { AssetSelector } from './components/AssetSelector';

export default function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'markov' | 'journal' | 'rules'>('terminal');
  const [assets, setAssets] = useState<Asset[]>(ASSET_LIST);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('EUR/USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('M15');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [tickCount, setTickCount] = useState<number>(1420);
  const [lastTickDelta, setLastTickDelta] = useState<number>(1);
  const [rightPanelMode, setRightPanelMode] = useState<'coach' | 'execution' | 'both'>('coach');

  // Modals
  const [isCoachOpen, setIsCoachOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  // Account State (Lesson 6.1 & 6.2)
  const [account, setAccount] = useState<AccountStats>({
    balance: 10000.0,
    equity: 10000.0,
    currency: 'USD',
    exchangeRateUsdZar: 17.65, // South African Rand rate
    dailyStartingEquity: 10000.0,
    dailyLossLimitPercent: 5.0, // 5% max daily DD (Lesson 6.2)
    weeklyLossLimitPercent: 10.0,
    currentDailyPnl: 0,
    currentDailyLossPercent: 0,
    circuitBreakerTripped: false,
    winCount: 4,
    lossCount: 2,
    totalTrades: 6,
  });

  // Trade Orders & Journal
  const [orders, setOrders] = useState<TradeOrder[]>([
    {
      id: 'TRD-1091',
      symbol: 'EUR/USD',
      type: 'BUY',
      openTime: '2026-10-28 08:30',
      entryPrice: 1.0825,
      stopLoss: 1.0805,
      takeProfit: 1.0865,
      lotSize: 0.5,
      riskPercent: 1.0,
      riskAmount: 100,
      rewardAmount: 200,
      riskRewardRatio: 2.0,
      status: 'CLOSED_PROFIT',
      pnl: 200,
      pnlPips: 40.0,
      trailingBreakevenActive: true,
      alignedTimeframes: ['D1', 'H4', 'H1', 'M15'],
      notes: 'Clean 4/4 A+ Institutional Setup on M15 EMA 2/5 Crossover',
    },
    {
      id: 'TRD-1092',
      symbol: 'USD/ZAR',
      type: 'SELL',
      openTime: '2026-10-28 09:15',
      entryPrice: 17.7200,
      stopLoss: 17.7600,
      takeProfit: 17.6400,
      lotSize: 0.35,
      riskPercent: 1.0,
      riskAmount: 100,
      rewardAmount: 200,
      riskRewardRatio: 2.0,
      status: 'CLOSED_PROFIT',
      pnl: 180,
      pnlPips: 80.0,
      trailingBreakevenActive: true,
      alignedTimeframes: ['D1', 'H4', 'H1'],
      notes: 'D1->H4->H1 Bearish Trend Alignment with Break-Even Trailed',
    },
    {
      id: 'TRD-1093',
      symbol: 'US30',
      type: 'BUY',
      openTime: '2026-10-28 10:00',
      entryPrice: 42320.0,
      stopLoss: 42280.0,
      takeProfit: 42420.0,
      lotSize: 0.25,
      riskPercent: 1.0,
      riskAmount: 100,
      rewardAmount: 250,
      riskRewardRatio: 2.5,
      status: 'CLOSED_LOSS',
      pnl: -100,
      pnlPips: -40.0,
      trailingBreakevenActive: false,
      alignedTimeframes: ['D1', 'H4', 'M15'],
      notes: 'Stopped out at hard SL. Adhered to strict 1% risk limit.',
    },
  ]);

  // Current active asset object
  const currentAsset = useMemo(() => {
    return assets.find(a => a.symbol === selectedSymbol) || assets[0];
  }, [assets, selectedSymbol]);

  // Candle series cache per asset & timeframe
  const [candlesByTf, setCandlesByTf] = useState<Record<string, Record<Timeframe, Candle[]>>>(() => {
    const initial: Record<string, Record<Timeframe, Candle[]>> = {};
    assets.forEach(asset => {
      const trend = asset.symbol === 'USD/ZAR' ? 'BEARISH' : asset.change24h > 0 ? 'BULLISH' : 'BEARISH';
      initial[asset.symbol] = {
        D1: generateCandles(asset.currentPrice, 'D1', 75, trend),
        H4: generateCandles(asset.currentPrice, 'H4', 75, trend),
        H1: generateCandles(asset.currentPrice, 'H1', 75, trend),
        M15: generateCandles(asset.currentPrice, 'M15', 75, trend),
      };
    });
    return initial;
  });

  // 1. Fetch YFinance real-time live quotes for all assets every 3.5s
  useEffect(() => {
    let isMounted = true;

    async function fetchYfQuotes() {
      try {
        const res = await fetch('/api/yfinance/quotes');
        if (!res.ok) return;
        const data = await res.json();
        const quotes = data?.quotes;
        if (!quotes || !isMounted) return;

        setAssets(prev =>
          prev.map(asset => {
            const yfData = quotes[asset.symbol];
            if (yfData && typeof yfData.price === 'number') {
              return {
                ...asset,
                currentPrice: Number(yfData.price.toFixed(asset.digits)),
                change24h: Number(yfData.change24h),
              };
            }
            return asset;
          })
        );

        // Feed live Yfinance quotes into candles across all timeframes (D1, H4, H1, M15)
        // so EMAs (EMA 2, EMA 5, Filter EMA) recalculate live on every Yfinance quote poll
        setCandlesByTf(prev => {
          let modified = false;
          const next = { ...prev };
          const timeframes: Timeframe[] = ['D1', 'H4', 'H1', 'M15'];

          for (const [symbol, quoteVal] of Object.entries(quotes)) {
            const yfData = quoteVal as { price?: number; change24h?: number } | null | undefined;
            if (!yfData || typeof yfData.price !== 'number' || !next[symbol]) continue;
            const livePrice = yfData.price;
            modified = true;
            const symbolSeries = { ...next[symbol] };

            for (const tf of timeframes) {
              const candles = symbolSeries[tf];
              if (candles && candles.length > 0) {
                const updatedCandles = [...candles];
                const lastIdx = updatedCandles.length - 1;
                const lastCandle = { ...updatedCandles[lastIdx] };
                lastCandle.close = livePrice;
                lastCandle.high = Math.max(lastCandle.high, livePrice);
                lastCandle.low = Math.min(lastCandle.low, livePrice);
                updatedCandles[lastIdx] = lastCandle;
                symbolSeries[tf] = updatedCandles;
              }
            }
            next[symbol] = symbolSeries;
          }

          return modified ? next : prev;
        });

        setTickCount(c => c + 1);
      } catch {
        // Fallback to internal micro-tick loop if offline
      }
    }

    fetchYfQuotes();
    const quoteInterval = setInterval(fetchYfQuotes, 3500);

    return () => {
      isMounted = false;
      clearInterval(quoteInterval);
    };
  }, []);

  // 2. Fetch YFinance real-time historical and live candles for active symbol & timeframes
  useEffect(() => {
    let isMounted = true;
    const timeframes: Timeframe[] = ['D1', 'H4', 'H1', 'M15'];

    async function loadYfCandlesForActiveSymbol() {
      for (const tf of timeframes) {
        try {
          const res = await fetch(`/api/yfinance/candles?symbol=${encodeURIComponent(selectedSymbol)}&timeframe=${tf}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data?.candles && Array.isArray(data.candles) && data.candles.length >= 10 && isMounted) {
            setCandlesByTf(prev => {
              const currentSymbolData = prev[selectedSymbol] || {} as Record<Timeframe, Candle[]>;
              return {
                ...prev,
                [selectedSymbol]: {
                  ...currentSymbolData,
                  [tf]: data.candles,
                },
              };
            });
          }
        } catch {
          // Keep current candles on error
        }
      }
    }

    loadYfCandlesForActiveSymbol();

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol]);

  // Calculate timeframe analyses for the current asset
  const tfAnalysisMap = useMemo(() => {
    const assetCandles = candlesByTf[currentAsset.symbol];
    if (!assetCandles) return null;

    return {
      D1: analyzeTimeframe('D1', assetCandles.D1, currentAsset.pipSize),
      H4: analyzeTimeframe('H4', assetCandles.H4, currentAsset.pipSize),
      H1: analyzeTimeframe('H1', assetCandles.H1, currentAsset.pipSize),
      M15: analyzeTimeframe('M15', assetCandles.M15, currentAsset.pipSize),
    };
  }, [candlesByTf, currentAsset]);

  // Evaluate the 3-Timeframe Confluence Alignment (D1 → H4 → H1 → M15 hierarchy)
  const mtfAlignment = useMemo(() => {
    if (!tfAnalysisMap) return null;
    return evaluateMultiTimeframeAlignment(tfAnalysisMap);
  }, [tfAnalysisMap]);

  // Calculate Markov Regime data (Lesson 11)
  const markovData = useMemo(() => {
    if (!tfAnalysisMap) return null;
    return calculateMarkovRegime(tfAnalysisMap, 1.2);
  }, [tfAnalysisMap]);

  // High-frequency live real-time price tick loop (every 650ms)
  useEffect(() => {
    if (!isSimulating || account.circuitBreakerTripped) return;

    const interval = setInterval(() => {
      setTickCount(c => c + 1);

      // Micro tick drift
      const deltaDirection = Math.random() > 0.48 ? 1 : -1;
      setLastTickDelta(deltaDirection);

      setAssets(prevAssets => {
        return prevAssets.map(asset => {
          const isSelected = asset.symbol === currentAsset.symbol;
          // Apply slight realistic Brownian micro-drift
          const changeRatio = (Math.random() - (deltaDirection > 0 ? 0.47 : 0.53)) * 0.0003;
          const newPrice = Number((asset.currentPrice * (1 + changeRatio)).toFixed(asset.digits));
          return {
            ...asset,
            currentPrice: newPrice,
          };
        });
      });

      // Update current candle across all timeframes for active asset so EMAs tick live
      setCandlesByTf(prev => {
        const symbol = currentAsset.symbol;
        const currentSeries = prev[symbol];
        if (!currentSeries) return prev;

        const nextSeries = { ...currentSeries };
        const timeframes: Timeframe[] = ['D1', 'H4', 'H1', 'M15'];
        const tickDrift = (Math.random() - (deltaDirection > 0 ? 0.47 : 0.53)) * currentAsset.currentPrice * 0.00015;

        for (const tf of timeframes) {
          const candles = currentSeries[tf];
          if (!candles || candles.length === 0) continue;
          const updated = [...candles];
          const lastIdx = updated.length - 1;
          const last = { ...updated[lastIdx] };
          const newClose = Number((last.close + tickDrift).toFixed(currentAsset.digits));
          last.close = newClose;
          last.high = Math.max(last.high, newClose);
          last.low = Math.min(last.low, newClose);
          updated[lastIdx] = last;
          nextSeries[tf] = updated;
        }

        return {
          ...prev,
          [symbol]: nextSeries,
        };
      });

      // Update open orders PnL
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.status !== 'OPEN') return order;
          const pipDiff = order.type === 'BUY'
            ? (currentAsset.currentPrice - order.entryPrice) / currentAsset.pipSize
            : (order.entryPrice - currentAsset.currentPrice) / currentAsset.pipSize;

          const pnlValue = pipDiff * (order.lotSize * 10);

          // Lesson 4.3: Check if hit 1:1 risk ratio to trail break-even automatically
          const target1to1Pips = Math.abs(order.entryPrice - order.stopLoss) / currentAsset.pipSize;
          let beActive = order.trailingBreakevenActive;
          let sl = order.stopLoss;

          if (!beActive && pipDiff >= target1to1Pips && target1to1Pips > 0) {
            beActive = true;
            sl = order.entryPrice; // Lock in break-even!
          }

          // Check if TP or SL hit
          let newStatus: TradeOrder['status'] = order.status;
          if (order.type === 'BUY') {
            if (currentAsset.currentPrice >= order.takeProfit) newStatus = 'CLOSED_PROFIT';
            if (currentAsset.currentPrice <= sl) newStatus = beActive ? 'BREAK_EVEN' : 'CLOSED_LOSS';
          } else {
            if (currentAsset.currentPrice <= order.takeProfit) newStatus = 'CLOSED_PROFIT';
            if (currentAsset.currentPrice <= sl) newStatus = beActive ? 'BREAK_EVEN' : 'CLOSED_LOSS';
          }

          return {
            ...order,
            pnl: Number(pnlValue.toFixed(2)),
            pnlPips: Number(pipDiff.toFixed(1)),
            trailingBreakevenActive: beActive,
            stopLoss: sl,
            status: newStatus,
          };
        });
      });
    }, 650);

    return () => clearInterval(interval);
  }, [isSimulating, currentAsset, account.circuitBreakerTripped]);

  // Recalculate account equity and 5% drawdown breaker
  useEffect(() => {
    const openPnl = orders
      .filter(o => o.status === 'OPEN')
      .reduce((sum, o) => sum + o.pnl, 0);

    const currentEquity = account.balance + openPnl;
    const dailyDrop = account.dailyStartingEquity - currentEquity;
    const dailyDropPct = Math.max(0, (dailyDrop / account.dailyStartingEquity) * 100);

    // Trip circuit breaker if >= 5% daily drawdown (Lesson 6.2)
    const tripped = dailyDropPct >= account.dailyLossLimitPercent;

    setAccount(prev => ({
      ...prev,
      equity: Number(currentEquity.toFixed(2)),
      currentDailyPnl: Number((currentEquity - prev.dailyStartingEquity).toFixed(2)),
      currentDailyLossPercent: Number(dailyDropPct.toFixed(2)),
      circuitBreakerTripped: tripped,
    }));
  }, [orders, account.balance, account.dailyStartingEquity, account.dailyLossLimitPercent]);

  // Handle Trade Execution
  const handleExecuteTrade = useCallback((orderData: any) => {
    const newOrder: TradeOrder = {
      id: `TRD-${Math.floor(1000 + Math.random() * 9000)}`,
      openTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'OPEN',
      pnl: 0,
      pnlPips: 0,
      trailingBreakevenActive: false,
      ...orderData,
    };

    setOrders(prev => [newOrder, ...prev]);
    setAccount(prev => ({
      ...prev,
      totalTrades: prev.totalTrades + 1,
    }));
  }, []);

  const handleCloseTrade = useCallback((id: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== id) return o;
        const finalStatus = o.pnl > 0 ? 'CLOSED_PROFIT' : o.pnl === 0 ? 'BREAK_EVEN' : 'CLOSED_LOSS';
        return {
          ...o,
          status: finalStatus,
        };
      })
    );
  }, []);

  const handleTrailBreakEven = useCallback((id: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== id) return o;
        return {
          ...o,
          stopLoss: o.entryPrice,
          trailingBreakevenActive: true,
          notes: (o.notes || '') + ' · Trailed to Break-Even manually (1:1 R:R)',
        };
      })
    );
  }, []);

  const handleToggleCurrency = () => {
    setAccount(prev => ({
      ...prev,
      currency: prev.currency === 'USD' ? 'ZAR' : 'USD',
    }));
  };

  const handleEmergencyHalt = () => {
    setAccount(prev => ({
      ...prev,
      circuitBreakerTripped: !prev.circuitBreakerTripped,
    }));
  };

  const handleClearJournal = () => {
    setOrders(prev => prev.filter(o => o.status === 'OPEN'));
  };

  const activeCandles = candlesByTf[currentAsset.symbol]?.[selectedTimeframe] || [];
  const openOrders = orders.filter(o => o.status === 'OPEN');

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCoach={() => setIsCoachOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        account={account}
        onEmergencyHalt={handleEmergencyHalt}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
      />

      {/* Main Terminal Body */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto px-3 sm:px-6 py-4">
        {/* Asset Selector & Market Scanner with Live Feed Status */}
        <AssetSelector
          assets={assets}
          selectedSymbol={selectedSymbol}
          onSelectAsset={asset => setSelectedSymbol(asset.symbol)}
          tickCount={tickCount}
          lastTickDelta={lastTickDelta}
        />

        {/* Multi-Timeframe Hierarchy Banner (D1 EMA 20 -> H4 EMA 50 -> H1 EMA 200 -> M15 EMA 200) */}
        {mtfAlignment && (
          <HierarchyBanner
            alignment={mtfAlignment}
            selectedTimeframe={selectedTimeframe}
            onSelectTimeframe={setSelectedTimeframe}
            activeSymbol={currentAsset.symbol}
          />
        )}

        {/* Tab View Switcher */}
        {activeTab === 'terminal' && mtfAlignment && (
          <div className="space-y-4">
            {/* Main War Room Grid: Chart & Matrix (7 Cols) | Discipline Coach & Order Engine (5 Cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column (7 Cols): Candlestick Chart & Multi-Timeframe Matrix */}
              <div className="lg:col-span-7 space-y-4">
                <TradingChart
                  candles={activeCandles}
                  timeframe={selectedTimeframe}
                  symbol={currentAsset.symbol}
                  pipSize={currentAsset.pipSize}
                  digits={currentAsset.digits}
                  onTimeframeChange={setSelectedTimeframe}
                  yfSymbol={currentAsset.yfSymbol}
                />

                {/* Multi-Timeframe Quantitative Matrix Card */}
                <TimeframeMatrix
                  alignment={mtfAlignment}
                  asset={currentAsset}
                  selectedTimeframe={selectedTimeframe}
                  onSelectTimeframe={setSelectedTimeframe}
                />
              </div>

              {/* Right Column (5 Cols): Dedicated High-Visibility Discipline Coach & Order Routing */}
              <div className="lg:col-span-5 space-y-4">
                {/* Right Panel View Mode Tabs */}
                <div className="p-1 bg-[#0b121e] border border-cyan-900/50 rounded-lg flex items-center justify-between gap-1 shadow-sm font-mono-numbers">
                  <button
                    onClick={() => setRightPanelMode('coach')}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      rightPanelMode === 'coach'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🛡️ DISCIPLINE COACH</span>
                  </button>

                  <button
                    onClick={() => setRightPanelMode('execution')}
                    className={`flex-1 py-1.5 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      rightPanelMode === 'execution'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>⚡ ORDER ROUTING</span>
                  </button>

                  <button
                    onClick={() => setRightPanelMode('both')}
                    className={`py-1.5 px-3 rounded text-xs font-bold transition-all hidden sm:flex items-center justify-center gap-1.5 ${
                      rightPanelMode === 'both'
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>↕️ BOTH</span>
                  </button>
                </div>

                {/* 1. Discipline Coach Audit Block (Always rendered when mode is 'coach' or 'both') */}
                {(rightPanelMode === 'coach' || rightPanelMode === 'both') && (
                  <DisciplineCoachPanel
                    asset={currentAsset}
                    alignment={mtfAlignment}
                    account={account}
                  />
                )}

                {/* 2. Order Execution & Risk Engine */}
                {(rightPanelMode === 'execution' || rightPanelMode === 'both') && (
                  <ExecutionPanel
                    asset={currentAsset}
                    alignment={mtfAlignment}
                    account={account}
                    openOrders={openOrders}
                    onExecuteTrade={handleExecuteTrade}
                    onCloseTrade={handleCloseTrade}
                    onTrailBreakEven={handleTrailBreakEven}
                    onToggleCurrency={handleToggleCurrency}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Markov Regimes Tab */}
        {activeTab === 'markov' && markovData && (
          <MarkovRegimePanel markovData={markovData} />
        )}

        {/* Trade Journal Tab */}
        {activeTab === 'journal' && (
          <TradeJournal
            orders={orders}
            account={account}
            onClearJournal={handleClearJournal}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060910] px-4 md:px-8 py-3 text-xs text-slate-500 font-mono-numbers flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span>BLUEPRINT TRADING TERMINAL</span>
          <span>·</span>
          <span>Real-Time Algorithmic Execution System</span>
          <span>·</span>
          <span>Johannesburg, South Africa</span>
        </div>
        <div className="flex items-center gap-3">
          <span>D1 (EMA 20) → H4 (EMA 50) → H1 (EMA 200) → M15 (EMA 200)</span>
          <span className="text-cyan-400 font-semibold">≥ 3 TF Confluence Rule Active</span>
        </div>
      </footer>

      {/* Expandable Full-Screen Discipline Coach Modal */}
      {mtfAlignment && (
        <DisciplineCoachModal
          isOpen={isCoachOpen}
          onClose={() => setIsCoachOpen(false)}
          asset={currentAsset}
          alignment={mtfAlignment}
          account={account}
        />
      )}

      {/* Blueprint Manual Rulebook Modal */}
      <RulebookModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
}
