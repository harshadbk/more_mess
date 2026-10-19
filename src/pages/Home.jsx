import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import Benefits from '../components/Benefits.jsx'
import MenuSection from '../components/MenuSection.jsx'
import TodaysMenu from '../components/TodaysMenu.jsx'
import MealPlans from '../components/MealPlans.jsx'
import TodayOrder from '../components/TodayOrder.jsx'
import Gallery from '../components/Gallery.jsx'
import About from '../components/About.jsx'
import HowToJoin from '../components/HowToJoin.jsx'
import Testimonials from '../components/Testimonials.jsx'
import FAQ from '../components/FAQ.jsx'
import Contact from '../components/Contact.jsx'
import Footer from '../components/Footer.jsx'
import { FloatingWhatsApp } from '../components/WhatsAppButton.jsx'

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-forest focus:px-5 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Benefits />
        <TodaysMenu />
        <MenuSection />
        <MealPlans />
        <TodayOrder />
        <Gallery />
        <About />
        <HowToJoin />
        <Testimonials />
        <FAQ />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  )
}
