import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../../animations/variants'
import { cn } from '../../utils/cn'

export default function SectionHeading({ eyebrow, title, highlight, text, align = 'center', className }) {
  return (
    <motion.div
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      className={cn('mb-8 max-w-2xl sm:mb-12 md:mb-16', align === 'center' && 'mx-auto text-center', className)}
    >
      {eyebrow && (
        <motion.span variants={fadeUp} className="eyebrow">
          {eyebrow}
        </motion.span>
      )}
      <motion.h2 variants={fadeUp} className="mt-3 text-[2rem] font-extrabold leading-[1.05] sm:mt-4 sm:text-5xl lg:text-[3.5rem]">
        {title} {highlight && <span className="text-gradient">{highlight}</span>}
      </motion.h2>
      {text && (
        <motion.p variants={fadeUp} className="mt-3 text-[15px] leading-relaxed text-ink/60 sm:mt-5 sm:text-lg">
          {text}
        </motion.p>
      )}
    </motion.div>
  )
}
