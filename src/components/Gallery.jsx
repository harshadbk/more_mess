import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'
import { galleryImages } from '../data/galleryData.js'

// Editorial layout for 6 images (mobile: 2 cols, desktop: 4 cols x 3 rows). Extra images fall into 1x1 cells.
const layout = ['col-span-2 lg:row-span-2', 'lg:row-span-2', '', '', 'lg:col-span-2', 'col-span-2']

const hasSamples = galleryImages.some((img) => img.isSample)

export default function Gallery() {
  if (!galleryImages.length) return null

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="gallery-title" eyebrow="Gallery" title="A taste of everyday comfort">
          Chapati, sabzi, dal and rice — the honest, filling food that makes a good daily meal.
        </SectionHeading>

        <ul className="mt-14 grid auto-rows-[170px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:gap-4 lg:grid-cols-4">
          {galleryImages.map((img, i) => (
            <Reveal
              as="li"
              key={img.src}
              delay={(i % 3) * 70}
              className={`group relative overflow-hidden rounded-2xl bg-cream-dark ${layout[i] ?? ''}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              {img.caption && (
                <>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-charcoal/65 via-charcoal/0 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <p className="absolute bottom-3 left-4 font-display text-sm font-semibold text-white sm:text-base">
                    {img.caption}
                  </p>
                </>
              )}
            </Reveal>
          ))}
        </ul>

        {hasSamples && (
          <p className="mt-6 text-center text-xs text-muted">
            Representative photographs of home-style Indian food. Photos from Sai Mess will be added soon.
          </p>
        )}
      </div>
    </section>
  )
}
