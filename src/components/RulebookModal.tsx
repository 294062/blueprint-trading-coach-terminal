import React from 'react';
import { BookOpen, X, CheckCircle2, ShieldCheck, AlertTriangle, Layers, Award } from 'lucide-react';

interface RulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulebookModal: React.FC<RulebookModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-[#0b111c] border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0f1726]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                THE BLUEPRINT TRADING MANUAL — CODES OF CONDUCT
              </h2>
              <span className="text-[11px] text-slate-400">
                Blueprint Trading Academy · Quantitative Execution Systems
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Section: Updated EMA Rules Architecture */}
          <div className="p-4 bg-[#0d1627] border border-cyan-900/60 rounded-lg">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm mb-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>UPDATED MTF EMA ARCHITECTURE & HIERARCHY RULES</span>
            </div>
            <p className="text-slate-300 mb-3 leading-relaxed">
              The updated terminal enforces the strict D1 → H4 → H1 → M15 execution hierarchy with dedicated EMA 2 and EMA 5 momentum triggers on all four timeframes, governed by distinct structural filter boundaries:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono-numbers">
              <div className="p-2.5 bg-[#090e17] rounded border border-slate-800">
                <span className="text-white font-bold block mb-1">D1 (Daily) — Macro Director</span>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  <li>• <strong className="text-purple-300">EMA 20</strong>: Macro Filter Boundary</li>
                  <li>• <strong className="text-cyan-300">EMA 2</strong>: Ultra-Fast Trigger Line</li>
                  <li>• <strong className="text-amber-300">EMA 5</strong>: Fast Baseline Guide</li>
                  <li>• Rule: Price &gt; EMA 20 for Longs; &lt; EMA 20 for Shorts</li>
                </ul>
              </div>

              <div className="p-2.5 bg-[#090e17] rounded border border-slate-800">
                <span className="text-white font-bold block mb-1">H4 (4-Hour) — Local Trend</span>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  <li>• <strong className="text-purple-300">EMA 50</strong>: Local-Trend Filter Boundary</li>
                  <li>• <strong className="text-cyan-300">EMA 2</strong>: Ultra-Fast Trigger Line</li>
                  <li>• <strong className="text-amber-300">EMA 5</strong>: Fast Baseline Guide</li>
                  <li>• Rule: Filters out toxic noise; dynamic support/resistance</li>
                </ul>
              </div>

              <div className="p-2.5 bg-[#090e17] rounded border border-slate-800">
                <span className="text-white font-bold block mb-1">H1 (1-Hour) — Execution Filter</span>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  <li>• <strong className="text-purple-300">EMA 200</strong>: Intermediate Execution Filter</li>
                  <li>• <strong className="text-cyan-300">EMA 2</strong>: Ultra-Fast Trigger Line</li>
                  <li>• <strong className="text-amber-300">EMA 5</strong>: Fast Baseline Guide</li>
                  <li>• Rule: Confirms institutional execution regime</li>
                </ul>
              </div>

              <div className="p-2.5 bg-[#090e17] rounded border border-slate-800">
                <span className="text-white font-bold block mb-1">M15 (15-Min) — Execution War Room</span>
                <ul className="space-y-1 text-[11px] text-slate-400">
                  <li>• <strong className="text-purple-300">EMA 200</strong>: Intraday Execution Filter</li>
                  <li>• <strong className="text-cyan-300">EMA 2 / 5</strong>: Mechanical Crossover Trigger</li>
                  <li>• Preferred high-efficiency structural scalping workspace</li>
                  <li>• Precise entry on pullback to dynamic EMA zone</li>
                </ul>
              </div>
            </div>

            {/* The 3-TF rule callout */}
            <div className="mt-3 p-3 bg-cyan-950/40 border border-cyan-500/30 rounded text-cyan-200 text-xs">
              <strong>The 3-Timeframe Confluence Rule:</strong> Only 3 timeframes' alignments are required to generate a signal or execute a trade, viz:
              <div className="font-mono-numbers mt-1 text-[11px] text-cyan-300">
                • D1 → H4 → H1 (Valid Signal) or D1 → H4 → M15 (Valid Signal) or H4 → H1 → M15 (Valid Signal)
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                When 4 of 4 timeframes align, it constitutes an Grade A+ Institutional Super-Confluence setup.
              </div>
            </div>
          </div>

          {/* Core Axioms */}
          <div className="p-4 bg-[#090e17] border border-slate-800 rounded-lg space-y-2">
            <span className="text-xs font-bold text-white block uppercase tracking-wider">
              Instructor's Cardinal Axioms
            </span>
            <blockquote className="italic border-l-2 border-cyan-400 pl-3 text-cyan-200">
              "We are entirely out of the prediction business. We do not possess a crystal ball, nor do we require one. Our operational mandate is exclusively to isolate, verify, and systematically execute within areas of extreme mathematical high-probability opportunity."
            </blockquote>
            <blockquote className="italic border-l-2 border-cyan-400 pl-3 text-cyan-200">
              "Successful traders don't trade more. They trade better."
            </blockquote>
          </div>

          {/* Lesson 6: Mathematical Capital Risk Management */}
          <div className="p-4 bg-[#090e17] border border-slate-800 rounded-lg space-y-2.5">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Lesson 6: Capital Defense Parameters</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 font-mono-numbers text-[11px]">
              <li>• <strong className="text-emerald-400">Fixed Fractional Risk:</strong> Maximum Risk per single trade is strictly &le; 1.0% – 2.0% of total liquid account equity.</li>
              <li>• <strong className="text-emerald-400">Lot Sizing Equation:</strong> Lot Size = (Account Capital &times; Risk %) / (SL Distance &times; Pip Value)</li>
              <li>• <strong className="text-amber-400">5% Daily Capital Loss Boundary:</strong> If breached, all open trades are closed and terminal operations are frozen for 24 hours.</li>
              <li>• <strong className="text-amber-400">10% Weekly Loss Boundary:</strong> If hit, trading is stopped until the following Monday.</li>
              <li>• <strong className="text-cyan-400">Positive Expectancy:</strong> Minimum 1:2 or 1:3 Risk-to-Reward Ratio on every trade. At 1:2 R:R, a trader only needs 35% win rate to remain profitable.</li>
              <li>• <strong className="text-cyan-400">Lesson 4.3 Break-Even Trailing:</strong> When price hits a 1:1 risk ratio, Stop Loss is automatically adjusted to entry price for a completely risk-free run.</li>
            </ul>
          </div>

          {/* Lesson 1.6: Sideways Market Lockout Warning */}
          <div className="p-3 bg-amber-950/30 border border-amber-600/30 rounded-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-200/90 leading-relaxed">
              <strong>Critical Operational Warning (Lesson 1.6):</strong> Statistically, over 75% of total retail capital destruction occurs inside sideways, choppy consolidation markets. Because retail traders lack structural filters, they enter micro-positions randomly inside tightening bands. The Blueprint system locks out execution during these periods unless 3-TF confluence is verified.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0f1726] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded transition-colors text-xs"
          >
            Acknowledge Blueprint Rules
          </button>
        </div>
      </div>
    </div>
  );
};
