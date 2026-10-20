import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../../animations/variants'
import { features } from '../../data/content'
import SectionHeading from '../ui/SectionHeading'

export default function WhyChooseUs() {
  return (
    <section id="why" className="relative py-14 sm:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeading eyebrow="Why choose us" title="Good food is a" highlight="promise." text="Six reasons thousands of students, families and office teams keep coming back for one more bite." />

        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3"
        >
          {features.map(({ icon: Icon, title, text, tint }, i) => (
            <motion.article
              key={title}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-[1.5rem] bg-white p-4 shadow-soft transition-all duration-500 hover:-translate-y-2 hover:shadow-lift sm:rounded-[2rem] sm:p-7"
            >
              <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${tint} opacity-10 blur-2xl transition-all duration-700 group-hover:scale-150 group-hover:opacity-25`} />
              <div className="flex items-start gap-5">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl sm:h-16 sm:w-16 bg-gradient-to-br ${tint} text-white shadow-lg transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110`}>
                  <Icon className="h-6 w-6 sm:h-[30px] sm:w-[30px]" strokeWidth={2.2} />
                </div>
                <span className="ml-auto font-display text-3xl font-black sm:text-5xl text-ink/[0.05] transition-colors group-hover:text-brand/10">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-[15px] font-bold leading-tight sm:mt-6 sm:text-xl">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/60 sm:mt-2 sm:text-base">{text}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
