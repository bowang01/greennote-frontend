import { type FormEvent, useEffect, useState } from 'react'
import { request, upload } from '../api/client.ts'
import { useSite, type SiteConfig } from '../site/SiteContext.tsx'

export function SitePage() {
  const { site, refresh } = useSite()
  const [form, setForm] = useState<SiteConfig>(site)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setForm(site)
  }, [site])

  async function onLogo(file: File | undefined) {
    if (!file) {
      return
    }
    const stored = await upload('/api/admin/files', file)
    setForm((current) => ({ ...current, logo: stored.url }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    try {
      await request<SiteConfig>('/api/admin/site', {
        method: 'PUT',
        body: JSON.stringify(form),
      })
      await refresh()
      setMessage('Site settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  return (
    <section>
      <h1>Site</h1>
      <form className="panel stack" onSubmit={onSubmit}>
        <label>
          Name
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </label>
        <label>
          Theme color
          <input
            type="color"
            value={form.themeColor || '#1b6b45'}
            onChange={(event) => setForm({ ...form, themeColor: event.target.value })}
          />
        </label>
        <label>
          Logo
          <input type="file" accept="image/*" onChange={(event) => onLogo(event.target.files?.[0])} />
        </label>
        {form.logo ? <img className="logo-preview" src={form.logo} alt="Site logo" /> : null}
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p>{message}</p> : null}
        <button type="submit">Save</button>
      </form>
    </section>
  )
}
