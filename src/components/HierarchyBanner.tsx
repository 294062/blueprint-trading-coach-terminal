import React from 'react';
import { MultiTimeframeAlignment, Timeframe } from '../types/trading';
import { CheckCircle2, XCircle, ArrowRight, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

interface HierarchyBannerProps {
  alignment: MultiTimeframeAlignment;
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  activeSymbol: string;
}

export const HierarchyBanner: React.FC<HierarchyBannerProps> = ({
  alignment,
  selectedTimeframe,
  onSelectTimeframe,
  activeSymbol,
}) => {
  const steps: {
    tf: Timeframe;
    role: string;
    filterLabel: string;
  }[] = [
    { tf: 'D1', role: 'Macro Filter', filterLabel: 'EMA 20' },
    { tf: 'H4', role: 'Local-Trend Filter', filterLabel: 'EMA 50' },
    { tf: 'H1', role: 'Execution Filter', filterLabel: 'EMA 200' },
    { tf: 'M15', role: 'Execution Trigger', filterLabel: 'EMA 200' },
  ];

  const { alignedCount, canExecute, activeDirection, alignedTimeframes, analysis } = alignment;

  return (
    <div className="w-full bg-[#0d131f] border border-slate-800 rounded-lg p-3 md:p-4 mb-4">
      {/* Top row: Status, Rule reminder & Signal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
              Hierarchy Sequence:
            </span>
            <span className="text-xs font-mono-numbers text-cyan-400 font-semibold">
              D1 (EMA 20) → H4 (EMA 50) → H1 (EMA 200) → M15 (EMA 200)
            </span>
          </div>
          <span className="text-slate-600 hidden sm:inline">·</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            3-TF Rule: <strong className="text-slate-200">≥ 3 Aligned to Execute</strong>
          </span>
        </div>

        {/* Live Confluence & Signal Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {canExecute ? (
            <div className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-2 ${
              activeDirection === 'BUY'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {alignedCount === 4 ? 'A+ FULL CONFLUENCE' : 'VALID SIGNAL'} · {activeDirection} ({alignedCount}/4 TFs)
              </span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded text-xs font-medium bg-amber-950/50 text-amber-300 border border-amber-600/40 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>LOCKOUT: {alignedCount}/4 Aligned (Requires ≥ 3)</span>
            </div>
          )}
        </div>
      </div>

      {/* Stepper Grid: D1 -> H4 -> H1 -> M15 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3">
        {steps.map((step, idx) => {
          const tfData = analysis[step.tf];
          const isSelected = selectedTimeframe === step.tf;
          const isAligned = alignedTimeframes.includes(step.tf);
          const biasColor =
            tfData.bias === 'BULLISH'
              ? 'text-emerald-400'
              : tfData.bias === 'BEARISH'
              ? 'text-rose-400'
              : 'text-amber-400';

          return (
            <div
              key={step.tf}
              onClick={() => onSelectTimeframe(step.tf)}
              className={`relative cursor-pointer transition-all rounded-md p-3 border ${
                isSelected
                  ? 'bg-[#152033] border-cyan-500/80 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'bg-[#0f1726]/80 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Header row of card */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono-numbers font-bold text-sm text-white">
                    {step.tf}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({step.filterLabel})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isAligned ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </div>

              {/* Sub-label role */}
              <div className="text-[11px] text-slate-400 mb-2">
                {step.role}
              </div>

              {/* Metrics */}
              <div className="space-y-1 font-mono-numbers text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[11px]">EMA 2 / 5:</span>
                  <span className={tfData.ema2 >= tfData.ema5 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                    {tfData.ema2.toFixed(step.tf === 'M15' || step.tf === 'H1' ? 4 : 2)} / {tfData.ema5.toFixed(step.tf === 'M15' || step.tf === 'H1' ? 4 : 2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span className="text-[11px]">{step.filterLabel}:</span>
                  <span className="text-slate-200">
                    {tfData.filterValue.toFixed(step.tf === 'M15' || step.tf === 'H1' ? 4 : 2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-500">TF Bias:</span>
                  <span className={`text-[11px] font-semibold tracking-wide ${biasColor}`}>
                    {tfData.bias}
                  </span>
                </div>
              </div>

              {/* Click to inspect hint */}
              <div className="mt-2 pt-1 text-[10px] text-right text-slate-500">
                {isSelected ? '● Active Chart View' : 'Click to View Chart'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rationale explanation banner */}
      <div className="mt-3 pt-2 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/40">
        <div className="flex items-center gap-2">
          {canExecute ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {alignment.verdictReason}
            </span>
          ) : (
            <span className="text-amber-400/90 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {alignment.verdictReason}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 hidden md:block">
          Asset: <strong className="text-slate-300 font-mono-numbers">{activeSymbol}</strong>
        </div>
      </div>
    </div>
  );
};
