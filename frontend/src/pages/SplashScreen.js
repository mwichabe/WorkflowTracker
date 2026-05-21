import { useEffect, useState } from "react";
import {
  FileText, ArrowRight, GitBranch, Shield, BarChart3,
  CheckCircle, Clock, XCircle, HelpCircle,
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

.spl-btn-ghost {
  display: inline-flex; align-items: center; gap: 7px;
  background: transparent;
  color: #7572A8;
  font-size: 13.5px; font-weight: 500;
  padding: 12px 20px; border-radius: 11px;
  border: 1px solid #D9D6EE;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.spl-btn-ghost:hover { border-color: #B0ABDC; color: #4A47A3; background: #F0EEF9; }

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
.spl-mock-body { padding: 16px; }

.spl-msc { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: 14px; }
.spl-msc-card {
  background: #FAF9FC;
  border: 1px solid #EDE9F8;
  border-radius: 10px; padding: 10px 12px;
}
.spl-msc-n { font-size: 20px; font-weight: 600; letter-spacing: -0.04em; line-height: 1; font-family: 'Lora', serif; }
.spl-msc-l { font-size: 9.5px; color: #B0ACBF; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

.spl-mtbl { width: 100%; border-collapse: collapse; }
.spl-mth {
  font-size: 9px; font-weight: 600; color: #C4C0D4;
  text-transform: uppercase; letter-spacing: 0.07em;
  padding: 0 8px 8px 0; text-align: left;
}
.spl-mtr td { padding: 7px 8px 7px 0; border-top: 1px solid #F3F0FA; }
.spl-mnm { font-size: 11.5px; font-weight: 500; color: #1A1730; }
.spl-mco { font-size: 10px; color: #B0ACBF; margin-top: 1px; }
.spl-mbadge {
  display: inline-block; font-size: 9.5px; font-weight: 600;
  padding: 3px 9px; border-radius: 20px;
}

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

const MOCK_STATS = [
  { n: "14", l: "Total",     c: "#534AB7" },
  { n: "4",  l: "Approved",  c: "#0F7A56" },
  { n: "3",  l: "Reviewing", c: "#9A5C0A" },
  { n: "2",  l: "Pending",   c: "#1D6FA8" },
];

const MOCK_ROWS = [
  { nm: "James Omondi",  co: "Savannah Ltd", status: "Approved",      bg: "#E8F5EE", cl: "#0F7A56" },
  { nm: "Amina Wanjiru", co: "Karibu Co.",   status: "Under Review",  bg: "#FEF3E2", cl: "#9A5C0A" },
  { nm: "David Mutua",   co: "Peak Group",   status: "Submitted",     bg: "#E4EFFE", cl: "#1D4FA8" },
  { nm: "Grace Njeri",   co: "Blue Valley",  status: "Need Info",     bg: "#F0EEFE", cl: "#534AB7" },
  { nm: "Peter Kariuki", co: "Summit Corp",  status: "Rejected",      bg: "#FDEAEA", cl: "#A32D2D" },
];

function AppMockup() {
  return (
    <div className="spl-mock">
      <div className="spl-mock-bar">
        <div className="spl-dots">
          {["#FFBDBA", "#FFD8A8", "#A8E6C1"].map(c => (
            <div key={c} className="spl-dot" style={{ background: c }} />
          ))}
        </div>
        <span className="spl-mock-label">WorkflowTracker — Applications</span>
      </div>
      <div className="spl-mock-body">
        <div className="spl-msc">
          {MOCK_STATS.map(s => (
            <div key={s.l} className="spl-msc-card">
              <div className="spl-msc-n" style={{ color: s.c }}>{s.n}</div>
              <div className="spl-msc-l">{s.l}</div>
            </div>
          ))}
        </div>
        <table className="spl-mtbl">
          <thead>
            <tr>
              <th className="spl-mth">Applicant</th>
              <th className="spl-mth">Company</th>
              <th className="spl-mth">Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ROWS.map(r => (
              <tr key={r.nm} className="spl-mtr">
                <td><div className="spl-mnm">{r.nm}</div></td>
                <td><div className="spl-mco">{r.co}</div></td>
                <td>
                  <span className="spl-mbadge" style={{ background: r.bg, color: r.cl }}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <button className="spl-btn-ghost">
                View docs
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
            <AppMockup />
          </div>
        </div>

        <div className="spl-trust">
          {["Django 4.2", "React 18", "JWT Auth", "Role-based Access", "RESTful API", "MongoDB"].flatMap((item, i, arr) => [
            <span key={item} className="spl-trust-item">{item}</span>,
            i < arr.length - 1 ? <span key={`sep-${i}`} className="spl-trust-sep" /> : null,
          ])}
        </div>
      </div>
    </>
  );
}