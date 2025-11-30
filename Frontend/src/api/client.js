// Shared HTTP helper for frontend -> backend requests
const API_ROOT = import.meta.env.VITE_API_ROOT || "http://localhost:5000/api";

export function apiRoot() {
  return API_ROOT;
}

export function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchJson(basePath, path, options = {}) {
  const url = `${API_ROOT}${basePath}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...authHeaders(),
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  if (!res.ok) {
    // try to parse JSON error message
    try {
      const err = JSON.parse(text);
      throw new Error(err.message || JSON.stringify(err));
    } catch {
      throw new Error(text || res.statusText);
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
