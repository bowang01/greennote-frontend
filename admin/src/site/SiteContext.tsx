import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { request } from '../api/client.ts'

export type SiteConfig = {
  name: string
  logo: string
  themeColor: string
}

const fallback: SiteConfig = { name: 'GreenNote', logo: '', themeColor: '#1b6b45' }

type SiteContextValue = {
  site: SiteConfig
  refresh: () => Promise<void>
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteConfig>(fallback)

  const refresh = async () => {
    const data = await request<SiteConfig>('/api/site', {}, false)
    setSite({
      name: data.name || fallback.name,
      logo: data.logo || '',
      themeColor: data.themeColor || fallback.themeColor,
    })
  }

  useEffect(() => {
    refresh().catch(() => setSite(fallback))
  }, [])

  useEffect(() => {
    document.title = `${site.name} Admin`
    document.documentElement.style.setProperty('--brand', site.themeColor)
  }, [site])

  const value = useMemo(() => ({ site, refresh }), [site])
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite(): SiteContextValue {
  const value = useContext(SiteContext)
  if (!value) {
    throw new Error('useSite must be used within SiteProvider')
  }
  return value
}
