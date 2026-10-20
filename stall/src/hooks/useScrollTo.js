import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/** Scroll to a home-page section, navigating home first when on another route. */
export function useScrollTo() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return useCallback(
    (id) => {
      if (pathname !== '/') {
        navigate(`/#${id}`)
        return
      }
      if (id === 'home') window.scrollTo({ top: 0, behavior: 'smooth' })
      else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    },
    [navigate, pathname],
  )
}
