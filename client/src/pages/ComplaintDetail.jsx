import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import {
  StatusMark,
  SeverityMeter,
  PriorityTag,
  STATUS,
  categoryLabel,
} from "../components/ui";

const fmt = (d) => new Date(d).toLocaleString();

function Row({ label, children }) {
  return (
    <div className="grid sm:grid-cols-[9rem_1fr] gap-x-4 py-2 border-b border-line last:border-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function ComplaintDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/complaints/${id}`)
      .then((res) => setC(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Could not load this complaint")
      );
  }, [id]);

  if (error) return <p className="text-alert">{error}</p>;
  if (!c) return <p className="text-ink-soft">Loading...</p>;

  const dept = c.department;

  return (
    <div className="max-w-3xl space-y-4">
      <Link to="/" className="text-sm text-teal font-medium underline">
        Back to complaints
      </Link>

      <section className="bg-white border border-line rounded-md p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-snug">{c.title}</h1>
          <StatusMark status={c.status} />
        </div>

        <p className="text-sm text-ink-soft">
          {c.trackingId}, reported on {fmt(c.createdAt)}
        </p>

        {c.images?.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {c.images.map((img) => (
              <a key={img.publicId} href={img.url} target="_blank" rel="noreferrer">
                <img
                  src={img.url}
                  alt={c.title}
                  className="w-40 h-40 object-cover rounded border border-line"
                />
              </a>
            ))}
          </div>
        )}

        <p>{c.description}</p>
        {c.aiSummary && (
          <p className="text-teal">AI summary: {c.aiSummary}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SeverityMeter value={c.severity} />
          <PriorityTag value={c.priorityScore} />
          {c.reportCount > 1 && (
            <span className="text-xs font-semibold text-teal">
              {c.reportCount} people reported this
            </span>
          )}
        </div>

        <dl className="text-sm">
          <Row label="Category">{categoryLabel(c.category)}</Row>
          {c.address && <Row label="Location">{c.address}</Row>}
        </dl>
      </section>

      <section className="bg-white border border-line rounded-md p-5">
        <h2 className="text-lg font-bold mb-2">Who is handling this</h2>
        {dept ? (
          <dl>
            <Row label="Department">{dept.name}</Row>
            <Row label="Officer">{c.assignedTo?.name || "Not assigned yet"}</Row>
            {dept.phone && (
              <Row label="Helpline">
                <a className="text-teal underline" href={`tel:${dept.phone}`}>
                  {dept.phone}
                </a>
              </Row>
            )}
            {dept.email && (
              <Row label="Email">
                <a className="text-teal underline" href={`mailto:${dept.email}`}>
                  {dept.email}
                </a>
              </Row>
            )}
            {dept.officeAddress && <Row label="Office">{dept.officeAddress}</Row>}
            {c.dueAt && (
              <Row label="Expected by">
                {fmt(c.dueAt)}
                {c.isOverdue && (
                  <span className="ml-2 text-xs font-semibold text-alert border border-alert rounded-sm px-2 py-0.5">
                    Overdue
                  </span>
                )}
              </Row>
            )}
          </dl>
        ) : (
          <p className="text-ink-soft">This complaint has not been routed yet.</p>
        )}
      </section>

      <section className="bg-white border border-line rounded-md p-5">
        <h2 className="text-lg font-bold mb-4">Timeline</h2>
        <ol className="border-l-2 border-line ml-1 space-y-5">
          {c.statusHistory.map((h, i) => (
            <li key={i} className="relative pl-5">
              <span
                className={`absolute -left-[7px] top-1.5 w-3 h-3 ${
                  STATUS[h.status]?.dot || "bg-ink-soft"
                }`}
                aria-hidden="true"
              />
              <p className="font-semibold">{STATUS[h.status]?.label || h.status}</p>
              <p className="text-xs text-ink-soft">
                {fmt(h.at)}
                {h.by?.name ? `, by ${h.by.name}` : ""}
              </p>
              {h.note && <p className="text-sm mt-1">{h.note}</p>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}