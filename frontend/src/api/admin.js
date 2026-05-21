const BASE = "/api/admin";

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

export const adminApi = {
  stats:          ()          => request("/stats"),
  users:          ()          => request("/users"),
  adminRequests:  ()          => request("/requests"),
  reviewRequest:  (id, body)  => request(`/requests/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};
