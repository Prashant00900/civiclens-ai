import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  StatusMark,
  SeverityMeter,
  PriorityTag,
  categoryLabel,
} from "../components/ui";

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

  if (loading) return <p className="text-ink-soft">Loading your complaints...</p>;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl bg-white border border-line rounded-md p-8">
        <h1 className="text-2xl font-bold mb-2">No complaints yet</h1>
        <p className="text-ink-soft mb-4">
          See a pothole, garbage pile or broken street light? Take a photo and
          report it. We will route it to the right department.
        </p>
        <Link
          to="/new"
          className="inline-block bg-teal text-white font-medium px-4 py-2 rounded hover:bg-teal-dark"
        >
          Report a problem
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline justify-between mb-4">
        <h1 className="text-2xl font-bold">My complaints</h1>
        <span className="text-sm text-ink-soft">{items.length} in total</span>
      </div>

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
                <span>{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}