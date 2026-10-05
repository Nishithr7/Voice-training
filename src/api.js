// Thin fetch wrappers for the local server.

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const msg = body?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.detail = body?.detail;
    throw err;
  }
  return body;
}

export const api = {
  health: () => request("/api/health"),

  getFeedback: (payload) => request("/api/feedback", { method: "POST", body: JSON.stringify(payload) }),

  listAttempts: (category) =>
    request(`/api/attempts${category ? `?category=${encodeURIComponent(category)}` : ""}`),
  deleteAttempt: (id) => request(`/api/attempts/${encodeURIComponent(id)}`, { method: "DELETE" }),

  getFocus: () => request("/api/focus"),
  setFocus: (focus) => request("/api/focus", { method: "PUT", body: JSON.stringify({ focus }) }),
  reviewFocus: (result) => request("/api/focus/review", { method: "POST", body: JSON.stringify({ result }) }),
};
