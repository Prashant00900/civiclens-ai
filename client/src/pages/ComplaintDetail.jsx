import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

const STATUS_STYLES = {
  submitted: "bg-gray-200 text-gray-800",
  assigned: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const label = (s) => s.replace("_", " ");
const fmt = (d) => new Date(d).toLocaleString();

export default function ComplaintDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/complaints/${id}`)
      .then((res) => setC(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load complaint")
      );
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!c) return <p>Loading...</p>;

  const dept = c.department;

  return (
    <div className="space-y-4">
      <Link to="/" className="text-blue-600 text-sm">
        Back
      </Link>

      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-bold">{c.title}</h1>
          <span
            className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[c.status]}`}
          >
            {label(c.status)}
          </span>
        </div>

        <p className="text-xs text-gray-500">
          Tracking ID: {c.trackingId} · Reported on {fmt(c.createdAt)}
        </p>

        {c.images?.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {c.images.map((img) => (
              <a key={img.publicId} href={img.url} target="_blank" rel="noreferrer">
                <img
                  src={img.url}
                  alt={c.title}
                  className="w-40 h-40 object-cover rounded-lg"
                />
              </a>
            ))}
          </div>
        )}

        <p className="text-gray-700">{c.description}</p>

        {c.aiSummary && (
          <p className="text-sm text-purple-700">AI: {c.aiSummary}</p>
        )}

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-800">
            Severity {c.severity}/5
          </span>
          <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
            Priority {c.priorityScore}
          </span>
          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            {label(c.category)}
          </span>
        </div>

        {c.address && (
          <p className="text-sm text-gray-600">Location: {c.address}</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-5 space-y-2">
        <h2 className="font-semibold">Who is handling this</h2>
        {dept ? (
          <>
            <p>
              <span className="text-gray-500">Department: </span>
              {dept.name}
            </p>
            <p>
              <span className="text-gray-500">Officer: </span>
              {c.assignedTo?.name || "Not assigned yet"}
            </p>
            {dept.phone && (
              <p>
                <span className="text-gray-500">Helpline: </span>
                <a className="text-blue-600" href={`tel:${dept.phone}`}>
                  {dept.phone}
                </a>
              </p>
            )}
            {dept.email && (
              <p>
                <span className="text-gray-500">Email: </span>
                <a className="text-blue-600" href={`mailto:${dept.email}`}>
                  {dept.email}
                </a>
              </p>
            )}
            {dept.officeAddress && (
              <p>
                <span className="text-gray-500">Office: </span>
                {dept.officeAddress}
              </p>
            )}
            {c.dueAt && (
              <p>
                <span className="text-gray-500">Expected by: </span>
                {fmt(c.dueAt)}
                {c.isOverdue && (
                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                    Overdue
                  </span>
                )}
              </p>
            )}
          </>
        ) : (
          <p className="text-gray-500">Department not assigned yet.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="font-semibold mb-3">Timeline</h2>
        <ol className="space-y-3 border-l-2 border-gray-200 pl-4">
          {c.statusHistory.map((h, i) => (
            <li key={i}>
              <p className="font-medium">{label(h.status)}</p>
              <p className="text-xs text-gray-500">
                {fmt(h.at)}
                {h.by?.name ? ` · by ${h.by.name}` : ""}
              </p>
              {h.note && <p className="text-sm text-gray-600">{h.note}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}