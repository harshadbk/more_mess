/**
 * Small fetch wrapper for the Sai Mess API (backend/).
 * In development Vite proxies /api to http://localhost:5001 (see vite.config.js and .env).
 * In production set VITE_API_URL to the deployed API, e.g. 'https://api.saimess.in'.
 */
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') + '/api'
const TOKEN_KEY = 'moremess.token'

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (token) => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* storage unavailable (private mode) — session lasts until reload */
    }
  },
}

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = tokenStore.get()
  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body && JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong.', res.status, data.fields)
  return data
}
