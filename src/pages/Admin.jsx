import { useCallback, useEffect, useState } from 'react'
import AccountLayout from '../components/account/AccountLayout.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import { FormError } from '../components/account/Field.jsx'
import GroupCard from '../components/account/GroupCard.jsx'
import { useNotice } from '../components/Notice.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { todayIST } from '../data/accountOptions.js'
import ActivityTab from './admin/ActivityTab.jsx'
import DuesTab from './admin/DuesTab.jsx'
import MenuTab from './admin/MenuTab.jsx'
import OrdersTab from './admin/OrdersTab.jsx'
import PaymentsTab from './admin/PaymentsTab.jsx'
import PricesTab from './admin/PricesTab.jsx'
import UsersTab from './admin/UsersTab.jsx'
import { Stat } from './admin/shared.jsx'

const tabs = [
  { id: 'orders', label: "Today's orders" },
  { id: 'menu', label: 'Menu' },
  { id: 'activity', label: 'Heatmap' },
  { id: 'dues', label: 'Dues' },
  { id: 'payments', label: 'Payments' },
  { id: 'users', label: 'Users' },
  { id: 'groups', label: 'Groups' },
  { id: 'prices', label: 'Prices' },
]

export default function Admin() {
  const { user } = useAuth()
  const notify = useNotice()
  const [tab, setTab] = useState('orders')
  const [ordersDate, setOrdersDate] = useState(todayIST())
  const [users, setUsers] = useState(null)
  const [groups, setGroups] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    Promise.all([api('/admin/users'), api('/admin/groups')])
      .then(([u, g]) => {
        setUsers(u.users)
        setGroups(g.groups)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(load, [load, tab]) // refresh the counts and lists whenever a tab is opened

  const toggleActive = async (target) => {
    const active = target.active === false
    try {
      const { user: updated } = await api(`/admin/users/${target._id}`, { method: 'PATCH', body: { active } })
      setUsers((list) => list.map((u) => (u._id === updated._id ? updated : u)))
      notify(
        active
          ? `${target.name} is active again from tomorrow.`
          : `${target.name} marked as left. No tiffins counted after today.`,
      )
    } catch (err) {
      notify(err.message)
    }
  }

  const deleteUser = async (target) => {
    if (!window.confirm(`Delete ${target.name}'s account? Their tiffin history is deleted too.`)) return
    try {
      await api(`/admin/users/${target._id}`, { method: 'DELETE' })
      notify(`${target.name} was deleted.`)
      load()
    } catch (err) {
      notify(err.message)
    }
  }

  const openDay = (date) => {
    setOrdersDate(date)
    setTab('orders')
  }

  const customers = users?.filter((u) => u.role === 'user') ?? []
  const needsUsers = ['payments', 'users', 'groups'].includes(tab)

  return (
    <AccountLayout wide>
      <p className="eyebrow">Admin</p>
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Sai Mess dashboard</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Active customers" value={users ? customers.filter((u) => u.active !== false).length : null} />
        <Stat label="Groups" value={groups?.length} />
        <Stat
          label="Individuals"
          value={
            users && groups
              ? customers.filter((u) => !groups.some((g) => g.members.some((m) => m._id === u._id))).length
              : null
          }
        />
      </div>

      <div className="mt-10 flex flex-wrap gap-2 print:hidden" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? 'bg-forest text-white' : 'bg-white text-charcoal hover:bg-forest/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ErrorBoundary key={tab} name="This tab">
          <FormError message={error} />
          {tab === 'orders' && <OrdersTab date={ordersDate} setDate={setOrdersDate} />}
          {tab === 'menu' && <MenuTab />}
          {tab === 'activity' && <ActivityTab onOpenDay={openDay} />}
          {tab === 'dues' && <DuesTab />}
          {tab === 'prices' && <PricesTab />}
          {needsUsers && !error && !(users && groups) && <p className="text-muted">Loading…</p>}
          {tab === 'payments' && users && groups && <PaymentsTab users={users} groups={groups} />}
          {tab === 'users' && users && groups && (
            <UsersTab
              users={users}
              groups={groups}
              currentUser={user}
              onToggleActive={toggleActive}
              onDelete={deleteUser}
            />
          )}
          {tab === 'groups' && groups && (
            <div className="grid gap-5 lg:grid-cols-2">
              {groups.length === 0 && <p className="card p-6 text-muted">No groups yet.</p>}
              {groups.map((g) => (
                <GroupCard
                  key={g._id}
                  group={g}
                  currentUser={user}
                  onChange={(updated) =>
                    setGroups((list) =>
                      updated ? list.map((x) => (x._id === g._id ? updated : x)) : list.filter((x) => x._id !== g._id),
                    )
                  }
                />
              ))}
            </div>
          )}
        </ErrorBoundary>
      </div>
    </AccountLayout>
  )
}
