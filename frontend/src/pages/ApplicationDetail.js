import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Edit2, Send, Play,
  CheckCircle, XCircle, HelpCircle,
  User, Building2, Mail, Tag,
  Clock, FileText, MessageSquare, Hash,
  Calendar, RefreshCw, Shield,
} from "lucide-react";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { WorkflowStepper } from "../components/WorkflowStepper";
import { useAuth } from "../context/AuthContext";

const DECISIONS = [
  { value: "Approved",              label: "Approve",           cls: "sel-approve", Icon: CheckCircle },
  { value: "Need More Information", label: "Request More Info", cls: "sel-nmi",     Icon: HelpCircle },
  { value: "Rejected",              label: "Reject",            cls: "sel-reject",  Icon: XCircle },
];

function fmt(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [app, setApp]             = useState(null);
  const [loading, setLoad]        = useState(true);
  const [error, setError]         = useState(null);
  const [busy, setBusy]           = useState(false);
  const [showDecision, setShowD]  = useState(false);
  const [pick, setPick]           = useState("");
  const [comment, setComment]     = useState("");

  const fetchApp = useCallback(() => {
    setLoad(true);
    api.get(id)
      .then(setApp)
      .catch((e) => setError(e.message))
      .finally(() => setLoad(false));
  }, [id]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  useEffect(() => {
    function onFocus() {
      api.get(id).then(setApp).catch(() => {});
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [id]);

  const act = async (fn, msg) => {
    setBusy(true);
    try {
      const updated = await fn();
      setApp(updated);
      setShowD(false); setPick(""); setComment("");
      toast.success(msg);
    } catch (e) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleDecision = () => {
    if (!pick) { toast.error("Please select a decision."); return; }
    if ((pick === "Rejected" || pick === "Need More Information") && !comment.trim()) {
      toast.error("A reviewer comment is required for this decision.");
      return;
    }
    act(() => api.decide(id, { decision: pick, reviewer_comment: comment }), `Decision recorded: ${pick}`);
  };

  if (loading) return <div className="loading-wrap"><div className="spinner" /><span className="loading-label">Loading application…</span></div>;
  if (error)   return <div className="error-banner">{error}</div>;
  if (!app)    return null;

  const isOwner = user && app.submitted_by_id === user.id;
  const canEdit = (app.status === "Draft" || app.status === "Need More Information") && (isOwner || isAdmin);
  const canSubmit = (app.status === "Draft" || app.status === "Need More Information") && isOwner;
  const isLive  = ["Draft","Need More Information","Submitted","Under Review"].includes(app.status);

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Back
      </button>

      {/* ── Hero ── */}
      <div className="detail-hero">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hero-track">{app.tracking_number}</div>
          <h1>{app.applicant_name}</h1>
          <div className="hero-meta">
            <Building2 size={13} />{app.company_name}
            <span className="hero-sep">·</span>
            <Tag size={13} />{app.application_type}
            <span className="hero-sep">·</span>
            <Mail size={13} />{app.applicant_email}
            {app.submitted_by_username && (
              <>
                <span className="hero-sep">·</span>
                <User size={13} />
                <span>by {app.submitted_by_username}</span>
              </>
            )}
          </div>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* ── Workflow stepper ── */}
      <WorkflowStepper status={app.status} />

      {/* ── Action bar ── */}
      {isLive && (
        <div className="action-bar">
          <span className="action-label">Actions</span>

          {canEdit && (
            <button className="btn btn-secondary" onClick={() => navigate(`/${id}/edit`)}>
              <Edit2 size={13} /> Edit
            </button>
          )}
          {canSubmit && (
            <button className="btn btn-primary" disabled={busy}
              onClick={() => act(() => api.submit(id), "Application submitted successfully!")}>
              <Send size={13} />
              {app.status === "Need More Information" ? "Resubmit Application" : "Submit Application"}
            </button>
          )}
          {app.status === "Submitted" && isAdmin && (
            <button className="btn btn-primary" disabled={busy}
              onClick={() => act(() => api.startReview(id), "Review started!")}>
              <Play size={13} /> Start Review
            </button>
          )}
          {app.status === "Under Review" && isAdmin && !showDecision && (
            <button className="btn btn-primary" onClick={() => setShowD(true)}>
              <CheckCircle size={13} /> Record Decision
            </button>
          )}
          {app.status === "Submitted" && !isAdmin && (
            <div className="adm-notice">
              <Shield size={13} />
              Awaiting admin review
            </div>
          )}
          {app.status === "Under Review" && !isAdmin && (
            <div className="adm-notice">
              <Shield size={13} />
              Under review by {app.reviewed_by_username || "an admin"}
            </div>
          )}
        </div>
      )}

      {/* ── Decision form ── */}
      {showDecision && (
        <div className="decision-card">
          <h3>Record Reviewer Decision</h3>
          <p className="dsub">Choose the outcome and provide supporting commentary.</p>

          <div className="decision-opts">
            {DECISIONS.map(({ value, label, cls, Icon }) => (
              <label key={value} className={`d-opt ${pick === value ? cls : ""}`}>
                <input type="radio" name="dec" value={value} checked={pick === value} onChange={() => setPick(value)} />
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
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide your reviewer notes…"
            />
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary"
              onClick={() => { setShowD(false); setPick(""); setComment(""); }}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy || !pick} onClick={handleDecision}>
              {busy ? "Saving…" : "Submit Decision"}
            </button>
          </div>
        </div>
      )}

      {/* ── Info grid ── */}
      <div className="info-grid">
        <div className="info-card">
          <div className="info-title"><User size={12} /> Applicant Information</div>
          <div className="info-row">
            <dt>Full Name</dt>
            <dd><User size={12} style={{ color: "var(--text-3)" }} />{app.applicant_name}</dd>
          </div>
          <div className="info-row">
            <dt>Email Address</dt>
            <dd><Mail size={12} style={{ color: "var(--text-3)" }} />{app.applicant_email}</dd>
          </div>
          <div className="info-row">
            <dt>Company / Organisation</dt>
            <dd><Building2 size={12} style={{ color: "var(--text-3)" }} />{app.company_name}</dd>
          </div>
          <div className="info-row">
            <dt>Application Type</dt>
            <dd><Tag size={12} style={{ color: "var(--text-3)" }} />{app.application_type}</dd>
          </div>
          <div className="info-row">
            <dt>Tracking Number</dt>
            <dd className="mono"><Hash size={12} style={{ color: "var(--text-3)" }} />{app.tracking_number}</dd>
          </div>
          <div className="info-row">
            <dt>Submitted By</dt>
            <dd>
              <User size={12} style={{ color: "var(--text-3)" }} />
              {app.submitted_by_username || <em style={{ color: "var(--text-3)" }}>Unknown</em>}
            </dd>
          </div>
          <div className="info-row">
            <dt>Current Status</dt>
            <dd><StatusBadge status={app.status} /></dd>
          </div>
        </div>

        <div className="info-card">
          <div className="info-title"><Clock size={12} /> Activity Timeline</div>
          {[
            { label: "Created",       icon: Calendar,    value: app.created_at },
            { label: "Last Updated",  icon: RefreshCw,   value: app.updated_at },
            { label: "Submitted At",  icon: Send,        value: app.submitted_at },
            { label: "Reviewed At",   icon: CheckCircle, value: app.reviewed_at },
          ].map(({ label, icon: Icon, value }) => (
            <div key={label} className="tl-item">
              <div className={`tl-dot ${value ? "on" : ""}`} />
              <dl>
                <dt>{label}</dt>
                <dd className={value ? "" : "empty"}>{value ? fmt(value) : "Pending"}</dd>
              </dl>
            </div>
          ))}
        </div>
      </div>

      {/* ── Description ── */}
      <div className="content-card">
        <div className="content-title"><FileText size={12} /> Application Description</div>
        <p>{app.description}</p>
      </div>

      {/* ── Reviewer comment ── */}
      <div className="content-card">
        <div className="content-title"><MessageSquare size={12} /> Reviewer Comment</div>
        {app.reviewer_comment
          ? <div className="reviewer-box">{app.reviewer_comment}</div>
          : <p style={{ color: "var(--text-3)", fontStyle: "italic", fontSize: 13 }}>
              No reviewer comment yet.
            </p>
        }
        {app.reviewed_by_username && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-3)" }}>
            <Shield size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
            Reviewed by <strong>{app.reviewed_by_username}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
