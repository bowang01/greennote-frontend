import { type FormEvent, useEffect, useState } from 'react'
import { request } from '../api/client.ts'

type Channel = { id: string; name: string; sortNo: number; status: number }

export function ChannelsPage() {
  const [rows, setRows] = useState<Channel[]>([])
  const [name, setName] = useState('')
  const [sortNo, setSortNo] = useState(0)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    try {
      setRows(await request<Channel[]>('/api/admin/channels'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  useEffect(() => {
    load().catch(() => undefined)
  }, [])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    await request('/api/admin/channels', { method: 'POST', body: JSON.stringify({ name, sortNo }) })
    setName('')
    await load()
  }

  async function toggle(row: Channel) {
    await request(`/api/admin/channels/${row.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: row.status === 0 ? 1 : 0 }),
    })
    await load()
  }

  return (
    <section>
      <h1>Channels</h1>
      <form className="toolbar" onSubmit={(event) => onCreate(event).catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required />
        <input value={sortNo} onChange={(event) => setSortNo(Number(event.target.value))} type="number" aria-label="Sort" />
        <button type="submit">Add</button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sort</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>No channels yet.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.sortNo}</td>
                  <td>{row.status === 0 ? 'Enabled' : 'Disabled'}</td>
                  <td>
                    <button type="button" className="ghost" onClick={() => toggle(row).catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
                      {row.status === 0 ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
