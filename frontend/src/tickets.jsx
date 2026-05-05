import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";

const API_BASE = "http://127.0.0.1:5000/api";

const TICKET_TYPES = [
  {
    value: "sick_leave",
    label: "Sick Leave",
    color: "text-red-400",
    bg: "bg-red-500/20",
  },
  {
    value: "half_day",
    label: "Half Day",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
  },
  {
    value: "leave",
    label: "Full Leave",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
  },
];

function TicketBadge({ type }) {
  const t = TICKET_TYPES.find((x) => x.value === type);
  if (!t) return null;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.bg} ${t.color}`}
    >
      {t.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    Pending: "bg-yellow-500/20 text-yellow-400",
    Approved: "bg-green-500/20 text-green-400",
    Rejected: "bg-red-500/20 text-red-400",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? "bg-slate-600 text-slate-300"}`}
    >
      {status}
    </span>
  );
}

function StatusIcon({ status }) {
  if (status === "Approved")
    return <CheckCircle size={15} className="text-green-400" />;
  if (status === "Rejected")
    return <XCircle size={15} className="text-red-400" />;
  return <Clock size={15} className="text-yellow-400" />;
}

const EMPTY_FORM = {
  employee: "",
  department: "",
  type: "sick_leave",
  reason: "",
  date: format(new Date(), "yyyy-MM-dd"),
};

export default function Tickets({ onTicketUpdate }) {
  const [tickets, setTickets] = useState([]);
  const [activeView, setActiveView] = useState("manager");
  const [submitted, setSubmitted] = useState(false);
  const [managerNote, setManagerNote] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tickets`);
      setTickets(res.data);
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    let cancelled = false;

    const loadTickets = async () => {
      try {
        const res = await axios.get(`${API_BASE}/tickets`);
        if (!cancelled) setTickets(res.data);
      } catch (e) {
        console.error(e);
      }
    };

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, []);

  const raiseTicket = async () => {
    if (!form.employee.trim() || !form.reason.trim()) return;
    try {
      await axios.post(`${API_BASE}/tickets`, form);
      setSubmitted(true);
      setForm(EMPTY_FORM);
      await fetchTickets();
      if (onTicketUpdate) onTicketUpdate();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const resolveTicket = async (id, status) => {
    try {
      await axios.patch(`${API_BASE}/tickets/${id}`, {
        status,
        manager_note: managerNote[id] || "",
      });
      await fetchTickets();
      if (onTicketUpdate) onTicketUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTicket = async (id) => {
    if (!window.confirm("Delete this ticket?")) return;
    try {
      await axios.delete(`${API_BASE}/tickets/${id}`);
      await fetchTickets();
      if (onTicketUpdate) onTicketUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditForm({ reason: t.reason, date: t.date, type: t.type });
  };

  const saveEdit = async (id) => {
    try {
      await axios.put(`${API_BASE}/tickets/${id}`, editForm);
      setEditingId(null);
      await fetchTickets();
    } catch (e) {
      console.error(e);
    }
  };

  const pending = tickets.filter((t) => t.status === "Pending");
  const resolved = tickets.filter((t) => t.status !== "Pending");

  return (
    <div className="space-y-6">
      {/* ── Toggle buttons ── */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView("manager")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 cursor-pointer
            ${
              activeView === "manager"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
            }`}
        >
          Manager View
          {pending.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveView("raise")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 cursor-pointer
            ${
              activeView === "raise"
                ? "bg-indigo-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
            }`}
        >
          <Plus size={14} /> Raise a Ticket
        </button>
      </div>

      {/* ── Raise ticket form ── */}
      {activeView === "raise" && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-lg">
          <p className="text-sm font-semibold text-white mb-4">New Ticket</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Your name
              </label>
              <input
                value={form.employee}
                onChange={(e) =>
                  setForm((f) => ({ ...f, employee: e.target.value }))
                }
                placeholder="Full name"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Department
              </label>
              <input
                value={form.department}
                onChange={(e) =>
                  setForm((f) => ({ ...f, department: e.target.value }))
                }
                placeholder="Your department"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Ticket type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TICKET_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition cursor-pointer
                      ${
                        form.type === t.value
                          ? `${t.bg} ${t.color} border-current`
                          : "bg-slate-700 text-slate-400 border-slate-600 hover:border-slate-400 hover:text-white"
                      }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Reason
              </label>
              <textarea
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
                placeholder="Briefly describe your reason..."
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400 resize-none focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={raiseTicket}
              disabled={!form.employee.trim() || !form.reason.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-lg text-sm font-medium text-white transition cursor-pointer"
            >
              Submit Ticket
            </button>
            {submitted && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                <p className="text-green-400 text-sm">
                  ✓ Ticket submitted successfully
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Manager will review and approve / reject
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Manager view ── */}
      {activeView === "manager" && (
        <div className="space-y-6">
          {/* Pending */}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <AlertTriangle size={12} className="text-yellow-400" />
              Pending — {pending.length} ticket(s)
            </p>
            {pending.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
                <CheckCircle
                  size={32}
                  className="text-green-400 mx-auto mb-2"
                />
                <p className="text-slate-400 text-sm">No pending tickets</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-800 border border-yellow-500/20 rounded-xl p-4"
                  >
                    {editingId === t.id ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-400 font-medium">
                          Editing ticket #{t.id}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {TICKET_TYPES.map((tp) => (
                            <button
                              key={tp.value}
                              onClick={() =>
                                setEditForm((f) => ({ ...f, type: tp.value }))
                              }
                              className={`py-1.5 px-2 rounded text-xs font-medium border transition cursor-pointer
                                ${
                                  editForm.type === tp.value
                                    ? `${tp.bg} ${tp.color} border-current`
                                    : "bg-slate-700 text-slate-400 border-slate-600 hover:text-white"
                                }`}
                            >
                              {tp.label}
                            </button>
                          ))}
                        </div>
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, date: e.target.value }))
                          }
                          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <textarea
                          value={editForm.reason}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              reason: e.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-xs text-white resize-none focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(t.id)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-1.5 rounded text-xs font-medium text-white transition cursor-pointer"
                          >
                            Save changes
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 bg-slate-700 hover:bg-slate-600 py-1.5 rounded text-xs font-medium text-slate-300 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {t.employee}
                            </p>
                            <p className="text-xs text-slate-400">
                              {t.department} · {t.date} · Raised {t.raised_at}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <TicketBadge type={t.type} />
                            <button
                              onClick={() => startEdit(t)}
                              title="Edit ticket"
                              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-700 transition cursor-pointer"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => deleteTicket(t.id)}
                              title="Delete ticket"
                              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 transition cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded p-2 mb-3 italic">
                          "{t.reason}"
                        </p>
                        <input
                          placeholder="Manager note (optional)"
                          value={managerNote[t.id] || ""}
                          onChange={(e) =>
                            setManagerNote((n) => ({
                              ...n,
                              [t.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 mb-2 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => resolveTicket(t.id, "Approved")}
                            className="flex-1 bg-green-600 hover:bg-green-500 py-1.5 rounded text-xs font-medium text-white transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => resolveTicket(t.id, "Rejected")}
                            className="flex-1 bg-red-700 hover:bg-red-600 py-1.5 rounded text-xs font-medium text-white transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resolved */}
          {resolved.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                Resolved — {resolved.length} ticket(s)
              </p>
              <div className="space-y-2">
                {resolved.map((t) => (
                  <div
                    key={t.id}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon status={t.status} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="text-xs font-medium text-white">
                            {t.employee}
                          </p>
                          <TicketBadge type={t.type} />
                          <StatusBadge status={t.status} />
                        </div>
                        <p className="text-xs text-slate-400">
                          {t.date} · {t.department}
                        </p>
                        <p className="text-xs text-slate-500 italic">
                          "{t.reason}"
                        </p>
                        {t.manager_note && (
                          <p className="text-xs text-indigo-300 mt-0.5">
                            Note: {t.manager_note}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTicket(t.id)}
                      title="Delete ticket"
                      className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition cursor-pointer ml-3 flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
