import { useEffect } from 'react'
import { site } from '../../data/site'

const setMeta = (selector, value) => document.head.querySelector(selector)?.setAttribute('content', value)

/**
 * Per-route metadata. The static tags in index.html serve crawlers and WhatsApp /
 * social link previews (which don't run JS); this keeps them in sync on navigation.
 * (react-helmet doesn't support React 19, so this replaces it.)
 */
export default function Seo({ title, description = site.subheading, path = '/' }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${site.name}` : `${site.name} | ${site.tagline}`
    const url = `https://shreesaisnacks.in${path}`
    document.title = fullTitle
    setMeta('meta[name="description"]', description)
    setMeta('meta[property="og:title"]', fullTitle)
    setMeta('meta[property="og:description"]', description)
    setMeta('meta[property="og:url"]', url)
    setMeta('meta[name="twitter:title"]', fullTitle)
    setMeta('meta[name="twitter:description"]', description)
    document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', url)
  }, [title, description, path])
  return null
}
