import { useState } from 'react'
import { cn } from '../../utils/cn'

const variants = {
  primary:
    'bg-gradient-to-r from-brand to-brand-2 text-white shadow-[0_12px_30px_-10px_rgb(255_107_0/0.7)] hover:shadow-[0_18px_40px_-12px_rgb(255_107_0/0.85)] shimmer',
  whatsapp: 'bg-[#25D366] text-white shadow-[0_12px_30px_-10px_rgb(37_211_102/0.7)] hover:bg-[#1fbe5b]',
  outline: 'border-2 border-ink/10 bg-white/70 text-ink backdrop-blur hover:border-brand hover:text-brand',
  ghost: 'text-ink hover:bg-peach/60',
  dark: 'bg-ink text-white hover:bg-black',
}

const sizes = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-6 text-[15px]',
  lg: 'h-14 px-8 text-base',
}

/** Pill button with a material-style ripple. Renders <a> when `href` is set. */
export default function Button({ as, href, variant = 'primary', size = 'md', className, children, onPointerDown, ...props }) {
  const [ripples, setRipples] = useState([])
  const Tag = as ?? (href ? 'a' : 'button')

  const handlePointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const ripple = { id: Date.now() + Math.random(), x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size }
    setRipples((r) => [...r, ripple])
    setTimeout(() => setRipples((r) => r.filter((x) => x.id !== ripple.id)), 650)
    onPointerDown?.(e)
  }

  return (
    <Tag
      href={href}
      onPointerDown={handlePointerDown}
      className={cn(
        'group relative inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-full font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
      {...(Tag === 'button' && !props.type ? { type: 'button' } : {})}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/40"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size, animation: 'ripple 650ms ease-out forwards' }}
        />
      ))}
    </Tag>
  )
}
