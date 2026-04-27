'use client';
import { useMemo, useState } from 'react';
import Surface from '../ui/Surface';
import { TrendingUp, TrendingDown, Minus, Calendar, BarChart3 } from 'lucide-react';

export default function ProgressChart({ data }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Process chart data
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return generateEmptyChart();
    }

    return processChartData(data);
  }, [data]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!chartData.points || chartData.points.length === 0) {
      return { total: 0, average: 0, trend: 0 };
    }

    const values = chartData.points.map(p => p.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = (total / values.length).toFixed(1);

    // Calculate trend (compare last 2 weeks vs first 2 weeks)
    const recentAvg = (values[values.length - 1] + values[values.length - 2]) / 2;
    const oldAvg = (values[0] + values[1]) / 2;
    const trend = oldAvg > 0 ? (((recentAvg - oldAvg) / oldAvg) * 100).toFixed(0) : 0;

    return { total, average, trend: Number(trend) };
  }, [chartData]);

  return (
    <div className="relative group p-1 rounded-[4rem] bg-gradient-to-br from-[var(--card-border)] via-transparent to-[var(--card-border)] shadow-2xl">
      <Surface className="p-10 md:p-14 rounded-[3.8rem] bg-[var(--card-bg)]/60 backdrop-blur-3xl border border-[var(--card-border)] overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Header Logic Integrated */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-5 mb-4">
              <div className="w-14 h-14 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/20 shadow-sm">
                <BarChart3 size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[var(--site-text)] tracking-tighter leading-tight">
                Velocity <span className="text-gradient-elite">Analysis</span>
              </h2>
            </div>
            <p className="text-sm font-bold text-[var(--site-text-muted)] opacity-60 tracking-wide max-w-xl">
              Visualizing the scalar magnitude of knowledge acquisition over the current operational timeline.
            </p>
          </div>

          <div className="flex items-center gap-6 px-8 py-5 bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] rounded-[2rem] backdrop-blur-sm">
            <div className="text-center">
              <div className="text-2xl font-black text-blue-600">
                {stats.average}
              </div>
              <div className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                Wk Avg
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--card-border)]" />
            <div className={`text-center ${stats.trend > 0 ? 'text-emerald-500' : stats.trend < 0 ? 'text-red-500' : 'text-neutral-500'
              }`}>
              <div className="text-2xl font-black flex items-center justify-center gap-1">
                {stats.trend > 0 ? <TrendingUp size={18} /> : stats.trend < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
                {Math.abs(stats.trend)}%
              </div>
              <div className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                Trend Flux
              </div>
            </div>
          </div>
        </div>

        {/* Chart Visualization */}
        <div className="relative z-10 mt-10">
          <svg
            viewBox={`0 0 ${chartData.width} ${chartData.height}`}
            className="w-full h-auto overflow-visible"
            style={{ maxHeight: '350px' }}
          >
            {/* Grid lines - Elite Style */}
            <g className="grid-lines">
              {[0, 1, 2, 3, 4].map((i) => {
                const y = chartData.height - (i * chartData.height / 4);
                return (
                  <g key={i}>
                    <line
                      x1="0"
                      y1={y}
                      x2={chartData.width}
                      y2={y}
                      stroke="currentColor"
                      className="text-[var(--site-text)] opacity-[0.03]"
                      strokeWidth="1"
                    />
                    <text
                      x="-15"
                      y={y + 4}
                      className="text-[10px] font-black fill-[var(--site-text-muted)] opacity-40 uppercase tracking-widest"
                      textAnchor="end"
                    >
                      {Math.round(chartData.maxValue * i / 4)}
                    </text>
                  </g>
                );
              })}
            </g>

            <defs>
              <linearGradient id="chartGradientElite" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={chartData.areaPath}
              fill="url(#chartGradientElite)"
              className="animate-in fade-in duration-1000"
            />

            {/* Line - Premium Glow */}
            <path
              d={chartData.linePath}
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw-line"
              style={{
                strokeDasharray: chartData.pathLength,
                strokeDashoffset: chartData.pathLength,
                animation: 'drawLine 2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                filter: 'drop-shadow(0 4px 12px rgba(99, 102, 241, 0.4))',
              }}
            />

            {/* Points - Tactical Nodes */}
            {chartData.points.map((point, i) => (
              <g key={i} className="group/node">
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="20"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                <circle
                  cx={point.x}
                  cy={point.y}
                  r={hoveredPoint?.week === point.week ? '8' : '5'}
                  fill="var(--card-bg)"
                  stroke="var(--accent-primary)"
                  strokeWidth="3"
                  className="transition-all duration-300 pointer-events-none"
                />

                {hoveredPoint?.week === point.week && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="12"
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="2"
                    className="animate-ping opacity-30"
                  />
                )}
              </g>
            ))}

            {/* X-axis labels */}
            {chartData.points.map((point, i) => (
              i % 2 === 0 && (
                <text
                  key={i}
                  x={point.x}
                  y={chartData.height + 25}
                  className="text-[9px] font-black fill-[var(--site-text-muted)] opacity-40 uppercase tracking-widest"
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              )
            ))}
          </svg>

          {/* Tooltip - Elite Chart Version */}
          {hoveredPoint && (
            <div
              className="absolute z-[100] px-5 py-4 bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--card-border)] text-[var(--site-text)] rounded-[1.5rem] shadow-2xl pointer-events-none animate-in zoom-in-95 slide-in-from-bottom-2 duration-300"
              style={{
                left: `${(hoveredPoint.x / chartData.width) * 100}%`,
                top: `${(hoveredPoint.y / chartData.height) * 100}%`,
                transform: 'translate(-50%, -120%)',
              }}
            >
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1.5 opacity-60">
                {hoveredPoint.week}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tighter">{hoveredPoint.value}</span>
                <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Course Units</span>
              </div>
              <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
                <div className="border-[6px] border-transparent border-t-[var(--card-border)]" />
              </div>
            </div>
          )}
        </div>

        {/* Legend / Footer info */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-12 pt-10 border-t border-[var(--card-border)] gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              <span className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60">
                Completion Flux
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--site-text-muted)] opacity-40" />
              <span className="text-[10px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-60">
                Weekly Resolution
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-2.5 bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] rounded-full backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-black text-[var(--site-text)] uppercase tracking-[0.2em]">Trajectory Analysis Verified</span>
          </div>
        </div>
      </Surface>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-draw-line {
          animation: drawLine 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
}

// Helper functions
function processChartData(data) {
  const width = 1000;
  const height = 300;
  const padding = 50;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Get max value for scaling
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const yScale = chartHeight / maxValue;
  const xStep = chartWidth / (data.length - 1);

  // Generate points
  const points = data.map((item, i) => ({
    x: padding + i * xStep,
    y: height - padding - (item.value * yScale),
    value: item.value,
    week: item.week || `Week ${i + 1}`,
    label: item.label || `W${i + 1}`,
    date: item.date || '',
  }));

  // Generate SVG paths
  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  // Calculate path length for animation
  const pathLength = points.reduce((sum, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    return sum + Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
  }, 0);

  return {
    width,
    height,
    points,
    linePath,
    areaPath,
    pathLength,
    maxValue,
  };
}

function generateEmptyChart() {
  const emptyData = Array.from({ length: 12 }, (_, i) => ({
    value: 0,
    week: `Week ${i + 1}`,
    label: `W${i + 1}`,
    date: '',
  }));

  return processChartData(emptyData);
}
