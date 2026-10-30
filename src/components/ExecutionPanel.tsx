import React, { useState } from 'react';
import { Asset, MultiTimeframeAlignment, TradeOrder, AccountStats } from '../types/trading';
import { ShieldCheck, Lock, Play, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle } from 'lucide-react';

interface ExecutionPanelProps {
  asset: Asset;
  alignment: MultiTimeframeAlignment;
  account: AccountStats;
  openOrders: TradeOrder[];
  onExecuteTrade: (order: Omit<TradeOrder, 'id' | 'openTime' | 'status' | 'pnl' | 'pnlPips' | 'trailingBreakevenActive'>) => void;
  onCloseTrade: (id: string) => void;
  onTrailBreakEven: (id: string) => void;
  onToggleCurrency: () => void;
}

export const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  asset,
  alignment,
  account,
  openOrders,
  onExecuteTrade,
  onCloseTrade,
  onTrailBreakEven,
  onToggleCurrency,
}) => {
  const [riskPercent, setRiskPercent] = useState<number>(1.0); // 1.0% default
  const [riskReward, setRiskReward] = useState<number>(2.0); // 1:2 minimum
  const [customSlPips, setCustomSlPips] = useState<number>(25); // 25 pips default

  const { canExecute, activeDirection, alignedCount, alignedTimeframes, analysis } = alignment;

  // Account currency formatter
  const isZar = account.currency === 'ZAR';
  const currSym = isZar ? 'R' : '$';
  const equityInCurr = isZar ? account.equity * account.exchangeRateUsdZar : account.equity;

  // Pip value in current currency per standard lot (1.00 lot)
  const pipValuePerLot = (asset.category === 'Crypto' ? 1 : asset.category === 'Indices' ? 1 : 10) * (isZar ? account.exchangeRateUsdZar : 1);

  // Position Sizing Formula (Lesson 6.1)
  // Lot Size = (Account Capital * Risk %) / (SL Distance * Pip Value)
  const riskAmount = equityInCurr * (riskPercent / 100);
  const calculatedLotSize = Math.max(0.01, Number((riskAmount / (customSlPips * pipValuePerLot)).toFixed(2)));

  // Calculated SL & TP prices based on direction
  const price = asset.currentPrice;
  const slOffset = customSlPips * asset.pipSize;
  const tpOffset = customSlPips * riskReward * asset.pipSize;

  const buySl = price - slOffset;
  const buyTp = price + tpOffset;
  const sellSl = price + slOffset;
  const sellTp = price - tpOffset;

  const handleOrder = (type: 'BUY' | 'SELL') => {
    if (!canExecute || account.circuitBreakerTripped) return;

    const stopLoss = type === 'BUY' ? buySl : sellSl;
    const takeProfit = type === 'BUY' ? buyTp : sellTp;
    const rewardAmount = riskAmount * riskReward;

    onExecuteTrade({
      symbol: asset.symbol,
      type,
      entryPrice: price,
      stopLoss,
      takeProfit,
      lotSize: calculatedLotSize,
      riskPercent,
      riskAmount,
      rewardAmount,
      riskRewardRatio: riskReward,
      alignedTimeframes,
      notes: `Executed via ${alignedCount}/4 TF Confluence (${alignedTimeframes.join('→')})`,
    });
  };

  return (
    <div className="w-full bg-[#0d131f] border border-slate-800 rounded-lg p-3 md:p-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <span>ORDER ROUTING ENGINE</span>
            <span className="text-[11px] font-normal text-slate-400">Lesson 6 & 9 Execution</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Fixed fractional 1–2% sizing · Hard SL & TP · 1:1 Break-Even Trail
          </p>
        </div>

        <button
          onClick={onToggleCurrency}
          className="text-xs font-mono-numbers px-2.5 py-1 rounded bg-[#162033] border border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          Currency: <strong className="text-cyan-400">{account.currency}</strong>
        </button>
      </div>

      {/* Account Balance & Daily Drawdown Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-2.5 bg-[#090e17] rounded border border-slate-800/80 font-mono-numbers text-xs">
        <div>
          <span className="text-[10px] text-slate-500 block">ACCOUNT EQUITY</span>
          <span className="text-slate-100 font-bold">
            {currSym}{equityInCurr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">DAILY P&L (5% MAX DD)</span>
          <span className={`font-bold ${account.currentDailyPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {account.currentDailyPnl >= 0 ? '+' : ''}{currSym}{(account.currentDailyPnl * (isZar ? account.exchangeRateUsdZar : 1)).toFixed(2)} ({account.currentDailyLossPercent.toFixed(2)}%)
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">WIN / LOSS RATIO</span>
          <span className="text-slate-300">
            {account.winCount}W / {account.lossCount}L ({account.totalTrades > 0 ? ((account.winCount / account.totalTrades) * 100).toFixed(0) : 0}%)
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">CONFLUENCE STATUS</span>
          <span className={`font-bold ${canExecute ? 'text-emerald-400' : 'text-amber-400'}`}>
            {canExecute ? `${alignedCount}/4 VALID` : `${alignedCount}/4 LOCKED`}
          </span>
        </div>
      </div>

      {/* Execution Form Controls */}
      <div className="space-y-3 mb-4">
        {/* Risk Percentage Selector (Lesson 6.1: <= 1.0% - 2.0%) */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-slate-400">Risk Model (Max 2.0%):</span>
            <span className="font-mono-numbers text-cyan-400 font-semibold">{riskPercent}% of Equity ({currSym}{riskAmount.toFixed(2)})</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 font-mono-numbers text-xs">
            {[0.5, 1.0, 1.5, 2.0].map((r) => (
              <button
                key={r}
                onClick={() => setRiskPercent(r)}
                className={`py-1.5 px-2 rounded border text-center transition-colors ${
                  riskPercent === r
                    ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-[#101726] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
        </div>

        {/* Risk to Reward Ratio Selector (Lesson 6.3: Min 1:2) */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs">
            <span className="text-slate-400">Mathematical R:R Ratio:</span>
            <span className="font-mono-numbers text-cyan-400 font-semibold">1:{riskReward.toFixed(1)} Expectancy</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 font-mono-numbers text-xs">
            {[2.0, 2.5, 3.0].map((rr) => (
              <button
                key={rr}
                onClick={() => setRiskReward(rr)}
                className={`py-1.5 px-2 rounded border text-center transition-colors ${
                  riskReward === rr
                    ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-[#101726] text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                1:{rr.toFixed(1)} {rr === 2.0 ? '(Min)' : rr === 3.0 ? '(Target)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Stop Loss Distance in Pips */}
        <div className="flex items-center justify-between text-xs font-mono-numbers pt-1">
          <span className="text-slate-400">SL Distance (Pips/Pts):</span>
          <div className="flex items-center gap-2">
            {[15, 25, 40].map((pips) => (
              <button
                key={pips}
                onClick={() => setCustomSlPips(pips)}
                className={`px-2 py-0.5 rounded text-[11px] border ${
                  customSlPips === pips
                    ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                    : 'bg-[#101726] text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {pips} pips
              </button>
            ))}
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-bold">Lot: {calculatedLotSize}</span>
          </div>
        </div>
      </div>

      {/* 3-Timeframe Rule Barrier Notice */}
      {!canExecute && (
        <div className="p-3 mb-3 bg-amber-950/40 border border-amber-600/30 rounded text-xs text-amber-300/90 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-amber-200">Execution Mechanically Locked</strong>
            Only {alignedCount}/4 timeframes agree. The Blueprint rule requires at least 3 aligned timeframes (D1 → H4 → H1 and/or M15) to route orders. Sideways consolidation filter active to protect capital.
          </div>
        </div>
      )}

      {/* Execution Buttons (BUY / SELL) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* BUY Button */}
        <button
          onClick={() => handleOrder('BUY')}
          disabled={!canExecute || activeDirection === 'SELL' || account.circuitBreakerTripped}
          className={`p-3 rounded-lg border font-mono-numbers text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
            canExecute && activeDirection === 'BUY' && !account.circuitBreakerTripped
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer'
              : 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1.5 text-sm">
            <ArrowUpRight className="w-4 h-4" />
            <span>BUY {asset.symbol}</span>
          </div>
          <span className="text-[10px] font-normal opacity-90">
            {canExecute && activeDirection === 'BUY'
              ? `TP: ${buyTp.toFixed(asset.digits)} (1:${riskReward})`
              : 'Locked (Requires Bullish Confluence)'}
          </span>
        </button>

        {/* SELL Button */}
        <button
          onClick={() => handleOrder('SELL')}
          disabled={!canExecute || activeDirection === 'BUY' || account.circuitBreakerTripped}
          className={`p-3 rounded-lg border font-mono-numbers text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
            canExecute && activeDirection === 'SELL' && !account.circuitBreakerTripped
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.35)] cursor-pointer'
              : 'bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-1.5 text-sm">
            <ArrowDownRight className="w-4 h-4" />
            <span>SELL {asset.symbol}</span>
          </div>
          <span className="text-[10px] font-normal opacity-90">
            {canExecute && activeDirection === 'SELL'
              ? `TP: ${sellTp.toFixed(asset.digits)} (1:${riskReward})`
              : 'Locked (Requires Bearish Confluence)'}
          </span>
        </button>
      </div>

      {/* Active Orders List */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Active Positions ({openOrders.length})</span>
          <span className="text-[11px] text-slate-500">Lesson 4.3: 1:1 BE Trailing Active</span>
        </div>

        {openOrders.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-600 border border-dashed border-slate-800/80 rounded">
            No live positions. Waiting for 3-TF alignment signal.
          </div>
        ) : (
          <div className="space-y-2">
            {openOrders.map((order) => {
              const isProfit = order.pnl >= 0;
              return (
                <div
                  key={order.id}
                  className="p-2.5 bg-[#090e17] border border-slate-800 rounded font-mono-numbers text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        order.type === 'BUY' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                      }`}>
                        {order.type}
                      </span>
                      <span className="font-bold text-white">{order.symbol}</span>
                      <span className="text-slate-400">({order.lotSize} lots)</span>
                    </div>

                    <div className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}{currSym}{(order.pnl * (isZar ? account.exchangeRateUsdZar : 1)).toFixed(2)} ({order.pnlPips > 0 ? '+' : ''}{order.pnlPips.toFixed(1)} pips)
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Entry: {order.entryPrice.toFixed(asset.digits)}</span>
                    <span>SL: {order.stopLoss.toFixed(asset.digits)}</span>
                    <span>TP: {order.takeProfit.toFixed(asset.digits)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => onTrailBreakEven(order.id)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                        order.trailingBreakevenActive
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>{order.trailingBreakevenActive ? 'BE Protected (Risk-Free)' : 'Trail to BE at 1:1'}</span>
                    </button>

                    <button
                      onClick={() => onCloseTrade(order.id)}
                      className="text-[10px] px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/50 text-rose-300 hover:bg-rose-900"
                    >
                      Close Market
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
