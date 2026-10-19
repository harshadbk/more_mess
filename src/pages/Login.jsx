import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AccountLayout from '../components/account/AccountLayout.jsx'
import Field, { FormError } from '../components/account/Field.jsx'
import { homeFor, useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ identifier: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={homeFor(user)} replace />

  const update = (e) => setValues((v) => ({ ...v, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const loggedIn = await login(values.identifier.trim(), values.password)
      navigate(location.state?.from || homeFor(loggedIn), { replace: true })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <AccountLayout>
      <p className="eyebrow">Members</p>
      <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Log in to Sai Mess</h1>
      <p className="mt-3 text-muted">Manage your meal groups and members.</p>

      <form onSubmit={onSubmit} className="card mt-8 space-y-5 p-6 sm:p-8" noValidate>
        <FormError message={error} />
        <Field
          label="Email or mobile number"
          name="identifier"
          autoComplete="username"
          required
          value={values.identifier}
          onChange={update}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={values.password}
          onChange={update}
        />
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-center text-sm text-muted">
          New here?{' '}
          <Link to="/register" className="font-semibold text-forest hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AccountLayout>
  )
}
