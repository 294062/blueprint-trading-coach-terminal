import React, { useState } from 'react';
import { Asset, AssetCategory } from '../types/trading';
import { Radio, Search, Activity, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface AssetSelectorProps {
  assets: Asset[];
  selectedSymbol: string;
  onSelectAsset: (asset: Asset) => void;
  tickCount: number;
  lastTickDelta: number;
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  assets,
  selectedSymbol,
  onSelectAsset,
  tickCount,
  lastTickDelta,
}) => {
  const [activeCategory, setActiveCategory] = useState<AssetCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories: (AssetCategory | 'ALL')[] = ['ALL', 'Forex', 'Indices', 'Commodities', 'Crypto'];

  const filteredAssets = assets.filter((a) => {
    const matchesCategory = activeCategory === 'ALL' || a.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full bg-[#0d131f] border border-slate-800 rounded-lg p-3 mb-4">
      {/* Top Bar: Feed status & Category Tabs & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-800">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50 font-bold shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-white bg-[#090e17] border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Real-time feed status pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#09111c] border border-cyan-800/60 font-mono-numbers text-[11px] shadow-[0_0_10px_rgba(6,182,212,0.15)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-cyan-300 font-bold tracking-wide">YFINANCE REAL-TIME FEED</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Ticks: <strong className="text-white">{tickCount.toLocaleString()}</strong></span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Latency: <strong className="text-emerald-300">12ms</strong></span>
          </div>

          {/* Quick Search */}
          <div className="relative w-36 sm:w-44">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#080d16] border border-slate-800 rounded pl-7 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono-numbers"
            />
          </div>
        </div>
      </div>

      {/* Asset Tickers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-9 gap-2">
        {filteredAssets.map((asset) => {
          const isSelected = asset.symbol === selectedSymbol;
          const isUp = asset.change24h >= 0;

          return (
            <button
              key={asset.symbol}
              onClick={() => onSelectAsset(asset)}
              className={`p-2 rounded border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-[#15233a] border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50'
                  : 'bg-[#090e17] border-slate-800/80 hover:border-slate-700 hover:bg-[#0c1320]'
              }`}
            >
              {/* Top row: symbol & change */}
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-mono-numbers font-bold text-xs text-white group-hover:text-cyan-300 transition-colors">
                  {asset.symbol}
                </span>
                <span className={`text-[10px] font-mono-numbers flex items-center font-medium ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? '+' : ''}{asset.change24h.toFixed(2)}%
                </span>
              </div>

              {/* Price & Spread */}
              <div className="flex items-center justify-between font-mono-numbers text-[11px]">
                <span className={`font-semibold tracking-tight ${
                  isSelected ? 'text-white' : 'text-slate-200'
                }`}>
                  {asset.currentPrice.toFixed(asset.digits)}
                </span>
                <span className="text-[9px] text-slate-500">
                  {asset.spreadPips}p
                </span>
              </div>

              {/* YFinance ticker badge */}
              <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60 text-[9px] font-mono-numbers text-slate-500">
                <span className="truncate text-cyan-400/80 font-medium">YF: {asset.yfSymbol || asset.symbol}</span>
                <span className="truncate max-w-[55px] text-slate-500">{asset.category}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
