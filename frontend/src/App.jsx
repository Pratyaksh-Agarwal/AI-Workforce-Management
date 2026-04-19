import React, { useState, useEffect } from "react";
import axios from "axios";
import { format, addDays } from "date-fns";
import {
  Loader2,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
  BarChart2,
  Settings,
  Shield,
  Star,
} from "lucide-react";
import Charts from "./charts";

const API_BASE = "http://127.0.0.1:5000/api";

const DEPT_LIST = [
  "Engineering",
  "Support",
  "Marketing",
  "Human Resources",
  "Research and Development",
  "Product Management",
  "Accounting",
  "Legal",
  "Business Development",
  "Services",
];

const SHIFT_PREFS = ["Morning", "Evening", "Night", "Any"];

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

  if (explanation)
    return (
      <p className="text-slate-300 text-xs max-w-sm leading-relaxed">
        {explanation}
      </p>
    );
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
                className={`h-1.5 rounded-full ${barColor(d.riskScore)}`}
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

// ── HR Constraint Panel ───────────────────────────────────────────────────────
function HRConstraints({ constraints, setConstraints }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Shield size={16} className="text-indigo-400" />
        HR Constraint Settings
      </p>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Max hours/day (labor law limit)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={6}
              max={14}
              step={0.5}
              value={constraints.maxHours}
              onChange={(e) =>
                setConstraints((c) => ({
                  ...c,
                  maxHours: parseFloat(e.target.value),
                }))
              }
              className="flex-1"
            />
            <span className="text-white text-sm font-medium w-10">
              {constraints.maxHours}h
            </span>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Min rest between shifts (hours)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={6}
              max={12}
              step={1}
              value={constraints.minRest}
              onChange={(e) =>
                setConstraints((c) => ({
                  ...c,
                  minRest: parseInt(e.target.value),
                }))
              }
              className="flex-1"
            />
            <span className="text-white text-sm font-medium w-10">
              {constraints.minRest}h
            </span>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Max staff per shift
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={50}
              step={1}
              value={constraints.maxPerShift}
              onChange={(e) =>
                setConstraints((c) => ({
                  ...c,
                  maxPerShift: parseInt(e.target.value),
                }))
              }
              className="flex-1"
            />
            <span className="text-white text-sm font-medium w-10">
              {constraints.maxPerShift}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">
            Enforce fairness balancing
          </label>
          <button
            onClick={() =>
              setConstraints((c) => ({
                ...c,
                enforceFairness: !c.enforceFairness,
              }))
            }
            className={`w-10 h-5 rounded-full transition-colors ${constraints.enforceFairness ? "bg-indigo-600" : "bg-slate-600"}`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${constraints.enforceFairness ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-slate-400">
            Respect shift preferences
          </label>
          <button
            onClick={() =>
              setConstraints((c) => ({
                ...c,
                respectPreferences: !c.respectPreferences,
              }))
            }
            className={`w-10 h-5 rounded-full transition-colors ${constraints.respectPreferences ? "bg-indigo-600" : "bg-slate-600"}`}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full transition-transform mx-0.5 ${constraints.respectPreferences ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 mt-2">
          <p className="text-xs text-slate-400">Active constraints summary</p>
          <p className="text-xs text-white mt-1">
            Max {constraints.maxHours}h/day · {constraints.minRest}h rest ·
            {constraints.enforceFairness ? " Fairness ON" : " Fairness OFF"} ·
            {constraints.respectPreferences ? " Prefs ON" : " Prefs OFF"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Employee Preference Panel ─────────────────────────────────────────────────
function EmployeePreferences({ preferences, setPreferences }) {
  const [name, setName] = useState("");
  const [dept, setDept] = useState(DEPT_LIST[0]);
  const [pref, setPref] = useState("Any");
  const [skills, setSkills] = useState("");

  const add = () => {
    if (!name.trim()) return;
    setPreferences((p) => [
      ...p,
      { name: name.trim(), dept, shiftPref: pref, skills: skills.trim() },
    ]);
    setName("");
    setSkills("");
  };

  const remove = (idx) => setPreferences((p) => p.filter((_, i) => i !== idx));

  return (
    <div className="bg-slate-800 rounded-xl p-6">
      <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Star size={16} className="text-indigo-400" />
        Employee Preferences
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Employee name"
          className="col-span-2 bg-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-400"
        />
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="bg-slate-700 rounded px-3 py-2 text-sm text-white"
        >
          {DEPT_LIST.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select
          value={pref}
          onChange={(e) => setPref(e.target.value)}
          className="bg-slate-700 rounded px-3 py-2 text-sm text-white"
        >
          {SHIFT_PREFS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="Skills (e.g. Python, SQL)"
          className="col-span-2 bg-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-400"
        />
      </div>
      <button
        onClick={add}
        className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded text-sm font-medium mb-4 transition"
      >
        Add Preference
      </button>

      {preferences.length === 0 && (
        <p className="text-xs text-slate-500 text-center">
          No preferences added yet
        </p>
      )}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {preferences.map((p, i) => (
          <div
            key={i}
            className="bg-slate-700/50 rounded-lg p-2 flex justify-between items-start"
          >
            <div>
              <p className="text-xs font-medium text-white">{p.name}</p>
              <p className="text-xs text-slate-400">
                {p.dept} · Prefers {p.shiftPref}
              </p>
              {p.skills && (
                <p className="text-xs text-indigo-300 mt-0.5">{p.skills}</p>
              )}
            </div>
            <button
              onClick={() => remove(i)}
              className="text-slate-500 hover:text-red-400 text-xs ml-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [employees, setEmployees] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [aiData, setAiData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    format(addDays(new Date(), 1), "yyyy-MM-dd"),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [preferences, setPreferences] = useState([]);
  const [constraints, setConstraints] = useState({
    maxHours: 10,
    minRest: 8,
    maxPerShift: 35,
    enforceFairness: true,
    respectPreferences: true,
  });

  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    try {
      const [empRes, workRes, aiRes, demandRes] = await Promise.all([
        axios.get(`${API_BASE}/employees`),
        axios.get(`${API_BASE}/workload`),
        axios.get(`${API_BASE}/ai-insights`),
        axios.get(`${API_BASE}/predicted-demand`), // ✅ new
      ]);
      setEmployees(empRes.data);
      setWorkload(workRes.data);
      setAiData(aiRes.data);
      // ✅ Pre-fill predicted demand so dashboard doesn't show "-"
      setSchedule(
        (prev) =>
          prev ?? {
            predicted_demand: demandRes.data.predicted_demand,
            schedule: [],
            date: null,
          },
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Is Flask running on port 5000?");
    }
  };

  const generateSchedule = async () => {
    setLoading(true);
    setError("");
    setSchedule(null);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        maxHours: constraints.maxHours,
        minRest: constraints.minRest,
        maxPerShift: constraints.maxPerShift,
        enforceFairness: constraints.enforceFairness,
        respectPreferences: constraints.respectPreferences,
      });
      const res = await axios.get(`${API_BASE}/schedule?${params}`);
      setSchedule(res.data);
      setActiveTab("schedule");
    } catch (err) {
      console.error(err);
      setError("Failed to generate schedule.");
    } finally {
      setLoading(false);
    }
  };

  const overloaded = aiData.filter((e) => e.status === "Overloaded").length;
  const normal = aiData.filter((e) => e.status === "Normal").length;
  const underutilized = aiData.filter(
    (e) => e.status === "Underutilized",
  ).length;

  const kpis = [
    {
      label: "Total Staff",
      value: employees.length,
      icon: <Users size={18} />,
      color: "text-indigo-400",
    },
    {
      label: "Data Points",
      value: workload.length,
      icon: <Activity size={18} />,
      color: "text-teal-400",
    },
    {
      label: "Predicted Demand",
      value: schedule ? schedule.predicted_demand : "-",
      icon: <TrendingUp size={18} />,
      color: "text-purple-400",
    },
    {
      label: "Overloaded",
      value: overloaded,
      icon: <AlertCircle size={18} />,
      color: overloaded > 0 ? "text-red-400" : "text-green-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top bar */}
      <div className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 text-transparent bg-clip-text">
              AI Workforce Management
            </h1>
            <p className="text-xs text-slate-400">
              Intelligent scheduling · Fairness-aware · Explainable AI
            </p>
          </div>
          <div className="flex gap-1">
            {["dashboard", "schedule", "analytics", "hr-settings"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition
                  ${activeTab === tab ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
                >
                  {tab === "hr-settings" ? "HR Settings" : tab}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="bg-slate-800 rounded-xl p-4 flex items-center gap-3"
            >
              <div className={`${k.color} opacity-80`}>{k.icon}</div>
              <div>
                <p className="text-xs text-slate-400">{k.label}</p>
                <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Dashboard ── */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-slate-800 rounded-xl p-6 space-y-4">
                <p className="text-sm font-semibold text-white">
                  Schedule Generator
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Overloaded",
                      val: overloaded,
                      cls: "bg-red-500/10 text-red-400",
                    },
                    {
                      label: "Normal",
                      val: normal,
                      cls: "bg-green-500/10 text-green-400",
                    },
                    {
                      label: "Underutilized",
                      val: underutilized,
                      cls: "bg-yellow-500/10 text-yellow-400",
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className={`${s.cls} p-2 rounded text-center`}
                    >
                      <p className="text-xs opacity-80">{s.label}</p>
                      <p className="font-bold text-lg">{s.val}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg">
                  <p className="text-indigo-400 text-xs font-medium mb-1">
                    🧠 AI Insight
                  </p>
                  {overloaded > 0 ? (
                    <p className="text-xs text-slate-300">
                      {overloaded} employees exceed dept. baseline —
                      redistribute before scheduling.
                    </p>
                  ) : (
                    <p className="text-xs text-green-400">
                      All employees within normal range. Good time to generate a
                      schedule.
                    </p>
                  )}
                  {preferences.length > 0 && (
                    <p className="text-xs text-indigo-300 mt-1">
                      {preferences.length} employee preference(s) will be
                      applied.
                    </p>
                  )}
                  {constraints.enforceFairness && (
                    <p className="text-xs text-teal-300 mt-1">
                      Fairness balancing is active.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Schedule date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 bg-slate-700 rounded text-white text-sm"
                  />
                </div>
                <button
                  onClick={generateSchedule}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Generating...
                    </>
                  ) : (
                    "Generate Schedule"
                  )}
                </button>
                {error && (
                  <p className="text-red-400 text-xs flex items-center gap-1">
                    <AlertCircle size={12} />
                    {error}
                  </p>
                )}
              </div>
              <div className="lg:col-span-2">
                <Charts
                  workload={workload}
                  employees={employees}
                  aiData={aiData}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FairnessMeter aiData={aiData} />
              <div className="md:col-span-2">
                <DeptAnalytics aiData={aiData} />
              </div>
            </div>
          </div>
        )}

        {/* ── Schedule ── */}
        {activeTab === "schedule" && (
          <div>
            {!schedule ? (
              <div className="bg-slate-800 rounded-xl p-12 text-center">
                <TrendingUp size={40} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No schedule generated yet.</p>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="mt-4 text-indigo-400 text-sm hover:underline"
                >
                  Go to dashboard →
                </button>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl overflow-hidden">
                <div className="p-6 flex justify-between items-center border-b border-slate-700">
                  <div>
                    <h2 className="text-lg font-bold">Generated Schedule</h2>
                    <p className="text-slate-400 text-sm">
                      {format(new Date(schedule.date), "PPPP")}
                    </p>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-xs text-slate-400">Total assigned</p>
                      <p className="text-indigo-400 font-bold text-xl">
                        {schedule.predicted_demand}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Max hours limit</p>
                      <p className="text-teal-400 font-bold text-xl">
                        {constraints.maxHours}h
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">
                        Preferences applied
                      </p>
                      <p className="text-purple-400 font-bold text-xl">
                        {preferences.length}
                      </p>
                    </div>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/50 text-slate-300">
                    <tr>
                      <th className="p-3 text-left">Employee</th>
                      <th className="p-3 text-left">Department</th>
                      <th className="p-3 text-left">Shift</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Score</th>
                      <th className="p-3 text-left">AI Explanation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.schedule.map((emp) => (
                      <tr
                        key={emp.id}
                        className="border-t border-slate-700/50 hover:bg-slate-700/30 transition"
                      >
                        <td className="p-3">
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-slate-400">{emp.role}</p>
                        </td>
                        <td className="p-3 text-slate-300 text-xs">
                          {emp.skill}
                        </td>
                        <td className="p-3">
                          <ShiftBadge shift={emp.shift} />
                        </td>
                        <td className="p-3">
                          <StatusBadge status={emp.status} />
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-slate-300 font-mono">
                            {emp.workload_score}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs">
                          <ExplainCell emp={emp} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Analytics ── */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FairnessMeter aiData={aiData} />
              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
                  Workforce Summary
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Total employees tracked", value: aiData.length },
                    {
                      label: "Overloaded",
                      value: overloaded,
                      color: "text-red-400",
                    },
                    { label: "Normal", value: normal, color: "text-green-400" },
                    {
                      label: "Underutilized",
                      value: underutilized,
                      color: "text-yellow-400",
                    },
                    {
                      label: "Avg hours/day",
                      value: aiData.length
                        ? (
                            aiData.reduce((s, e) => s + e.hours_worked, 0) /
                            aiData.length
                          ).toFixed(1)
                        : "-",
                    },
                    {
                      label: "Departments tracked",
                      value: [...new Set(aiData.map((e) => e.department))]
                        .length,
                    },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className="flex justify-between items-center py-1.5 border-b border-slate-700/50"
                    >
                      <span className="text-xs text-slate-400">{r.label}</span>
                      <span
                        className={`text-sm font-semibold ${r.color ?? "text-white"}`}
                      >
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DeptAnalytics aiData={aiData} />
          </div>
        )}

        {/* ── HR Settings ── */}
        {activeTab === "hr-settings" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HRConstraints
              constraints={constraints}
              setConstraints={setConstraints}
            />
            <EmployeePreferences
              preferences={preferences}
              setPreferences={setPreferences}
            />
            <div className="md:col-span-2 bg-slate-800 rounded-xl p-6">
              <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Settings size={16} className="text-indigo-400" />
                System Architecture
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {
                    step: "1",
                    label: "Data Ingestion",
                    desc: "dummyjson API + CSV fallback",
                    color: "bg-indigo-500/20 border-indigo-500/30",
                  },
                  {
                    step: "2",
                    label: "Demand Prediction",
                    desc: "RandomForest · 90-day history",
                    color: "bg-purple-500/20 border-purple-500/30",
                  },
                  {
                    step: "3",
                    label: "Constraint Modeling",
                    desc: "Labor laws · Fairness rules",
                    color: "bg-teal-500/20 border-teal-500/30",
                  },
                  {
                    step: "4",
                    label: "Schedule Generation",
                    desc: "Dept-aware · Preference-based",
                    color: "bg-amber-500/20 border-amber-500/30",
                  },
                  {
                    step: "5",
                    label: "AI Explainability",
                    desc: "Rule-based NLG explanations",
                    color: "bg-green-500/20 border-green-500/30",
                  },
                ].map((s) => (
                  <div
                    key={s.step}
                    className={`${s.color} border rounded-xl p-3 text-center`}
                  >
                    <p className="text-xs text-slate-400 mb-1">Step {s.step}</p>
                    <p className="text-sm font-medium text-white">{s.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
