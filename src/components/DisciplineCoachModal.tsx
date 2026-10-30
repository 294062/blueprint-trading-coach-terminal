import React, { useState } from 'react';
import { MultiTimeframeAlignment, Asset, AccountStats } from '../types/trading';
import { Bot, X, ShieldAlert, CheckCircle2, AlertOctagon, Flame, Brain, Send, RefreshCw } from 'lucide-react';

interface DisciplineCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset;
  alignment: MultiTimeframeAlignment;
  account: AccountStats;
}

export const DisciplineCoachModal: React.FC<DisciplineCoachModalProps> = ({
  isOpen,
  onClose,
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

  if (!isOpen) return null;

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
        throw new Error('Coach audit request failed');
      }

      const data = await response.json();
      setAuditResult(data);
    } catch (err: any) {
      // Deterministic fallback if offline
      const isApproved = alignment.alignedCount >= 3 && riskPercent <= 2.0 && riskReward >= 2.0;
      setAuditResult({
        verdict: isApproved ? 'APPROVED' : 'REJECTED',
        rulesPassed: isApproved
          ? [
              `3-Timeframe Confluence Passed (${alignment.alignedCount}/4 TFs aligned)`,
              'Fixed Fractional Risk <= 2.0%',
              `R:R >= 1:2.0 verified`,
            ]
          : ['Risk model evaluated'],
        rulesBroken: isApproved
          ? []
          : [
              `Hierarchy Alignment Failure: Only ${alignment.alignedCount}/4 timeframes agree. Blueprint requires at least 3 aligned timeframes (D1 → H4 → H1 and/or M15).`,
            ],
        coachAdvice: isApproved
          ? 'VERDICT: ORDER AUTHORIZED.\n\nYour trade setup meets the strict Blueprint quantitative criteria. You have achieved 3+ timeframe confluence across the D1 → H4 → H1 → M15 hierarchy. Execute with hard-coded Stop Loss and trail to break-even at 1:1 risk ratio.'
          : 'VERDICT: ORDER LOCKED OUT.\n\nOnly 3 TF alignments are permitted to route orders. 75% of retail capital destruction occurs inside sideways, choppy consolidation. Step away from the order button. Successful traders don\'t trade more—they trade better.',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b111c] border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0f1726]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                DISCIPLINE COACH: BLUEPRINT TRADING AUDIT
              </h2>
              <span className="text-[11px] text-slate-400">
                The Blueprint Trading Academy · Mechanical Rule Verification
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono-numbers">
          {/* Card: Current Proposed Trade Parameters */}
          <div className="p-3 bg-[#080d16] border border-slate-800 rounded-lg">
            <div className="text-[11px] font-bold text-slate-300 mb-2 uppercase tracking-wider">
              Step 1: Test Trade Parameters against Blueprint Rules
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Intended Direction</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIntendedAction('BUY')}
                    className={`flex-1 py-1 px-2 rounded border text-center font-bold ${
                      intendedAction === 'BUY'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-[#101726] text-slate-400 border-slate-800'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => setIntendedAction('SELL')}
                    className={`flex-1 py-1 px-2 rounded border text-center font-bold ${
                      intendedAction === 'SELL'
                        ? 'bg-rose-950 text-rose-300 border-rose-500'
                        : 'bg-[#101726] text-slate-400 border-slate-800'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Risk Percentage</label>
                <select
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full bg-[#101726] border border-slate-800 rounded p-1.5 text-slate-200"
                >
                  <option value={0.5}>0.5% (Conservative)</option>
                  <option value={1.0}>1.0% (Standard L6.1)</option>
                  <option value={1.5}>1.5% (High Conviction)</option>
                  <option value={2.0}>2.0% (Maximum Limit)</option>
                  <option value={3.5}>3.5% (RULE VIOLATION)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Target R:R Ratio</label>
                <select
                  value={riskReward}
                  onChange={(e) => setRiskReward(Number(e.target.value))}
                  className="w-full bg-[#101726] border border-slate-800 rounded p-1.5 text-slate-200"
                >
                  <option value={1.0}>1:1.0 (PROHIBITED)</option>
                  <option value={2.0}>1:2.0 (Minimum Standard)</option>
                  <option value={3.0}>1:3.0 (Blueprint Target)</option>
                  <option value={4.0}>1:4.0 (Macro Runner)</option>
                </select>
              </div>
            </div>

            <div className="mt-3 flex justify-between items-center pt-2 border-t border-slate-800/80">
              <span className="text-slate-400">
                Asset: <strong className="text-white">{asset.symbol}</strong> ({asset.currentPrice}) · Alignment: <strong className={alignment.canExecute ? 'text-emerald-400' : 'text-amber-400'}>{alignment.alignedCount}/4 TFs</strong>
              </span>

              <button
                onClick={handleRunAudit}
                disabled={loading}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                <span>{loading ? 'Evaluating...' : 'Run Mechanical Audit'}</span>
              </button>
            </div>
          </div>

          {/* Audit Results */}
          {auditResult && (
            <div className="p-4 bg-[#090e17] border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">AUDIT OUTCOME:</span>
                <span className={`px-2.5 py-0.5 rounded font-bold text-xs ${
                  auditResult.verdict === 'APPROVED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                    : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                }`}>
                  {auditResult.verdict === 'APPROVED' ? 'EXECUTION AUTHORIZED' : 'EXECUTION LOCKED OUT'}
                </span>
              </div>

              {/* Passed rules */}
              {auditResult.rulesPassed.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] text-emerald-400 font-semibold block">Checks Passed:</span>
                  {auditResult.rulesPassed.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Broken rules */}
              {auditResult.rulesBroken.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] text-rose-400 font-semibold block">Rules Breached:</span>
                  {auditResult.rulesBroken.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-rose-300">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coach commentary */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] text-cyan-300 font-bold block mb-1">
                  Blueprint Trading Directive:
                </span>
                <div className="p-3 bg-[#0d1422] rounded border border-slate-800/80 text-slate-300 whitespace-pre-wrap leading-relaxed font-sans text-xs">
                  {auditResult.coachAdvice}
                </div>
              </div>
            </div>
          )}

          {/* Psychological Calibration (Lesson 7) */}
          <div className="p-3 bg-[#070b12] border border-slate-800/80 rounded-lg">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] mb-2">
              <Brain className="w-4 h-4" />
              <span>LESSON 7: THE FOUR TOXIC TRADING DISTORTIONS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
              <div className="p-2 bg-[#0d131f] rounded border border-slate-800/50">
                <strong className="text-slate-200 block">1. Fear</strong>
                Hesitating on a valid 3-TF signal because the prior trade lost.
              </div>
              <div className="p-2 bg-[#0d131f] rounded border border-slate-800/50">
                <strong className="text-slate-200 block">2. Greed</strong>
                Inflating risk &gt; 2% hoping for a quick home run.
              </div>
              <div className="p-2 bg-[#0d131f] rounded border border-slate-800/50">
                <strong className="text-slate-200 block">3. Revenge Trading</strong>
                Violating rules immediately after a stop loss hit.
              </div>
              <div className="p-2 bg-[#0d131f] rounded border border-slate-800/50">
                <strong className="text-slate-200 block">4. Over-Trading</strong>
                Forcing entries in choppy sideways markets when &lt; 3 TFs agree.
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-[#0f1726] flex items-center justify-between text-[11px] text-slate-400 font-mono-numbers">
          <span>Cardinal Axiom: "Successful traders don't trade more. They trade better."</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
