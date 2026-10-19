import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert, X } from 'lucide-react'

const NoticeContext = createContext(() => {})

/** Lightweight toast used for setup messages (e.g. WhatsApp not configured). */
export function NoticeProvider({ children }) {
  const [notice, setNotice] = useState(null)
  const timer = useRef(null)

  const show = useCallback((message) => {
    clearTimeout(timer.current)
    setNotice({ message, key: Date.now() })
    timer.current = setTimeout(() => setNotice(null), 7000)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  const value = useMemo(() => show, [show])

  return (
    <NoticeContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 sm:bottom-8"
      >
        {notice && (
          <div
            key={notice.key}
            className="pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl bg-charcoal px-4 py-3 text-sm text-white shadow-lift"
          >
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-saffron" aria-hidden="true" />
            <p className="flex-1 leading-relaxed">{notice.message}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="-m-1 rounded-full p-1 text-white/70 hover:text-white"
              aria-label="Dismiss message"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </NoticeContext.Provider>
  )
}

export const useNotice = () => useContext(NoticeContext)
