import Reveal from './Reveal.jsx'

export default function SectionHeading({ id, eyebrow, title, children, align = 'center', light = false }) {
  const centered = align === 'center'
  return (
    <Reveal className={`max-w-2xl ${centered ? 'mx-auto text-center' : ''}`}>
      {eyebrow && (
        <p className={`eyebrow ${light ? 'text-saffron' : ''} ${centered ? 'justify-center' : ''}`}>
          <span className={`h-px w-6 ${light ? 'bg-saffron' : 'bg-fresh'}`} aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className={`mt-3 text-3xl leading-[1.15] font-extrabold sm:text-4xl lg:text-[2.75rem] ${light ? 'text-white' : ''}`}
      >
        {title}
      </h2>
      {children && (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${light ? 'text-white/75' : 'text-muted'}`}>
          {children}
        </p>
      )}
    </Reveal>
  )
}
