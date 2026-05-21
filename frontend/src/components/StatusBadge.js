export const APPLICATION_TYPES = [
  "Recordation",
  "Renewal",
  "Change of Ownership",
  "Change of Name",
  "Discontinuation",
];

export const STATUS_META = {
  "Draft":                  { color: "#64748B", bg: "#F1F5F9", label: "Draft" },
  "Submitted":              { color: "#2563EB", bg: "#DBEAFE", label: "Submitted" },
  "Under Review":           { color: "#D97706", bg: "#FEF3C7", label: "Under Review" },
  "Need More Information":  { color: "#7C3AED", bg: "#EDE9FE", label: "Need More Info" },
  "Approved":               { color: "#059669", bg: "#D1FAE5", label: "Approved" },
  "Rejected":               { color: "#DC2626", bg: "#FEE2E2", label: "Rejected" },
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { color: "#64748B", bg: "#F1F5F9", label: status };
  return (
    <span className="badge" style={{ background: meta.bg, color: meta.color }}>
      <span className="badge-dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
