import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SEASONAL_DATA = {
  Healthcare: [85, 78, 92, 88, 75, 70, 72, 80, 88, 95, 98, 96],
  Retail: [60, 58, 65, 70, 75, 80, 78, 82, 85, 90, 98, 100],
  IT: [90, 92, 88, 85, 87, 89, 91, 93, 88, 85, 82, 80],
  Manufacturing: [75, 78, 80, 85, 88, 90, 85, 82, 80, 78, 75, 72],
};

const INDICATORS = [
  {
    key: "holiday",
    label: "Holiday Season",
    months: [10, 11],
    color: "bg-red-500/20 text-red-400",
  },
  {
    key: "flu",
    label: "Flu Season",
    months: [0, 1, 10, 11],
    color: "bg-yellow-500/20 text-yellow-400",
  },
  {
    key: "summer",
    label: "Summer Peak",
    months: [5, 6, 7],
    color: "bg-amber-500/20 text-amber-400",
  },
  {
    key: "yearend",
    label: "Year-End Surge",
    months: [11],
    color: "bg-purple-500/20 text-purple-400",
  },
];

const COLORS = {
  Healthcare: { border: "#6366f1", bg: "rgba(99,102,241,0.08)" },
  Retail: { border: "#22c55e", bg: "rgba(34,197,94,0.08)" },
  IT: { border: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
  Manufacturing: { border: "#ef4444", bg: "rgba(239,68,68,0.08)" },
};

export default function SeasonalChart({ workload }) {
  const [selectedIndustry, setSelectedIndustry] = useState("Healthcare");
  const [showIndicators, setShowIndicators] = useState(true);

  const currentMonth = new Date().getMonth();
  const data = SEASONAL_DATA[selectedIndustry];
  const peak = Math.max(...data);
  const trough = Math.min(...data);
  const peakMonth = MONTHS[data.indexOf(peak)];
  const troughMonth = MONTHS[data.indexOf(trough)];

  const chartData = {
    labels: MONTHS,
    datasets: [
      {
        label: `${selectedIndustry} Demand`,
        data: data,
        borderColor: COLORS[selectedIndustry].border,
        backgroundColor: COLORS[selectedIndustry].bg,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: MONTHS.map((_, i) =>
          i === currentMonth ? "#ffffff" : COLORS[selectedIndustry].border,
        ),
        pointBorderWidth: MONTHS.map((_, i) => (i === currentMonth ? 2 : 1)),
        // eslint-disable-next-line no-dupe-keys
        pointRadius: MONTHS.map((_, i) => (i === currentMonth ? 7 : 4)),
      },
      {
        label: "Your Workload Data",
        data: (() => {
          const monthly = new Array(12).fill(null);
          if (workload && workload.length) {
            const grouped = {};
            workload.forEach((w) => {
              const m = new Date(w.date).getMonth();
              if (!grouped[m]) grouped[m] = [];
              grouped[m].push(w.demand);
            });
            Object.entries(grouped).forEach(([m, vals]) => {
              monthly[parseInt(m)] = Math.round(
                (vals.reduce((a, b) => a + b, 0) / vals.length) * 6,
              );
            });
          }
          return monthly;
        })(),
        borderColor: "#94a3b8",
        backgroundColor: "transparent",
        borderDash: [4, 4],
        tension: 0.3,
        fill: false,
        pointRadius: 3,
      },
    ],
  };

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.y} staff needed`,
          afterLabel: (ctx) => {
            const m = ctx.dataIndex;
            const active = INDICATORS.filter((ind) => ind.months.includes(m));
            return active.length
              ? `📌 ${active.map((i) => i.label).join(", ")}`
              : "";
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
      y: {
        min: 40,
        max: 110,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#64748b",
          font: { size: 11 },
          callback: (v) => `${v}%`,
        },
      },
    },
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 space-y-4">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-white">
            Seasonal Demand Variation
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Industry staffing patterns across 12 months
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {Object.keys(SEASONAL_DATA).map((ind) => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer
                ${
                  selectedIndustry === ind
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600"
                }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      {/* Peak / Trough stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-slate-400">Peak month</p>
          <p className="text-sm font-bold text-red-400">{peakMonth}</p>
          <p className="text-xs text-slate-500">{peak}% demand</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-slate-400">Lowest month</p>
          <p className="text-sm font-bold text-green-400">{troughMonth}</p>
          <p className="text-xs text-slate-500">{trough}% demand</p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-slate-400">Current month</p>
          <p className="text-sm font-bold text-indigo-400">
            {MONTHS[currentMonth]}
          </p>
          <p className="text-xs text-slate-500">{data[currentMonth]}% demand</p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        <Line data={chartData} options={opts} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span
            className="w-6 h-0.5 rounded"
            style={{
              background: COLORS[selectedIndustry].border,
              display: "inline-block",
            }}
          />
          {selectedIndustry} industry trend
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-400">
          <span
            className="w-6 h-0.5 rounded bg-slate-400 inline-block"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg,#94a3b8 0,#94a3b8 4px,transparent 4px,transparent 8px)",
            }}
          />
          Your workload data
        </span>
        <span className="flex items-center gap-1.5 text-xs text-white">
          <span
            className="w-3 h-3 rounded-full bg-white inline-block border-2"
            style={{ borderColor: COLORS[selectedIndustry].border }}
          />
          Current month
        </span>
      </div>

      {/* Business indicators */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            Business Indicators
          </p>
          <button
            onClick={() => setShowIndicators((v) => !v)}
            className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
          >
            {showIndicators ? "Hide" : "Show"}
          </button>
        </div>
        {showIndicators && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {INDICATORS.map((ind) => {
              const isActive = ind.months.includes(currentMonth);
              return (
                <div
                  key={ind.key}
                  className={`rounded-lg p-2 border transition ${ind.color}
                    ${isActive ? "border-current opacity-100" : "border-slate-700 opacity-60"}`}
                >
                  <p className="text-xs font-medium">{ind.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">
                    {ind.months.map((m) => MONTHS[m]).join(", ")}
                  </p>
                  {isActive && (
                    <p className="text-xs font-bold mt-1">● Active now</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
