import { businessConfig } from '../data/businessConfig.js'
import { hasWhatsApp, whatsappDigits } from './business.js'

/**
 * Build a wa.me link with a safely encoded prefilled message.
 * Returns '' when the business number is not configured or invalid.
 */
export function buildWhatsAppUrl(message = '') {
  if (!hasWhatsApp) return ''
  const text = message.trim()
  return `https://wa.me/${whatsappDigits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

const greeting = `Hi ${businessConfig.name},`

export const messages = {
  general: () => `${greeting} I would like to know more about your meals and meal plans.`,
  join: () => `${greeting} I am interested in joining the mess. Please share the plan details and timings.`,
  dish: (item, categoryLabel) =>
    `${greeting} I would like to know about "${item.name}" (${categoryLabel}). Is it available, and what is the price?`,
  plan: (plan) =>
    `${greeting} I would like to enquire about the ${plan.name}. Please share the price, included meals and timings.`,
  faq: (question) => `${greeting} I have a question: ${question}`,
  todayOrder: ({ date, name, phone, meal, count, food, delivery, address, note }) =>
    [
      `${greeting} I want to order tiffin for today only.`,
      '',
      `Date: ${date}`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Meal: ${meal}`,
      `Number of tiffins: ${count}`,
      `Food: ${food}`,
      `Pickup / delivery: ${delivery}`,
      address ? `Address: ${address}` : null,
      note ? `Note: ${note}` : null,
      '',
      'Please confirm my order and the total amount.',
    ]
      .filter((line) => line !== null)
      .join('\n'),
  contactForm: ({ name, phone, plan, message }) =>
    [
      `${greeting} I would like to enquire about joining.`,
      '',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Preferred plan: ${plan}`,
      message ? `Message: ${message}` : null,
    ]
      .filter((line) => line !== null)
      .join('\n'),
}
