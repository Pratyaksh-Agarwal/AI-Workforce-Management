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

const Charts = ({ workload, employees }) => {
  // Line Chart (Workload Trend)
  const lineData = {
    labels: workload.map((w) => w.date),
    datasets: [
      {
        label: "Workload Demand",
        data: workload.map((w) => w.demand),
        borderColor: "#4f46e5",
        tension: 0.3,
      },
    ],
  };

  // Bar Chart (Employees)
  const barData = {
    labels: employees.map((e) => e.name),
    datasets: [
      {
        label: "Employees",
        data: employees.map(() => 1),
        backgroundColor: "#6366f1",
      },
    ],
  };

  // Pie Chart (Utilization - dummy logic)
  const overloaded =
    employees.length > 0 ? Math.floor(employees.length * 0.3) : 0;
  const normal = employees.length > 0 ? Math.floor(employees.length * 0.5) : 0;
  const underutilized = employees.length - overloaded - normal;

  const pieData = {
    labels: ["Overloaded", "Normal", "Underutilized"],
    datasets: [
      {
        data: [overloaded, normal, underutilized],
        backgroundColor: ["#ef4444", "#22c55e", "#eab308"],
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-2">Workload Trend</h3>
        <Line data={lineData} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-2">Employee Distribution</h3>
        <Bar data={barData} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow md:col-span-2">
        <h3 className="font-semibold mb-2">Utilization</h3>
        <div className="h-[250px] w-[200] flex justify-center">
          <Pie data={pieData} />
        </div>
      </div>
    </div>
  );
};

export default Charts;
