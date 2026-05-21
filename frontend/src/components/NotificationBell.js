import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCheck, Shield, FileText, X } from "lucide-react";
import { notificationsApi } from "../api/notifications";
import { useAuth } from "../context/AuthContext";

function fmtRelative(dt) {
  const diff = Date.now() - new Date(dt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const { isGuest } = useAuth();
  const [notifs, setNotifs]   = useState([]);
  const [open, setOpen]       = useState(false);
  const panelRef = useRef(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await notificationsApi.list();
      setNotifs(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (isGuest) return;
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs, isGuest]);

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    try {
      await notificationsApi.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  }

  if (isGuest) return null;

  const unread = notifs.filter(n => !n.is_read).length;

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button
        className={`notif-btn${open ? " notif-btn-open" : ""}`}
        onClick={() => { setOpen(v => !v); if (!open) fetchNotifs(); }}
        title="Notifications"
      >
        <Bell size={15} strokeWidth={2} />
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <span>Notifications</span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {unread > 0 && (
                <button className="notif-mark-read" onClick={markAllRead} title="Mark all read">
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button className="notif-close" onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="notif-list">
            {notifs.length === 0 ? (
              <div className="notif-empty">
                <Bell size={22} strokeWidth={1.5} />
                <span>No notifications yet</span>
              </div>
            ) : (
              notifs.slice(0, 15).map((n) => (
                <div key={n.id} className={`notif-item${n.is_read ? " notif-read" : ""}`}>
                  <div className={`notif-icon ${n.type === "admin_request" ? "notif-icon-admin" : "notif-icon-status"}`}>
                    {n.type === "admin_request" ? <Shield size={12} /> : <FileText size={12} />}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-msg">{n.message}</div>
                    <div className="notif-time">{fmtRelative(n.created_at)}</div>
                  </div>
                  {!n.is_read && <div className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
