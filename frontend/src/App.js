import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { FileText, LayoutList, Plus, GitBranch, LogOut, Ghost, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ApplicationList   from "./pages/ApplicationList";
import ApplicationForm   from "./pages/ApplicationForm";
import ApplicationDetail from "./pages/ApplicationDetail";
import SplashScreen      from "./pages/SplashScreen";
import AuthPage          from "./pages/AuthPage";
import AdminDashboard    from "./pages/AdminDashboard";
import ChatBot           from "./components/ChatBot";
import NotificationBell  from "./components/NotificationBell";
import { STATUS_META }   from "./components/StatusBadge";
import { api }           from "./api/client";
import { notificationsApi } from "./api/notifications";
import "./index.css";

function SidebarUser() {
  const { user, isGuest, logout } = useAuth();
  const initials = user
    ? ((user.first_name?.[0] || "") + (user.last_name?.[0] || "")).toUpperCase() ||
      user.username[0].toUpperCase()
    : "G";

  function handleLogout() {
    toast.success("Signed out — token cleared.");
    logout();
  }

  return (
    <div className="sbu">
      <div className={`sbu-avatar${isGuest ? " guest" : ""}`}>
        {isGuest ? <Ghost size={13} strokeWidth={2} color="rgba(255,255,255,.6)" /> : initials}
      </div>
      <div>
        <div className="sbu-name">
          {isGuest ? "Guest" : user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : user?.username}
        </div>
        <div className="sbu-role">
          {isGuest ? "Read-only access"
            : user?.is_superuser ? "Super Admin"
            : user?.is_staff ? "Admin"
            : "Authenticated"}
        </div>
      </div>
      <div className="sbu-spacer" />
      <NotificationBell />
      <button className="sbu-logout" title="Sign out" onClick={handleLogout}>
        <LogOut size={14} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ── Sidebar ────────────────────────────────────────────── */
function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAdmin, isGuest, user } = useAuth();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    api.list().then((apps) => {
      const c = {};
      Object.keys(STATUS_META).forEach((k) => {
        c[k] = apps.filter((a) => a.status === k).length;
      });
      setCounts(c);
    }).catch(() => {});
  }, [pathname]);

  // "Apply to be Admin" state
  const [reqStatus, setReqStatus] = useState(null);
  const [reqLoading, setReqLoading] = useState(false);

  useEffect(() => {
    if (!isGuest && user && !isAdmin) {
      notificationsApi.adminRequestStatus()
        .then(data => setReqStatus(data.status))
        .catch(() => setReqStatus(null));
    }
  }, [isGuest, user, isAdmin]);

  async function applyForAdmin() {
    setReqLoading(true);
    try {
      await notificationsApi.requestAdmin({ reason: "" });
      setReqStatus("pending");
      toast.success("Your admin request has been submitted!");
    } catch (e) {
      toast.error(e.message || "Failed to submit request");
    } finally {
      setReqLoading(false);
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand" onClick={() => navigate("/")}>
        <div className="sidebar-logo">
          <FileText size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div className="sidebar-name">WorkflowTracker</div>
          <div className="sidebar-tagline">Application Management</div>
        </div>
      </div>

      <div className="sidebar-sep" />

      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        <button
          className={`sidebar-link ${pathname === "/" ? "active" : ""}`}
          onClick={() => navigate("/")}
        >
          <LayoutList size={15} strokeWidth={2} />
          <span>Applications</span>
          {Object.values(counts).reduce((s, v) => s + v, 0) > 0 && (
            <span className="link-badge">
              {Object.values(counts).reduce((s, v) => s + v, 0)}
            </span>
          )}
        </button>

        {!isGuest && (
          <button className="sidebar-link" onClick={() => navigate("/new")}>
            <GitBranch size={15} strokeWidth={2} />
            <span>New Application</span>
          </button>
        )}

        {isAdmin && (
          <>
            <div className="sidebar-sep" style={{ margin: "8px 0" }} />
            <div className="sidebar-section-label">Admin</div>
            <button
              className={`sidebar-link ${pathname === "/admin" ? "active" : ""}`}
              onClick={() => navigate("/admin")}
            >
              <Shield size={15} strokeWidth={2} />
              <span>Admin Dashboard</span>
            </button>
          </>
        )}
      </div>

      <div className="sidebar-spacer" />

      {Object.keys(counts).length > 0 && (
        <div className="sidebar-status-panel">
          <div className="sidebar-status-title">Status Breakdown</div>
          {Object.entries(STATUS_META).map(([key, meta]) =>
            counts[key] > 0 ? (
              <div
                key={key}
                className="sidebar-status-row"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/")}
              >
                <div className="sidebar-status-dot" style={{ background: meta.color }} />
                <span className="sidebar-status-name">{meta.label}</span>
                <span className="sidebar-status-count">{counts[key]}</span>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Apply to be Admin — shown to regular authenticated users only */}
      {!isGuest && user && !isAdmin && (
        <div className="sidebar-admin-req">
          {reqStatus === "pending" && (
            <div className="adm-req-badge adm-req-badge-pending">
              <Shield size={11} /> Admin request pending…
            </div>
          )}
          {reqStatus === "rejected" && (
            <div className="adm-req-badge adm-req-badge-rejected">
              <Shield size={11} /> Request rejected
              <button className="adm-reapply-link" onClick={applyForAdmin} disabled={reqLoading}>
                Re-apply
              </button>
            </div>
          )}
          {reqStatus === "approved" && (
            <div className="adm-req-badge adm-req-badge-approved">
              <Shield size={11} /> Admin approved!
            </div>
          )}
          {reqStatus === null && (
            <button
              className="sidebar-admin-apply-btn"
              onClick={applyForAdmin}
              disabled={reqLoading}
            >
              <Users size={13} strokeWidth={2} />
              {reqLoading ? "Requesting…" : "Apply to be Admin"}
            </button>
          )}
        </div>
      )}

      <SidebarUser />

      {!isGuest && (
        <button className="sidebar-new-btn" onClick={() => navigate("/new")}>
          <Plus size={14} strokeWidth={2.5} />
          New Application
        </button>
      )}
    </aside>
  );
}

/* ── Auth guard wrapper ─────────────────────────────────── */
function AdminGuard({ children }) {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);
  return isAdmin ? children : null;
}

/* ── Main shell ─────────────────────────────────────────── */
function Shell() {
  const { isAuthenticated } = useAuth();
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem("splash_seen") === "1"
  );

  function handleSplashDone() {
    sessionStorage.setItem("splash_seen", "1");
    setSplashDone(true);
  }

  if (!splashDone) return <SplashScreen onDone={handleSplashDone} />;
  if (!isAuthenticated) return <AuthPage />;

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="content-area">
          <div className="content-inner">
            <Routes>
              <Route path="/"         element={<ApplicationList />} />
              <Route path="/new"      element={<ApplicationForm />} />
              <Route path="/admin"    element={<AdminGuard><AdminDashboard /></AdminGuard>} />
              <Route path="/:id"      element={<ApplicationDetail />} />
              <Route path="/:id/edit" element={<ApplicationForm />} />
            </Routes>
          </div>
        </div>
      </div>
      <ChatBot />
    </BrowserRouter>
  );
}

/* ── Root ───────────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "10px",
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          },
          success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
        }}
      />
      <Shell />
    </AuthProvider>
  );
}
