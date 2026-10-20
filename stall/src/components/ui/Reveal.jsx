import { motion } from 'framer-motion'
import { fadeUp } from '../../animations/variants'

/** Animate children into view once when scrolled to. */
export default function Reveal({ variants = fadeUp, delay = 0, className, as = 'div', children, ...props }) {
  const MotionTag = motion[as]
  return (
    <MotionTag
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay }}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  )
}
