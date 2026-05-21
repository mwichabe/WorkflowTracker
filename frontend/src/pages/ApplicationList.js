import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, FileText, ArrowRight,
  Layers, Circle, Clock, AlertCircle,
  HelpCircle, CheckCircle, XCircle, PieChart, RefreshCw,
} from "lucide-react";
import { api } from "../api/client";
import { StatusBadge, STATUS_META } from "../components/StatusBadge";
import { DonutChart } from "../components/DonutChart";

const STATS = [
  { key: "",                      label: "All",          cls: "s-all",  Icon: Layers },
  { key: "Draft",                 label: "Draft",        cls: "s-draft",Icon: Circle },
  { key: "Submitted",             label: "Submitted",    cls: "s-sub",  Icon: Clock },
  { key: "Under Review",          label: "Under Review", cls: "s-rev",  Icon: AlertCircle },
  { key: "Need More Information", label: "Need Info",    cls: "s-nmi",  Icon: HelpCircle },
  { key: "Approved",              label: "Approved",     cls: "s-app",  Icon: CheckCircle },
  { key: "Rejected",              label: "Rejected",     cls: "s-rej",  Icon: XCircle },
];

const STATUS_COLORS = {
  "Draft":                 "#94A3B8",
  "Submitted":             "#3B82F6",
  "Under Review":          "#F59E0B",
  "Need More Information": "#8B5CF6",
  "Approved":              "#10B981",
  "Rejected":              "#EF4444",
};

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function fmtDate(dt) {
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ApplicationList() {
  const [apps, setApps]   = useState([]);
  const [loading, setLoad]= useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchApps = useCallback((silent = false) => {
    if (!silent) setLoad(true);
    setError(null);
    api.list()
      .then(data => { setApps(data); })
      .catch((e) => setError(e.message))
      .finally(() => setLoad(false));
  }, []);

  // Initial load
  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Re-fetch when the user switches back to this tab so admin decisions appear immediately
  useEffect(() => {
    function onFocus() { fetchApps(true); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchApps]);

  const counts = useMemo(() => {
    const c = { "": apps.length };
    STATS.slice(1).forEach(({ key }) => { c[key] = apps.filter((a) => a.status === key).length; });
    return c;
  }, [apps]);

  const chartData = useMemo(() =>
    Object.entries(STATUS_META)
      .map(([key, meta]) => ({ label: meta.label, value: counts[key] ?? 0, color: STATUS_COLORS[key] }))
      .filter((d) => d.value > 0),
    [counts]
  );

  const filtered = useMemo(() => {
    let list = filter ? apps.filter((a) => a.status === filter) : apps;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.applicant_name.toLowerCase().includes(q) ||
        a.company_name.toLowerCase().includes(q) ||
        a.tracking_number.toLowerCase().includes(q) ||
        a.applicant_email.toLowerCase().includes(q) ||
        a.application_type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [apps, filter, search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            Applications
            {!loading && <span className="count-chip">{apps.length}</span>}
          </h1>
          <p>Track and manage all workflow applications end-to-end</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => fetchApps()} disabled={loading} title="Refresh">
            <RefreshCw size={14} strokeWidth={2} className={loading ? "spin-icon" : ""} />
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/new")}>
            <Plus size={14} strokeWidth={2.5} /> New Application
          </button>
        </div>
      </div>

      {/* Clickable stat cards */}
      <div className="stats-row">
        {STATS.map(({ key, label, cls, Icon }) => (
          <div
            key={key}
            className={`stat-card ${cls} ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            <div className="stat-icon"><Icon size={14} strokeWidth={2} /></div>
            <div className="stat-value">{loading ? "—" : counts[key] ?? 0}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Chart + table panel */}
      <div className="panel-row">
        {/* Donut chart */}
        <div className="chart-card">
          <div className="chart-card-title"><PieChart size={12} /> Distribution</div>
          <div className="chart-center">
            <DonutChart data={chartData} size={160} />
          </div>
          <div className="chart-legend">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const count = counts[key] ?? 0;
              const pct = apps.length > 0 ? Math.round((count / apps.length) * 100) : 0;
              return (
                <div
                  key={key}
                  className="legend-row"
                  onClick={() => setFilter(filter === key ? "" : key)}
                >
                  <div className="legend-dot" style={{ background: STATUS_COLORS[key] }} />
                  <span className="legend-label">{meta.label}</span>
                  <span className="legend-count">{count}</span>
                  {apps.length > 0 && <span className="legend-pct">{pct}%</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: search + table */}
        <div>
          <div className="search-bar">
            <div className="search-field">
              <Search size={14} />
              <input
                className="search-input"
                placeholder="Search by name, company, email, or tracking number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {(search || filter) && (
              <button
                className="btn btn-ghost"
                onClick={() => { setSearch(""); setFilter(""); }}
              >
                Clear
              </button>
            )}
          </div>

          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <div className="loading-wrap">
              <div className="spinner" />
              <span className="loading-label">Loading…</span>
            </div>
          ) : (
            <div className="table-card">
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><FileText size={28} strokeWidth={1.5} /></div>
                  <h3>{search || filter ? "No results found" : "No applications yet"}</h3>
                  <p>
                    {search || filter
                      ? "Try adjusting your search or filter."
                      : "Create your first application to get started."}
                  </p>
                  {!search && !filter && (
                    <button className="btn btn-primary" onClick={() => navigate("/new")}>
                      <Plus size={14} /> Create Application
                    </button>
                  )}
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Tracking #</th>
                      <th>Applicant</th>
                      <th>Company</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((app) => (
                      <tr key={app.id} className="table-row" onClick={() => navigate(`/${app.id}`)}>
                        <td><code className="cell-track">{app.tracking_number}</code></td>
                        <td>
                          <div className="applicant-cell">
                            <div className="avatar">{initials(app.applicant_name)}</div>
                            <div>
                              <div className="cell-name">{app.applicant_name}</div>
                              <div className="cell-email">{app.applicant_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="cell-co">{app.company_name}</td>
                        <td><span className="type-pill">{app.application_type}</span></td>
                        <td><StatusBadge status={app.status} /></td>
                        <td className="cell-date">{fmtDate(app.created_at)}</td>
                        <td>
                          <span className="cell-go">View <ArrowRight size={13} /></span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
