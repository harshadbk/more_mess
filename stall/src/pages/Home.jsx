import { motion } from 'framer-motion'
import { pageTransition } from '../animations/variants'
import Seo from '../components/common/Seo'
import Contact from '../components/contact/Contact'
import Gallery from '../components/gallery/Gallery'
import About from '../components/home/About'
import { Faq, InstagramFeed, Newsletter, OrderCta } from '../components/home/Extras'
import Hero from '../components/home/Hero'
import MenuSection from '../components/home/MenuSection'
import Offers from '../components/home/Offers'
import Specials from '../components/home/Specials'
import Stats from '../components/home/Stats'
import WhyChooseUs from '../components/home/WhyChooseUs'
import Reviews from '../components/testimonials/Reviews'

export default function Home() {
  return (
    <motion.div {...pageTransition}>
      <Seo />
      <Hero />
      <MenuSection />
      <Specials />
      <Stats />
      <WhyChooseUs />
      <Offers />
      <Gallery />
      <About />
      <Reviews />
      <InstagramFeed />
      <Faq />
      <OrderCta />
      <Contact />
      <Newsletter />
    </motion.div>
  )
}
