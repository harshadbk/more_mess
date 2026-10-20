/** Small pieces shared by the admin tabs. */

export function Stat({ label, value, note, tone = 'text-forest' }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold tracking-wider text-muted uppercase">{label}</p>
      <p className={`mt-1 font-display text-3xl font-extrabold ${tone}`}>{value ?? '–'}</p>
      {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
    </div>
  )
}

export const Tick = ({ on }) =>
  on ? <span className="font-bold text-fresh">Yes</span> : <span className="text-muted">–</span>
