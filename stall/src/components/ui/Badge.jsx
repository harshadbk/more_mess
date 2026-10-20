import { cn } from '../../utils/cn'

const tones = {
  veg: 'bg-white/90 text-leaf',
  popular: 'bg-gradient-to-r from-brand to-brand-2 text-white',
  chef: 'bg-ink/85 text-cheese',
  soft: 'bg-peach text-brand',
}

export default function Badge({ tone = 'soft', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm backdrop-blur', tones[tone], className)}>
      {children}
    </span>
  )
}

/** Indian food-safety style veg mark: green square with a dot. */
export function VegMark({ className }) {
  return (
    <span className={cn('inline-grid h-4 w-4 place-items-center rounded-[3px] border-2 border-leaf bg-white', className)} aria-label="Pure veg" title="Pure veg">
      <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
    </span>
  )
}
