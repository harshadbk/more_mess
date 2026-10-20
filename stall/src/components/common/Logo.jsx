import { Link } from 'react-router-dom'
import SandwichMark from './SandwichMark'
import { cn } from '../../utils/cn'

export default function Logo({ className, light = false }) {
  return (
    <Link to="/" className={cn('group flex items-center gap-2.5', className)} aria-label="Shree Sai Snacks & Sandwich — home">
      <span className="grid h-10 w-10 place-items-center rounded-2xl sm:h-11 sm:w-11 bg-gradient-to-br from-brand to-brand-2 shadow-soft transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-105">
        <SandwichMark size={30} />
      </span>
      <span className="leading-none">
        <span className={cn('block whitespace-nowrap font-display text-lg font-extrabold tracking-tight', light ? 'text-white' : 'text-ink')}>
          Shree Sai <span className="text-brand">Snacks</span>
        </span>
        <span className={cn('block text-[10px] font-bold uppercase tracking-[0.28em]', light ? 'text-white/60' : 'text-ink/45')}>
          &amp; Sandwich
        </span>
      </span>
    </Link>
  )
}
