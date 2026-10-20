import { MapPin } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'
import { businessConfig } from '../data/businessConfig.js'
import { fullAddress, isSet, mapUrl } from '../utils/business.js'

const { about } = businessConfig

const fallbackPhoto = {
  src: '/images/curries-rice.webp',
  alt: 'Bowls of home-style vegetable curries served with steamed rice',
  width: 900,
  height: 1200,
}

export default function About() {
  const photo = about.photos[0] ?? fallbackPhoto
  const secondPhoto = about.photos[1]

  const extras = [
    { title: about.ownerName ? `Meet ${about.ownerName}` : 'Meet the owner', text: about.ownerIntro },
    { title: 'Our story', text: about.story },
    { title: 'Our food philosophy', text: about.philosophy },
  ].filter((e) => isSet(e.text))

  return (
    <section id="about" aria-labelledby="about-title" className="bg-white py-20 sm:py-28">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <Reveal className="relative order-last lg:order-first">
          <div aria-hidden="true" className="absolute -top-4 -left-4 size-28 rounded-3xl bg-saffron-soft sm:size-36" />
          <div className="relative overflow-hidden rounded-3xl shadow-lift">
            <img
              src={photo.src}
              alt={photo.alt}
              width={photo.width ?? 900}
              height={photo.height ?? 600}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] w-full object-cover lg:aspect-[5/6]"
            />
          </div>
          {secondPhoto && (
            <div className="absolute -right-3 -bottom-8 w-2/5 overflow-hidden rounded-2xl border-4 border-white shadow-lift sm:-right-6">
              <img
                src={secondPhoto.src}
                alt={secondPhoto.alt}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
            </div>
          )}
        </Reveal>

        <div>
          <SectionHeading id="about-title" eyebrow="About Sai Mess" title="Good Food. Everyday Comfort." align="left" />
          <Reveal className="mt-6 space-y-4 text-base leading-relaxed text-muted sm:text-lg">
            <p>
              When you are studying, working long hours or living away from home, a dependable meal makes every day a
              little easier. {businessConfig.name} is a daily meal destination built around that simple idea.
            </p>
            <p>
              We keep things straightforward: satisfying home-style food, regular meal times and a friendly place to eat
              — so you can focus on your day and leave the cooking to us.
            </p>
          </Reveal>

          {extras.length > 0 && (
            <div className="mt-8 space-y-6 border-l-2 border-saffron pl-6">
              {extras.map((e) => (
                <Reveal key={e.title}>
                  <h3 className="text-lg font-bold">{e.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted">{e.text}</p>
                </Reveal>
              ))}
            </div>
          )}

          {fullAddress && (
            <Reveal className="mt-8 flex items-start gap-3 rounded-2xl bg-cream p-4">
              <MapPin className="mt-0.5 size-5 shrink-0 text-fresh" aria-hidden="true" />
              <p className="text-[15px] text-charcoal">
                {fullAddress}
                {mapUrl && (
                  <>
                    {' · '}
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-forest underline decoration-saffron decoration-2 underline-offset-4"
                    >
                      Get directions
                    </a>
                  </>
                )}
              </p>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  )
}
