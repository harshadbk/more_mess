import { motion } from 'framer-motion'

const layers = [
  { d: 'M8 26 L32 6 L56 26 Z', fill: '#FFE7CC', stroke: '#E9A15B' }, // top bread
  { d: 'M9 27 Q20 22 32 27 T55 27 L55 31 Q44 26 32 31 T9 31 Z', fill: '#2ECC71' }, // lettuce
  { d: 'M9 31 H55 V35 H9 Z', fill: '#FF4D3D' }, // tomato
  { d: 'M8 35 L56 35 L50 40 L44 35 L38 40 L32 35 L26 40 L20 35 L14 40 Z', fill: '#FFC93C' }, // cheese
  { d: 'M8 40 H56 Q56 46 50 46 H14 Q8 46 8 40 Z', fill: '#FFE7CC', stroke: '#E9A15B' }, // bottom bread
]

/** The brand sandwich icon. `animate` stacks the layers in one by one (loader). */
export default function SandwichMark({ size = 40, animate = false, className }) {
  return (
    <svg viewBox="0 0 64 52" width={size} height={(size * 52) / 64} className={className} aria-hidden="true">
      {layers.map((l, i) => (
        <motion.path
          key={i}
          d={l.d}
          fill={l.fill}
          stroke={l.stroke}
          strokeWidth={l.stroke ? 1.5 : 0}
          strokeLinejoin="round"
          initial={animate ? { y: -40, opacity: 0 } : false}
          animate={animate ? { y: 0, opacity: 1 } : undefined}
          transition={{ delay: 0.15 + (layers.length - 1 - i) * 0.12, type: 'spring', stiffness: 260, damping: 16 }}
        />
      ))}
    </svg>
  )
}
