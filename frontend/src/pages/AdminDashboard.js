import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Shield, Users, FileText, Clock, CheckCircle, XCircle,
  HelpCircle, ArrowRight, Play, ChevronDown, ChevronUp,
  Search, RefreshCw, UserCheck, UserX, AlertTriangle,
} from "lucide-react";
import { api } from "../api/client";
import { adminApi } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";

function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtDateTime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ── Decision Modal ────────────────────────────────────────
function DecisionModal({ app, onClose, onDone }) {
  const [pick, setPick]       = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy]       = useState(false);

  const DECISIONS = [
    { value: "Approved",              label: "Approve",           cls: "sel-approve", Icon: CheckCircle },
    { value: "Need More Information", label: "Request More Info", cls: "sel-nmi",     Icon: HelpCircle },
    { value: "Rejected",              label: "Reject",            cls: "sel-reject",  Icon: XCircle },
  ];

  async function submit() {
    if (!pick) { toast.error("Select a decision first."); return; }
    if ((pick === "Rejected" || pick === "Need More Information") && !comment.trim()) {
      toast.error("A comment is required for this decision."); return;
    }
    setBusy(true);
    try {
      await api.decide(app.id, { decision: pick, reviewer_comment: comment });
      toast.success(`Decision recorded: ${pick}`);
      onDone();
    } catch (e) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h3>Record Decision</h3>
          <p>{app.tracking_number} · {app.applicant_name}</p>
        </div>
        <div className="decision-opts" style={{ marginBottom: 14 }}>
          {DECISIONS.map(({ value, label, cls, Icon }) => (
            <label key={value} className={`d-opt ${pick === value ? cls : ""}`}>
              <input type="radio" name="adm-dec" value={value} checked={pick === value} onChange={() => setPick(value)} />
              <Icon size={14} /> {label}
            </label>
          ))}
        </div>
        <div className="dtg">
          <label>
            Reviewer Comment{" "}
            {pick === "Rejected" || pick === "Need More Information"
              ? <span className="hint-req">*</span>
              : <span className="hint-opt">(optional)</span>}
          </label>
          <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Provide reviewer notes…" />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy || !pick} onClick={submit}>
            {busy ? "Saving…" : "Submit Decision"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Admin Request Row ─────────────────────────────────────
function AdminRequestRow({ req, onRefresh }) {
  const [note, setNote]   = useState("");
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(false);

  async function act(action) {
    if (action === "reject" && !note.trim()) {
      toast.error("A note is required when rejecting."); return;
    }
    setBusy(true);
    try {
      await adminApi.reviewRequest(req.id, { action, reviewer_note: note });
      toast.success(action === "approve" ? `${req.username} is now an admin!` : "Request rejected.");
      onRefresh();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`adm-req-row${open ? " adm-req-row-open" : ""}`}>
      <div className="adm-req-header" onClick={() => setOpen(v => !v)}>
        <div className="adm-req-user">
          <div className="avatar">{req.username[0].toUpperCase()}</div>
          <div>
            <div className="adm-req-name">{req.username}</div>
            <div className="adm-req-date">{fmtDateTime(req.created_at)}</div>
          </div>
        </div>
        <div className="adm-req-status">
          <span className={`adm-status-pill adm-status-${req.status}`}>{req.status}</span>
        </div>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </div>

      {open && (
        <div className="adm-req-body">
          {req.reason && (
            <div className="adm-req-reason">
              <span>Reason:</span> {req.reason}
            </div>
          )}
          {req.status === "pending" && (
            <div className="adm-req-actions">
              <input
                className="adm-req-note-input"
                placeholder="Optional note for approval / required for rejection…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn adm-btn-approve" disabled={busy} onClick={() => act("approve")}>
                  <UserCheck size={13} /> Approve
                </button>
                <button className="btn adm-btn-reject" disabled={busy} onClick={() => act("reject")}>
                  <UserX size={13} /> Reject
                </button>
              </div>
            </div>
          )}
          {req.status !== "pending" && req.reviewer_note && (
            <div className="adm-req-note-display">
              <span>Reviewer note:</span> {req.reviewer_note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function AdminDashboard() {
  const navigate  = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [stats, setStats]     = useState(null);
  const [apps, setApps]       = useState([]);
  const [requests, setReqs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [statusFilter, setSF] = useState("");
  const [tab, setTab]         = useState("applications");
  const [modalApp, setModal]  = useState(null);
  const [busy, setBusy]       = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([adminApi.stats(), api.list()]);
      setStats(s);
      setApps(a);
      if (isSuperAdmin) {
        const r = await adminApi.adminRequests();
        setReqs(r);
      }
    } catch (e) {
      toast.error(e.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => { load(); }, [load]);

  async function startReview(appId) {
    setBusy(prev => ({ ...prev, [appId]: true }));
    try {
      await api.startReview(appId);
      toast.success("Review started!");
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(prev => ({ ...prev, [appId]: false }));
    }
  }

  const filtered = apps.filter(a => {
    const matchStatus = !statusFilter || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.applicant_name.toLowerCase().includes(q) ||
      a.company_name.toLowerCase().includes(q) ||
      a.tracking_number.toLowerCase().includes(q) ||
      (a.submitted_by_username || "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingRequests = requests.filter(r => r.status === "pending");

  const STAT_CARDS = [
    { label: "Total Applications", value: stats?.total_applications ?? "—", cls: "s-all",  Icon: FileText },
    { label: "Submitted",          value: stats?.status_counts?.Submitted ?? 0,       cls: "s-sub",  Icon: Clock },
    { label: "Under Review",       value: stats?.status_counts?.["Under Review"] ?? 0, cls: "s-rev",  Icon: AlertTriangle },
    { label: "Approved",           value: stats?.status_counts?.Approved ?? 0,         cls: "s-app",  Icon: CheckCircle },
    { label: "Rejected",           value: stats?.status_counts?.Rejected ?? 0,         cls: "s-rej",  Icon: XCircle },
    { label: "Total Users",        value: stats?.total_users ?? "—",                   cls: "s-draft", Icon: Users },
  ];

  const pendingAction = apps.filter(a => a.status === "Submitted" || a.status === "Under Review");

  if (loading) return (
    <div className="loading-wrap"><div className="spinner" /><span className="loading-label">Loading admin dashboard…</span></div>
  );

  return (
    <div className="page">
      {/* header */}
      <div className="page-header">
        <div>
          <h1>
            <Shield size={18} style={{ marginRight: 8, verticalAlign: "middle", color: "#6366F1" }} />
            Admin Dashboard
          </h1>
          <p>Review applications and manage admin access requests</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* stats row */}
      <div className="stats-row">
        {STAT_CARDS.map(({ label, value, cls, Icon }) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div className="stat-icon"><Icon size={14} strokeWidth={2} /></div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* pending action banner */}
      {pendingAction.length > 0 && (
        <div className="adm-action-banner">
          <Clock size={14} />
          <span>
            <strong>{pendingAction.length}</strong> application{pendingAction.length !== 1 ? "s" : ""} need your attention
          </span>
          <button className="adm-banner-btn" onClick={() => { setTab("applications"); setSF("Submitted"); }}>
            View Submitted →
          </button>
        </div>
      )}

      {/* tabs */}
      <div className="adm-tabs">
        <button className={`adm-tab${tab === "applications" ? " active" : ""}`} onClick={() => setTab("applications")}>
          <FileText size={14} /> Applications
          <span className="adm-tab-count">{apps.length}</span>
        </button>
        {isSuperAdmin && (
          <button className={`adm-tab${tab === "requests" ? " active" : ""}`} onClick={() => setTab("requests")}>
            <Shield size={14} /> Admin Requests
            {pendingRequests.length > 0 && (
              <span className="adm-tab-count adm-tab-count-alert">{pendingRequests.length}</span>
            )}
          </button>
        )}
      </div>

      {/* ── Applications tab ── */}
      {tab === "applications" && (
        <>
          <div className="search-bar" style={{ marginBottom: 12 }}>
            <div className="search-field">
              <Search size={14} />
              <input
                className="search-input"
                placeholder="Search by applicant, company, tracking number or username…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="adm-status-select"
              value={statusFilter}
              onChange={(e) => setSF(e.target.value)}
            >
              <option value="">All Statuses</option>
              {["Draft","Submitted","Under Review","Need More Information","Approved","Rejected"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {(search || statusFilter) && (
              <button className="btn btn-ghost" onClick={() => { setSearch(""); setSF(""); }}>Clear</button>
            )}
          </div>

          <div className="table-card">
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><FileText size={28} strokeWidth={1.5} /></div>
                <h3>No applications found</h3>
                <p>Try adjusting your search or filters.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Applicant</th>
                    <th>Submitted By</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <tr key={app.id} className="table-row">
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
                      <td>
                        {app.submitted_by_username
                          ? <span className="adm-user-chip">{app.submitted_by_username}</span>
                          : <span className="adm-anon">—</span>}
                      </td>
                      <td><span className="type-pill">{app.application_type}</span></td>
                      <td><StatusBadge status={app.status} /></td>
                      <td className="cell-date">{fmtDate(app.created_at)}</td>
                      <td>
                        <div className="adm-row-actions">
                          {app.status === "Submitted" && (
                            <button
                              className="btn adm-btn-sm adm-btn-review"
                              disabled={!!busy[app.id]}
                              onClick={() => startReview(app.id)}
                            >
                              <Play size={12} /> {busy[app.id] ? "…" : "Start Review"}
                            </button>
                          )}
                          {app.status === "Under Review" && (
                            <button
                              className="btn adm-btn-sm adm-btn-decide"
                              onClick={() => setModal(app)}
                            >
                              <CheckCircle size={12} /> Decide
                            </button>
                          )}
                          <button
                            className="btn adm-btn-sm adm-btn-view"
                            onClick={() => navigate(`/${app.id}`)}
                          >
                            View <ArrowRight size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Admin Requests tab (superuser only) ── */}
      {tab === "requests" && isSuperAdmin && (
        <div className="adm-requests-panel">
          {requests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Shield size={28} strokeWidth={1.5} /></div>
              <h3>No admin requests</h3>
              <p>No users have requested admin access yet.</p>
            </div>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <div className="adm-section-label">
                  Pending ({pendingRequests.length})
                </div>
              )}
              {requests.map((req) => (
                <AdminRequestRow key={req.id} req={req} onRefresh={load} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Decision modal */}
      {modalApp && (
        <DecisionModal
          app={modalApp}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
