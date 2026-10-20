import { useState } from 'react'
import { imageSrcSet, imageUrl } from '../../utils/images'
import { cn } from '../../utils/cn'

/**
 * Lazy, responsive Unsplash image with a shimmer skeleton and graceful fallback.
 * `ratio` = height / width.
 */
export default function SmartImage({ id, alt, ratio = 1, sizes = '(min-width: 1024px) 33vw, 100vw', width = 720, priority = false, className, imgClassName, style }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div style={style} className={cn(!className?.includes('absolute') && 'relative', 'overflow-hidden', !loaded && 'skeleton', className)}>
      {failed ? (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-peach to-cream text-5xl" role="img" aria-label={alt}>
          🥪
        </div>
      ) : (
        <img
          src={imageUrl(id, width, Math.round(width * ratio))}
          srcSet={imageSrcSet(id, ratio)}
          sizes={sizes}
          alt={alt}
          width={width}
          height={Math.round(width * ratio)}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover transition-all duration-700', loaded ? 'scale-100 opacity-100' : 'scale-105 opacity-0', imgClassName)}
        />
      )}
    </div>
  )
}
