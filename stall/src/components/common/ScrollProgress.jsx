import { motion, useScroll, useSpring } from 'framer-motion'

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 })
  return <motion.div style={{ scaleX }} className="fixed inset-x-0 top-0 z-[80] h-1 origin-left bg-gradient-to-r from-brand via-brand-2 to-cheese" aria-hidden="true" />
}
