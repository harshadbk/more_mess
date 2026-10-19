import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AccountLayout from '../components/account/AccountLayout.jsx'
import Field, { ChoiceGroup, FormError, MultiChoice } from '../components/account/Field.jsx'
import { homeFor, useAuth } from '../context/AuthContext.jsx'
import { foodOptions, mealOptions, occupationOptions, planOptions } from '../data/accountOptions.js'
import { normalizeIndianNumber } from '../utils/business.js'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  plan: 'monthly',
  meals: ['lunch', 'dinner'],
  foodPreference: 'veg',
  occupation: 'student',
  address: '',
}

function validate(v) {
  const errors = {}
  if (v.name.trim().length < 2) errors.name = 'Please enter your full name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Enter a valid email address.'
  if (!normalizeIndianNumber(v.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.'
  if (v.password.length < 8) errors.password = 'Use at least 8 characters.'
  if (v.confirmPassword !== v.password) errors.confirmPassword = 'Passwords do not match.'
  if (v.address.length > 200) errors.address = 'Keep the address under 200 characters.'
  return errors
}

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor(user)} replace />

  const update = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    setFormError('')
    if (Object.keys(found).length) return
    setBusy(true)
    try {
      const { confirmPassword: _, ...details } = values
      const created = await register(details)
      navigate(homeFor(created), { replace: true })
    } catch (err) {
      setErrors(err.fields || {})
      setFormError(err.message)
      setBusy(false)
    }
  }

  return (
    <AccountLayout>
      <p className="eyebrow">Join Sai Mess</p>
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Create your account</h1>
      <p className="mt-3 text-muted">
        Join on your own, or with friends as a group. You can create or join a group later. It's optional.
      </p>

      <form onSubmit={onSubmit} className="card mt-8 space-y-5 p-6 sm:p-8" noValidate>
        <FormError message={formError} />
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={update}
          error={errors.name}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update}
          error={errors.email}
        />
        <Field
          label="Mobile number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          value={values.phone}
          onChange={update}
          error={errors.phone}
        />
        <ChoiceGroup
          label="How do you want to pay?"
          name="plan"
          options={planOptions}
          value={values.plan}
          onChange={(plan) => setValues((v) => ({ ...v, plan }))}
        />
        <MultiChoice
          label="Which meals do you want every day?"
          hint="Pick any. You can skip or add a meal on any day later."
          name="meals"
          options={mealOptions}
          value={values.meals}
          onChange={(meals) => setValues((v) => ({ ...v, meals }))}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Food preference"
            name="foodPreference"
            as="select"
            value={values.foodPreference}
            onChange={update}
          >
            {foodOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Field>
          <Field label="I am a" name="occupation" as="select" value={values.occupation} onChange={update}>
            {occupationOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Field>
        </div>
        <Field
          label="Address / hostel / college (optional)"
          name="address"
          autoComplete="street-address"
          value={values.address}
          onChange={update}
          error={errors.address}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          value={values.password}
          onChange={update}
          error={errors.password}
        />
        <Field
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={update}
          error={errors.confirmPassword}
        />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-forest hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AccountLayout>
  )
}
