import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import { Calendar, Users, Activity, MessageSquare, Loader2, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

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
      const empRes = await axios.get(`${API_BASE}/employees`);
      setEmployees(empRes.data);

      const workRes = await axios.get(`${API_BASE}/workload`);
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
    setExplanationMap({});
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