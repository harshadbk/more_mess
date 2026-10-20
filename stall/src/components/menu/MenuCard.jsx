import { motion } from 'framer-motion'
import { ChefHat, Flame, Heart, Plus } from 'lucide-react'
import { useFavorites } from '../../context/FavoritesContext'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { categories } from '../../data/menu'
import { cn } from '../../utils/cn'
import { orderMessage, whatsappLink } from '../../utils/whatsapp'
import Badge, { VegMark } from '../ui/Badge'
import SmartImage from '../ui/SmartImage'

const catEmoji = Object.fromEntries(categories.map((c) => [c.id, c.emoji]))

const motionProps = {
  layout: true,
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.2 } },
  transition: { type: 'spring', stiffness: 260, damping: 26 },
}

/** Mobile: compact food-app row (details left, photo + ADD right). */
function MenuRow({ item, fav, toggle }) {
  return (
    <motion.article {...motionProps} className="relative flex gap-4 rounded-[1.6rem] bg-white p-3.5 pb-5 shadow-soft active:scale-[0.99]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-1.5">
          <VegMark className="h-3.5 w-3.5" />
          {item.popular && (
            <span className="flex items-center gap-0.5 text-[11px] font-extrabold text-brand">
              <Flame size={12} className="fill-brand" /> Bestseller
            </span>
          )}
          {item.chef && (
            <span className="flex items-center gap-0.5 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-bold text-cheese">
              <ChefHat size={11} /> Chef’s pick
            </span>
          )}
        </div>
        <h3 className="mt-1.5 text-[16px] font-bold leading-snug">{item.name}</h3>
        <p className="mt-0.5 font-display text-lg font-extrabold">
          <span className="text-sm text-brand">₹</span>
          {item.price}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink/50">{item.description}</p>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => toggle(item.id)}
          aria-label={fav ? `Remove ${item.name} from favourites` : `Add ${item.name} to favourites`}
          aria-pressed={fav}
          className="mt-auto flex w-fit items-center gap-1 pt-2 text-xs font-semibold text-ink/45"
        >
          <Heart size={15} className={cn(fav ? 'fill-tomato text-tomato' : '')} /> {fav ? 'Saved' : 'Save'}
        </motion.button>
      </div>

      <div className="relative w-[124px] shrink-0">
        <SmartImage id={item.image} alt={item.name} width={260} sizes="124px" className="aspect-square rounded-2xl" />
        <a
          href={whatsappLink(orderMessage(item))}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Order ${item.name} on WhatsApp`}
          className="absolute -bottom-3 left-1/2 flex h-9 w-[92px] -translate-x-1/2 items-center justify-center gap-0.5 rounded-xl border border-brand/20 bg-white text-sm font-extrabold tracking-wide text-brand shadow-[0_6px_16px_-4px_rgb(255_107_0/0.45)] active:scale-95"
        >
          ADD <Plus size={15} strokeWidth={3} />
        </a>
      </div>
    </motion.article>
  )
}

export default function MenuCard({ item }) {
  const { has, toggle } = useFavorites()
  const fav = has(item.id)
  const desktop = useIsDesktop()

  if (!desktop) return <MenuRow item={item} fav={fav} toggle={toggle} />

  return (
    <motion.article
      {...motionProps}
      className="group relative flex flex-col rounded-[1.75rem] bg-white p-3 shadow-soft transition-[box-shadow,transform] duration-500 hover:-translate-y-2 hover:shadow-lift"
    >
      {/* glow */}
      <div className="pointer-events-none absolute -inset-px -z-10 rounded-[1.8rem] bg-gradient-to-br from-brand/40 via-cheese/30 to-transparent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative">
        <SmartImage id={item.image} alt={item.name} ratio={0.78} width={480} sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 90vw" className="aspect-[1/0.78] rounded-[1.35rem]" imgClassName="group-hover:scale-110" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone="veg">
            <VegMark className="h-3.5 w-3.5" /> Veg
          </Badge>
          {item.popular && (
            <Badge tone="popular">
              <Flame size={12} /> Popular
            </Badge>
          )}
          {item.chef && (
            <Badge tone="chef">
              <ChefHat size={12} /> Chef’s Choice
            </Badge>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => toggle(item.id)}
          aria-label={fav ? `Remove ${item.name} from favourites` : `Add ${item.name} to favourites`}
          aria-pressed={fav}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110"
        >
          <Heart size={18} className={cn('transition-colors', fav ? 'fill-tomato text-tomato' : 'text-ink/50')} />
        </motion.button>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold leading-snug">{item.name}</h3>
          <span className="text-xl" aria-hidden="true">
            {catEmoji[item.category]}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/55">{item.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <p className="font-display text-2xl font-extrabold">
            <span className="text-base text-brand">₹</span>
            {item.price}
          </p>
          <a
            href={whatsappLink(orderMessage(item))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Order ${item.name} on WhatsApp`}
            className="flex h-11 items-center gap-1.5 rounded-full bg-peach px-4 text-sm font-bold text-brand transition-all duration-300 hover:bg-gradient-to-r hover:from-brand hover:to-brand-2 hover:text-white hover:shadow-soft"
          >
            <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" /> Order
          </a>
        </div>
      </div>
    </motion.article>
  )
}
