/**
 * SAI MESS — BUSINESS CONFIGURATION
 * ----------------------------------------------------------------------------
 * This is the single place to edit real business details.
 *
 * Rules:
 *  - Leave a value as an empty string ('') or null until the owner confirms it.
 *  - Empty values are never shown as fake data: the site hides that detail,
 *    hides the section, or shows a "contact us" prompt instead.
 *  - Never type in guessed prices, addresses, hours, reviews or customer counts.
 *
 * Meal plan prices live in src/data/mealPlans.js.
 * Menu items live in src/data/menuData.js.
 */

export const businessConfig = {
  name: 'Sai Mess',
  tagline: 'Ghar Jaisa Khana, Roz Aapke Saath.',

  // Final website address, without a trailing slash, e.g. 'https://saimess.in'.
  // Used for the canonical URL, Open Graph image URL, sitemap and structured data.
  siteUrl: '',

  location: {
    street: '', // e.g. 'Shop 4, Sai Residency, Near XYZ College'
    area: 'Krushnamai Nagar', // neighbourhood / locality
    city: 'Sangli',
    state: 'Maharashtra',
    postalCode: '', // e.g. '416415'
    // "Share" link from Google Maps, e.g. 'https://maps.app.goo.gl/xxxx'
    mapUrl: '',
    // Optional: Google Maps > Share > Embed a map > copy only the src="..." URL.
    // Must start with 'https://www.google.com/maps/embed'.
    mapEmbedUrl: '',
  },

  // Indian mobile numbers. Any format works: '98XXXXXXXX', '+91 98XXX XXXXX', '091-98XXXXXXXX'.
  whatsappNumber: '9130852285',
  phone: '9130852285',

  // 'pure-veg' | 'veg-and-non-veg' | '' (not confirmed yet)
  foodType: 'veg-and-non-veg',

  // Human-readable, e.g. 'Monday to Saturday (Sunday dinner closed)'
  openingDays: 'All 7 days (Monday to Sunday)',

  // Human-readable timings, e.g. '8:00 AM – 10:00 AM'. Leave '' for meals not served.
  mealTimings: {
    breakfast: '',
    lunch: '11:30 AM – 2:30 PM',
    dinner: '7:30 PM – 10:00 PM',
  },

  // Machine-readable hours for Google (structured data). Only fill when verified.
  // Example: [{ days: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '08:00', closes: '22:00' }]
  openingHoursSpec: [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '11:30',
      closes: '14:30',
    },
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '19:30',
      closes: '22:00',
    },
  ],

  // Rough price indicator for Google, e.g. '₹' or '₹80–₹3000'. Only fill when verified.
  priceRange: '',

  // Full URLs only (https://...). Empty links are hidden.
  social: {
    instagram: '',
    facebook: '',
    googleBusiness: '',
  },

  // Set verified: true only after the owner confirms the number.
  // The badge in the hero is hidden while verified is false.
  customerCount: {
    value: 25,
    verified: false,
  },

  // About section. Leave '' to use the default friendly copy only.
  about: {
    ownerName: '', // only if the owner wants to be named publicly
    ownerIntro: '',
    story: '',
    philosophy: '',
    // Real photos of the mess, e.g. [{ src: '/images/mess/dining.webp', alt: 'Dining area at Sai Mess' }]
    // Put files in public/images/mess/. Until added, a representative food photo is used.
    photos: [],
  },
}
