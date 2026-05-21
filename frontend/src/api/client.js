const BASE = "/api/applications";

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

export const api = {
  list:        (status) => request(status ? `/?status=${encodeURIComponent(status)}` : "/"),
  get:         (id)     => request(`/${id}`),
  create:      (body)   => request("/",              { method: "POST", body: JSON.stringify(body) }),
  update:      (id, body) => request(`/${id}`,       { method: "PUT",  body: JSON.stringify(body) }),
  submit:      (id)     => request(`/${id}/submit`,      { method: "POST" }),
  startReview: (id)     => request(`/${id}/start-review`,{ method: "POST" }),
  decide:      (id, body) => request(`/${id}/decision`,  { method: "POST", body: JSON.stringify(body) }),
  delete:      (id)       => request(`/${id}`,            { method: "DELETE" }),
};
