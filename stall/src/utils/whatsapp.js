import { site } from '../data/site'

export const whatsappLink = (message = site.whatsappGreeting) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`

export const orderMessage = (item) =>
  `Hi ${site.shortName}! 👋 I'd like to order:\n\n• ${item.name} — ₹${item.price}\n\nPlease confirm. Thank you!`

export const callLink = `tel:+91${site.phone}`
