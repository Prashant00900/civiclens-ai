import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#6b7280"];

const NEXT = {
  submitted: "assigned",
  assigned: "in_progress",
  in_progress: "resolved",
};

const STATUS_STYLES = {
  submitted: "bg-gray-200 text-gray-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const label = (s) => s.replace("_", " ");

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const params = { limit: 50 };
      if (status) params.status = status;
      const { data } = await api.get("/complaints", { params });
      setItems(data.items);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load complaints");
    } finally {
      setLoading(false);
    }
    api
      .get("/analytics/summary")
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  };

  useEffect(() => {
    load();
  }, [status]);

  const changeStatus = async (id, next) => {
    try {
      await api.patch(`/complaints/${id}/status`, { status: next });
      toast.success(`Marked as ${label(next)}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const statusData = summary
    ? Object.entries(summary.byStatus).map(([name, count]) => ({
        name: label(name),
        count,
      }))
    : [];

  const s = summary?.byStatus || {};

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              ["Total", summary.total],
              ["New", s.submitted || 0],
              ["In progress", (s.assigned || 0) + (s.in_progress || 0)],
              ["Resolved", s.resolved || 0],
              ["Avg resolve (hrs)", summary.avgResolutionHours],
            ].map(([name, value]) => (
              <div key={name} className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-500">{name}</p>
                <p className="text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow p-4">
              <p className="font-semibold mb-2">By category</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                                    <Pie
                    data={summary.byCategory}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                    label={({ name, value }) => `${label(name)}: ${value}`}
                  >
                    {summary.byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow p-4">
              <p className="font-semibold mb-2">By status</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Complaints (highest priority first)</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded-lg p-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No complaints found.</p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c._id} className="bg-white rounded-xl shadow p-4 flex gap-4">
              {c.images?.[0] && (
                <img
                  src={c.images[0].url}
                  alt={c.title}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{c.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[c.status]}`}>
                    {label(c.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{c.description}</p>
                {c.aiSummary && (
                  <p className="text-sm text-purple-700 mt-1">AI: {c.aiSummary}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                    Severity {c.severity}/5
                  </span>
                  <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                    Priority {c.priorityScore}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {label(c.category)}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {c.department?.name || "Unassigned"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {c.trackingId} · by {c.reportedBy?.name} ·{" "}
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
                {NEXT[c.status] && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => changeStatus(c._id, NEXT[c.status])}
                      className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg"
                    >
                      Mark {label(NEXT[c.status])}
                    </button>
                    {c.status !== "in_progress" && (
                      <button
                        onClick={() => changeStatus(c._id, "rejected")}
                        className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-lg"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}