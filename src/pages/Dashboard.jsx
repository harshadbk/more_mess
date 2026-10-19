import { useEffect, useState } from 'react'
import { CalendarDays, KeyRound, Pencil, Plus, User, Wallet } from 'lucide-react'
import AccountLayout from '../components/account/AccountLayout.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import Field, { ChoiceGroup, FormError, MultiChoice } from '../components/account/Field.jsx'
import GroupCard from '../components/account/GroupCard.jsx'
import GroupLedger from '../components/account/GroupLedger.jsx'
import PaymentList, { agreedTotal } from '../components/account/PaymentList.jsx'
import AccountSummary from '../components/account/AccountSummary.jsx'
import OrderCart from '../components/account/OrderCart.jsx'
import Heatmap from '../components/account/Heatmap.jsx'
import MonthTab from './admin/MonthTab.jsx'
import { useNotice } from '../components/Notice.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { foodLabel, mealOptions, mealsLabel, planLabel, planOptions, rupees, todayIST } from '../data/accountOptions.js'

function PlanCard() {
  const { user, setUser } = useAuth()
  const notify = useNotice()
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState({ plan: user.plan, meals: user.meals })
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    try {
      const { user: updated } = await api('/auth/me', { method: 'PATCH', body: values })
      setUser(updated)
      setEditing(false)
      notify('Your plan was updated.')
    } catch (err) {
      notify(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-6" aria-labelledby="plan-title">
      <div className="flex items-center justify-between gap-2">
        <h2 id="plan-title" className="text-lg font-extrabold">
          My plan
        </h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline"
          >
            <Pencil className="size-4" aria-hidden="true" />
            Change
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-5">
          <ChoiceGroup
            label="How do you want to pay?"
            name="plan"
            options={planOptions}
            value={values.plan}
            onChange={(plan) => setValues((v) => ({ ...v, plan }))}
          />
          <MultiChoice
            label="Which meals every day?"
            hint="You can still skip or add a meal on any day."
            name="meals"
            options={mealOptions}
            value={values.meals}
            onChange={(meals) => setValues((v) => ({ ...v, meals }))}
          />
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={busy} className="btn-primary flex-1">
              {busy ? 'Saving…' : 'Save plan'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn-outline">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            ['Pays', planLabel(user.plan)],
            ['Daily', mealsLabel(user.meals)],
            ['Food', foodLabel(user.foodPreference)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-cream-dark/60 px-2 py-3">
              <dt className="text-[11px] font-semibold tracking-wider text-muted uppercase">{label}</dt>
              <dd className="mt-1 text-sm font-bold text-forest">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

function CreateGroupForm({ onCreated }) {
  const [values, setValues] = useState({ name: '', description: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (values.name.trim().length < 2) return setError('Give your group a name (at least 2 characters).')
    setBusy(true)
    setError('')
    try {
      const { group } = await api('/groups', { method: 'POST', body: values })
      onCreated(group)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <h3 className="flex items-center gap-2 font-bold">
        <Plus className="size-4 text-fresh" aria-hidden="true" />
        Create a group
      </h3>
      <FormError message={error} />
      <Field
        label="Group name"
        name="groupName"
        placeholder="e.g. Room 204 friends"
        maxLength={60}
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
      />
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Creating…' : 'Create group'}
      </button>
    </form>
  )
}

function JoinGroupForm({ onJoined }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!code.trim()) return setError('Enter the invite code you were given.')
    setBusy(true)
    setError('')
    try {
      const { group } = await api('/groups/join', { method: 'POST', body: { inviteCode: code } })
      onJoined(group)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" noValidate>
      <h3 className="flex items-center gap-2 font-bold">
        <KeyRound className="size-4 text-fresh" aria-hidden="true" />
        Join with a code
      </h3>
      <FormError message={error} />
      <Field
        label="Invite code"
        name="inviteCode"
        placeholder="ABC234"
        autoComplete="off"
        maxLength={12}
        className="font-mono uppercase"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
      />
      <button type="submit" className="btn-outline w-full" disabled={busy}>
        {busy ? 'Joining…' : 'Join group'}
      </button>
    </form>
  )
}

/** Shown when the user eats on their own. Groups are optional. */
function NoGroup({ onGroup }) {
  const notify = useNotice()
  const created = (g) => {
    onGroup(g)
    notify(`Group “${g.name}” created. Share invite code ${g.inviteCode} with your friends.`)
  }
  const joined = (g) => {
    onGroup(g)
    notify(`You joined ${g.name}.`)
  }
  return (
    <section className="card p-6" aria-labelledby="group-title">
      <h2 id="group-title" className="flex items-center gap-2 text-lg font-extrabold">
        <User className="size-5 text-fresh" aria-hidden="true" />
        You're joining as an individual
      </h2>
      <p className="mt-1 text-sm text-muted">
        That's fine, groups are optional. If you eat with friends, make a group so your tiffins and payments are counted
        together.
      </p>
      <div className="mt-5 space-y-6">
        <CreateGroupForm onCreated={created} />
        <div className="border-t border-line" />
        <JoinGroupForm onJoined={joined} />
      </div>
    </section>
  )
}

function RecordPaymentForm({ group, onAdded }) {
  const notify = useNotice()
  const [values, setValues] = useState({ amount: '', paidOn: todayIST(), note: '', forGroup: false })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!(Number(values.amount) > 0)) return setError('Enter the amount you paid.')
    setBusy(true)
    setError('')
    try {
      const { payment } = await api('/payments', { method: 'POST', body: values })
      onAdded(payment)
      setValues((v) => ({ ...v, amount: '', note: '' }))
      notify('Payment recorded. Sai Mess will confirm it.')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <h3 className="font-bold">I paid Sai Mess</h3>
      <FormError message={error} />
      {group && (
        <ChoiceGroup
          label="Paid for"
          name="forGroup"
          options={[
            { value: 'me', label: 'Just me' },
            { value: 'group', label: `My group`, hint: group.name },
          ]}
          value={values.forGroup ? 'group' : 'me'}
          onChange={(v) => setValues((x) => ({ ...x, forGroup: v === 'group' }))}
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Amount (₹)"
          name="amount"
          type="number"
          inputMode="numeric"
          min="1"
          placeholder="2000"
          value={values.amount}
          onChange={(e) => setValues((v) => ({ ...v, amount: e.target.value }))}
        />
        <Field
          label="Paid on"
          name="paidOn"
          type="date"
          value={values.paidOn}
          onChange={(e) => setValues((v) => ({ ...v, paidOn: e.target.value }))}
        />
      </div>
      <Field
        label="Note (optional)"
        name="note"
        placeholder="e.g. UPI, October month"
        value={values.note}
        onChange={(e) => setValues((v) => ({ ...v, note: e.target.value }))}
      />
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Saving…' : 'Record payment'}
      </button>
    </form>
  )
}

function MyHeatmap({ refreshKey, groupName }) {
  const [history, setHistory] = useState(null) // { days, since }
  useEffect(() => {
    api('/orders/history?days=182')
      .then(setHistory)
      .catch(() => setHistory({ days: [], since: '' }))
  }, [refreshKey])
  return (
    <section className="card p-6" aria-labelledby="history-title">
      <h2 id="history-title" className="flex items-center gap-2 text-lg font-extrabold">
        <CalendarDays className="size-5 text-fresh" aria-hidden="true" />
        My tiffin calendar
      </h2>
      <p className="mt-1 mb-4 text-sm text-muted">
        Last 6 months
        {groupName ? `: your tiffins, including the meals you were ticked for in “${groupName}”` : ''}. Darker = more
        tiffins. Tap or hover a day for the meal-by-meal count.
      </p>
      {history ? (
        <Heatmap days={history.days} since={history.since} showAmount />
      ) : (
        <p className="text-muted">Loading…</p>
      )}
    </section>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [group, setGroup] = useState(undefined) // undefined = loading, null = no group
  const [payments, setPayments] = useState(null)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0) // bump to reload totals and calendar
  const refresh = () => setRefreshKey((k) => k + 1)

  const loadPayments = () =>
    api('/payments')
      .then(({ payments }) => setPayments(payments))
      .catch((err) => setError(err.message))

  useEffect(() => {
    api('/groups')
      .then(({ groups }) => setGroup(groups[0] ?? null))
      .catch((err) => setError(err.message))
    loadPayments()
  }, [])

  // Joining or leaving a group changes which payments you can see.
  const changeGroup = (next) => {
    setGroup(next)
    loadPayments()
    refresh()
  }

  const pending = payments?.filter((p) => !p.rejected && !p.customerConfirmed).length ?? 0
  // In a group only the owner pays the mess; other members pay the owner (see GroupLedger).
  const isOwner = Boolean(group && group.owner?._id === user._id)
  const showMessPayments = !group || isOwner || Boolean(payments?.length)

  return (
    <AccountLayout wide>
      <p className="eyebrow">Your account</p>
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Namaste, {user.name.split(' ')[0]}</h1>
      <p className="mt-3 max-w-2xl text-muted">
        {group ? `You eat with the group “${group.name}”.` : 'You are joining as an individual.'} Manage your tiffins
        and payments here.
      </p>
      <FormError message={error} />
      <div className="mt-8">
        <ErrorBoundary name="Your account">
          <AccountSummary refreshKey={refreshKey} />
        </ErrorBoundary>
      </div>

      {/* Phones: planner, then plan + group, then calendar + payments. Large screens: plan + group on the right. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="lg:col-start-1">
          <ErrorBoundary name="Your order">
            <OrderCart planKey={`${user.meals.join()}|${refreshKey}`} onSaved={refresh} />
          </ErrorBoundary>
          {group && (
            <div className="mt-8">
              <ErrorBoundary name="Group payments">
                <GroupLedger group={group} refreshKey={refreshKey} onChange={refresh} />
              </ErrorBoundary>
            </div>
          )}
        </div>

        <aside className="space-y-8 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <ErrorBoundary name="Your plan">
            <PlanCard />
          </ErrorBoundary>
          {group === undefined ? (
            <p className="text-muted">Loading group…</p>
          ) : group ? (
            <ErrorBoundary name="Your group">
              <GroupCard group={group} currentUser={user} onChange={changeGroup} />
            </ErrorBoundary>
          ) : (
            <ErrorBoundary name="Groups">
              <NoGroup onGroup={changeGroup} />
            </ErrorBoundary>
          )}
        </aside>

        <div className="space-y-8 lg:col-start-1">
          <ErrorBoundary name="Your tiffin calendar">
            <MyHeatmap refreshKey={refreshKey} groupName={group?.name} />
          </ErrorBoundary>
          {group && (
            <ErrorBoundary name="Group tiffins">
              <MonthTab key={refreshKey} group={group} me={user._id} />
            </ErrorBoundary>
          )}

          {showMessPayments && (
            <section aria-labelledby="payments-title">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 id="payments-title" className="flex items-center gap-2 text-2xl font-extrabold">
                  <Wallet className="size-6 text-fresh" aria-hidden="true" />
                  Payments
                </h2>
                {payments && (
                  <p className="text-sm text-muted">
                    Agreed total: <strong className="text-forest">{rupees(agreedTotal(payments))}</strong>
                    {pending > 0 && <span className="ml-2 font-semibold text-saffron">{pending} to confirm</span>}
                  </p>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">A payment counts once both you and Sai Mess have confirmed it.</p>
              <div className="mt-4 space-y-5">
                <RecordPaymentForm
                  group={isOwner ? group : null}
                  onAdded={(p) => setPayments((list) => [p, ...(list ?? [])])}
                />
                {payments && (
                  <PaymentList
                    payments={payments}
                    side="customer"
                    showPayer={Boolean(group)}
                    onChange={(p) => {
                      setPayments((list) => list.map((x) => (x._id === p._id ? p : x)))
                      refresh()
                    }}
                  />
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </AccountLayout>
  )
}
