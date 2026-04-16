import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { Calendar, Users, Activity, MessageSquare, Loader2, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Overloaded: "bg-red-500/20 text-red-400 border border-red-500/30",
    Normal: "bg-green-500/20 text-green-400 border border-green-500/30",
    Underutilized:
      "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-slate-600 text-slate-300"}`}
    >
      {status}
    </span>
  );
}

// ── Shift badge ───────────────────────────────────────────────────────────────
function ShiftBadge({ shift }) {
  const map = {
    Morning: "bg-amber-500/20 text-amber-300",
    Evening: "bg-indigo-500/20 text-indigo-300",
    Night: "bg-purple-500/20 text-purple-300",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${map[shift] ?? "bg-slate-600 text-slate-300"}`}
    >
      {shift}
    </span>
  );
}

// ── Explain cell ──────────────────────────────────────────────────────────────
function ExplainCell({ emp }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/explain-assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee: emp.name,
          department: emp.skill,
          role: emp.role ?? "",
          shift: emp.shift,
          hours_worked: emp.hours_worked ?? 0,
          tasks_completed: emp.tasks_completed ?? 0,
          status: emp.status ?? "Normal",
          workload_score: emp.workload_score ?? 0,
        }),
      });
      if (!res.ok) throw new Error(`Server ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setExplanation(data.explanation);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (explanation) {
    return (
      <p className="text-slate-300 text-xs max-w-sm leading-relaxed">
        {explanation}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={fetchExplanation}
        disabled={loading}
        className="text-indigo-400 flex items-center text-xs hover:text-indigo-300 disabled:opacity-50 w-fit"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-1" size={12} />
            Thinking...
          </>
        ) : (
          <>
            <MessageSquare size={12} className="mr-1" />
            Explain
          </>
        )}
      </button>
      {error && (
        <span className="text-red-400 text-xs flex items-center gap-1">
          <AlertCircle size={10} />
          {error}
        </span>
      )}
    </div>
  );
}

// ── Department analytics panel ────────────────────────────────────────────────
function DeptAnalytics({ aiData }) {
  if (!aiData.length) return null;

  const deptMap = {};
  aiData.forEach((e) => {
    if (!deptMap[e.department]) deptMap[e.department] = [];
    deptMap[e.department].push(e);
  });

  const depts = Object.entries(deptMap)
    .map(([dept, emps]) => {
      const avgHours =
        emps.reduce((s, e) => s + e.hours_worked, 0) / emps.length;
      const overloaded = emps.filter((e) => e.status === "Overloaded").length;
      const under = emps.filter((e) => e.status === "Underutilized").length;
      const riskScore = Math.min(
        100,
        Math.round((overloaded / emps.length) * 60 + (avgHours / 13) * 40),
      );
      return {
        dept,
        count: emps.length,
        avgHours: avgHours.toFixed(1),
        overloaded,
        under,
        riskScore,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const riskColor = (r) =>
    r >= 70 ? "text-red-400" : r >= 40 ? "text-yellow-400" : "text-green-400";
  const barColor = (r) =>
    r >= 70 ? "bg-red-500" : r >= 40 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart2 size={16} className="text-indigo-400" />
        Department Burnout Risk
      </p>
      <div className="space-y-3">
        {depts.map((d) => (
          <div key={d.dept} className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-medium text-white">{d.dept}</p>
                <p className="text-xs text-slate-400">
                  {d.count} staff · {d.avgHours}h avg
                </p>
              </div>
              <span className={`text-xs font-bold ${riskColor(d.riskScore)}`}>
                {d.riskScore}/100
              </span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-1.5 mb-1">
              <div
                className={`h-1.5 rounded-full ${barColor(d.riskScore)} transition-all`}
                style={{ width: `${d.riskScore}%` }}
              />
            </div>
            <div className="flex gap-3 mt-1">
              {d.overloaded > 0 && (
                <span className="text-xs text-red-400">
                  {d.overloaded} overloaded
                </span>
              )}
              {d.under > 0 && (
                <span className="text-xs text-yellow-400">
                  {d.under} underutilized
                </span>
              )}
              {d.overloaded === 0 && d.under === 0 && (
                <span className="text-xs text-green-400">All normal</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fairness meter ────────────────────────────────────────────────────────────
function FairnessMeter({ aiData }) {
  if (!aiData.length) return null;
  const hours = aiData.map((e) => e.hours_worked);
  const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
  const stddev = Math.sqrt(
    hours.reduce((s, h) => s + (h - mean) ** 2, 0) / hours.length,
  );
  const score = Math.max(
    0,
    Math.min(100, Math.round(100 - (stddev / mean) * 100)),
  );
  const color =
    score >= 75
      ? "text-green-400"
      : score >= 50
        ? "text-yellow-400"
        : "text-red-400";
  const bar =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
  const label =
    score >= 75
      ? "Fair distribution"
      : score >= 50
        ? "Moderate variance"
        : "High imbalance";

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
        Scheduling Fairness
      </p>
      <div className="flex items-end gap-2 mb-2">
        <span className={`text-3xl font-bold ${color}`}>{score}</span>
        <span className="text-slate-400 text-sm mb-1">/100</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-slate-400">
        {label} · std dev {stddev.toFixed(1)}h
      </p>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [employees, setEmployees] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [schedule, setSchedule] = useState(null);

  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [explanationMap, setExplanationMap] = useState({});
  const [explainingId, setExplainingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [empRes, workRes, aiRes] = await Promise.all([
        axios.get(`${API_BASE}/employees`),
        axios.get(`${API_BASE}/workload`),
        axios.get(`${API_BASE}/ai-insights`),
      ]);
      setEmployees(empRes.data);
      setWorkload(workRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load initial data from backend.");
    }
  };

  const generateSchedule = async () => {
    setLoading(true);
    setError('');
    setSchedule(null);
    try {
      const res = await axios.get(`${API_BASE}/schedule?date=${selectedDate}`);
      setSchedule(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate schedule. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const getExplanation = async (employee) => {
    if (explanationMap[employee.id]) return; // Already have it

    setExplainingId(employee.id);
    try {
      const res = await axios.post(`${API_BASE}/explain`, {
        name: employee.name,
        shift: employee.shift,
        skill: employee.skill
      });
      setExplanationMap(prev => ({
        ...prev,
        [employee.id]: res.data.explanation
      }));
    } catch (err) {
      console.error(err);
      setExplanationMap(prev => ({
        ...prev,
        [employee.id]: "Error generating explanation."
      }));
    } finally {
      setExplainingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600">
          AI Workforce Planning
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Intelligent forecasting and automated scheduling for your entire team.
        </p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Controls & Stats */}
        <div className="space-y-6">

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center text-slate-800">
              <Calendar className="mr-2 text-indigo-500" size={20} />
              Schedule Generator
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <button
                onClick={generateSchedule}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all flex justify-center items-center shadow-md disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                {loading ? 'Generating...' : 'Generate New Schedule'}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start text-sm border border-red-100">
                <AlertCircle className="shrink-0 mr-2 mt-0.5" size={16} />
                <p>{error}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
              <div className="bg-blue-100 p-3 rounded-full mb-3">
                <Users className="text-blue-600" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{employees.length}</h3>
              <p className="text-sm text-slate-500 font-medium">Total Staff</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
              <div className="bg-emerald-100 p-3 rounded-full mb-3">
                <Activity className="text-emerald-600" size={24} />
              </div>
              <h3 className="text-3xl font-bold text-slate-800">{workload.length}</h3>
              <p className="text-sm text-slate-500 font-medium">Data Points</p>
            </div>
          </div>
        )}

        </div>

        {/* Right Column: Schedule Results */}
        <div className="lg:col-span-2 space-y-6">
          {schedule ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-linear-to-r from-indigo-50 to-blue-50 border-b border-slate-200 p-6 flex justify-between items-center sm:flex">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Generated Schedule</h2>
                  <p className="text-sm text-slate-500">{format(new Date(schedule.date), 'PPPP')}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 font-medium">Predicted Demand</div>
                  <div className="text-2xl font-bold tracking-tight text-indigo-700">{schedule.predicted_demand} Employees</div>
                </div>
              </div>

              <div className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                        <th className="p-4 px-6">Employee</th>
                        <th className="p-4 px-6">Skill</th>
                        <th className="p-4 px-6">Assigned Shift</th>
                        <th className="p-4 px-6">AI Explanation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {schedule.schedule.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="p-8 text-center text-slate-500">
                            No employees could be scheduled based on constraints.
                          </td>
                        </tr>
                      ) : (
                        schedule.schedule.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 px-6 font-medium text-slate-900">{emp.name}</td>
                            <td className="p-4 px-6">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {emp.skill}
                              </span>
                            </td>
                            <td className="p-4 px-6">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${emp.shift === 'Morning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  emp.shift === 'Evening' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                    'bg-slate-800 text-slate-200 border-slate-700'
                                }`}>
                                {emp.shift}
                              </span>
                            </td>
                            <td className="p-4 px-6">
                              {explanationMap[emp.id] ? (
                                <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-lg border border-slate-200">
                                  "{explanationMap[emp.id]}"
                                </p>
                              ) : (
                                <button
                                  onClick={() => getExplanation(emp)}
                                  disabled={explainingId === emp.id}
                                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center transition-colors bg-indigo-50 hover:bg-indigo-100 py-1.5 px-3 rounded-lg"
                                >
                                  {explainingId === emp.id ? (
                                    <><Loader2 className="animate-spin mr-1.5" size={14} /> Think...</>
                                  ) : (
                                    <><MessageSquare className="mr-1.5" size={14} /> Explain</>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center h-full min-h-100">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="text-slate-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Schedule Active</h3>
              <p className="text-slate-500 max-w-sm">
                Select a target date and generate a new workforce schedule to see assignments and AI explanations.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;