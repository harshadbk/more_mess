import { businessConfig as config } from '../data/businessConfig.js'

/** True for non-empty strings / non-empty arrays / numbers. */
export const isSet = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

const isHttpUrl = (value) => {
  if (!isSet(value)) return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export const safeUrl = (value) => (isHttpUrl(value) ? value : '')

/**
 * Normalise an Indian phone number to '91XXXXXXXXXX' (no plus, no spaces).
 * Returns '' if the value is not a valid 10-digit Indian mobile/landline.
 */
export function normalizeIndianNumber(raw) {
  if (!isSet(raw)) return ''
  // Drop trunk/international zeros first ('0', '091', '0091'), then the country code.
  let digits = String(raw).replace(/\D/g, '').replace(/^0+/, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  return /^[1-9]\d{9}$/.test(digits) ? `91${digits}` : ''
}

export const whatsappDigits = normalizeIndianNumber(config.whatsappNumber)
export const phoneDigits = normalizeIndianNumber(config.phone)
export const hasWhatsApp = whatsappDigits !== ''
export const hasPhone = phoneDigits !== ''

export const phoneHref = hasPhone ? `tel:+${phoneDigits}` : ''

/** '+91 98765 43210' */
export const formatIndianNumber = (digits) => (digits ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}` : '')

const loc = config.location
export const city = loc.city.trim()
export const area = loc.area.trim()

/** 'Area, City' — the short local line used in the hero/footer. */
export const shortLocation = [area, city].filter(Boolean).join(', ')

/** Full postal address, or '' if street and city are both missing. */
export const fullAddress =
  isSet(loc.street) || isSet(city)
    ? [loc.street, area, city, [loc.state, loc.postalCode].filter(isSet).join(' ')].filter(isSet).join(', ')
    : ''

export const mapUrl = safeUrl(loc.mapUrl)
export const mapEmbedUrl = loc.mapEmbedUrl.startsWith('https://www.google.com/maps/embed') ? loc.mapEmbedUrl : ''

export const mealTimingList = [
  { id: 'breakfast', label: 'Breakfast', time: config.mealTimings.breakfast },
  { id: 'lunch', label: 'Lunch', time: config.mealTimings.lunch },
  { id: 'dinner', label: 'Dinner', time: config.mealTimings.dinner },
].filter((m) => isSet(m.time))

export const foodTypeLabel =
  config.foodType === 'pure-veg' ? 'Pure Veg' : config.foodType === 'veg-and-non-veg' ? 'Veg & Non-Veg' : ''

export const isPureVeg = config.foodType === 'pure-veg'

export const socialLinks = [
  { id: 'instagram', label: 'Instagram', url: safeUrl(config.social.instagram) },
  { id: 'facebook', label: 'Facebook', url: safeUrl(config.social.facebook) },
  { id: 'googleBusiness', label: 'Google Maps profile', url: safeUrl(config.social.googleBusiness) },
].filter((s) => s.url)

export const showCustomerCount = config.customerCount.verified === true && Number(config.customerCount.value) > 0

export const formatPrice = (price) =>
  typeof price === 'number' && price > 0 ? `₹${price.toLocaleString('en-IN')}` : ''
