import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, addDays } from "date-fns";
import { Calendar, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import Charts from "./charts";

const API_BASE = "http://127.0.0.1:5000/api";

function App() {
  const [employees, setEmployees] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [aiData, setAiData] = useState([]); // ✅ FIXED

  const [selectedDate, setSelectedDate] = useState(
    format(addDays(new Date(), 1), "yyyy-MM-dd"),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [explanationMap, setExplanationMap] = useState({});
  const [explainingId, setExplainingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const empRes = await axios.get(`${API_BASE}/employees`);
      setEmployees(empRes.data);

      const workRes = await axios.get(`${API_BASE}/workload`);
      setWorkload(workRes.data);

      const aiRes = await axios.get(`${API_BASE}/ai-insights`);
      setAiData(aiRes.data);
    } catch (_err) {
      console.error(_err);
      setError("Failed...");
    }
  };

  const generateSchedule = async () => {
    setLoading(true);
    setError("");
    setSchedule(null);
    setExplanationMap({});
    try {
      const res = await axios.get(`${API_BASE}/schedule?date=${selectedDate}`);
      setSchedule(res.data);
    } catch (_err) {
      console.error(_err);
      setError("Failed...");
    } finally {
      setLoading(false);
    }
  };

  const getExplanation = async (employee) => {
    if (explanationMap[employee.id]) return;

    setExplainingId(employee.id);
    try {
      const res = await axios.post(`${API_BASE}/explain`, {
        name: employee.name,
        shift: employee.shift,
        skill: employee.skill,
      });
      setExplanationMap((prev) => ({
        ...prev,
        [employee.id]: res.data.explanation,
      }));
    } catch {
      setExplanationMap((prev) => ({
        ...prev,
        [employee.id]: "Error generating explanation.",
      }));
    } finally {
      setExplainingId(null);
    }
  };

  // ✅ REAL AI STATS
  const overloaded = aiData.filter((e) => e.status === "Overloaded").length;
  const normal = aiData.filter((e) => e.status === "Normal").length;
  const underutilized = aiData.filter(
    (e) => e.status === "Underutilized",
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 md:p-10">
      {/* HEADER */}
      <header className="max-w-7xl mx-auto mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text">
          AI Workforce Planning
        </h1>
      </header>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-800 p-5 rounded-xl">
            <p className="text-sm text-slate-400">Total Staff</p>
            <h2 className="text-2xl font-bold">{employees.length}</h2>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl">
            <p className="text-sm text-slate-400">Data Points</p>
            <h2 className="text-2xl font-bold">{workload.length}</h2>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl">
            <p className="text-sm text-slate-400">Predicted Demand</p>
            <h2 className="text-2xl font-bold">
              {schedule ? schedule.predicted_demand : "-"}
            </h2>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl">
            <p className="text-sm text-slate-400">Overloaded</p>
            <h2 className="text-red-400 font-bold">{overloaded}</h2>
          </div>
        </div>

        {/* LEFT + CHART */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="bg-slate-800 p-6 rounded-xl space-y-4">
            {/* REAL STATS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-500/10 p-3 rounded text-center">
                <p className="text-xs text-red-400">Overloaded</p>
                <p className="font-bold">{overloaded}</p>
              </div>

              <div className="bg-green-500/10 p-3 rounded text-center">
                <p className="text-xs text-green-400">Normal</p>
                <p className="font-bold">{normal}</p>
              </div>

              <div className="bg-yellow-500/10 p-3 rounded text-center">
                <p className="text-xs text-yellow-400">Underutilized</p>
                <p className="font-bold">{underutilized}</p>
              </div>
            </div>

            {/* AI TIP */}
            <div className="bg-slate-700 p-3 rounded text-sm">
              <p className="text-indigo-400">🧠 AI Insight</p>
              <p>{overloaded} employees need workload balancing</p>
            </div>

            {/* CONTROLS */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2 bg-slate-700 rounded"
            />

            <button
              onClick={generateSchedule}
              className="w-full bg-indigo-600 py-2 rounded"
            >
              {loading ? "Generating..." : "Generate Schedule"}
            </button>

            {error && <p className="text-red-400">{error}</p>}
          </div>

          {/* CHARTS */}
          <div className="lg:col-span-2">
            <Charts workload={workload} employees={employees} />
          </div>
        </div>

        {/* TABLE */}
        {schedule && (
          <div className="bg-slate-800 rounded-xl shadow overflow-hidden mt-6">
            {/* HEADER */}
            <div className="p-6 flex justify-between items-center border-b border-slate-700">
              <div>
                <h2 className="text-lg font-bold">Generated Schedule</h2>
                <p className="text-slate-400 text-sm">
                  {format(new Date(schedule.date), "PPPP")}
                </p>
              </div>

              <div className="text-indigo-400 font-bold">
                {schedule.predicted_demand} Employees
              </div>
            </div>

            {/* TABLE */}
            <table className="w-full text-sm">
              <thead className="bg-slate-700 text-slate-300">
                <tr>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Department</th>
                  <th className="p-3 text-left">Shift</th>
                  <th className="p-3 text-left">AI</th>
                </tr>
              </thead>

              <tbody>
                {schedule.schedule.map((emp) => (
                  <tr
                    key={emp.id}
                    className="border-t border-slate-700 hover:bg-slate-700/50 transition"
                  >
                    {/* NAME */}
                    <td className="p-3 font-medium">{emp.name}</td>

                    {/* SKILL */}
                    <td className="p-3 text-slate-300">{emp.skill}</td>

                    {/* SHIFT */}
                    <td className="p-3">
                      <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-xs">
                        {emp.shift}
                      </span>
                    </td>

                    {/* AI BUTTON */}
                    <td className="p-3">
                      {explanationMap[emp.id] ? (
                        <span className="text-slate-300 text-xs">
                          {explanationMap[emp.id]}
                        </span>
                      ) : (
                        <button
                          onClick={() => getExplanation(emp)}
                          disabled={explainingId === emp.id}
                          className="text-indigo-400 flex items-center text-xs"
                        >
                          {explainingId === emp.id ? (
                            <>
                              <Loader2
                                className="animate-spin mr-1"
                                size={14}
                              />
                              Thinking...
                            </>
                          ) : (
                            <>
                              <MessageSquare size={14} className="mr-1" />
                              Explain
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
