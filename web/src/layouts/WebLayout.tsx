import { type FormEvent, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { PublishDialog } from '../pages/PublishPage.tsx'
import { useSite } from '../site/SiteContext.tsx'

type MemberProfile = {
  userId: string
  username: string
  nickname: string
  avatar: string
}

export function WebLayout() {
  const { token, logout } = useAuth()
  const { site } = useSite()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const editId = pathname.match(/^\/notes\/([^/]+)\/edit$/)?.[1] ?? null
  const composing = pathname === '/publish' || Boolean(editId)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!token) {
      setProfile(null)
      return
    }
    let active = true
    request<MemberProfile>('/api/member/profile')
      .then((data) => {
        if (active) {
          setProfile(data)
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

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const text = query.trim()
    navigate(text ? `/?q=${encodeURIComponent(text)}` : '/')
  }

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <NavLink to="/" className="rail-logo" end>
          {site.logo ? <img src={site.logo} alt="" /> : <span className="mark" aria-hidden="true" />}
          <span>{site.name}</span>
        </NavLink>
        <nav className="rail-nav">
          <NavLink to="/" end>
            <Compass />
            Discover
          </NavLink>
          {token ? (
            <NavLink to="/messages">
              <Bell />
              Messages
            </NavLink>
          ) : (
            <Link to="/login">
              <Bell />
              Messages
            </Link>
          )}
          {token ? (
            <NavLink to="/publish">
              <Plus />
              Publish
            </NavLink>
          ) : (
            <Link to="/login">
              <Plus />
              Publish
            </Link>
          )}
        </nav>
        <div className="rail-foot">
          {token && profile ? (
            <NavLink to="/profile" className="rail-user">
              {profile.avatar ? <img src={profile.avatar} alt="" /> : <span className="avatar tiny" />}
              <span>{profile.nickname || profile.username}</span>
            </NavLink>
          ) : (
            <NavLink to="/login" className="rail-user">
              <span className="avatar tiny" />
              <span>Sign in</span>
            </NavLink>
          )}
          {token ? (
            <button type="button" className="ghost" onClick={logout}>
              Log out
            </button>
          ) : null}
        </div>
      </aside>
      <div className="app-main">
        <header className="top-bar">
          <form className="search-bar" onSubmit={onSearch}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notes"
              aria-label="Search notes"
            />
            <button type="submit" aria-label="Search">
              <SearchIcon />
            </button>
          </form>
          {token ? null : (
            <nav className="top-links">
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register">Register</NavLink>
            </nav>
          )}
        </header>
        <main className="main-pane">
          <Outlet />
        </main>
      </div>
      {composing && token ? (
        <PublishDialog
          noteId={editId}
          onClose={() => navigate(editId ? `/notes/${editId}` : '/')}
        />
      ) : null}
    </div>
  )
}

function Compass() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.8 9.2 13 13l-3.8 1.8L11 11z" fill="currentColor" />
    </svg>
  )
}

function Plus() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6v12M6 12h12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function Bell() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 16h12l-1.2-2.2V10a4.8 4.8 0 0 0-9.6 0v3.8z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 18a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
