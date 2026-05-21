import { useState } from "react";
import {
  FileText, User, Mail, Lock, Eye, EyeOff,
  LogIn, UserPlus, Ghost, AlertCircle,
} from "lucide-react";
import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

/* ── small reusable field components ── */
function Field({ label, required, children }) {
  return (
    <div className="auth-fg">
      <label>
        {label}{required && <span className="auth-req"> *</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ icon: Icon, ...props }) {
  return (
    <div className="auth-input-wrap">
      <Icon size={14} />
      <input className="auth-input" {...props} />
    </div>
  );
}

function PwInput({ show, onToggle, ...props }) {
  return (
    <div className="auth-pw-wrap">
      <Lock size={14} className="auth-pw-lock" />
      <input
        className="auth-input auth-pw-input"
        type={show ? "text" : "password"}
        {...props}
      />
      <button type="button" className="auth-pw-toggle" onClick={onToggle} tabIndex={-1}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div className="auth-error-box">
      <AlertCircle size={14} />
      <span>{msg}</span>
    </div>
  );
}

export default function AuthPage() {
  const { login, continueAsGuest } = useAuth();
  const [tab, setTab]         = useState("login");
  const [loading, setLoading] = useState(false);

  /* per-tab error messages */
  const [loginErr,  setLoginErr]  = useState("");
  const [regErr,    setRegErr]    = useState("");

  /* show-password flags */
  const [showLp,  setShowLp]  = useState(false);
  const [showRp,  setShowRp]  = useState(false);
  const [showRp2, setShowRp2] = useState(false);

  /* login fields */
  const [lu, setLu] = useState("");
  const [lp, setLp] = useState("");

  /* register fields */
  const [rFirst, setRFirst] = useState("");
  const [rLast,  setRLast]  = useState("");
  const [rUser,  setRUser]  = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPw,    setRPw]    = useState("");
  const [rPw2,   setRPw2]   = useState("");

  function switchTab(t) {
    setTab(t);
    setLoginErr("");
    setRegErr("");
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginErr("");
    if (!lu.trim()) return setLoginErr("Username is required.");
    if (!lp)        return setLoginErr("Password is required.");
    setLoading(true);
    try {
      const { token, user } = await authApi.login(lu.trim(), lp);
      login(token, user);
      toast.success(`Welcome back, ${user.first_name || user.username}!`);
    } catch (err) {
      setLoginErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setRegErr("");
    if (!rUser.trim())  return setRegErr("Username is required.");
    if (!rEmail.trim()) return setRegErr("Email is required.");
    if (!rPw)           return setRegErr("Password is required.");
    if (rPw.length < 6) return setRegErr("Password must be at least 6 characters.");
    if (rPw !== rPw2)   return setRegErr("Passwords do not match.");
    setLoading(true);
    try {
      const { token, user } = await authApi.register(
        rUser.trim(), rEmail.trim(), rPw,
        rFirst.trim(), rLast.trim(),
      );
      login(token, user);
      toast.success(`Account created! Welcome, ${user.first_name || user.username}!`);
    } catch (err) {
      setRegErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay">
      <div className="auth-panel">

        {/* logo */}
        <div className="auth-logo">
          <FileText size={22} color="#fff" strokeWidth={2} />
        </div>
        <h2 className="auth-title">WorkflowTracker</h2>
        <p className="auth-sub">
          {tab === "login" ? "Sign in to your account" : "Create a new account"}
        </p>

        {/* tabs */}
        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === "login" ? " active" : ""}`}
            onClick={() => switchTab("login")}
          >
            <LogIn size={13} strokeWidth={2} /> Sign In
          </button>
          <button
            className={`auth-tab${tab === "register" ? " active" : ""}`}
            onClick={() => switchTab("register")}
          >
            <UserPlus size={13} strokeWidth={2} /> Register
          </button>
        </div>

        {/* ── LOGIN ── */}
        {tab === "login" && (
          <form onSubmit={handleLogin} autoComplete="off" noValidate>
            <ErrorBox msg={loginErr} />

            <Field label="Username">
              <TextInput
                icon={User}
                placeholder="your_username"
                value={lu}
                onChange={(e) => { setLu(e.target.value); setLoginErr(""); }}
                autoFocus
                autoComplete="username"
              />
            </Field>

            <Field label="Password">
              <PwInput
                show={showLp}
                onToggle={() => setShowLp(v => !v)}
                placeholder="••••••••"
                value={lp}
                onChange={(e) => { setLp(e.target.value); setLoginErr(""); }}
                autoComplete="current-password"
              />
            </Field>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>

            <p className="auth-hint">
              No account yet?{" "}
              <button type="button" className="auth-hint-link" onClick={() => switchTab("register")}>
                Register here
              </button>
            </p>
          </form>
        )}

        {/* ── REGISTER ── */}
        {tab === "register" && (
          <form onSubmit={handleRegister} autoComplete="off" noValidate>
            <ErrorBox msg={regErr} />

            <div className="auth-field-row">
              <Field label="First Name">
                <TextInput icon={User} placeholder="Jane" value={rFirst}
                  onChange={(e) => setRFirst(e.target.value)} />
              </Field>
              <Field label="Last Name">
                <TextInput icon={User} placeholder="Doe" value={rLast}
                  onChange={(e) => setRLast(e.target.value)} />
              </Field>
            </div>

            <Field label="Username" required>
              <TextInput
                icon={User}
                placeholder="jane_doe"
                value={rUser}
                onChange={(e) => { setRUser(e.target.value); setRegErr(""); }}
                autoFocus
                autoComplete="username"
              />
            </Field>

            <Field label="Email" required>
              <TextInput
                icon={Mail}
                type="email"
                placeholder="jane@example.com"
                value={rEmail}
                onChange={(e) => { setREmail(e.target.value); setRegErr(""); }}
                autoComplete="email"
              />
            </Field>

            <div className="auth-field-row">
              <Field label="Password" required>
                <PwInput
                  show={showRp}
                  onToggle={() => setShowRp(v => !v)}
                  placeholder="min. 6 chars"
                  value={rPw}
                  onChange={(e) => { setRPw(e.target.value); setRegErr(""); }}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm Password">
                <PwInput
                  show={showRp2}
                  onToggle={() => setShowRp2(v => !v)}
                  placeholder="repeat password"
                  value={rPw2}
                  onChange={(e) => { setRPw2(e.target.value); setRegErr(""); }}
                  autoComplete="new-password"
                />
              </Field>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? "Creating account…" : "Create Account"}
            </button>

            <p className="auth-hint">
              Already have an account?{" "}
              <button type="button" className="auth-hint-link" onClick={() => switchTab("login")}>
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* divider + guest */}
        <div className="auth-divider">or</div>
        <button className="auth-guest" onClick={continueAsGuest}>
          <Ghost size={15} strokeWidth={2} />
          Continue as Guest
        </button>
        <p className="auth-guest-note">
          Guest mode gives read-only access. Sign in to create or manage applications.
        </p>
      </div>
    </div>
  );
}
