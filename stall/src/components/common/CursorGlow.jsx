import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useState } from 'react'

/** Soft orange glow that trails the cursor (fine-pointer devices only). */
export default function CursorGlow() {
  const [enabled, setEnabled] = useState(false)
  const x = useMotionValue(-400)
  const y = useMotionValue(-400)
  const sx = useSpring(x, { stiffness: 120, damping: 20 })
  const sy = useSpring(y, { stiffness: 120, damping: 20 })

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)')
    setEnabled(mq.matches)
    if (!mq.matches) return
    const move = (e) => {
      x.set(e.clientX - 200)
      y.set(e.clientY - 200)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [x, y])

  if (!enabled) return null
  return (
    <motion.div
      aria-hidden="true"
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[1] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgb(255_138_0/0.13),transparent_65%)]"
    />
  )
}
