# Shree Sai Snacks & Sandwich

Premium light-theme website (React 19 + Vite + Tailwind v4 + Framer Motion + GSAP + Swiper) with a small Express + MongoDB backend for customer reviews.

## Run locally

```bash
npm install && npm --prefix server install   # first time only
npm run server    # API on http://localhost:5000  (reads server/.env)
npm run dev       # site on http://localhost:5173 (proxies /api to the server)
```

## Admin

- Small **Admin login** link just above the footer → `/admin`
- Username/password: `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `server/.env` (restart the server after changing them)
- View all reviews, filter bad (1–2★) ones, delete

Reviews are stored in MongoDB collection `stall_review` (database `moremess`).

## Editing content

| What | File |
|---|---|
| Menu items & prices | `src/data/menu.js` |
| Phone, address, hours, socials | `src/data/site.js` |
| Offers, FAQs, timeline, gallery, sample reviews | `src/data/content.js` |
| Photos (Unsplash ids) | `src/data/photos.js` |

## Deploy

- Frontend: `npm run build` → upload `dist/` (Vercel/Netlify). Set `VITE_API_URL` to the backend URL and add an SPA rewrite to `index.html`.
- Backend: deploy `server/` (Render/Railway), set the same env vars as `server/.env`, and put the site's URL in `CLIENT_ORIGIN`.
