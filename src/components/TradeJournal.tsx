import React, { useState } from 'react';
import { TradeOrder, AccountStats } from '../types/trading';
import { BookOpen, Download, TrendingUp, TrendingDown, CheckCircle2, XCircle, Search } from 'lucide-react';

interface TradeJournalProps {
  orders: TradeOrder[];
  account: AccountStats;
  onClearJournal: () => void;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({ orders, account, onClearJournal }) => {
  const [filterSymbol, setFilterSymbol] = useState<string>('ALL');

  const isZar = account.currency === 'ZAR';
  const currSym = isZar ? 'R' : '$';
  const mult = isZar ? account.exchangeRateUsdZar : 1;

  // Filter orders
  const filteredOrders = orders.filter(
    (o) => filterSymbol === 'ALL' || o.symbol === filterSymbol
  );

  // Performance metrics calculation (Lesson 9.2)
  const closedTrades = orders.filter((o) => o.status !== 'OPEN');
  const winningTrades = closedTrades.filter((o) => o.pnl > 0);
  const losingTrades = closedTrades.filter((o) => o.pnl < 0);

  const totalGrossWin = winningTrades.reduce((sum, o) => sum + o.pnl, 0);
  const totalGrossLoss = Math.abs(losingTrades.reduce((sum, o) => sum + o.pnl, 0));
  const profitFactor = totalGrossLoss > 0 ? (totalGrossWin / totalGrossLoss).toFixed(2) : totalGrossWin > 0 ? 'MAX' : '0.00';
  const netPnL = totalGrossWin - totalGrossLoss;
  const winRate = closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1) : '0.0';

  const exportCSV = () => {
    if (orders.length === 0) return;
    const headers = ['ID,Symbol,Type,Time,Entry,StopLoss,TakeProfit,LotSize,RiskPct,PnL,PnLPips,Status,Timeframes,Notes'];
    const rows = orders.map((o) =>
      [
        o.id,
        o.symbol,
        o.type,
        o.openTime,
        o.entryPrice,
        o.stopLoss,
        o.takeProfit,
        o.lotSize,
        o.riskPercent,
        o.pnl,
        o.pnlPips,
        o.status,
        `"${o.alignedTimeframes.join('->')}"`,
        `"${o.notes || ''}"`,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `blueprint_trading_journal_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-[#0d131f] border border-slate-800 rounded-lg p-3 md:p-6 mb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              SYSTEMATIC TRADE JOURNAL & AUDIT LOG
            </h2>
            <span className="text-xs font-mono-numbers px-2 py-0.5 rounded bg-[#152033] border border-slate-700 text-cyan-300">
              Lesson 10.2 Imperative
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Permanent quantitative record of all executions, risk compliance, and multi-timeframe setups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={orders.length === 0}
            className="px-3 py-1.5 text-xs font-mono-numbers rounded bg-[#152033] border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary (Lesson 9.2: Net Profit, Profit Factor, Drawdown) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono-numbers">
        <div className="p-3 bg-[#090e17] border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">NET REALIZED PROFIT</span>
          <span className={`text-base font-bold ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netPnL >= 0 ? '+' : ''}{currSym}{(netPnL * mult).toFixed(2)}
          </span>
        </div>

        <div className="p-3 bg-[#090e17] border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">SYSTEM PROFIT FACTOR</span>
          <span className="text-base font-bold text-cyan-300">{profitFactor}</span>
        </div>

        <div className="p-3 bg-[#090e17] border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">WIN RATE (MIN 35% FOR 1:2 R:R)</span>
          <span className="text-base font-bold text-slate-200">
            {winRate}% ({winningTrades.length}W / {losingTrades.length}L)
          </span>
        </div>

        <div className="p-3 bg-[#090e17] border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-500 uppercase block">CURRENT DRAWDOWN</span>
          <span className="text-base font-bold text-amber-300">
            {account.currentDailyLossPercent.toFixed(2)}% / 5.0% max
          </span>
        </div>
      </div>

      {/* Table of Orders */}
      <div className="bg-[#090e17] border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300">Execution Log ({filteredOrders.length})</span>
          <span className="text-slate-500 font-mono-numbers">D1 → H4 → H1 → M15 Verified</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-600">
            No logged trade orders yet. Execute valid 3-TF setups from the war room to generate journal data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-numbers text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-[#0c121d]">
                  <th className="py-2.5 px-3 font-semibold">Time</th>
                  <th className="py-2.5 px-3 font-semibold">Asset</th>
                  <th className="py-2.5 px-3 font-semibold">Order</th>
                  <th className="py-2.5 px-3 font-semibold">Lots</th>
                  <th className="py-2.5 px-3 font-semibold">Entry / SL / TP</th>
                  <th className="py-2.5 px-3 font-semibold">Hierarchy Alignment</th>
                  <th className="py-2.5 px-3 font-semibold">PnL ({account.currency})</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isProfit = order.pnl >= 0;
                  return (
                    <tr key={order.id} className="border-b border-slate-800/40 hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {order.openTime}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {order.symbol}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          order.type === 'BUY' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                        }`}>
                          {order.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        {order.lotSize}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        <div>In: {order.entryPrice}</div>
                        <div>SL: {order.stopLoss} · TP: {order.takeProfit}</div>
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300 text-[11px]">
                        {order.alignedTimeframes.join(' → ')}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isProfit ? '+' : ''}{currSym}{(order.pnl * mult).toFixed(2)}
                        </span>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {order.pnlPips > 0 ? '+' : ''}{order.pnlPips.toFixed(1)} pips
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        <span className={`px-2 py-0.5 rounded ${
                          order.status === 'CLOSED_PROFIT'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : order.status === 'CLOSED_LOSS'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                            : order.status === 'BREAK_EVEN'
                            ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
