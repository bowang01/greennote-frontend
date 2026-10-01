import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { request, type Profile } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { useSite } from '../site/SiteContext.tsx'

export function WebLayout() {
  const { token, logout } = useAuth()
  const { site } = useSite()
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (!token) {
      setUsername('')
      return
    }
    let active = true
    request<Profile>('/api/member/profile')
      .then((profile) => {
        if (active) {
          setUsername(profile.username)
        }
      })
      .catch(() => {
        if (active) {
          logout()
        }
      })
    return () => {
      active = false
    }
  }, [token, logout])

  return (
    <div className="page-shell">
      <header className="site-header">
        <NavLink to="/" className="wordmark" end>
          {site.logo ? <img className="logo-preview" src={site.logo} alt="" /> : <span className="mark" aria-hidden="true" />}
          {site.name}
        </NavLink>
        <nav className="header-nav">
          <NavLink to="/" end>
            Discover
          </NavLink>
          {token ? (
            <>
              <NavLink to="/publish">Publish</NavLink>
              <NavLink to="/profile">{username || 'Profile'}</NavLink>
              <button type="button" className="ghost" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
