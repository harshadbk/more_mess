/**
 * FAQ
 * ----------------------------------------------------------------------------
 * Each answer is built from the configured business data.
 * If the data is missing, `answer` returns null and the FAQ shows a
 * "Ask on WhatsApp" button instead of a made-up answer.
 *
 * To add a static answer: answer: () => 'Your confirmed answer.'
 */
import { businessConfig } from './businessConfig.js'
import { mealPlans } from './mealPlans.js'
import { foodTypeLabel, fullAddress, isSet, mealTimingList, formatPrice } from '../utils/business.js'

const join = (parts) => parts.filter(Boolean).join(' ')

export const faqs = [
  {
    id: 'plans',
    question: 'What meal plans are available?',
    answer: () => {
      const names = mealPlans.map((p) => p.name)
      return `We offer a ${names.slice(0, -1).join(', ')} and ${names.at(-1)}. Message us to confirm the meals included in each plan.`
    },
  },
  {
    id: 'timings',
    question: 'What are the meal timings?',
    answer: () => {
      if (!mealTimingList.length) return null
      return join([
        mealTimingList.map((m) => `${m.label}: ${m.time}`).join(' · ') + '.',
        isSet(businessConfig.openingDays) ? `Open ${businessConfig.openingDays}.` : '',
      ])
    },
  },
  {
    id: 'location',
    question: 'Where is Sai Mess located?',
    answer: () => (fullAddress ? `Sai Mess is at ${fullAddress}.` : null),
  },
  {
    id: 'pricing',
    question: 'How can I enquire about monthly pricing?',
    answer: () => {
      const monthly = mealPlans.find((p) => p.id === 'monthly')
      const price = monthly && formatPrice(monthly.price)
      return price
        ? `The Monthly Plan is ${price} ${monthly.priceUnit}. Send us a WhatsApp message to confirm what is included and to join.`
        : 'Send us a WhatsApp message or call us, and we will share the current monthly price and what is included.'
    },
  },
  {
    id: 'join',
    question: 'How do I join Sai Mess?',
    answer: () =>
      'Look through the menu and meal plans, then contact us on WhatsApp or by phone. We will confirm the plan, meal timings and visit details with you directly. There is no online payment on this website.',
  },
  {
    id: 'food-type',
    question: 'Is vegetarian or non-vegetarian food available?',
    answer: () => {
      if (businessConfig.foodType === 'pure-veg') return 'Sai Mess serves pure vegetarian food.'
      if (businessConfig.foodType === 'veg-and-non-veg')
        return `Sai Mess serves ${foodTypeLabel.toLowerCase()} food. Ask us which days non-veg dishes are served.`
      return null
    },
  },
]
