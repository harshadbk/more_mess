import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { pageTransition } from '../animations/variants'
import Seo from '../components/common/Seo'

export default function NotFound() {
  return (
    <motion.section {...pageTransition} className="container-x grid min-h-[80vh] place-items-center pt-24 text-center">
      <Seo title="Page not found" path="/404" />
      <div>
        <motion.p animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2.5 }} className="text-8xl">
          🥪
        </motion.p>
        <h1 className="mt-6 text-5xl font-extrabold">
          This page got <span className="text-gradient">eaten.</span>
        </h1>
        <p className="mt-3 text-ink/60">Let’s get you back to the good stuff.</p>
        <Link to="/" className="mt-8 inline-flex h-12 items-center rounded-full bg-gradient-to-r from-brand to-brand-2 px-6 font-semibold text-white shadow-soft">
          Back to home
        </Link>
      </div>
    </motion.section>
  )
}
