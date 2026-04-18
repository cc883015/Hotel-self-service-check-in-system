// API client. Uses same-origin by default (dev via Vite proxy; prod via Pages rewrite).
// Override with VITE_API_BASE if the Worker is on a different domain.

const BASE = import.meta.env.VITE_API_BASE || "";

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    ...opts,
  });
  if (!res.ok) {
    let body = null;
    try { body = await res.json(); } catch {}
    const err = new Error(body?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  const ct = res.headers.get("Content-Type") || "";
  if (ct.includes("application/json")) return res.json();
  return res;
}

export const api = {
  // Public
  lookup: (name) => request("/api/lookup", { method: "POST", body: JSON.stringify({ name }) }),

  // Auth
  login:  (username, password) =>
    request("/api/admin/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request("/api/admin/logout", { method: "POST" }),
  me:     () => request("/api/admin/me"),

  // Guests
  listGuests:  () => request("/api/admin/guests"),
  addGuest:    (data) => request("/api/admin/guests", { method: "POST", body: JSON.stringify(data) }),
  deleteGuest: (id)   => request(`/api/admin/guests/${id}`, { method: "DELETE" }),

  // Export — returns raw Response for blob download
  exportCSV: () => fetch(`${BASE}/api/admin/export`, { credentials: "include" }),

  // Settings
  getSettings:    () => request("/api/admin/settings"),
  updateSettings: (data) =>
    request("/api/admin/settings", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (current_password, new_password) =>
    request("/api/admin/password", {
      method: "PUT",
      body: JSON.stringify({ current_password, new_password }),
    }),
};
