import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { useSite } from '../site/SiteContext.tsx'

type MenuItem = { id: string; name: string; path: string }
type AdminProfile = { username: string; nickname: string; menus: MenuItem[] }

export function AdminLayout() {
  const { logout } = useAuth()
  const { site } = useSite()
  const [profile, setProfile] = useState<AdminProfile | null>(null)

  useEffect(() => {
    let active = true
    request<AdminProfile>('/api/auth/me')
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
  }, [logout])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          {site.logo ? <img className="logo-preview" src={site.logo} alt="" /> : <span className="mark" aria-hidden="true" />}
          {site.name}
        </div>
        <nav className="side-nav">
          {(profile?.menus ?? []).map((menu) => (
            <NavLink key={menu.id} to={menu.path} end={menu.path === '/'}>
              {menu.name}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>{profile?.nickname || 'Admin'}</span>
          <button type="button" className="ghost" onClick={logout}>
            Log out
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
