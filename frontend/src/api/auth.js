const BASE = "/api/auth";

async function request(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export const authApi = {
  login:    (username, password) => request("/login",    { username, password }),
  register: (username, email, password, first_name, last_name) =>
    request("/register", { username, email, password, first_name, last_name }),
};
