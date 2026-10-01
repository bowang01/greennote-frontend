import { type FormEvent, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

export function RegisterPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (token) {
    return <Navigate to="/profile" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      await request(
        '/api/member/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ username: username.trim(), password, nickname: nickname.trim() }),
        },
        false,
      )
      await login(username.trim(), password)
      navigate('/profile', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Register failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Create account</h1>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={3} />
        </label>
        <label>
          Nickname
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={pending}>
          {pending ? 'Creating...' : 'Create account'}
        </button>
        <Link to="/login">Already have an account? Sign in</Link>
      </form>
    </section>
  )
}
