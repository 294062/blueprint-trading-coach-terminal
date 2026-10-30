import React from 'react';
import { MarkovRegimeData, MarkovState } from '../types/trading';
import { GitBranch, TrendingUp, TrendingDown, PauseCircle, Zap, Shield, Sparkles } from 'lucide-react';

interface MarkovRegimePanelProps {
  markovData: MarkovRegimeData;
}

export const MarkovRegimePanel: React.FC<MarkovRegimePanelProps> = ({ markovData }) => {
  const { currentState, transitionMatrix, positionSizingMultiplier, recommendedAction, confidence } = markovData;

  const states: {
    state: MarkovState;
    label: string;
    code: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      state: 'Bullish Regime',
      label: 'State 1: Bullish Regime',
      code: 'S1_BULL',
      desc: 'Sustained institutional accumulation. Price riding above EMA 50/200.',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
      color: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300',
    },
    {
      state: 'Neutral Tight',
      label: 'State 2: Neutral Tight',
      code: 'S2_TIGHT',
      desc: 'Horizontal range block. Energy compression preparing for explosive expansion.',
      icon: <PauseCircle className="w-4 h-4 text-amber-400" />,
      color: 'border-amber-500/50 bg-amber-950/20 text-amber-300',
    },
    {
      state: 'Bearish Regime',
      label: 'State 3: Bearish Regime',
      code: 'S3_BEAR',
      desc: 'Institutional distribution & liquidation waves dominant.',
      icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
      color: 'border-rose-500/50 bg-rose-950/20 text-rose-300',
    },
    {
      state: 'Volatile Wide',
      label: 'State 4: Volatile Wide',
      code: 'S4_WIDE',
      desc: 'Erratic macro expansion, whipsaw hazard. Strict capital defense required.',
      icon: <Zap className="w-4 h-4 text-cyan-400" />,
      color: 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300',
    },
  ];

  return (
    <div className="w-full bg-[#0d131f] border border-slate-800 rounded-lg p-3 md:p-6 mb-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-800/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              MARKOV CHAIN PROBABILITY MATRIX
            </h2>
            <span className="text-xs font-mono-numbers px-2 py-0.5 rounded bg-[#152033] border border-slate-700 text-cyan-300">
              Lesson 11 Core Model
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Memoryless regime modeling & dynamic positioning edge based on structural state transitions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-[#0a0f18] border border-slate-800 font-mono-numbers text-xs">
            <span className="text-slate-500 text-[10px] block">ACTIVE DETECTED STATE</span>
            <span className="text-cyan-300 font-bold">{currentState}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#0a0f18] border border-slate-800 font-mono-numbers text-xs">
            <span className="text-slate-500 text-[10px] block">POSITION MULTIPLIER</span>
            <span className="text-emerald-400 font-bold">{positionSizingMultiplier}x</span>
          </div>
        </div>
      </div>

      {/* 4 Primary States Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {states.map((st) => {
          const isActive = currentState === st.state;
          return (
            <div
              key={st.state}
              className={`p-3.5 rounded-lg border transition-all ${
                isActive
                  ? 'bg-[#15233a] border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
                  : 'bg-[#090e17] border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {st.icon}
                  <span className="text-xs font-bold text-white">{st.label}</span>
                </div>
                {isActive && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 animate-pulse">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                {st.desc}
              </p>
              <div className="text-[10px] font-mono-numbers text-slate-500 pt-1 border-t border-slate-800/60">
                Code: {st.code}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transition Probability Matrix Table */}
      <div className="bg-[#090e17] border border-slate-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-slate-200 tracking-wide">
            EMPIRICAL TRANSITION PROBABILITY MATRIX P(S_next | S_current)
          </div>
          <span className="text-[11px] text-slate-500 font-mono-numbers">
            Lesson 11.3 Quantitative Logic
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-numbers text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                <th className="py-2 px-3 font-semibold">Current State \ Next State</th>
                <th className="py-2 px-3 font-semibold text-emerald-400">Bullish Regime</th>
                <th className="py-2 px-3 font-semibold text-amber-400">Neutral Tight</th>
                <th className="py-2 px-3 font-semibold text-rose-400">Bearish Regime</th>
                <th className="py-2 px-3 font-semibold text-cyan-400">Volatile Wide</th>
              </tr>
            </thead>
            <tbody>
              {transitionMatrix.map((row) => {
                const isCurrentRow = row.from === currentState;
                return (
                  <tr
                    key={row.from}
                    className={`border-b border-slate-800/50 ${
                      isCurrentRow ? 'bg-cyan-950/30 font-semibold' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-300 flex items-center gap-2">
                      {isCurrentRow && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                      <span>{row.from}</span>
                    </td>
                    <td className="py-2 px-3 text-emerald-300">
                      {(row.to['Bullish Regime'] * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-amber-300">
                      {(row.to['Neutral Tight'] * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-rose-300">
                      {(row.to['Bearish Regime'] * 100).toFixed(0)}%
                    </td>
                    <td className="py-2 px-3 text-cyan-300">
                      {(row.to['Volatile Wide'] * 100).toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Sizing & System Action Callout */}
      <div className="p-3 bg-[#0a1220] border border-cyan-900/50 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-200 block font-semibold">
              Algorithmic Execution Directive (Lesson 11.3)
            </strong>
            <span className="text-slate-400">
              {recommendedAction}
            </span>
          </div>
        </div>

        <div className="text-[11px] font-mono-numbers text-slate-400 text-right shrink-0">
          State Confidence: <strong className="text-emerald-400">{(confidence * 100).toFixed(0)}%</strong>
        </div>
      </div>
    </div>
  );
};
