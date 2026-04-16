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
);

const Charts = ({ workload, employees, aiData }) => {
  const overloaded = aiData.filter((e) => e.status === "Overloaded").length;
  const normal = aiData.filter((e) => e.status === "Normal").length;
  const underutilized = aiData.filter(
    (e) => e.status === "Underutilized",
  ).length;

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
        fill: true,
      },
    ],
  };

  const deptBarData = {
    labels: deptLabels,
    datasets: [
      {
        label: "Avg Hours/Day",
        data: deptAvgHours,
        backgroundColor: deptColors,
        borderRadius: 6,
      },
    ],
  };

  const pieData = {
    labels: ["Overloaded", "Normal", "Underutilized"],
    datasets: [
      {
        data: [overloaded, normal, underutilized],
        backgroundColor: ["#ef4444", "#22c55e", "#eab308"],
        borderWidth: 0,
      },
    ],
  };

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94a3b8", font: { size: 10 } },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94a3b8" },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-800 p-4 rounded-xl">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
          Workload Demand Trend
        </p>
        <div className="h-48">
          <Line data={lineData} options={chartOpts} />
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
          Avg Hours by Department
        </p>
        <div className="h-48">
          <Bar
            data={deptBarData}
            options={{
              ...chartOpts,
              indexAxis: "y",
              scales: {
                x: { ...chartOpts.scales.x, min: 0, max: 13 },
                y: {
                  grid: { display: false },
                  ticks: { color: "#94a3b8", font: { size: 10 } },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-xl md:col-span-2">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
          Workforce Utilization
        </p>
        <div className="flex items-center gap-8">
          <div className="h-48 w-48 flex-shrink-0">
            <Pie
              data={pieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="flex flex-col gap-3 flex-1">
            {[
              {
                label: "Overloaded",
                count: overloaded,
                color: "bg-red-500",
                text: "text-red-400",
                desc: "Working beyond dept. baseline",
              },
              {
                label: "Normal",
                count: normal,
                color: "bg-green-500",
                text: "text-green-400",
                desc: "Within healthy range",
              },
              {
                label: "Underutilized",
                count: underutilized,
                color: "bg-yellow-500",
                text: "text-yellow-400",
                desc: "Below dept. baseline",
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${s.color} flex-shrink-0`}
                />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className={`text-xs font-medium ${s.text}`}>
                      {s.label}
                    </span>
                    <span className="text-xs text-slate-400">
                      {count(aiData) > 0
                        ? ((s.count / aiData.length) * 100).toFixed(0)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${s.color}`}
                      style={{
                        width:
                          aiData.length > 0
                            ? `${(s.count / aiData.length) * 100}%`
                            : "0%",
                      }}
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
        </div>
      </div>
    </div>
  );
};

// helper used in Charts
function count(arr) {
  return arr.length;
}

export default Charts;
