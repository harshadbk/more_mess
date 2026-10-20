import { useState } from 'react'
import { Copy, Crown, LogOut, Trash2, UserMinus, UserPlus, Users } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useNotice } from '../Notice.jsx'
import { inputClass } from './Field.jsx'

const foodLabel = { veg: 'Veg', 'non-veg': 'Non-veg', jain: 'Jain' }

/**
 * One meal group. Owners (and admins) can add/remove members and delete the group;
 * other members can leave.
 * `onChange(group)` receives the updated group, or null when it was deleted / left.
 */
export default function GroupCard({ group, currentUser, onChange }) {
  const notify = useNotice()
  const [identifier, setIdentifier] = useState('')
  const [busy, setBusy] = useState(false)

  const ownerId = group.owner?._id
  const canManage = ownerId === currentUser._id || currentUser.role === 'admin'

  const run = async (request, { confirm, success } = {}) => {
    if (confirm && !window.confirm(confirm)) return false
    setBusy(true)
    try {
      const data = await request()
      onChange(data.group ?? null)
      if (success) notify(success)
      return true
    } catch (err) {
      notify(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const base = `/groups/${group._id}`

  const addMember = async (e) => {
    e.preventDefault()
    if (!identifier.trim()) return
    const ok = await run(() => api(`${base}/members`, { method: 'POST', body: { identifier: identifier.trim() } }), {
      success: 'Member added.',
    })
    if (ok) setIdentifier('')
  }

  const removeMember = (member) =>
    run(() => api(`${base}/members/${member._id}`, { method: 'DELETE' }), {
      confirm: `Remove ${member.name} from ${group.name}?`,
      success: `${member.name} was removed.`,
    })

  const leave = () =>
    run(() => api(`${base}/members/${currentUser._id}`, { method: 'DELETE' }), {
      confirm: `Leave ${group.name}?`,
      success: `You left ${group.name}.`,
    })

  const deleteGroup = () =>
    run(() => api(base, { method: 'DELETE' }), {
      confirm: `Delete ${group.name} for everyone? This cannot be undone.`,
      success: 'Group deleted.',
    })

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode)
      notify('Invite code copied.')
    } catch {
      notify(`Invite code: ${group.inviteCode}`)
    }
  }

  return (
    <article className="card p-6" aria-busy={busy}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold break-words">{group.name}</h3>
          {group.description && <p className="mt-1 text-[15px] text-muted">{group.description}</p>}
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
            <Users className="size-4" aria-hidden="true" />
            {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-forest/30 bg-forest/5 px-4 py-2 text-center">
          <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">Invite code</p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-lg font-bold tracking-[0.2em] text-forest">{group.inviteCode}</span>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-md p-1 text-forest hover:bg-forest/10"
              aria-label="Copy invite code"
            >
              <Copy className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-line border-y border-line">
        {group.members.map((member) => {
          const isOwner = member._id === ownerId
          return (
            <li key={member._id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold">
                  <span className="truncate">{member.name}</span>
                  {isOwner && <Crown className="size-4 shrink-0 text-saffron" aria-label="Group owner" />}
                  {member._id === currentUser._id && <span className="text-xs font-normal text-muted">(you)</span>}
                </p>
                <p className="truncate text-sm text-muted">
                  {[member.phone, foodLabel[member.foodPreference]].filter(Boolean).join(' · ')}
                </p>
              </div>
              {canManage && !isOwner && (
                <button
                  type="button"
                  onClick={() => removeMember(member)}
                  disabled={busy}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[#b4442a] hover:bg-[#b4442a]/10"
                >
                  <UserMinus className="size-4" aria-hidden="true" />
                  Remove
                </button>
              )}
            </li>
          )
        })}
      </ul>

      {canManage && (
        <form onSubmit={addMember} className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1">
            <span className="text-sm font-semibold">Add a member by email or mobile</span>
            <input
              className={inputClass(false)}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="friend@example.com or 98765 43210"
            />
          </label>
          <button type="submit" className="btn-outline" disabled={busy || !identifier.trim()}>
            <UserPlus className="size-4" aria-hidden="true" />
            Add
          </button>
        </form>
      )}

      <div className="mt-5 flex justify-end">
        {canManage ? (
          <button
            type="button"
            onClick={deleteGroup}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#b4442a] hover:underline"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete group
          </button>
        ) : (
          <button
            type="button"
            onClick={leave}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#b4442a] hover:underline"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Leave group
          </button>
        )}
      </div>
    </article>
  )
}
