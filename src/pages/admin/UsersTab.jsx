import { Trash2 } from 'lucide-react'
import { foodLabel, mealsLabel, planLabel } from '../../data/accountOptions.js'

/** Everyone with their plan and group. Mark customers who left, or delete accounts. */
export default function UsersTab({ users, groups, currentUser, onToggleActive, onDelete }) {
  const groupOf = (u) => groups.find((g) => g.members.some((m) => m._id === u._id))?.name
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-line bg-cream-dark/50 text-xs tracking-wider text-muted uppercase">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Contact</th>
            <th className="px-4 py-3 font-semibold">Plan</th>
            <th className="px-4 py-3 font-semibold">Group</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {users.map((u) => {
            const isSelf = u._id === currentUser._id
            return (
              <tr key={u._id} className={u.active === false ? 'opacity-60' : ''}>
                <td className="px-4 py-3 font-semibold">
                  {u.name}
                  {u.role === 'admin' && (
                    <span className="ml-2 rounded-full bg-saffron-soft px-2 py-0.5 text-xs text-charcoal">Admin</span>
                  )}
                  {u.address && <div className="max-w-56 truncate font-normal text-muted">{u.address}</div>}
                </td>
                <td className="px-4 py-3">
                  <div>{u.phone}</div>
                  <div className="text-muted">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  {u.role === 'user' ? (
                    <>
                      <div>
                        {planLabel(u.plan)} · {mealsLabel(u.meals)}
                      </div>
                      <div className="text-muted">{foodLabel(u.foodPreference)}</div>
                    </>
                  ) : (
                    <span className="text-muted">–</span>
                  )}
                </td>
                <td className="px-4 py-3">{groupOf(u) ?? <span className="text-muted">Individual</span>}</td>
                <td className="px-4 py-3">
                  {u.role === 'user' && (
                    <button
                      type="button"
                      onClick={() => onToggleActive(u)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        u.active === false ? 'bg-cream-dark text-muted' : 'bg-fresh/10 text-fresh'
                      }`}
                      title="Inactive people are not counted in orders"
                    >
                      {u.active === false ? 'Left mess' : 'Active'}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => onDelete(u)}
                      className="rounded-full p-2 text-[#b4442a] hover:bg-[#b4442a]/10"
                      aria-label={`Delete ${u.name}`}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
