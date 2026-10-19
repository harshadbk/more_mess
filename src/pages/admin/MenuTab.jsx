import { useEffect, useRef, useState } from 'react'
import { Coffee, Copy, ImagePlus, Moon, Pencil, Sparkles, Sun, Trash2, X } from 'lucide-react'
import Field, { ChoiceGroup, FormError } from '../../components/account/Field.jsx'
import DishItem from '../../components/account/DishItem.jsx'
import { useNotice } from '../../components/Notice.jsx'
import { api } from '../../lib/api.js'
import { resizeImage } from '../../lib/image.js'
import { addDays, formatDate, todayIST } from '../../data/accountOptions.js'

const sections = [
  { value: 'breakfast', label: 'Breakfast', icon: Coffee },
  { value: 'lunch', label: 'Lunch', icon: Sun },
  { value: 'dinner', label: 'Dinner', icon: Moon },
  { value: 'special', label: 'Special', icon: Sparkles, hint: 'Extra, priced' },
]

const emptyDish = { meal: 'lunch', name: '', food: 'veg', price: '', description: '', image: '' }

/** Add or edit one dish. `locked` = meals whose time is already over on `date`. */
function DishForm({ date, locked, editing, onSaved, onCancel }) {
  const notify = useNotice()
  const [values, setValues] = useState(editing ?? emptyDish)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => setValues(editing ?? emptyDish), [editing])

  // A closed meal can't take new dishes: move the form to the first meal still open.
  const open = sections.filter((s) => !locked.includes(s.value))
  useEffect(() => {
    if (locked.includes(values.meal) && open.length) setValues((v) => ({ ...v, meal: open[0].value }))
  }, [locked]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key) => (value) => setValues((v) => ({ ...v, [key]: value }))

  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      set('image')(await resizeImage(file))
    } catch (err) {
      notify(err.message)
    }
    e.target.value = ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!values.name.trim()) return setError('Enter the dish name.')
    if (values.meal === 'special' && !(Number(values.price) > 0)) return setError('Specials need a price.')
    if (locked.includes(values.meal)) return setError('That meal time is over for this day. Add it for tomorrow instead.')
    setBusy(true)
    setError('')
    try {
      const body = { ...values, date, price: Number(values.price) || 0 }
      const { dish } = editing
        ? await api(`/menu/${editing._id}`, { method: 'PUT', body })
        : await api('/menu', { method: 'POST', body })
      onSaved(dish, Boolean(editing))
      if (!editing) setValues((v) => ({ ...emptyDish, meal: v.meal, food: v.food }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold">{editing ? 'Edit dish' : 'Add a dish'}</h3>
        {editing && (
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-muted hover:text-charcoal">
            Cancel
          </button>
        )}
      </div>
      <p className="text-sm text-muted">For {formatDate(date)}</p>
      <FormError message={error} />
      <ChoiceGroup
        label="Meal"
        name="dishMeal"
        options={sections.map(({ value, label, hint }) =>
          locked.includes(value) ? { value, label, hint: 'Time is over', disabled: true } : { value, label, hint },
        )}
        value={values.meal}
        onChange={set('meal')}
      />
      <Field
        label="Dish name"
        name="dishName"
        placeholder="e.g. Veg thali, Poha, Chicken biryani"
        maxLength={80}
        value={values.name}
        onChange={(e) => set('name')(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        {['veg', 'non-veg'].map((food) => (
          <button
            key={food}
            type="button"
            aria-pressed={values.food === food}
            onClick={() => set('food')(food)}
            className={`rounded-xl border px-4 py-2.5 font-semibold ${
              values.food === food ? 'border-forest bg-forest/5 text-forest' : 'border-line bg-white'
            }`}
          >
            {food === 'veg' ? 'Veg' : 'Non-veg'}
          </button>
        ))}
      </div>
      <Field
        label={values.meal === 'special' ? 'Price (₹) *' : 'Price (₹, optional)'}
        name="dishPrice"
        type="number"
        min="0"
        inputMode="numeric"
        placeholder={values.meal === 'special' ? '120' : 'Empty = standard price (Prices tab)'}
        value={values.price}
        onChange={(e) => set('price')(e.target.value)}
      />
      <Field
        label="Description (optional)"
        name="dishDescription"
        placeholder="e.g. 3 chapati, dal, rice, sabzi"
        maxLength={160}
        value={values.description}
        onChange={(e) => set('description')(e.target.value)}
      />
      <div>
        <p className="text-sm font-semibold">Photo (optional)</p>
        <div className="mt-2 flex items-center gap-3">
          {values.image ? (
            <span className="relative">
              <img src={values.image} alt="Dish preview" className="size-20 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => set('image')('')}
                className="absolute -top-2 -right-2 rounded-full bg-charcoal p-1 text-white"
                aria-label="Remove photo"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ) : null}
          <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline min-h-11 px-4 text-sm">
            <ImagePlus className="size-4" aria-hidden="true" />
            {values.image ? 'Change photo' : 'Upload photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="sr-only" tabIndex={-1} />
        </div>
      </div>
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Saving…' : editing ? 'Save changes' : 'Add dish'}
      </button>
    </form>
  )
}

/** Admin: the menu for any day: breakfast, lunch, dinner and specials. */
export default function MenuTab() {
  const notify = useNotice()
  const [date, setDate] = useState(todayIST())
  const [dishes, setDishes] = useState(null)
  const [locked, setLocked] = useState([])
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setDishes(null)
    setEditing(null)
    api(`/menu?date=${date}`)
      .then(({ dishes, locked }) => {
        setDishes(dishes)
        setLocked(locked ?? [])
      })
      .catch((err) => setError(err.message))
  }, [date])

  const onSaved = (dish, wasEdit) => {
    setDishes((list) => (wasEdit ? list.map((d) => (d._id === dish._id ? dish : d)) : [...list, dish]))
    setEditing(null)
    notify(wasEdit ? `${dish.name} updated.` : `${dish.name} added to ${formatDate(date)}.`)
  }

  const remove = async (dish) => {
    if (!window.confirm(`Remove ${dish.name} from the menu?`)) return
    try {
      await api(`/menu/${dish._id}`, { method: 'DELETE' })
      setDishes((list) => list.filter((d) => d._id !== dish._id))
    } catch (err) {
      notify(err.message)
    }
  }

  const copyFromYesterday = async () => {
    const from = addDays(date, -1)
    if (dishes?.length && !window.confirm(`Add all dishes from ${formatDate(from)} to this day as well?`)) return
    try {
      const { dishes: copied } = await api('/menu/copy', { method: 'POST', body: { from, to: date } })
      setDishes(copied)
      notify(`Copied the menu from ${formatDate(from)}.`)
    } catch (err) {
      notify(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
          <Field label="Menu for" name="menuDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button type="button" onClick={() => setDate(todayIST())} className="btn-outline min-h-11 px-4 text-sm">
          Today
        </button>
        <button type="button" onClick={() => setDate(todayIST(1))} className="btn-outline min-h-11 px-4 text-sm">
          Tomorrow
        </button>
        <button type="button" onClick={copyFromYesterday} className="btn-outline min-h-11 px-4 text-sm">
          <Copy className="size-4" aria-hidden="true" />
          Copy previous day
        </button>
      </div>
      <FormError message={error} />

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          {!dishes && !error && <p className="text-muted">Loading menu…</p>}
          {dishes &&
            sections.map(({ value, label, icon: Icon }) => {
              const list = dishes.filter((d) => d.meal === value)
              return (
                <section key={value} className="card p-5">
                  <h3 className="flex items-center gap-2 font-extrabold">
                    <Icon
                      className={`size-5 ${value === 'special' ? 'text-saffron' : 'text-fresh'}`}
                      aria-hidden="true"
                    />
                    {label} <span className="text-sm font-normal text-muted">({list.length})</span>
                  </h3>
                  {locked.includes(value) && list.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">
                      {label} time is over for {formatDate(date)}.{' '}
                      {date === todayIST() && (
                        <button
                          type="button"
                          onClick={() => setDate(todayIST(1))}
                          className="font-semibold text-forest underline"
                        >
                          Add it for tomorrow
                        </button>
                      )}
                    </p>
                  ) : list.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">No dishes yet.</p>
                  ) : (
                    <ul className="mt-3 divide-y divide-line">
                      {list.map((dish) => (
                        <li key={dish._id} className="py-3">
                          <DishItem dish={dish} showPrice>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => setEditing(dish)}
                                className="rounded-full p-2 text-forest hover:bg-forest/10"
                                aria-label={`Edit ${dish.name}`}
                              >
                                <Pencil className="size-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => remove(dish)}
                                className="rounded-full p-2 text-[#b4442a] hover:bg-[#b4442a]/10"
                                aria-label={`Remove ${dish.name}`}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </button>
                            </div>
                          </DishItem>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <DishForm date={date} locked={locked} editing={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />
        </div>
      </div>
    </div>
  )
}
