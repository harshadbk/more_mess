/** Sai Mess mark: a steaming bowl on a forest-green tile. Keep in sync with public/favicon.svg. */
export function LogoMark({ className = 'size-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="13" fill="#174D35" />
      <path
        d="M17 9.5c-1.6 1.7-1.6 3.4 0 5.1s1.6 3.4 0 5.1M24 7.5c-1.6 1.7-1.6 3.4 0 5.1s1.6 3.4 0 5.1M31 9.5c-1.6 1.7-1.6 3.4 0 5.1s1.6 3.4 0 5.1"
        fill="none"
        stroke="#F4A340"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M8.5 24h31a15.5 15.5 0 0 1-31 0Z" fill="#FFF9EF" />
      <path d="M8.5 24h31" stroke="#2F7D50" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="18" y="38.5" width="12" height="2.6" rx="1.3" fill="#FFF9EF" />
    </svg>
  )
}

export default function Logo({ light = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="size-10 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[19px] font-extrabold tracking-[0.12em] ${light ? 'text-white' : 'text-forest'}`}
        >
          SAI <span className={light ? 'text-saffron' : 'text-fresh'}>MESS</span>
        </span>
        <span
          className={`mt-1 text-[10px] font-medium tracking-[0.22em] uppercase ${light ? 'text-white/60' : 'text-muted'}`}
        >
          Ghar jaisa khana
        </span>
      </span>
    </span>
  )
}
