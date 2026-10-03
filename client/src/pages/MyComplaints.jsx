import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const STATUS_STYLES = {
  submitted: "bg-gray-200 text-gray-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function MyComplaints() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/complaints/mine")
      .then((res) => setItems(res.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  if (items.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <p className="text-gray-600 mb-3">You have not reported anything yet.</p>
        <Link to="/new" className="text-blue-600 font-medium">
          Report your first problem
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Complaints</h1>
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
              <h2 className="font-semibold">{c.title}</h2>
              <span
                className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[c.status]}`}
              >
                {c.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-gray-600">{c.description}</p>
            {c.aiSummary && (
              <p className="text-sm text-purple-700 mt-1">AI: {c.aiSummary}</p>
            )}
            <div className="flex gap-2 mt-2 text-xs">
              <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                Severity {c.severity}/5
              </span>
              <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                Priority {c.priorityScore}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {c.category.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {c.trackingId} · {c.department?.name || "Unassigned"} ·{" "}
              {new Date(c.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}