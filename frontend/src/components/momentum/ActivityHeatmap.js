'use client';
import { useMemo, useState } from 'react';
import Surface from '../ui/Surface';
import { Calendar, Info } from 'lucide-react';

export default function ActivityHeatmap({ data }) {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Generate heatmap data for last 52 weeks (364 days)
  const heatmapData = useMemo(() => {
    if (!data) return generateEmptyHeatmap();

    return generateHeatmapFromData(data);
  }, [data]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!heatmapData) return { total: 0, streak: 0, bestDay: 0 };

    const total = heatmapData.reduce((sum, week) =>
      sum + week.reduce((weekSum, day) => weekSum + (day?.count || 0), 0), 0
    );

    const allDays = heatmapData.flat().filter(d => d?.count > 0);
    const bestDay = Math.max(...allDays.map(d => d.count), 0);

    return { total, bestDay };
  }, [heatmapData]);

  const handleMouseEnter = (day, e) => {
    if (!day) return;
    setHoveredDay(day);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  return (
    <div className="relative group p-1 rounded-[4rem] bg-gradient-to-br from-[var(--card-border)] via-transparent to-[var(--card-border)] shadow-2xl">
      <Surface className="p-10 md:p-14 rounded-[3.8rem] bg-[var(--card-bg)]/60 backdrop-blur-3xl border border-[var(--card-border)] overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Header Logic Integrated */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-5 mb-4">
              <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20 shadow-sm">
                <Calendar size={28} strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-[var(--site-text)] tracking-tighter leading-tight">
                Neural <span className="text-gradient-elite">Chronicle</span>
              </h2>
            </div>
            <p className="text-sm font-bold text-[var(--site-text-muted)] opacity-60 tracking-wide max-w-xl">
              High-fidelity logs of learning persistence and cognitive engagement over the last operational cycle.
            </p>
          </div>

          <div className="flex items-center gap-6 px-8 py-5 bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] rounded-[2rem] backdrop-blur-sm">
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-600">
                {stats.total}
              </div>
              <div className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                Operations
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--card-border)]" />
            <div className="text-center">
              <div className="text-2xl font-black text-blue-600">
                {stats.bestDay}
              </div>
              <div className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                Peak Flux
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="relative z-10 overflow-x-auto pb-4 premium-scroll">
          <div className="inline-flex flex-col gap-2 min-w-max">
            {/* Month labels */}
            <div className="flex gap-1 mb-3 ml-8">
              {getMonthLabels(heatmapData).map((month, i) => (
                <div
                  key={i}
                  className="text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-40"
                  style={{ width: `${month.width * 14}px` }}
                >
                  {month.label}
                </div>
              ))}
            </div>

            {/* Weekday labels + Grid */}
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 justify-around py-1">
                {['M', 'W', 'F'].map((day) => (
                  <div
                    key={day}
                    className="text-[8px] font-black text-[var(--site-text-muted)] w-6 text-center opacity-30"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="flex gap-1">
                {heatmapData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => (
                      <HeatmapCell
                        key={`${weekIndex}-${dayIndex}`}
                        day={day}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col sm:flex-row items-center justify-between mt-10 pt-10 border-t border-[var(--card-border)] gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-[var(--site-text-muted)] uppercase tracking-widest opacity-40">
              Intensity Matrix
            </span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className={`w-3.5 h-3.5 rounded-md ${i === 0 ? 'bg-[var(--site-text)]/[0.05]' :
                  i === 1 ? 'bg-emerald-500/20' :
                    i === 2 ? 'bg-emerald-500/40' :
                      i === 3 ? 'bg-emerald-500/70' :
                        'bg-emerald-500'
                  }`} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 px-5 py-2.5 bg-[var(--site-text)]/[0.03] border border-[var(--card-border)] rounded-full backdrop-blur-sm">
            <Info size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black text-[var(--site-text)] uppercase tracking-[0.2em]">Neural Node Analysis Active</span>
          </div>
        </div>

        {/* Tooltip - Elite Version */}
        {hoveredDay && (
          <div
            className="fixed z-[100] px-4 py-3 bg-[var(--card-bg)]/90 backdrop-blur-xl border border-[var(--card-border)] text-[var(--site-text)] rounded-2xl shadow-2xl pointer-events-none transform -translate-x-1/2 -translate-y-full mb-4 animate-in zoom-in-95 fade-in duration-200"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">
              {formatDate(hoveredDay.date)}
            </p>
            <p className="text-xl font-black tracking-tighter">
              {hoveredDay.count} <span className="text-sm text-[var(--site-text-muted)]">Activities</span>
            </p>
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
              <div className="border-[6px] border-transparent border-t-[var(--card-border)]" />
            </div>
          </div>
        )}
      </Surface>
    </div>
  );
}

function HeatmapCell({ day, onMouseEnter, onMouseLeave }) {
  if (!day) {
    return <div className="w-3 h-3" />;
  }

  const intensity = getIntensity(day.count);
  const colors = {
    0: 'bg-[var(--site-text)]/[0.05]',
    1: 'bg-emerald-500/20',
    2: 'bg-emerald-500/40',
    3: 'bg-emerald-500/70',
    4: 'bg-emerald-500',
  };

  return (
    <div
      className={`w-3 h-3 rounded-sm ${colors[intensity]} hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 dark:hover:ring-offset-black transition-all cursor-pointer hover:scale-125 relative group/cell`}
      onMouseEnter={(e) => onMouseEnter(day, e)}
      onMouseLeave={onMouseLeave}
      title={`${day.count} activities`}
    />
  );
}

// Helper functions
function getIntensity(count) {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

function generateEmptyHeatmap() {
  const weeks = [];
  const today = new Date();

  for (let week = 0; week < 52; week++) {
    const days = [];
    for (let day = 0; day < 7; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - ((51 - week) * 7 + (6 - day)));
      days.push({
        date: date.toISOString().split('T')[0],
        count: 0,
      });
    }
    weeks.push(days);
  }

  return weeks;
}

function generateHeatmapFromData(activityData) {
  const weeks = generateEmptyHeatmap();

  // Merge actual activity data
  if (activityData && typeof activityData === 'object') {
    weeks.forEach((week) => {
      week.forEach((day) => {
        if (activityData[day.date]) {
          day.count = activityData[day.date];
        }
      });
    });
  }

  return weeks;
}

function getMonthLabels(heatmapData) {
  const months = [];
  let currentMonth = null;
  let weekCount = 0;

  heatmapData.forEach((week) => {
    const firstDay = week.find((d) => d);
    if (!firstDay) return;

    const date = new Date(firstDay.date);
    const month = date.getMonth();

    if (month !== currentMonth) {
      if (currentMonth !== null && weekCount > 0) {
        months.push({
          label: new Date(2024, currentMonth).toLocaleString('default', {
            month: 'short',
          }),
          width: weekCount,
        });
      }
      currentMonth = month;
      weekCount = 1;
    } else {
      weekCount++;
    }
  });

  // Add last month
  if (weekCount > 0 && currentMonth !== null) {
    months.push({
      label: new Date(2024, currentMonth).toLocaleString('default', {
        month: 'short',
      }),
      width: weekCount,
    });
  }

  return months;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('default', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
