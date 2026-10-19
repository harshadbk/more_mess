import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl, messages } from '../utils/whatsapp.js'

/**
 * Opens WhatsApp with a prefilled message.
 * If the business number is not configured yet (businessConfig.whatsappNumber):
 *  - with `signUp="Join Sai Mess"` it becomes a link to the sign-up page with that label,
 *  - otherwise it is hidden.
 */
export default function WhatsAppButton({
  message,
  className = 'btn-primary',
  icon = true,
  signUp,
  children = 'Chat on WhatsApp',
  ...rest
}) {
  const url = buildWhatsAppUrl(message ?? messages.general())

  if (!url) {
    if (!signUp) return null
    return (
      <Link to="/register" className={className} onClick={rest.onClick}>
        {signUp}
      </Link>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {icon && <MessageCircle className="size-[18px] shrink-0" aria-hidden="true" />}
      {children}
      <span className="sr-only">(opens WhatsApp in a new tab)</span>
    </a>
  )
}

export function FloatingWhatsApp() {
  return (
    <WhatsAppButton
      message={messages.general()}
      icon={false}
      className="fixed right-4 bottom-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-fresh text-white shadow-lift ring-4 ring-white/70 transition-transform duration-200 hover:scale-105 hover:bg-forest sm:right-6 sm:bottom-6"
      aria-label="Chat with Sai Mess on WhatsApp"
    >
      <MessageCircle className="size-6" aria-hidden="true" />
    </WhatsAppButton>
  )
}
