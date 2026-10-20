import { Star } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Stars({ value = 5, size = 16, className }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} className={i < Math.round(value) ? 'fill-cheese text-cheese' : 'fill-mist text-mist'} />
      ))}
    </div>
  )
}
