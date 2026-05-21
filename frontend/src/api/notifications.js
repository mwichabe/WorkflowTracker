const BASE = "/api/auth";

function authHeaders() {
  const token = localStorage.getItem("wt_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeaders(), ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export const notificationsApi = {
  list:        () => request("/notifications"),
  markAllRead: () => request("/notifications/read-all", { method: "POST" }),
  requestAdmin:(body) => request("/request-admin", { method: "POST", body: JSON.stringify(body) }),
  adminRequestStatus: () => request("/admin-request-status"),
};
