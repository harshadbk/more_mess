import { whatsappLink } from '../utils/whatsapp'

/**
 * No backend yet — the contact form hands off to WhatsApp, which is how the
 * stall actually takes orders. Swap this for an API call (Formspree, EmailJS,
 * your own server) without touching the form component.
 */
export function sendContactMessage({ name, phone, message }) {
  const text = `Hi! I'm ${name} (${phone}).\n\n${message}`
  window.open(whatsappLink(text), '_blank', 'noopener')
  return Promise.resolve({ ok: true })
}

export function subscribeNewsletter(email) {
  // Placeholder: persist locally until a mailing-list provider is connected.
  try {
    const list = JSON.parse(localStorage.getItem('ss-newsletter') || '[]')
    localStorage.setItem('ss-newsletter', JSON.stringify([...new Set([...list, email])]))
  } catch {
    /* ignore */
  }
  return new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 600))
}
