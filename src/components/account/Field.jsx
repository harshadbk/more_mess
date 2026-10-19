export const inputClass = (invalid) =>
  `mt-2 block w-full rounded-xl border bg-white px-4 py-3 text-base text-charcoal placeholder:text-muted/70 transition-colors focus:outline-none focus-visible:ring-4 ${
    invalid
      ? 'border-[#b4442a] focus-visible:ring-[#b4442a]/15'
      : 'border-line hover:border-forest/40 focus-visible:border-forest focus-visible:ring-forest/15'
  }`

/** Labelled input/select with an inline error. Pass `as="select"` plus <option> children for a dropdown. */
export default function Field({ label, name, error, hint, as: Tag = 'input', className = '', children, ...props }) {
  const id = `field-${name}`
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-charcoal">
        {label}
      </label>
      <Tag
        id={id}
        name={name}
        className={`${inputClass(Boolean(error))} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...props}
      >
        {children}
      </Tag>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-[#b4442a]">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** A row of big tappable options (radio buttons styled as cards). */
export function ChoiceGroup({ label, name, options, value, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-charcoal">{label}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const checked = value === option.value
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-forest/15 ${
                checked ? 'border-forest bg-forest/5' : 'border-line bg-white hover:border-forest/40'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className={`block font-semibold ${checked ? 'text-forest' : 'text-charcoal'}`}>{option.label}</span>
              {option.hint && <span className="mt-0.5 block text-sm text-muted">{option.hint}</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Like ChoiceGroup, but several can be picked (checkboxes). `value` is an array. */
export function MultiChoice({ label, name, options, value, onChange, hint }) {
  const toggle = (option) => onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option])
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-charcoal">{label}</legend>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const checked = value.includes(option.value)
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-forest/15 ${
                checked ? 'border-forest bg-forest/5' : 'border-line bg-white hover:border-forest/40'
              }`}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => toggle(option.value)}
                className="mt-1 size-4 accent-[#174d35]"
              />
              <span>
                <span className={`block font-semibold ${checked ? 'text-forest' : 'text-charcoal'}`}>
                  {option.label}
                </span>
                {option.hint && <span className="mt-0.5 block text-sm text-muted">{option.hint}</span>}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function FormError({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl border border-[#b4442a]/30 bg-[#b4442a]/5 px-4 py-3 text-sm text-[#b4442a]">
      {message}
    </p>
  )
}
