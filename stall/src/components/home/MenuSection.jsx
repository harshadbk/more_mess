import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import MenuExplorer from '../menu/MenuExplorer'
import SectionHeading from '../ui/SectionHeading'

export default function MenuSection() {
  return (
    <section id="menu" className="relative bg-gradient-to-b from-transparent via-peach/30 to-transparent py-14 sm:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeading eyebrow="Our menu" title="Made fresh," highlight="made for you." text="40+ handcrafted favourites, every single one 100% vegetarian. Tap Order and we'll have it ready." />
        <MenuExplorer defaultTab="sandwich" />
        <div className="mt-8 text-center sm:mt-12">
          <Link to="/menu" className="group inline-flex items-center gap-2 font-bold text-brand">
            Open the full menu page <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
