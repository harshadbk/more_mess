// In dev, Vite proxies /api to the Express server (see vite.config.js).
// In production set VITE_API_URL to the deployed backend, e.g. https://api.shreesaisnacks.in
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const TOKEN_KEY = 'ss-admin-token'

async function request(path, { token, ...options } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

export const reviewApi = {
  list: () => request('/reviews'),
  create: (review) => request('/reviews', { method: 'POST', body: JSON.stringify(review) }),
}

export const adminApi = {
  login: (username, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  reviews: (token) => request('/admin/reviews', { token }),
  remove: (token, id) => request(`/admin/reviews/${id}`, { method: 'DELETE', token }),
}

export const adminToken = {
  get: () => {
    try {
      return sessionStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (t) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, t)
    } catch {
      /* ignore */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
  },
}
