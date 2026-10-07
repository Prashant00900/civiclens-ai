import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
import {
  StatusMark,
  SeverityMeter,
  PriorityTag,
  STATUS,
  categoryLabel,
} from "../components/ui";

const COLORS = ["#1b2430", "#0e5f5b", "#f2b705", "#b42318", "#4a5565", "#8aa39f"];

const NEXT = {
  submitted: "assigned",
  assigned: "in_progress",
  in_progress: "resolved",
};

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
      toast.success(`Marked as ${STATUS[next].label.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the status");
    }
  };

  const s = summary?.byStatus || {};
  const statusData = summary
    ? Object.entries(summary.byStatus).map(([name, count]) => ({
        name: STATUS[name]?.label || name,
        count,
      }))
    : [];

  const stats = summary
    ? [
        ["Total complaints", summary.total],
        ["New", s.submitted || 0],
        ["In progress", (s.assigned || 0) + (s.in_progress || 0)],
        ["Resolved", s.resolved || 0],
        ["Average hours to resolve", summary.avgResolutionHours],
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-line border border-line rounded-md overflow-hidden">
            {stats.map(([name, value], i) => (
              <div
                key={name}
                className={`bg-white p-4 ${i === 4 ? "col-span-2 md:col-span-1" : ""}`}
              >
                <p className="text-sm text-ink-soft">{name}</p>
                <p className="font-display text-3xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <section className="bg-white border border-line rounded-md p-4">
              <h2 className="font-bold mb-2">Complaints by category</h2>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={summary.byCategory}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={70}
                    label={({ name, value }) => `${categoryLabel(name)}: ${value}`}
                  >
                    {summary.byCategory.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </section>

            <section className="bg-white border border-line rounded-md p-4">
              <h2 className="font-bold mb-2">Complaints by status</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0e5f5b" />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Complaints, most urgent first</h2>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="border border-line bg-white rounded px-3 py-2 text-sm"
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
        <p className="text-ink-soft">Loading complaints...</p>
      ) : items.length === 0 ? (
        <p className="text-ink-soft">No complaints match this filter.</p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <article
              key={c._id}
              className="bg-white border border-line rounded-md p-4 flex gap-4"
            >
              {c.images?.[0] && (
                <img
                  src={c.images[0].url}
                  alt={c.title}
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/complaints/${c._id}`}
                    className="font-display font-bold text-lg leading-snug hover:underline"
                  >
                    {c.title}
                  </Link>
                  <StatusMark status={c.status} />
                </div>

                <p className="text-sm text-ink-soft line-clamp-2 mt-1">
                  {c.description}
                </p>
                {c.aiSummary && (
                  <p className="text-sm text-teal mt-1">AI summary: {c.aiSummary}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                  <SeverityMeter value={c.severity} />
                  <PriorityTag value={c.priorityScore} />
                  {c.reportCount > 1 && (
                    <span className="text-xs font-semibold text-teal">
                      {c.reportCount} people reported this
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-ink-soft">
                  <span>{c.trackingId}</span>
                  <span>{categoryLabel(c.category)}</span>
                  <span>{c.department?.name || "Unassigned"}</span>
                  <span>Reported by {c.reportedBy?.name}</span>
                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>

                {NEXT[c.status] && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => changeStatus(c._id, NEXT[c.status])}
                      className="bg-teal text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-teal-dark"
                    >
                      Mark {STATUS[NEXT[c.status]].label.toLowerCase()}
                    </button>
                    {c.status !== "in_progress" && (
                      <button
                        onClick={() => changeStatus(c._id, "rejected")}
                        className="border border-alert text-alert text-sm font-medium px-3 py-1.5 rounded hover:bg-red-50"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}