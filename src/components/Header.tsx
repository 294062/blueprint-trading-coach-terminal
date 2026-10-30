import React from 'react';
import { ShieldCheck, AlertOctagon, BookOpen, Bot, Activity } from 'lucide-react';
import { AccountStats } from '../types/trading';

interface HeaderProps {
  activeTab: 'terminal' | 'markov' | 'journal' | 'rules';
  setActiveTab: (tab: 'terminal' | 'markov' | 'journal' | 'rules') => void;
  onOpenCoach: () => void;
  onOpenRules: () => void;
  account: AccountStats;
  onEmergencyHalt: () => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCoach,
  onOpenRules,
  account,
  onEmergencyHalt,
  isSimulating,
  setIsSimulating,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#080c14]/95 backdrop-blur border-b border-slate-800/80 px-4 md:px-8 py-3 flex items-center justify-between gap-6">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/"
          className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2 whitespace-nowrap"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse-subtle"></span>
          BLUEPRINT QUANT TERMINAL
        </a>
        <span className="hidden lg:inline text-xs text-cyan-400 font-mono-numbers">
          YFINANCE LIVE · D1→H4→H1→M15
        </span>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs md:text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 border-b-2 ${
            activeTab === 'terminal' ? 'border-cyan-400 text-white font-semibold' : 'border-transparent text-slate-400'
          }`}
        >
          Execution Matrix
        </button>

        <button
          onClick={() => setActiveTab('markov')}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 border-b-2 ${
            activeTab === 'markov' ? 'border-cyan-400 text-white font-semibold' : 'border-transparent text-slate-400'
          }`}
        >
          Markov Regimes (L11)
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`hover:text-white transition-colors whitespace-nowrap py-1 border-b-2 ${
            activeTab === 'journal' ? 'border-cyan-400 text-white font-semibold' : 'border-transparent text-slate-400'
          }`}
        >
          Trade Journal ({account.totalTrades})
        </button>

        <button
          onClick={onOpenRules}
          className="hover:text-cyan-300 transition-colors whitespace-nowrap flex items-center gap-1.5 py-1 text-slate-400"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Manual Rules</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & Quick Status Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live Simulation Switch */}
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          title="Toggle live price tick streaming"
          className={`px-2.5 py-1.5 text-xs font-mono-numbers rounded border transition-colors flex items-center gap-1.5 ${
            isSimulating
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-700/50 hover:bg-emerald-900/50'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5 animate-spin text-emerald-400" style={{ animationDuration: isSimulating ? '2s' : '0s' }} />
          <span>{isSimulating ? 'YF LIVE FEED ON' : 'PAUSED'}</span>
        </button>

        {/* AI Discipline Coach */}
        <button
          onClick={onOpenCoach}
          className="px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded hover:bg-cyan-900/60 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Discipline Coach</span>
          <span className="sm:hidden">Coach</span>
        </button>

        {/* Emergency Circuit Breaker */}
        <button
          onClick={onEmergencyHalt}
          title="Lesson 6.2: 5% Max Daily Drawdown Freeze"
          className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            account.circuitBreakerTripped
              ? 'bg-rose-900/90 text-rose-200 border-rose-500 animate-pulse'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900'
          }`}
        >
          {account.circuitBreakerTripped ? (
            <>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              <span>TERMINAL FROZEN (5% DD)</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Protection Active</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
