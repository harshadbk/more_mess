import { useEffect, useRef } from 'react'

// Calls `reload` again every `ms` while the tab is visible, and as soon as the tab is shown again,
// so data that other people change (orders placed or updated) shows up without a page refresh.
export default function useLiveReload(reload, ms = 30 * 1000) {
  const latest = useRef(reload)
  latest.current = reload

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === 'visible') latest.current()
    }
    const timer = setInterval(run, ms)
    document.addEventListener('visibilitychange', run)
    window.addEventListener('focus', run)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', run)
      window.removeEventListener('focus', run)
    }
  }, [ms])
}
