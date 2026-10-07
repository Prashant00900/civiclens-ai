export const STATUS = {
  submitted: { label: "Submitted", dot: "bg-ink-soft" },
  assigned: { label: "Assigned", dot: "bg-blue-600" },
  in_progress: { label: "In progress", dot: "bg-signal" },
  resolved: { label: "Resolved", dot: "bg-teal" },
  rejected: { label: "Rejected", dot: "bg-alert" },
};

export const categoryLabel = (c) => (c || "").replace("_", " ");

export function StatusMark({ status }) {
  const s = STATUS[status] || STATUS.submitted;
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap">
      <span className={`w-2.5 h-2.5 ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

export function SeverityMeter({ value }) {
  return (
    <span
      className="inline-flex items-center gap-2"
      title={`Severity ${value} out of 5`}
    >
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`w-3 h-4 ${
              n <= value ? (value >= 4 ? "bg-alert" : "bg-signal") : "bg-line"
            }`}
          />
        ))}
      </span>
      <span className="text-sm text-ink-soft">Severity {value} of 5</span>
    </span>
  );
}

export function PriorityTag({ value }) {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-semibold border border-ink rounded-sm ${
        value >= 80 ? "bg-signal" : "bg-white"
      }`}
    >
      Priority {value}
    </span>
  );
}