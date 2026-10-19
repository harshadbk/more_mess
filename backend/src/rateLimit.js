// Small in-memory limit for public forms (no login): at most `max` requests per IP in `minutes`.
// Stops a script from flooding the database; real people never get near it.
export function rateLimit(max, minutes, message) {
  const recent = new Map() // ip -> [timestamps]
  return (req, _res, next) => {
    const now = Date.now()
    const hits = (recent.get(req.ip) ?? []).filter((t) => now - t < minutes * 60 * 1000)
    if (hits.length >= max) return next(Object.assign(new Error(message), { status: 429 }))
    hits.push(now)
    recent.set(req.ip, hits)
    if (recent.size > 5000) recent.clear()
    next()
  }
}

// Same rule as the website: a 10-digit Indian mobile, stored as '91XXXXXXXXXX' ('' if not valid).
export function phoneOf(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  return /^[1-9]\d{9}$/.test(digits) ? `91${digits}` : ''
}
