import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { businessConfig as config } from './src/data/businessConfig.js'
import { city, area, fullAddress, isSet, mapUrl, phoneDigits, shortLocation, socialLinks } from './src/utils/business.js'

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const siteUrl = config.siteUrl.replace(/\/+$/, '')

function buildSeo() {
  const title = city
    ? `${config.name} | Daily Meals and Meal Plans in ${city}`
    : `${config.name} | Daily Meals and Meal Plans`

  const description = shortLocation
    ? `${config.name} serves home-style daily meals in ${shortLocation}. See the menu, explore weekly and monthly meal plans, and enquire on WhatsApp.`
    : `${config.name} serves home-style daily meals for students and working professionals. See the menu, explore weekly and monthly meal plans, and enquire on WhatsApp.`

  const ogImage = siteUrl ? `${siteUrl}/og-image.jpg` : '/og-image.jpg'

  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(config.name)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
  ]
  if (siteUrl) {
    tags.push(`<link rel="canonical" href="${escapeHtml(siteUrl)}/" />`)
    tags.push(`<meta property="og:url" content="${escapeHtml(siteUrl)}/" />`)
  } else {
    tags.push('<!-- Canonical URL: set businessConfig.siteUrl once the final domain is known -->')
  }

  // LocalBusiness structured data — only verified (configured) fields are included.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: config.name,
    description,
    servesCuisine: 'Indian',
  }
  if (siteUrl) {
    ld.url = `${siteUrl}/`
    ld.image = ogImage
  }
  if (phoneDigits) ld.telephone = `+${phoneDigits}`
  if (fullAddress) {
    ld.address = {
      '@type': 'PostalAddress',
      ...(isSet(config.location.street) && { streetAddress: config.location.street }),
      ...(area && { addressLocality: city ? `${area}, ${city}` : area }),
      ...(!area && city && { addressLocality: city }),
      addressRegion: config.location.state,
      ...(isSet(config.location.postalCode) && { postalCode: config.location.postalCode }),
      addressCountry: 'IN',
    }
  }
  if (config.openingHoursSpec.length) {
    ld.openingHoursSpecification = config.openingHoursSpec.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    }))
  }
  if (isSet(config.priceRange)) ld.priceRange = config.priceRange
  if (mapUrl) ld.hasMap = mapUrl
  if (socialLinks.length) ld.sameAs = socialLinks.map((s) => s.url)

  tags.push(`<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`)
  return tags.map((t) => `    ${t}`).join('\n')
}

function seoPlugin() {
  return {
    name: 'sai-mess-seo',
    transformIndexHtml(html) {
      return html.replace('<!-- %SEO% -->', buildSeo().trimStart())
    },
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /']
      if (siteUrl) {
        robots.push('', `Sitemap: ${siteUrl}/sitemap.xml`)
        const today = new Date().toISOString().slice(0, 10)
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>\n</urlset>\n`,
        })
      }
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') + '\n' })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin()],
  // Forward API calls to the Express API in backend/ during development.
  server: {
    proxy: { '/api': process.env.API_PROXY || 'http://localhost:5000' }, // API_PROXY lets you point at another backend
  },
})
