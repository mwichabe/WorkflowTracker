import { useEffect, useState } from "react";
import {
  FileText, ArrowRight, GitBranch, Shield, BarChart3,
  CheckCircle, Clock, XCircle, HelpCircle, Send,
} from "lucide-react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.spl {
  position: fixed; inset: 0;
  background: #F7F5F0;
  font-family: 'DM Sans', sans-serif;
  display: flex; flex-direction: column;
  overflow: hidden;
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.spl-out { opacity: 0; transform: scale(1.015); pointer-events: none; }

.spl-bg-mark {
  position: absolute;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: #EAE6FC;
  top: -180px; right: -140px;
  pointer-events: none;
  opacity: 0.55;
}
.spl-bg-mark-2 {
  position: absolute;
  width: 340px; height: 340px;
  border-radius: 50%;
  background: #D9F0E8;
  bottom: -80px; left: -60px;
  pointer-events: none;
  opacity: 0.45;
}

.spl-main {
  flex: 1;
  display: flex;
  align-items: center;
  max-width: 1180px;
  width: 100%;
  margin: 0 auto;
  padding: 0 64px;
  gap: 80px;
  position: relative; z-index: 1;
}

.spl-left {
  flex: 1;
  max-width: 520px;
  opacity: 0; transform: translateY(24px);
  transition: opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s;
}
.spl-left.vis { opacity: 1; transform: translateY(0); }

.spl-right {
  flex: 1;
  opacity: 0; transform: translateY(18px);
  transition: opacity 0.8s ease 0.28s, transform 0.8s ease 0.28s;
}
.spl-right.vis { opacity: 1; transform: translateY(0); }

.spl-nav {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 52px;
}
.spl-logo {
  width: 36px; height: 36px; border-radius: 10px;
  background: #2E2A5E;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.spl-brand { font-size: 15px; font-weight: 600; color: #1A1730; letter-spacing: -0.02em; }
.spl-ver {
  margin-left: auto;
  font-size: 10.5px; font-weight: 500;
  color: #9896A4;
  background: #ECEAF3; border: 1px solid #DDD9F0;
  padding: 3px 11px; border-radius: 20px;
  letter-spacing: 0.04em;
}

.spl-eyebrow {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #5C58A0;
  margin-bottom: 18px;
}
.spl-eyebrow-line {
  width: 22px; height: 1.5px;
  background: #5C58A0; border-radius: 2px;
}

.spl-h1 {
  font-family: 'Lora', serif;
  font-size: clamp(34px, 3.8vw, 52px);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: #1A1730;
  margin-bottom: 20px;
}
.spl-h1 em {
  font-style: italic;
  color: #4A47A3;
}

.spl-sub {
  font-size: 15.5px;
  color: #6B6878;
  line-height: 1.72;
  max-width: 430px;
  margin-bottom: 36px;
  font-weight: 400;
}

.spl-feats { display: flex; flex-direction: column; gap: 14px; margin-bottom: 38px; }
.spl-feat { display: flex; align-items: flex-start; gap: 13px; }
.spl-feat-ico {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; margin-top: 1px;
}
.spl-feat-title {
  font-size: 13.5px; font-weight: 600;
  color: #1A1730; line-height: 1.3;
}
.spl-feat-desc {
  font-size: 12px; color: #8E8B9A;
  margin-top: 3px; line-height: 1.55;
}

.spl-cta-row { display: flex; align-items: center; gap: 14px; }
.spl-btn-go {
  display: inline-flex; align-items: center; gap: 9px;
  background: #2E2A5E;
  color: #fff;
  font-size: 14.5px; font-weight: 500;
  padding: 13px 26px; border-radius: 11px; border: none;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  letter-spacing: -0.01em;
  transition: background 0.2s ease, transform 0.2s ease;
}
.spl-btn-go:hover { background: #3D3880; transform: translateY(-2px); }
.spl-btn-go:active { transform: translateY(0); }

.spl-divider {
  margin-top: 32px; padding-top: 28px;
  border-top: 1px solid #E4E0F0;
  display: flex; gap: 28px;
}
.spl-stat-val {
  font-family: 'Lora', serif;
  font-size: 24px; font-weight: 500;
  line-height: 1; letter-spacing: -0.02em;
}
.spl-stat-lbl {
  font-size: 11px; color: #A09DAE; margin-top: 5px; font-weight: 400;
}

/* ── Workflow visual card ── */
.spl-mock {
  background: #FFFFFF;
  border: 1px solid #E8E4F0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(46,42,94,0.09), 0 2px 8px rgba(46,42,94,0.05);
}
.spl-mock-bar {
  background: #FAFAF9;
  border-bottom: 1px solid #F0EDF7;
  padding: 12px 16px;
  display: flex; align-items: center; gap: 7px;
}
.spl-dots { display: flex; gap: 5px; }
.spl-dot { width: 8px; height: 8px; border-radius: 50%; }
.spl-mock-label {
  font-size: 10.5px; font-weight: 500;
  color: #C4C0D4; margin-left: 8px; letter-spacing: 0.02em;
}

.spl-wf-body { padding: 18px 20px 20px; }

.spl-wf-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
}
.spl-wf-title {
  font-size: 11px; font-weight: 600; color: #9896A4;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.spl-wf-sub {
  font-size: 10px; color: #C4C0D4; font-weight: 400;
}

.spl-wf-step {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 5px 8px; border-radius: 9px;
  transition: background 0.3s ease;
  cursor: default;
}
.spl-wf-step.active { background: #F7F5FE; }

.spl-wf-connector {
  display: flex; flex-direction: column; align-items: center;
  flex-shrink: 0;
}
.spl-wf-dot {
  width: 30px; height: 30px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: transform 0.3s ease;
}
.spl-wf-step.active .spl-wf-dot { transform: scale(1.08); }
.spl-wf-line {
  width: 1.5px; height: 14px;
  background: #EDE9F8; margin: 3px 0;
}

.spl-wf-info { padding-top: 6px; flex: 1; min-width: 0; }
.spl-wf-lbl {
  font-size: 12.5px; font-weight: 600; color: #1A1730;
  transition: color 0.3s ease; line-height: 1;
}
.spl-wf-desc {
  font-size: 10.5px; color: #9896A4; margin-top: 3px;
  animation: wf-fadein 0.3s ease;
}
@keyframes wf-fadein { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }

.spl-wf-badge {
  margin-top: 6px; flex-shrink: 0;
  padding: 3px 9px; border-radius: 20px;
  font-size: 9.5px; font-weight: 600;
  display: flex; align-items: center; gap: 4px;
  animation: wf-fadein 0.3s ease;
}

.spl-wf-pulse {
  width: 8px; height: 8px; border-radius: 50%;
  margin-top: 11px; flex-shrink: 0;
}
@keyframes wf-pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
  50% { opacity: 0.6; transform: scale(0.75); }
}

.spl-wf-divider {
  margin: 12px 0 10px;
  border: none; border-top: 1px dashed #EDE9F8;
}

.spl-wf-branches {
  display: flex; gap: 8px; padding: 2px 8px;
}
.spl-wf-branch-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px;
  font-size: 10px; font-weight: 600;
}

.spl-wf-roles {
  margin-top: 14px; padding-top: 12px;
  border-top: 1px solid #F0EDF7;
  display: flex; gap: 7px; flex-wrap: wrap;
}
.spl-wf-role-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 11px; border-radius: 20px;
  font-size: 10px; font-weight: 500; color: #534AB7;
  background: #EEEDFC; border: 1px solid #DDD9F0;
}

/* ── Trust strip ── */
.spl-trust {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 13px 24px;
  border-top: 1px solid #EAE7F3;
  position: relative; z-index: 1; flex-wrap: wrap;
}
.spl-trust-item { font-size: 10.5px; font-weight: 500; color: #C0BDCE; letter-spacing: 0.04em; }
.spl-trust-sep  { width: 3px; height: 3px; border-radius: 50%; background: #DDD9EE; flex-shrink: 0; }

@media (max-width: 1040px) {
  .spl-main { padding: 0 40px; gap: 48px; }
}
@media (max-width: 860px) {
  .spl-main {
    flex-direction: column; padding: 32px 32px 16px;
    align-items: flex-start; justify-content: center;
    overflow-y: auto; height: 100%;
  }
  .spl-right { display: none; }
  .spl-left  { max-width: 100%; }
  .spl-nav   { margin-bottom: 36px; }
}
@media (max-width: 520px) {
  .spl-main { padding: 24px 22px 12px; }
  .spl-h1   { font-size: 32px; }
}
`;

const FEATURES = [
  {
    Icon: GitBranch,
    icoBg: "#EEEDFC", icoColor: "#534AB7",
    title: "End-to-end lifecycle",
    desc: "Enforced status transitions from Draft through to a final decision",
  },
  {
    Icon: Shield,
    icoBg: "#E2F5EE", icoColor: "#0F7A56",
    title: "Admin-controlled reviews",
    desc: "Only admins can start reviews and record decisions",
  },
  {
    Icon: BarChart3,
    icoBg: "#FEF3E2", icoColor: "#9A5C0A",
    title: "Live analytics",
    desc: "Status breakdowns and instant refresh when decisions land",
  },
];

const PIPELINE = [
  {
    label: "Draft",
    Icon: FileText,
    color: "#534AB7", bg: "#EEEDFC",
    desc: "Create and edit your application before submitting",
  },
  {
    label: "Submitted",
    Icon: Send,
    color: "#1D6FA8", bg: "#E4EFFE",
    desc: "Application queued and waiting for an admin to pick it up",
  },
  {
    label: "Under Review",
    Icon: Clock,
    color: "#9A5C0A", bg: "#FEF3E2",
    desc: "An admin has opened your application and is evaluating it",
  },
  {
    label: "Approved",
    Icon: CheckCircle,
    color: "#0F7A56", bg: "#E8F5EE",
    desc: "Decision recorded — application accepted",
  },
];

const BRANCHES = [
  { label: "Rejected",       Icon: XCircle,   color: "#A32D2D", bg: "#FDEAEA" },
  { label: "Need More Info", Icon: HelpCircle, color: "#534AB7", bg: "#F0EEFE" },
];

const ROLES = ["Super Admin", "Admin", "User / Guest"];

function WorkflowVisual() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % PIPELINE.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="spl-mock">
      <div className="spl-mock-bar">
        <div className="spl-dots">
          {["#FFBDBA", "#FFD8A8", "#A8E6C1"].map(c => (
            <div key={c} className="spl-dot" style={{ background: c }} />
          ))}
        </div>
        <span className="spl-mock-label">WorkflowTracker — Pipeline</span>
      </div>

      <div className="spl-wf-body">
        <div className="spl-wf-header">
          <span className="spl-wf-title">Application lifecycle</span>
          <span className="spl-wf-sub">4 stages · role-gated</span>
        </div>

        {PIPELINE.map(({ label, Icon, color, bg, desc }, i) => {
          const isActive = active === i;
          return (
            <div key={label} className={`spl-wf-step${isActive ? " active" : ""}`}>
              <div className="spl-wf-connector">
                <div className="spl-wf-dot" style={{ background: bg }}>
                  <Icon size={13} color={color} strokeWidth={2} />
                </div>
                {i < PIPELINE.length - 1 && <div className="spl-wf-line" />}
              </div>
              <div className="spl-wf-info">
                <div className="spl-wf-lbl" style={{ color: isActive ? color : "#1A1730" }}>
                  {label}
                </div>
                {isActive && <div className="spl-wf-desc">{desc}</div>}
              </div>
              {isActive && (
                <div
                  className="spl-wf-pulse"
                  style={{
                    background: color,
                    animation: "wf-pulse 1.4s ease-in-out infinite",
                  }}
                />
              )}
            </div>
          );
        })}

        <hr className="spl-wf-divider" />

        <div className="spl-wf-branches">
          {BRANCHES.map(({ label, Icon, color, bg }) => (
            <span key={label} className="spl-wf-branch-chip" style={{ background: bg, color }}>
              <Icon size={10} strokeWidth={2.5} />
              {label}
            </span>
          ))}
        </div>

        <div className="spl-wf-roles">
          {ROLES.map(r => (
            <span key={r} className="spl-wf-role-chip">{r}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SplashScreen({ onDone }) {
  const [vis, setVis]         = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVis(true), 80);
    return () => clearTimeout(t);
  }, []);

  function handleGo() {
    setLeaving(true);
    setTimeout(onDone, 480);
  }

  return (
    <>
      <style>{CSS}</style>
      <div className={`spl${leaving ? " spl-out" : ""}`}>
        <div className="spl-bg-mark" />
        <div className="spl-bg-mark-2" />

        <div className="spl-main">
          {/* LEFT */}
          <div className={`spl-left${vis ? " vis" : ""}`}>
            <div className="spl-nav">
              <div className="spl-logo">
                <FileText size={16} color="#fff" strokeWidth={2} />
              </div>
              <span className="spl-brand">WorkflowTracker</span>
              <span className="spl-ver">v1.0</span>
            </div>

            <div className="spl-eyebrow">
              <div className="spl-eyebrow-line" />
              Application Management Platform
            </div>

            <h1 className="spl-h1">
              Every application,<br />
              <em>tracked and decided.</em>
            </h1>

            <p className="spl-sub">
              A structured workflow platform for submitting, reviewing, and deciding
              on applications — with full audit trails and role-based access at every step.
            </p>

            <div className="spl-feats">
              {FEATURES.map(({ Icon, icoBg, icoColor, title, desc }) => (
                <div key={title} className="spl-feat">
                  <div className="spl-feat-ico" style={{ background: icoBg }}>
                    <Icon size={14} color={icoColor} strokeWidth={2} />
                  </div>
                  <div>
                    <div className="spl-feat-title">{title}</div>
                    <div className="spl-feat-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="spl-cta-row">
              <button className="spl-btn-go" onClick={handleGo}>
                Get started <ArrowRight size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="spl-divider">
              {[
                { val: "6",  lbl: "Workflow stages", color: "#534AB7" },
                { val: "3",  lbl: "Access roles",    color: "#0F7A56" },
                { val: "∞",  lbl: "Applications",    color: "#1D6FA8" },
              ].map(s => (
                <div key={s.lbl}>
                  <div className="spl-stat-val" style={{ color: s.color }}>{s.val}</div>
                  <div className="spl-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className={`spl-right${vis ? " vis" : ""}`}>
            <WorkflowVisual />
          </div>
        </div>

        <div className="spl-trust">
          {["Django 4.2", "React 18", "JWT Auth", "Role-based Access", "RESTful API", "PostgreSQL"].flatMap((item, i, arr) => [
            <span key={item} className="spl-trust-item">{item}</span>,
            i < arr.length - 1 ? <span key={`sep-${i}`} className="spl-trust-sep" /> : null,
          ])}
        </div>
      </div>
    </>
  );
}
