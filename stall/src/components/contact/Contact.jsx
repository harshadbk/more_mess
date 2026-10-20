import { motion } from 'framer-motion'
import { Clock, MapPin, Navigation, Phone, Send } from 'lucide-react'
import { useState } from 'react'
import { FaWhatsapp } from 'react-icons/fa6'
import { slideLeft, slideRight } from '../../animations/variants'
import { site } from '../../data/site'
import { sendContactMessage } from '../../services/contactService'
import { callLink, whatsappLink } from '../../utils/whatsapp'
import Button from '../ui/Button'
import SectionHeading from '../ui/SectionHeading'

const input = 'h-13 w-full rounded-2xl border-2 border-transparent bg-mist px-4 py-3 outline-none transition focus:border-brand/40 focus:bg-white'

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    await sendContactMessage(form)
    setSent(true)
    setForm({ name: '', phone: '', message: '' })
  }

  return (
    <section id="contact" className="py-14 sm:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeading eyebrow="📍 Visit us" title="Hungry?" highlight="Come say hi." text="Call, WhatsApp or drop by the stall. Your sandwich is just minutes away." />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <motion.div variants={slideLeft} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <a href={callLink} className="group rounded-[1.5rem] bg-white p-4 shadow-soft sm:rounded-[2rem] sm:p-6 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white transition group-hover:rotate-12">
                  <Phone size={24} />
                </span>
                <p className="mt-4 text-sm font-semibold text-ink/50">Call us</p>
                <p className="font-display text-[15px] font-bold sm:text-xl">{site.phoneDisplay}</p>
              </a>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="group rounded-[1.5rem] bg-white p-4 shadow-soft sm:rounded-[2rem] sm:p-6 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#25D366] text-white transition group-hover:rotate-12">
                  <FaWhatsapp size={26} />
                </span>
                <p className="mt-4 text-sm font-semibold text-ink/50">WhatsApp order</p>
                <p className="font-display text-[15px] font-bold sm:text-xl">Chat now →</p>
              </a>
            </div>

            <div className="rounded-[2rem] bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <Clock className="text-brand" />
                <h3 className="text-lg font-bold">Business Hours</h3>
              </div>
              <ul className="mt-4 divide-y divide-mist">
                {site.hours.map((h) => (
                  <li key={h.day} className="flex justify-between gap-4 py-3 text-sm sm:text-base">
                    <span className="text-ink/60">{h.day}</span>
                    <span className="font-semibold">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-[2rem] bg-white shadow-soft">
              <iframe title="Map to Shree Sai Snacks & Sandwich" src={site.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full border-0 grayscale-[30%]" />
              <div className="flex items-center justify-between gap-4 p-5">
                <p className="flex items-start gap-2 text-sm text-ink/70">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-brand" /> {site.address}
                </p>
                <a href={site.mapLink} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1.5 rounded-full bg-peach px-4 py-2 text-sm font-bold text-brand transition hover:bg-brand hover:text-white">
                  <Navigation size={15} /> Directions
                </a>
              </div>
            </div>
          </motion.div>

          <motion.form variants={slideRight} initial="hidden" whileInView="show" viewport={{ once: true }} onSubmit={submit} className="flex flex-col rounded-[2rem] bg-white p-6 shadow-soft sm:p-10">
            <h3 className="text-2xl font-bold">Send us a message</h3>
            <p className="mt-1 text-ink/55">Bulk orders, parties, feedback: we usually reply within minutes.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-sm font-semibold">Name</span>
                <input required value={form.name} onChange={set('name')} className={input} placeholder="Your name" autoComplete="name" />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-semibold">Phone</span>
                <input required type="tel" pattern="[0-9+\s-]{10,15}" value={form.phone} onChange={set('phone')} className={input} placeholder="98765 43210" autoComplete="tel" />
              </label>
            </div>
            <label className="mt-5 block flex-1">
              <span className="mb-1.5 block text-sm font-semibold">Message</span>
              <textarea required rows={6} value={form.message} onChange={set('message')} className={`${input} h-full min-h-32 resize-none sm:min-h-40`} placeholder="I'd like to order 10 grill sandwiches for Saturday…" />
            </label>
            <Button type="submit" size="lg" className="mt-6 w-full sm:w-fit">
              <Send size={18} /> Send via WhatsApp
            </Button>
            {sent && (
              <p role="status" className="mt-4 text-sm font-semibold text-emerald-600">
                ✓ WhatsApp opened with your message. Just hit send!
              </p>
            )}
          </motion.form>
        </div>
      </div>
    </section>
  )
}
