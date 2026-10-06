import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, request, type Profile } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

export function HomePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    request<Profile>('/api/auth/me')
      .then((data) => {
        if (active) {
          setProfile(data)
        }
      })
      .catch((err: unknown) => {
        if (!active) {
          return
        }
        if (err instanceof ApiError && (err.status === 401 || err.message === 'Not signed in')) {
          logout()
          navigate('/login', { replace: true })
          return
        }
        setError(err instanceof Error ? err.message : 'Request failed')
      })
    return () => {
      active = false
    }
  }, [logout, navigate])

  return (
    <section className="home">
      <h1>Home</h1>
      {error ? <p className="form-error">{error}</p> : null}
      <p className="lead">{profile ? `Signed in as ${profile.username}.` : 'Loading account...'}</p>
      <div className="cards">
        <article>
          <h2>Notes</h2>
          <p>Review pending notes, then approve, reject, or take them offline.</p>
        </article>
        <article>
          <h2>Channels</h2>
          <p>Fashion, food, travel, and the rest of the feed.</p>
        </article>
        <article>
          <h2>Members</h2>
          <p>User accounts will be managed here.</p>
        </article>
      </div>
    </section>
  )
}
