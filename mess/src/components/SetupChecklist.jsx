import { useState } from 'react'
import { ClipboardList, X } from 'lucide-react'
import { businessConfig as c } from '../data/businessConfig.js'
import { highlightedPlanId, mealPlans } from '../data/mealPlans.js'
import { menuItems } from '../data/menuData.js'
import { galleryImages } from '../data/galleryData.js'
import { city, fullAddress, hasPhone, hasWhatsApp, isSet, mapUrl, mealTimingList } from '../utils/business.js'

// Development-only panel listing business details that still need the owner's input.
const missing = [
  [!hasWhatsApp, 'WhatsApp number (businessConfig.whatsappNumber)'],
  [!hasPhone, 'Contact phone (businessConfig.phone)'],
  [!fullAddress, 'Address (businessConfig.location)'],
  [!city, 'City — used in page title and SEO'],
  [!mapUrl, 'Google Maps link (location.mapUrl)'],
  [!isSet(c.foodType), "Food type: 'pure-veg' or 'veg-and-non-veg'"],
  [!mealTimingList.length, 'Meal timings (businessConfig.mealTimings)'],
  [!isSet(c.openingDays), 'Opening days (businessConfig.openingDays)'],
  [!isSet(c.siteUrl), 'Final domain (businessConfig.siteUrl) — canonical, sitemap'],
  [mealPlans.every((p) => !p.price), 'Meal plan prices (data/mealPlans.js)'],
  [highlightedPlanId === null, 'Recommended plan (optional, data/mealPlans.js)'],
  [menuItems.some((m) => m.isSample), 'Real menu items (data/menuData.js)'],
  [galleryImages.some((g) => g.isSample), 'Real photos (data/galleryData.js)'],
  [!c.customerCount.verified, 'Confirm customer count to show the badge (optional)'],
]
  .filter(([isMissing]) => isMissing)
  .map(([, label]) => label)

export default function SetupChecklist() {
  const [open, setOpen] = useState(false)
  if (!missing.length) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-6rem)] text-sm">
      {open ? (
        <div className="w-80 max-w-full rounded-2xl border border-line bg-white p-4 shadow-lift">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display font-bold">Setup checklist (dev only)</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close setup checklist"
              className="rounded-full p-1"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <ul className="mt-3 max-h-72 list-disc space-y-1.5 overflow-y-auto pl-5 text-muted">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-charcoal px-4 py-2.5 font-semibold text-white shadow-lift"
        >
          <ClipboardList className="size-4" aria-hidden="true" />
          {missing.length} setup items
        </button>
      )}
    </div>
  )
}
