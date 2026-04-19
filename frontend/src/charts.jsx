import React from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

const Charts = ({ workload, aiData }) => {
  // ── Department avg hours from real aiData ──────────────────────────────────
  const deptMap = {};
  aiData.forEach((e) => {
    if (!deptMap[e.department]) deptMap[e.department] = [];
    deptMap[e.department].push(e.hours_worked);
  });
  const deptLabels = Object.keys(deptMap);
  const deptAvgHours = deptLabels.map((d) => {
    const arr = deptMap[d];
    return parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1));
  });
  const deptColors = deptAvgHours.map((h) =>
    h >= 10 ? "#ef4444" : h >= 8 ? "#eab308" : "#22c55e",
  );

  // ── Utilization counts from real aiData ────────────────────────────────────
  const overloaded = aiData.filter((e) => e.status === "Overloaded").length;
  const normal = aiData.filter((e) => e.status === "Normal").length;
  const underutilized = aiData.filter(
    (e) => e.status === "Underutilized",
  ).length;

  // ── Workload trend line ────────────────────────────────────────────────────
  const lineData = {
    labels: workload.map((w) => w.date),
    datasets: [
      {
        label: "Workload Demand",
        data: workload.map((w) => w.demand),
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.08)",
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#6366f1",
        fill: true,
      },
    ],
  };

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "#64748b",
          font: { size: 9 },
          maxTicksLimit: 8,
          maxRotation: 45,
        },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#64748b", font: { size: 10 } },
      },
    },
  };

  // ── Dept horizontal bar ────────────────────────────────────────────────────
  const deptBarData = {
    labels: deptLabels,
    datasets: [
      {
        label: "Avg hours/day",
        data: deptAvgHours,
        backgroundColor: deptColors,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const deptBarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.x.toFixed(1)} hrs/day`,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 13,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: { color: "#64748b", font: { size: 10 } },
      },
      y: {
        grid: { display: false },
        ticks: { color: "#94a3b8", font: { size: 10 } },
      },
    },
  };

  // ── Pie ────────────────────────────────────────────────────────────────────
  const pieData = {
    labels: ["Overloaded", "Normal", "Underutilized"],
    datasets: [
      {
        data: [overloaded, normal, underutilized],
        backgroundColor: ["#ef4444", "#22c55e", "#eab308"],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const pieOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const total = aiData.length || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Workload trend */}
      <div className="bg-slate-800 p-4 rounded-xl">
        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
          Workload Demand Trend
        </p>
        <p className="text-xs text-slate-500 mb-3">
          Last {workload.length} days
        </p>
        <div style={{ height: 180 }}>
          <Line data={lineData} options={lineOpts} />
        </div>
      </div>

      {/* Dept avg hours */}
      <div className="bg-slate-800 p-4 rounded-xl">
        <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">
          Avg Hours by Department
        </p>
        <div className="flex gap-3 mb-3">
          {[
            { label: "High", color: "bg-red-500" },
            { label: "Medium", color: "bg-yellow-500" },
            { label: "Normal", color: "bg-green-500" },
          ].map((l) => (
            <span
              key={l.label}
              className="flex items-center gap-1 text-xs text-slate-400"
            >
              <span className={`w-2 h-2 rounded-sm ${l.color}`} />
              {l.label}
            </span>
          ))}
        </div>
        <div style={{ height: 180 }}>
          <Bar data={deptBarData} options={deptBarOpts} />
        </div>
      </div>

      {/* Utilization pie + legend */}
      <div className="bg-slate-800 p-4 rounded-xl md:col-span-2">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
          Workforce Utilization
        </p>
        <div className="flex items-center gap-8 flex-wrap">
          {/* Pie */}
          <div style={{ height: 160, width: 160, flexShrink: 0 }}>
            <Pie data={pieData} options={pieOpts} />
          </div>

          {/* Legend bars */}
          <div className="flex flex-col gap-4 flex-1 min-w-48">
            {[
              {
                label: "Overloaded",
                count: overloaded,
                bar: "bg-red-500",
                text: "text-red-400",
                desc: "Exceeds dept. baseline by >1.5h",
              },
              {
                label: "Normal",
                count: normal,
                bar: "bg-green-500",
                text: "text-green-400",
                desc: "Within healthy range",
              },
              {
                label: "Underutilized",
                count: underutilized,
                bar: "bg-yellow-500",
                text: "text-yellow-400",
                desc: "Below dept. baseline by >2.5h",
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${s.bar} flex-shrink-0`}
                />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className={`text-xs font-medium ${s.text}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {((s.count / total) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${s.bar}`}
                      style={{ width: `${(s.count / total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
                <span className="text-lg font-bold text-white w-8 text-right">
                  {s.count}
                </span>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="flex flex-col gap-3 min-w-36">
            {[
              { label: "Total tracked", value: aiData.length },
              { label: "Departments", value: deptLabels.length },
              {
                label: "Avg hours/day",
                value: aiData.length
                  ? (
                      aiData.reduce((s, e) => s + e.hours_worked, 0) /
                      aiData.length
                    ).toFixed(1) + "h"
                  : "-",
              },
              {
                label: "Avg tasks/day",
                value: aiData.length
                  ? (
                      aiData.reduce((s, e) => s + e.tasks_completed, 0) /
                      aiData.length
                    ).toFixed(1)
                  : "-",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-slate-700/50 rounded-lg px-3 py-2"
              >
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className="text-sm font-bold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
