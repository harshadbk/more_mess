import { useEffect, useState } from 'react'

/** Returns the id of the section currently in the middle of the viewport. */
export function useActiveSection(ids, enabled = true) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    if (!enabled) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [ids, enabled])
  return active
}
