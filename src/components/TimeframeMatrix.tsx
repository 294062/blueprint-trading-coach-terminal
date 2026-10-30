import React from 'react';
import { MultiTimeframeAlignment, Timeframe, Asset } from '../types/trading';
import { CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, Layers, Sliders, Info } from 'lucide-react';

interface TimeframeMatrixProps {
  alignment: MultiTimeframeAlignment;
  asset: Asset;
  selectedTimeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
}

export const TimeframeMatrix: React.FC<TimeframeMatrixProps> = ({
  alignment,
  asset,
  selectedTimeframe,
  onSelectTimeframe,
}) => {
  const { analysis, alignedTimeframes, alignedCount, canExecute, activeDirection } = alignment;

  const tfs: {
    tf: Timeframe;
    name: string;
    roleDescription: string;
    filterEmaName: string;
    filterRationale: string;
  }[] = [
    {
      tf: 'D1',
      name: 'Daily (Macro Director)',
      roleDescription: 'Charts institutional multi-month accumulation and baseline direction.',
      filterEmaName: 'EMA 20 Macro Filter',
      filterRationale: 'Price must be cleanly above for buys, below for sells.',
    },
    {
      tf: 'H4',
      name: '4-Hour (Local-Trend)',
      roleDescription: 'Isolates dominant mid-term institutional momentum trend.',
      filterEmaName: 'EMA 50 Local Filter',
      filterRationale: 'Acts as dynamic support/resistance for local swings.',
    },
    {
      tf: 'H1',
      name: '1-Hour (Execution Filter)',
      roleDescription: 'Intermediate structural alignment bridging macro and war room.',
      filterEmaName: 'EMA 200 Execution Filter',
      filterRationale: 'Confirms intermediate institutional regime alignment.',
    },
    {
      tf: 'M15',
      name: '15-Min (Execution War Room)',
      roleDescription: 'Definitive war room optimizing high-probability mechanical entries.',
      filterEmaName: 'EMA 200 Execution Filter',
      filterRationale: 'Executes on fast EMA 2 / EMA 5 crossover pullback.',
    },
  ];

  return (
    <div className="w-full bg-[#0d131f] border border-slate-800 rounded-lg p-3 md:p-4 mb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-800/80 gap-2">
        <div>
          <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>MULTI-TIMEFRAME QUANT MATRIX</span>
            <span className="text-[11px] text-cyan-300 font-mono-numbers">
              [D1 → H4 → H1 → M15]
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Systematic rule inspection · 3 of 4 timeframes mandatory to authorize execution
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-numbers">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Aligned Count:</span>
            <strong className={`px-2 py-0.5 rounded text-xs ${
              canExecute ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50' : 'bg-amber-950 text-amber-300 border border-amber-700/50'
            }`}>
              {alignedCount} / 4 Timeframes
            </strong>
          </div>
        </div>
      </div>

      {/* Grid of 4 Timeframes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {tfs.map((item) => {
          const tfData = analysis[item.tf];
          const isSelected = selectedTimeframe === item.tf;
          const isAligned = alignedTimeframes.includes(item.tf);

          return (
            <div
              key={item.tf}
              onClick={() => onSelectTimeframe(item.tf)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#142033] border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                  : 'bg-[#0a0f19] border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* TF title row */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono-numbers font-bold text-base text-white">
                    {item.tf}
                  </span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                    {item.name.replace(`${item.tf} `, '')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isAligned ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-mono-numbers font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      ALIGNED
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1 text-[11px] font-mono-numbers">
                      <XCircle className="w-3.5 h-3.5" />
                      OFF-AXIS
                    </span>
                  )}
                </div>
              </div>

              {/* Filter badge */}
              <div className="mb-2.5 p-1.5 bg-[#0f1827] rounded border border-slate-800/80 text-[11px] font-mono-numbers flex items-center justify-between">
                <span className="text-purple-300 font-semibold">{item.filterEmaName}</span>
                <span className="text-slate-300">{tfData.filterValue.toFixed(asset.digits)}</span>
              </div>

              {/* Data Table */}
              <div className="space-y-1.5 font-mono-numbers text-xs mb-3">
                <div className="flex justify-between text-slate-400">
                  <span className="text-[11px]">EMA 2 Trigger:</span>
                  <span className="text-cyan-300 font-medium">{tfData.ema2.toFixed(asset.digits)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span className="text-[11px]">EMA 5 Baseline:</span>
                  <span className="text-amber-300 font-medium">{tfData.ema5.toFixed(asset.digits)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span className="text-[11px]">EMA 2 vs 5 Cross:</span>
                  <span className={tfData.ema2 >= tfData.ema5 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {tfData.ema2 >= tfData.ema5 ? 'Bullish (2 > 5)' : 'Bearish (2 < 5)'}
                  </span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span className="text-[11px]">Filter Boundary:</span>
                  <span className={tfData.isAboveFilter ? 'text-emerald-400' : 'text-rose-400'}>
                    {tfData.isAboveFilter ? 'Price Above' : 'Price Below'} ({tfData.distanceToFilterPips > 0 ? '+' : ''}{tfData.distanceToFilterPips.toFixed(1)}p)
                  </span>
                </div>
              </div>

              {/* Bias Result Badge */}
              <div className={`p-2 rounded text-xs font-mono-numbers flex items-center justify-between ${
                tfData.bias === 'BULLISH'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                  : tfData.bias === 'BEARISH'
                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
              }`}>
                <div className="flex items-center gap-1">
                  {tfData.bias === 'BULLISH' && <ArrowUpRight className="w-3.5 h-3.5" />}
                  {tfData.bias === 'BEARISH' && <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span className="font-bold">{tfData.bias}</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {isSelected ? 'Viewing' : 'Switch'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
