import { motion } from 'framer-motion'
import { pageTransition } from '../animations/variants'
import Seo from '../components/common/Seo'
import { OrderCta } from '../components/home/Extras'
import MenuExplorer from '../components/menu/MenuExplorer'

export default function MenuPage() {
  return (
    <motion.div {...pageTransition}>
      <Seo title="Menu" description="The full Shree Sai Snacks menu: sandwiches, toasts, grills, slices, burgers, fries and coffee, 100% veg." path="/menu" />
      <section className="relative overflow-hidden pb-20 pt-36">
        <div aria-hidden="true" className="absolute -right-32 -top-32 -z-10 h-[480px] w-[480px] rounded-full bg-brand-2/20 blur-[90px]" />
        <div aria-hidden="true" className="grain absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />
        <div className="container-x">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">🥪 Full menu</span>
            <h1 className="mt-4 text-5xl font-extrabold leading-[1.02] sm:text-6xl lg:text-7xl">
              Pick your <span className="text-gradient">happiness.</span>
            </h1>
            <p className="mt-5 text-lg text-ink/60">Search by name, category or price, then tap Order to add it and send your order on WhatsApp.</p>
          </div>
          <MenuExplorer />
        </div>
      </section>
      <OrderCta />
    </motion.div>
  )
}
