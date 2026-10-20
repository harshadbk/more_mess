import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, LogOut } from 'lucide-react'
import Logo from '../Logo.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

/** Shared shell for login, register, dashboard and admin pages. */
export default function AccountLayout({ children, wide = false }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-dvh bg-cream">
      <header className="border-b border-line bg-cream/95">
        <div className="container-page flex h-[4.5rem] items-center justify-between gap-4">
          <Link to="/" className="shrink-0 rounded-lg" aria-label="Sai Mess home">
            <Logo />
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-forest hover:bg-forest/10"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Back to home page</span>
                <span className="sm:hidden">Home</span>
              </Link>
              <span className="hidden text-sm text-muted md:inline">
                {user.name}
                {user.role === 'admin' && (
                  <span className="ml-2 rounded-full bg-saffron-soft px-2 py-0.5 text-xs font-semibold text-charcoal">
                    Admin
                  </span>
                )}
              </span>
              <button type="button" onClick={onLogout} className="btn-outline min-h-10 px-4 text-sm">
                <LogOut className="size-4" aria-hidden="true" />
                Log out
              </button>
            </div>
          ) : (
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to site
            </Link>
          )}
        </div>
      </header>
      <main className={`container-page py-10 sm:py-14 ${wide ? '' : 'max-w-xl'}`}>{children}</main>
    </div>
  )
}
