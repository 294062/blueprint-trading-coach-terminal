import React, { useState, useMemo } from 'react';
import { Candle, Timeframe } from '../types/trading';
import { calculateEMA, getFilterPeriodForTimeframe } from '../utils/indicators';
import { ZoomIn, ZoomOut, Zap } from 'lucide-react';

interface TradingChartProps {
  candles: Candle[];
  timeframe: Timeframe;
  symbol: string;
  pipSize: number;
  digits: number;
  onTimeframeChange: (tf: Timeframe) => void;
  yfSymbol?: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  timeframe,
  symbol,
  pipSize,
  digits,
  onTimeframeChange,
  yfSymbol,
}) => {
  const [hoveredCandleIndex, setHoveredCandleIndex] = useState<number | null>(null);
  const [visibleCandleCount, setVisibleCandleCount] = useState<number>(45);

  const filterInfo = getFilterPeriodForTimeframe(timeframe);

  // Take the most recent visible candles
  const displayCandles = useMemo(() => {
    return candles.slice(Math.max(0, candles.length - visibleCandleCount));
  }, [candles, visibleCandleCount]);

  // Compute EMAs over the full series, then slice to visible
  const closes = useMemo(() => candles.map(c => c.close), [candles]);
  const ema2Full = useMemo(() => calculateEMA(closes, 2), [closes]);
  const ema5Full = useMemo(() => calculateEMA(closes, 5), [closes]);
  const filterFull = useMemo(() => calculateEMA(closes, filterInfo.period), [closes, filterInfo.period]);

  const offset = candles.length - displayCandles.length;
  const ema2 = useMemo(() => ema2Full.slice(offset), [ema2Full, offset]);
  const ema5 = useMemo(() => ema5Full.slice(offset), [ema5Full, offset]);
  const filterEma = useMemo(() => filterFull.slice(offset), [filterFull, offset]);

  // Dimensions
  const width = 860;
  const height = 430;
  const padding = { top: 22, right: 86, bottom: 42, left: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Price scale (purely price and EMAs, volume completely removed)
  const { minPrice, maxPrice } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    displayCandles.forEach((c, i) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;

      // Ensure EMAs fit neatly inside vertical bounds
      if (ema2[i] && ema2[i] < min) min = ema2[i];
      if (ema2[i] && ema2[i] > max) max = ema2[i];
      if (ema5[i] && ema5[i] < min) min = ema5[i];
      if (ema5[i] && ema5[i] > max) max = ema5[i];
      if (filterEma[i] && filterEma[i] < min) min = filterEma[i];
      if (filterEma[i] && filterEma[i] > max) max = filterEma[i];
    });

    const range = max - min || 1;
    return {
      minPrice: min - range * 0.05,
      maxPrice: max + range * 0.05,
    };
  }, [displayCandles, ema2, ema5, filterEma]);

  const priceRange = maxPrice - minPrice;

  const getY = (val: number) => {
    return padding.top + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
  };

  const candleWidth = chartWidth / (displayCandles.length || 1);
  const barWidth = Math.max(3, candleWidth * 0.68);

  // Generate SVG path for an indicator
  const getLinePath = (data: number[]) => {
    return data
      .map((val, idx) => {
        const x = padding.left + idx * candleWidth + candleWidth / 2;
        const y = getY(val);
        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const activeCandle = hoveredCandleIndex !== null ? displayCandles[hoveredCandleIndex] : displayCandles[displayCandles.length - 1];
  const activeEma2 = hoveredCandleIndex !== null ? ema2[hoveredCandleIndex] : ema2[ema2.length - 1];
  const activeEma5 = hoveredCandleIndex !== null ? ema5[hoveredCandleIndex] : ema5[ema5.length - 1];
  const activeFilter = hoveredCandleIndex !== null ? filterEma[hoveredCandleIndex] : filterEma[filterEma.length - 1];

  const currentClose = displayCandles[displayCandles.length - 1]?.close;
  const isEma2Above5 = activeEma2 !== undefined && activeEma5 !== undefined ? activeEma2 >= activeEma5 : false;
  const emaSpreadPips = activeEma2 !== undefined && activeEma5 !== undefined && pipSize > 0
    ? ((activeEma2 - activeEma5) / pipSize).toFixed(1)
    : '0.0';

  // Price ticks on right axis
  const priceTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 6;
    for (let i = 0; i <= count; i++) {
      ticks.push(minPrice + (priceRange * i) / count);
    }
    return ticks;
  }, [minPrice, priceRange]);

  return (
    <div className="w-full bg-[#0a0f18] border border-slate-800 rounded-lg p-3 md:p-4">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/70">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono-numbers text-base font-bold text-white tracking-wide">
              {symbol}
            </span>
            <span className="text-xs text-white font-semibold font-mono-numbers">
              {timeframe} Chart
            </span>
            {yfSymbol && (
              <span className="text-[10px] font-mono-numbers text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60 shadow-sm font-semibold">
                YF: {yfSymbol}
              </span>
            )}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-[10px] text-emerald-300 font-mono-numbers">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              <span className="font-semibold">YF LIVE EMAs</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 p-0.5 bg-[#0e1624] rounded border border-slate-800">
            {(['D1', 'H4', 'H1', 'M15'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 text-xs font-mono-numbers rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-white hover:text-cyan-200 font-medium'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Indicator Legend (All labels in clear, readily readable white) */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono-numbers">
          <div className="flex items-center gap-1.5 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40">
            <span className="w-2.5 h-1 bg-cyan-400 rounded-full inline-block"></span>
            <span className="text-white font-medium text-[11px]">EMA 2:</span>
            <span className="text-cyan-300 font-bold text-[11px]">{activeEma2?.toFixed(digits)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-800/40">
            <span className="w-2.5 h-1 bg-amber-400 rounded-full inline-block"></span>
            <span className="text-white font-medium text-[11px]">EMA 5:</span>
            <span className="text-amber-300 font-bold text-[11px]">{activeEma5?.toFixed(digits)}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-purple-950/40 px-2.5 py-1 rounded border border-purple-800/40">
            <span className="w-2.5 h-1 bg-purple-400 rounded-full inline-block"></span>
            <span className="text-white font-medium text-[11px]">{filterInfo.name}:</span>
            <span className="text-purple-300 font-bold text-[11px]">{activeFilter?.toFixed(digits)}</span>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
            <button
              onClick={() => setVisibleCandleCount(prev => Math.min(75, prev + 10))}
              className="p-1 text-white hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setVisibleCandleCount(prev => Math.max(25, prev - 10))}
              className="p-1 text-white hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Candle OHLC Bar (All text in readily readable crisp white) */}
      {activeCandle && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono-numbers text-white font-medium mb-2 px-1">
          <div className="flex flex-wrap items-center gap-3">
            <span>T: <strong className="text-white font-bold">{activeCandle.timeFormatted}</strong></span>
            <span>O: <strong className="text-white font-bold">{activeCandle.open.toFixed(digits)}</strong></span>
            <span>H: <strong className="text-emerald-300 font-bold">{activeCandle.high.toFixed(digits)}</strong></span>
            <span>L: <strong className="text-rose-300 font-bold">{activeCandle.low.toFixed(digits)}</strong></span>
            <span>C: <strong className={`font-bold ${activeCandle.close >= activeCandle.open ? 'text-emerald-400' : 'text-rose-400'}`}>{activeCandle.close.toFixed(digits)}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live EMA 2 / 5 Trigger state */}
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
              isEma2Above5 ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/50' : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
            }`}>
              <Zap className="w-2.5 h-2.5" />
              {isEma2Above5 ? `EMA 2 > 5 (+${emaSpreadPips} pips Bullish)` : `EMA 2 < 5 (${emaSpreadPips} pips Bearish)`}
            </span>

            {/* Boundary Filter status */}
            <span className="hidden sm:inline text-white font-medium">
              Filter: <strong className={activeCandle.close >= (activeFilter || 0) ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {activeCandle.close >= (activeFilter || 0) ? `Above ${filterInfo.name} (${filterInfo.role})` : `Below ${filterInfo.name} (${filterInfo.role})`}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Main SVG Interactive Chart */}
      <div className="relative w-full overflow-hidden bg-[#070b12] rounded border border-slate-800/80">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredCandleIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {priceTicks.map((price, idx) => {
            const y = getY(price);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#162234"
                  strokeDasharray="2 3"
                  strokeWidth="0.8"
                />
                {/* Price Axis Labels in bright, readily readable white */}
                <text
                  x={width - padding.right + 6}
                  y={y + 3.5}
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {price.toFixed(digits)}
                </text>
              </g>
            );
          })}

          {/* Filter EMA line (EMA 20 / 50 / 200 depending on TF) */}
          <path
            d={getLinePath(filterEma)}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeDasharray={timeframe === 'H1' || timeframe === 'M15' ? '4 2' : undefined}
          />

          {/* EMA 5 Line (Fast baseline guide) */}
          <path
            d={getLinePath(ema5)}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.8"
          />

          {/* EMA 2 Line (Ultra-fast trigger line) */}
          <path
            d={getLinePath(ema2)}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.2"
          />

          {/* Candlesticks (Full vertical chart area utilized without volume obstruction) */}
          {displayCandles.map((candle, idx) => {
            const isUp = candle.close >= candle.open;
            const xCenter = padding.left + idx * candleWidth + candleWidth / 2;
            const xBar = xCenter - barWidth / 2;

            const yHigh = getY(candle.high);
            const yLow = getY(candle.low);
            const yOpen = getY(candle.open);
            const yClose = getY(candle.close);

            const bodyY = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

            const isHovered = hoveredCandleIndex === idx;

            // Check if there was an EMA 2 / 5 crossover right here
            const hasBullCross = idx > 0 && ema2[idx - 1] <= ema5[idx - 1] && ema2[idx] > ema5[idx];
            const hasBearCross = idx > 0 && ema2[idx - 1] >= ema5[idx - 1] && ema2[idx] < ema5[idx];

            return (
              <g key={idx}>
                {/* Thin wick */}
                <line
                  x1={xCenter}
                  y1={yHigh}
                  x2={xCenter}
                  y2={yLow}
                  stroke={isUp ? '#10b981' : '#f43f5e'}
                  strokeWidth="1.2"
                />

                {/* Real candle body */}
                <rect
                  x={xBar}
                  y={bodyY}
                  width={barWidth}
                  height={bodyHeight}
                  fill={isUp ? '#10b981' : '#f43f5e'}
                  stroke={isUp ? '#059669' : '#e11d48'}
                  strokeWidth="0.5"
                  rx="0.5"
                />

                {/* Crossover Trigger Marker (Lesson 4.1: EMA 2/5 Crossover Confirmation) */}
                {hasBullCross && (
                  <circle
                    cx={xCenter}
                    cy={yLow + 12}
                    r="4"
                    fill="#22d3ee"
                    stroke="#080c14"
                    strokeWidth="1.5"
                    className="animate-bounce"
                  />
                )}
                {hasBearCross && (
                  <circle
                    cx={xCenter}
                    cy={yHigh - 12}
                    r="4"
                    fill="#f43f5e"
                    stroke="#080c14"
                    strokeWidth="1.5"
                    className="animate-bounce"
                  />
                )}

                {/* Invisible hover capture rect */}
                <rect
                  x={padding.left + idx * candleWidth}
                  y={padding.top}
                  width={candleWidth}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredCandleIndex(idx)}
                />

                {/* Crosshair vertical line if hovered */}
                {isHovered && (
                  <line
                    x1={xCenter}
                    y1={padding.top}
                    x2={xCenter}
                    y2={height - padding.bottom}
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
              </g>
            );
          })}

          {/* Current Market Price horizontal line */}
          {currentClose !== undefined && (
            <g>
              <line
                x1={padding.left}
                y1={getY(currentClose)}
                x2={width - padding.right}
                y2={getY(currentClose)}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <rect
                x={width - padding.right + 2}
                y={getY(currentClose) - 8}
                width={padding.right - 4}
                height={16}
                fill="#0284c7"
                rx="2"
              />
              <text
                x={width - padding.right + 6}
                y={getY(currentClose) + 3.5}
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              >
                {currentClose.toFixed(digits)}
              </text>
            </g>
          )}

          {/* Real-Time Live EMA 2 Price Axis Tag */}
          {activeEma2 !== undefined && (
            <g>
              <line
                x1={width - padding.right - 10}
                y1={getY(activeEma2)}
                x2={width - padding.right}
                y2={getY(activeEma2)}
                stroke="#22d3ee"
                strokeWidth="1"
              />
              <rect
                x={width - padding.right + 2}
                y={getY(activeEma2) - 6.5}
                width={padding.right - 4}
                height={13}
                fill="#083344"
                stroke="#22d3ee"
                strokeWidth="0.8"
                rx="2"
              />
              <text
                x={width - padding.right + 5}
                y={getY(activeEma2) + 3}
                fill="#22d3ee"
                fontSize="8"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              >
                E2 {activeEma2.toFixed(digits)}
              </text>
            </g>
          )}

          {/* Real-Time Live EMA 5 Price Axis Tag */}
          {activeEma5 !== undefined && (
            <g>
              <line
                x1={width - padding.right - 10}
                y1={getY(activeEma5)}
                x2={width - padding.right}
                y2={getY(activeEma5)}
                stroke="#f59e0b"
                strokeWidth="1"
              />
              <rect
                x={width - padding.right + 2}
                y={getY(activeEma5) - 6.5}
                width={padding.right - 4}
                height={13}
                fill="#451a03"
                stroke="#f59e0b"
                strokeWidth="0.8"
                rx="2"
              />
              <text
                x={width - padding.right + 5}
                y={getY(activeEma5) + 3}
                fill="#fbbf24"
                fontSize="8"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              >
                E5 {activeEma5.toFixed(digits)}
              </text>
            </g>
          )}

          {/* Real-Time Live Filter EMA Price Axis Tag */}
          {activeFilter !== undefined && (
            <g>
              <line
                x1={width - padding.right - 10}
                y1={getY(activeFilter)}
                x2={width - padding.right}
                y2={getY(activeFilter)}
                stroke="#a855f7"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <rect
                x={width - padding.right + 2}
                y={getY(activeFilter) - 6.5}
                width={padding.right - 4}
                height={13}
                fill="#3b0764"
                stroke="#a855f7"
                strokeWidth="0.8"
                rx="2"
              />
              <text
                x={width - padding.right + 5}
                y={getY(activeFilter) + 3}
                fill="#d8b4fe"
                fontSize="8"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              >
                {filterInfo.name.replace('EMA ', 'E')} {activeFilter.toFixed(digits)}
              </text>
            </g>
          )}

          {/* X Axis Time Labels in bright, readily readable white */}
          {displayCandles.map((candle, idx) => {
            if (idx % Math.ceil(displayCandles.length / 6) === 0) {
              const x = padding.left + idx * candleWidth + candleWidth / 2;
              return (
                <text
                  key={`time-${idx}`}
                  x={x}
                  y={height - padding.bottom + 16}
                  fill="#ffffff"
                  fontSize="9.5"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {candle.timeFormatted}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Dynamic Support & Resistance banner in readily readable white */}
        <div className="absolute top-2 left-2 pointer-events-none bg-[#09101b]/95 border border-slate-700 rounded px-2.5 py-1 text-[11px] font-mono-numbers text-white font-medium shadow-md">
          <span className="text-purple-300 font-bold">{filterInfo.name}</span>: <span className="text-white">{filterInfo.role}</span> · <span className="text-white">Distance: </span><span className="text-white font-bold">{((displayCandles[displayCandles.length - 1]?.close - (filterEma[filterEma.length - 1] || 0)) / pipSize).toFixed(1)} pips</span>
        </div>
      </div>
    </div>
  );
};
