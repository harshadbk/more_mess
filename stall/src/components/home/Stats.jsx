import CountUpModule from 'react-countup'
import { useInView } from 'react-intersection-observer'
import { stats } from '../../data/content'

// react-countup ships CJS; unwrap the default export when interop leaves it nested.
const CountUp = CountUpModule.default ?? CountUpModule

export default function Stats() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.4 })
  return (
    <section ref={ref} aria-label="Our numbers" className="py-10">
      <div className="container-x">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="neu px-3 py-6 text-center transition-transform duration-500 hover:-translate-y-1 sm:py-10">
              <p className="font-display text-[2rem] font-black sm:text-6xl">
                <span className="text-gradient">{inView ? <CountUp end={s.end} decimals={s.decimals ?? 0} duration={2.4} separator="," /> : 0}</span>
                <span className="text-brand">{s.suffix}</span>
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink/50 sm:mt-2 sm:text-base">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
