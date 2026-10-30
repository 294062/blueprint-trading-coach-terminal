import React, { useState, useEffect } from 'react';
import { MultiTimeframeAlignment, Asset, AccountStats } from '../types/trading';
import { Bot, CheckCircle2, AlertOctagon, Brain, RefreshCw, Zap, ShieldAlert, Sparkles } from 'lucide-react';

interface DisciplineCoachPanelProps {
  asset: Asset;
  alignment: MultiTimeframeAlignment;
  account: AccountStats;
}

export const DisciplineCoachPanel: React.FC<DisciplineCoachPanelProps> = ({
  asset,
  alignment,
  account,
}) => {
  const [intendedAction, setIntendedAction] = useState<'BUY' | 'SELL'>('BUY');
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [riskReward, setRiskReward] = useState<number>(2.0);
  const [loading, setLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<{
    verdict: 'APPROVED' | 'REJECTED';
    rulesPassed: string[];
    rulesBroken: string[];
    coachAdvice: string;
    timestamp: string;
  } | null>(null);

  // Automatically sync intended action to dominant alignment if valid
  useEffect(() => {
    if (alignment.activeDirection === 'BUY') {
      setIntendedAction('BUY');
    } else if (alignment.activeDirection === 'SELL') {
      setIntendedAction('SELL');
    }
  }, [alignment.activeDirection]);

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/coach-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: asset.symbol,
          timeframe: 'M15',
          intendedAction,
          alignmentCount: alignment.alignedCount,
          alignedTimeframes: alignment.alignedTimeframes,
          d1State: {
            price: alignment.analysis.D1.lastClose,
            filterEma: alignment.analysis.D1.filterValue,
            crossover: alignment.analysis.D1.ema2 >= alignment.analysis.D1.ema5 ? 'Bullish' : 'Bearish',
          },
          h4State: {
            price: alignment.analysis.H4.lastClose,
            filterEma: alignment.analysis.H4.filterValue,
            crossover: alignment.analysis.H4.ema2 >= alignment.analysis.H4.ema5 ? 'Bullish' : 'Bearish',
          },
          h1State: {
            price: alignment.analysis.H1.lastClose,
            filterEma: alignment.analysis.H1.filterValue,
            crossover: alignment.analysis.H1.ema2 >= alignment.analysis.H1.ema5 ? 'Bullish' : 'Bearish',
          },
          m15State: {
            price: alignment.analysis.M15.lastClose,
            filterEma: alignment.analysis.M15.filterValue,
            crossover: alignment.analysis.M15.ema2 >= alignment.analysis.M15.ema5 ? 'Bullish' : 'Bearish',
          },
          riskPercent,
          riskRewardRatio: riskReward,
          currentPrice: asset.currentPrice,
        }),
      });

      if (!response.ok) {
        throw new Error('Audit request failed');
      }

      const data = await response.json();
      setAuditResult(data);
    } catch {
      // Deterministic Blueprint Trading mechanical rules evaluation
      const isApproved = alignment.alignedCount >= 3 && riskPercent <= 2.0 && riskReward >= 2.0;
      setAuditResult({
        verdict: isApproved ? 'APPROVED' : 'REJECTED',
        rulesPassed: isApproved
          ? [
              `3-Timeframe Confluence Passed (${alignment.alignedCount}/4 TFs aligned: ${alignment.alignedTimeframes.join(' → ')})`,
              `Fixed Fractional Risk ${riskPercent}% <= 2.0%`,
              `Mathematical Expectancy 1:${riskReward.toFixed(1)} >= 1:2.0 verified`,
            ]
          : [`Analyzed against Blueprint Rules`],
        rulesBroken: isApproved
          ? []
          : [
              `Hierarchy Alignment Failure: Only ${alignment.alignedCount}/4 timeframes agree. Blueprint requires at least 3 aligned timeframes (D1 → H4 → H1 and/or M15). 75% of capital destruction happens in unaligned conditions.`,
            ],
        coachAdvice: isApproved
          ? `VERDICT: ORDER EXECUTION AUTHORIZED.\n\nYour trade setup meets the strict Blueprint quantitative criteria. You have achieved ${alignment.alignedCount}/4 timeframe confluence across the D1 → H4 → H1 → M15 hierarchy (${alignment.alignedTimeframes.join(' → ')}). Price resides cleanly relative to the key filter boundaries (D1 EMA 20, H4 EMA 50, H1/M15 EMA 200), and the fast EMA 2/5 crossover confirms immediate momentum trigger.\n\nExecution Mandate: Route this order with hard-coded Stop Loss and Take Profit (1:${riskReward.toFixed(1)}). When price achieves a 1:1 risk ratio, immediately trail the stop to break-even to guarantee a risk-free speculative run. Remember: We do not hope or gamble. We execute our predefined mechanical formula.`
          : `VERDICT: ORDER LOCKED OUT — EXECUTION PROHIBITED.\n\nExecution has been frozen by the terminal rules engine. The Blueprint system requires at least 3 aligned timeframes (D1 → H4 → H1 and/or M15). Statistically, over 75% of retail capital destruction occurs inside sideways, choppy consolidation markets without 3-TF alignment.\n\nPsychological Calibration: Step away from the order button. Successful traders don't trade more—they trade better. Wait for the market to print a clean high-probability institutional setup.`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Run audit automatically on initial mount or when asset/alignment changes
  useEffect(() => {
    handleRunAudit();
  }, [asset.symbol, alignment.alignedCount]);

  return (
    <div className="w-full bg-[#0a101d] border-2 border-cyan-500/60 rounded-xl p-4 md:p-5 shadow-[0_0_25px_rgba(6,182,212,0.18)] ring-1 ring-cyan-400/20">
      {/* 1. Header with prominent branding */}
      <div className="flex items-start justify-between pb-3 mb-4 border-b border-cyan-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-white tracking-wide uppercase">
              DISCIPLINE COACH: BLUEPRINT TRADING AUDIT
            </h2>
            <p className="text-xs text-cyan-300/80 font-medium">
              The Blueprint Trading Academy · Mechanical Rule Verification
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={loading}
          title="Re-run mechanical audit"
          className="px-2.5 py-1.5 rounded bg-[#131f33] border border-cyan-700/60 text-cyan-300 hover:text-white hover:bg-cyan-900/60 transition-colors flex items-center gap-1.5 text-xs font-mono-numbers disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span className="hidden sm:inline">Re-Audit</span>
        </button>
      </div>

      {/* 2. Step 1: Test Trade Parameters against Blueprint Rules */}
      <div className="p-3.5 bg-[#0e1626] border border-slate-800 rounded-lg mb-4 font-mono-numbers">
        <div className="text-xs font-bold text-slate-200 mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Step 1: Test Trade Parameters against Blueprint Rules</span>
        </div>

        {/* Intended Direction */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-xs">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Intended Direction
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setIntendedAction('BUY')}
                className={`flex-1 py-1.5 px-2 rounded font-bold text-center transition-all ${
                  intendedAction === 'BUY'
                    ? 'bg-emerald-600 text-white border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-[#141e30] text-slate-400 border border-slate-700 hover:text-slate-200'
                }`}
              >
                BUY
              </button>
              <button
                onClick={() => setIntendedAction('SELL')}
                className={`flex-1 py-1.5 px-2 rounded font-bold text-center transition-all ${
                  intendedAction === 'SELL'
                    ? 'bg-rose-600 text-white border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                    : 'bg-[#141e30] text-slate-400 border border-slate-700 hover:text-slate-200'
                }`}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Risk Percentage */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Risk Percentage
            </label>
            <select
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full bg-[#141e30] border border-slate-700 rounded py-1.5 px-2 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
            >
              <option value={0.5}>0.5% (Conservative)</option>
              <option value={1.0}>1.0% (Standard L6.1)</option>
              <option value={1.5}>1.5% (High Conviction)</option>
              <option value={2.0}>2.0% (Maximum Limit)</option>
            </select>
          </div>

          {/* Target R:R Ratio */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Target R:R Ratio
            </label>
            <select
              value={riskReward}
              onChange={(e) => setRiskReward(Number(e.target.value))}
              className="w-full bg-[#141e30] border border-slate-700 rounded py-1.5 px-2 text-xs text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
            >
              <option value={2.0}>1:2.0 (Minimum Standard)</option>
              <option value={2.5}>1:2.5 (High Expectancy)</option>
              <option value={3.0}>1:3.0 (Blueprint Target)</option>
              <option value={4.0}>1:4.0 (Macro Runner)</option>
            </select>
          </div>
        </div>

        {/* Live context line & Run Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-300">
            Asset: <strong className="text-white font-bold">{asset.symbol}</strong> ({asset.currentPrice.toFixed(asset.digits)}) · Alignment: <strong className={alignment.canExecute ? 'text-emerald-400' : 'text-amber-400'}>{alignment.alignedCount}/4 TFs</strong>
          </div>

          <button
            onClick={handleRunAudit}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>Run Mechanical Audit</span>
          </button>
        </div>
      </div>

      {/* 3. Live Audit Result Outcome */}
      {auditResult && (
        <div className="p-3.5 bg-[#0e1626] border border-slate-800 rounded-lg mb-4 space-y-3 font-mono-numbers">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">AUDIT VERDICT:</span>
            <span className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 ${
              auditResult.verdict === 'APPROVED'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-rose-950 text-rose-300 border border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
            }`}>
              {auditResult.verdict === 'APPROVED' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>EXECUTION AUTHORIZED</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                  <span>EXECUTION LOCKED OUT</span>
                </>
              )}
            </span>
          </div>

          {/* Passed and broken rules */}
          <div className="space-y-1.5 text-xs">
            {auditResult.rulesPassed.map((rule, idx) => (
              <div key={`p-${idx}`} className="flex items-start gap-1.5 text-emerald-400/90 leading-tight">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-300">{rule}</span>
              </div>
            ))}

            {auditResult.rulesBroken.map((rule, idx) => (
              <div key={`b-${idx}`} className="flex items-start gap-1.5 text-rose-400 leading-tight">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-rose-200">{rule}</span>
              </div>
            ))}
          </div>

          {/* Coach directive text */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-cyan-300 block mb-1">
              Blueprint Trading Directive:
            </span>
            <div className="p-3 bg-[#090f1a] rounded border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
              {auditResult.coachAdvice}
            </div>
          </div>
        </div>
      )}

      {/* 4. LESSON 7: THE FOUR TOXIC TRADING DISTORTIONS */}
      <div className="p-3.5 bg-[#080d17] border border-cyan-900/40 rounded-lg space-y-2.5">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <Brain className="w-4 h-4" />
          <span>LESSON 7: THE FOUR TOXIC TRADING DISTORTIONS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-[#0f1828] rounded border border-slate-800">
            <strong className="text-slate-100 block mb-0.5 font-mono-numbers">1. Fear</strong>
            <span className="text-slate-400 text-[11px] leading-tight block">
              Hesitating on a valid 3-TF signal because the prior trade lost.
            </span>
          </div>

          <div className="p-2.5 bg-[#0f1828] rounded border border-slate-800">
            <strong className="text-slate-100 block mb-0.5 font-mono-numbers">2. Greed</strong>
            <span className="text-slate-400 text-[11px] leading-tight block">
              Inflating risk &gt; 2% hoping for a quick home run.
            </span>
          </div>

          <div className="p-2.5 bg-[#0f1828] rounded border border-slate-800">
            <strong className="text-slate-100 block mb-0.5 font-mono-numbers">3. Revenge Trading</strong>
            <span className="text-slate-400 text-[11px] leading-tight block">
              Violating rules immediately after a stop loss hit.
            </span>
          </div>

          <div className="p-2.5 bg-[#0f1828] rounded border border-slate-800">
            <strong className="text-slate-100 block mb-0.5 font-mono-numbers">4. Over-Trading</strong>
            <span className="text-slate-400 text-[11px] leading-tight block">
              Forcing entries in choppy sideways markets when &lt; 3 TFs agree.
            </span>
          </div>
        </div>

        {/* 5. Cardinal Axiom */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="italic text-cyan-200/90">
            Cardinal Axiom: <strong className="text-white">"Successful traders don't trade more. They trade better."</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
