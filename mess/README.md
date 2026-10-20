# Sai Mess — Website

**Ghar Jaisa Khana, Roz Aapke Saath.**

A fast, mobile-first, single-page website for Sai Mess, a daily meal mess. It shows the food, the menu and meal plans, and turns visitors into WhatsApp enquiries.

- React 18 + Vite 6
- Tailwind CSS v4
- Lucide icons
- Member accounts (admin + user roles) and meal groups, served by the separate API in `backend/`. No payments; enquiries still go through WhatsApp.
- Ready to deploy on Vercel.

---

## Quick start

Requires Node.js 18 or newer.

```bash
npm install        # install dependencies
npm run dev        # start the dev server at http://localhost:5174
npm run build      # create the production build in dist/
npm run preview    # serve the production build locally
```

While `npm run dev` is running, a **"setup items"** button in the bottom-left corner lists every business detail that still needs filling in. It only appears in development and never on the live site.

---

## Accounts and groups (backend)

The API is a separate project in `backend/` (Express + MongoDB). See its README for setup, env vars and routes.

Run it alongside this site:

```bash
cd backend && npm run dev        # API at http://localhost:5001
npm run dev                         # this site; Vite proxies /api to the API
```

**Pages:** `/login`, `/register`, `/dashboard` (user groups), `/admin` (admin only).

**Production:** set `VITE_API_URL` to the deployed API URL (e.g. in Vercel's environment variables). `vercel.json` makes `/login` and the other pages work when the browser is refreshed on them.

---

## Before you publish: what the owner must fill in

Every business detail lives in `src/data/`. **Leave anything you haven't confirmed empty.** The site never shows fake data. When a value is missing, it hides that detail or shows "Contact us" instead.

### 1. `src/data/businessConfig.js`: main details

| Field | Example | What happens while it's empty |
| --- | --- | --- |
| `whatsappNumber` | `'98765 43210'` | WhatsApp buttons show a "not set up yet" message and open nothing. **Required.** |
| `phone` | `'+91 98765 43210'` | "Call" buttons and phone number are hidden |
| `location.street`, `area`, `city`, `postalCode` | `'Vishrambag'`, `'Sangli'` | Address is hidden, and the page title has no city |
| `location.mapUrl` | Google Maps share link | "Open in Google Maps" button is hidden |
| `location.mapEmbedUrl` | `https://www.google.com/maps/embed?...` | Embedded map is hidden |
| `foodType` | `'pure-veg'` or `'veg-and-non-veg'` | Veg label is hidden and the FAQ says "ask us". `'pure-veg'` also hides non-veg menu items. |
| `openingDays` | `'Monday to Saturday'` | Hidden |
| `mealTimings.breakfast / lunch / dinner` | `'8:00 AM – 10:00 AM'` | Timings show "ask us". Leave a meal empty if you don't serve it. |
| `openingHoursSpec` | see comment in file | Opening hours are left out of Google structured data |
| `priceRange` | `'₹'` | Left out of structured data |
| `social.instagram / facebook / googleBusiness` | full `https://` URL | Social links are hidden |
| `customerCount` | `{ value: 25, verified: true }` | Hero badge is hidden until `verified: true` |
| `about.ownerName / ownerIntro / story / philosophy` | your own words | Only the default About text is shown |
| `about.photos` | `[{ src: '/images/mess/dining.webp', alt: '...' }]` | A representative food photo is used |
| `siteUrl` | `'https://saimess.in'` | No canonical URL, no sitemap.xml, and the Open Graph image uses a relative URL |

Phone numbers can be typed in any common Indian format. They're converted to `91XXXXXXXXXX` for `wa.me` links automatically, and invalid numbers are rejected.

### 2. `src/data/mealPlans.js`: prices

- `price`: a number in rupees (e.g. `3200`). `null` shows **"Contact us for pricing"**.
- `includedMeals`: e.g. `['Lunch', 'Dinner']`
- `conditions`: e.g. `['Sunday dinner not included']`
- `highlightedPlanId`: set to `'monthly'`, `'weekly'` or `'single'` **only** if the owner wants that plan marked "Recommended".

### 3. `src/data/menuData.js`: menu

The included dishes are **samples for design only** (`isSample: true`). While any sample is shown, the menu displays a "Sample dishes shown for illustration" notice.

To publish the real menu, replace the items, set `isSample: false` on each, and optionally set `menuMeta.updatedOn: '2026-10-17'`.

### 4. `src/data/galleryData.js`: photos

The current photos are representative stock photography (Unsplash licence, free for commercial use). **They aren't photos of Sai Mess.** A short note under the gallery says so while any `isSample: true` photo is shown.

To use your own photos:
1. Put them in `public/images/mess/` (WebP or JPG, about 1200px wide, under 200 KB each is ideal).
2. Update `src`, `alt`, `width`, `height` and set `isSample: false`.

### 5. `src/data/testimonials.js`: reviews

Empty by default, so the reviews section is **hidden** on the live site. Add only real customer words, shared with their permission. Never invent names, quotes or star ratings.

### 6. `src/data/faqData.js`: FAQ

Answers are built from the config above. When the data isn't set, the question shows an "Ask on WhatsApp" button instead of an answer. You can add or edit questions freely.

---

## How enquiries work (no backend)

- Every "Enquire" or "Join" button opens WhatsApp (`https://wa.me/91XXXXXXXXXX?text=...`) with a prefilled, `encodeURIComponent`-encoded message. Menu and plan buttons include the dish or plan name.
- The contact form checks name, phone (10-digit Indian number) and plan, then shows a **preview** of the message. The visitor taps "Open WhatsApp to Send" and must press send inside WhatsApp themselves.
- Nothing is stored on a server. The footer and the form both say this.
- If `whatsappNumber` is missing or invalid, no WhatsApp link is opened. A setup message appears instead.

---

## SEO

At build time, `vite.config.js` reads `businessConfig.js` and writes into `index.html`:

- `<title>`: `Sai Mess | Daily Meals and Meal Plans in <City>`
- Meta description with the real area and city
- Open Graph and Twitter tags (`public/og-image.jpg`, 1200×630)
- Canonical URL (once `siteUrl` is set)
- `FoodEstablishment` (LocalBusiness) JSON-LD containing **only** configured fields: name, telephone, address, opening hours, price range, map, social profiles

It also writes `robots.txt` on every build and `sitemap.xml` once `siteUrl` is set.

The page has one `<h1>`, semantic sections, descriptive alt text, a favicon (`public/favicon.svg`) and an Apple touch icon.

**After launch:** create or claim a free **Google Business Profile** for Sai Mess, with the same name, address and phone as the website. That matters more than anything else for "mess near me" searches.

---

## Deploying to Vercel

1. Push this folder to a GitHub repository.
2. On [vercel.com](https://vercel.com), choose **Add New → Project** and import the repo.
3. Vercel detects Vite automatically:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Click **Deploy**.
5. Add your domain under **Settings → Domains**, set `siteUrl` in `businessConfig.js` to that domain, and push again. That turns on the canonical URL and the sitemap.

Or from the command line: `npx vercel` (preview) and `npx vercel --prod`.

No `vercel.json` is needed, because this is a single page with section anchors and no client-side routes.

---

## Project structure

```
mess/
├── index.html                 # HTML shell. SEO tags are injected at build time
├── vite.config.js             # Vite + Tailwind + SEO/sitemap/robots plugin
├── public/
│   ├── favicon.svg, apple-touch-icon.png, og-image.jpg
│   └── images/                # Optimised WebP food photos (replaceable)
└── src/
    ├── main.jsx, App.jsx, index.css   # entry, providers, theme tokens
    ├── pages/Home.jsx                 # section order
    ├── components/
    │   ├── Navbar.jsx, Hero.jsx, Benefits.jsx
    │   ├── MenuSection.jsx, MenuCard.jsx
    │   ├── MealPlans.jsx, MealPlanCard.jsx
    │   ├── Gallery.jsx, About.jsx, HowToJoin.jsx, Testimonials.jsx
    │   ├── FAQ.jsx, Contact.jsx, Footer.jsx
    │   ├── WhatsAppButton.jsx         # WhatsApp CTA + floating button
    │   ├── SectionHeading.jsx, Reveal.jsx, Logo.jsx, Notice.jsx
    │   └── SetupChecklist.jsx         # dev-only "what's missing" panel
    ├── data/                          # ← all editable business content
    │   ├── businessConfig.js, menuData.js, mealPlans.js
    │   ├── galleryData.js, faqData.js, testimonials.js
    └── utils/
        ├── business.js                # derived values, phone normalisation, formatting
        └── whatsapp.js                # wa.me URL builder + message templates
```

## Brand

| Token | Hex | Use |
| --- | --- | --- |
| Forest | `#174D35` | Primary, buttons, headings |
| Fresh green | `#2F7D50` | Accents, icons |
| Cream | `#FFF9EF` | Page background |
| Saffron | `#F4A340` | Highlights, secondary CTA (always with dark text) |
| Charcoal | `#202820` | Body text |
| Muted | `#6B746B` | Secondary text |

Fonts: Manrope (headings) and Inter (body), loaded from Google Fonts. Logo: a steaming bowl on a forest-green tile (`src/components/Logo.jsx`, `public/favicon.svg`).

## Accessibility and performance notes

- Skip link, visible focus rings, keyboard-operable menu (Esc closes it), filters (`aria-pressed`) and FAQ accordion (`aria-expanded`)
- Form errors are linked with `aria-describedby`, and focus moves to the first invalid field
- `prefers-reduced-motion` turns off scroll reveals and smooth scrolling
- Lazy-loaded images below the fold with reserved dimensions; the hero image is preloaded
- About 65 KB of gzipped JavaScript; no animation library (scroll reveals are pure CSS plus IntersectionObserver)
