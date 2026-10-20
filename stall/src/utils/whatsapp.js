import { site } from '../data/site'

export const whatsappLink = (message = site.whatsappGreeting) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`

export const cartMessage = (lines, total, note = '') =>
  [
    `Hi ${site.shortName}! 👋 I'd like to order:`,
    '',
    ...lines.map(({ item, qty }) => `• ${qty} × ${item.name} — ₹${qty * item.price}`),
    '',
    `Total: ₹${total}`,
    ...(note.trim() ? ['', `Note: ${note.trim()}`] : []),
    '',
    'Please confirm. Thank you!',
  ].join('\n')

export const callLink = `tel:+91${site.phone}`
