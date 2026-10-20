const BASE = 'https://images.unsplash.com/photo-'

/** Build an optimised Unsplash URL (auto WebP/AVIF, cropped, compressed). */
export const imageUrl = (id, w = 600, h = w, q = 70) =>
  `${BASE}${id}?w=${w}${h ? `&h=${h}` : ''}&fit=crop&auto=format&q=${q}`

/** Responsive srcset for an image id at a given aspect ratio (h / w). */
export const imageSrcSet = (id, ratio = 1, widths = [320, 480, 720, 960]) =>
  widths.map((w) => `${imageUrl(id, w, ratio ? Math.round(w * ratio) : 0)} ${w}w`).join(', ')
