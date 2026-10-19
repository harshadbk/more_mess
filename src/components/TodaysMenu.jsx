import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Coffee, Moon, Sparkles, Sun } from 'lucide-react'
import SectionHeading from './SectionHeading.jsx'
import Reveal from './Reveal.jsx'
import DishItem from './account/DishItem.jsx'
import { api } from '../lib/api.js'
import { formatDate, rupees } from '../data/accountOptions.js'

const sections = [
  { value: 'breakfast', label: 'Breakfast', icon: Coffee },
  { value: 'lunch', label: 'Lunch', icon: Sun },
  { value: 'dinner', label: 'Dinner', icon: Moon },
  { value: 'special', label: 'Specials', icon: Sparkles },
]

/** The menu the admin posted for today. Hidden if nothing is posted or the server can't be reached. */
export default function TodaysMenu() {
  const [menu, setMenu] = useState(null)

  useEffect(() => {
    api('/menu')
      .then(setMenu)
      .catch(() => setMenu(null))
  }, [])

  if (!menu?.dishes.length) return null

  return (
    <section id="todays-menu" aria-labelledby="todays-menu-title" className="bg-white py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading id="todays-menu-title" eyebrow={formatDate(menu.date)} title="Today's menu">
          Freshly cooked today. Members pick one option per meal in their account (a group's owner picks for the whole
          group); anyone can order on WhatsApp.{' '}
          {menu.nonVegDay ? 'Today is a non-veg day.' : 'Non-veg is served on Sundays and Wednesdays.'}
        </SectionHeading>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {sections.map(({ value, label, icon: Icon }) => {
            const dishes = menu.dishes.filter((d) => d.meal === value)
            if (!dishes.length) return null
            const price = menu.prices?.[value]
            // On non-veg days the options are shown in two groups: Veg and Non-veg.
            const groups =
              menu.nonVegDay && value !== 'special' && dishes.some((d) => d.food === 'non-veg')
                ? [
                    { title: 'Veg', list: dishes.filter((d) => d.food !== 'non-veg') },
                    { title: 'Non-veg', list: dishes.filter((d) => d.food === 'non-veg') },
                  ].filter((g) => g.list.length)
                : [{ title: null, list: dishes }]
            return (
              <Reveal
                key={value}
                className={`card p-6 ${value === 'special' ? 'border-saffron/50 bg-saffron-soft/30' : ''}`}
              >
                <h3 className="flex items-center justify-between gap-2 text-xl font-extrabold">
                  <span className="flex items-center gap-2">
                    <Icon
                      className={`size-5 ${value === 'special' ? 'text-saffron' : 'text-fresh'}`}
                      aria-hidden="true"
                    />
                    {label}
                  </span>
                  {price > 0 && <span className="text-base font-semibold text-forest">{rupees(price)}</span>}
                </h3>
                {value !== 'special' && dishes.length > 1 && (
                  <p className="mt-1 text-sm text-muted">Pick one of {dishes.length} options</p>
                )}
                {groups.map((g) => (
                  <div key={g.title ?? 'all'}>
                    {g.title && (
                      <p className="mt-4 text-xs font-semibold tracking-wider text-muted uppercase">{g.title}</p>
                    )}
                    <ul className="mt-3 space-y-4">
                      {g.list.map((d) => (
                        <li key={d._id}>
                          <DishItem dish={d} showPrice={value === 'special'} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </Reveal>
            )
          })}
        </div>

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="#order-today" className="btn-primary">
            Order for today
          </a>
          <Link to="/register" className="btn-outline">
            Become a member
          </Link>
        </div>
      </div>
    </section>
  )
}
