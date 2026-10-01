import { useEffect, useState } from 'react'
import { request } from '../api/client.ts'

type NoteCard = {
  id: string
  title: string
  coverUrl: string
  authorName: string
  likeCount: number
  status: number
}
type Page = { list: NoteCard[]; total: number }

const STATUS: Record<number, string> = {
  0: 'Draft',
  1: 'Pending',
  2: 'Published',
  3: 'Offline',
}

export function NotesPage() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState<Page>({ list: [], total: 0 })
  const [error, setError] = useState('')

  async function load(nextStatus = status) {
    setError('')
    const query = nextStatus === '' ? '' : `?status=${nextStatus}`
    try {
      setPage(await request<Page>(`/api/admin/notes${query}`))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  useEffect(() => {
    load('').catch(() => undefined)
  }, [])

  async function approve(id: string) {
    await request(`/api/admin/notes/${id}/approve`, { method: 'PUT' })
    await load()
  }

  async function withReason(id: string, action: 'reject' | 'offline') {
    const reason = window.prompt(action === 'reject' ? 'Reject reason' : 'Offline reason')
    if (!reason) {
      return
    }
    await request(`/api/admin/notes/${id}/${action}`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    })
    await load()
  }

  return (
    <section>
      <h1>Notes</h1>
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          load().catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
        }}
      >
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="1">Pending</option>
          <option value="2">Published</option>
          <option value="3">Offline</option>
          <option value="0">Draft</option>
        </select>
        <button type="submit">Filter</button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Author</th>
              <th>Likes</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {page.list.length === 0 ? (
              <tr>
                <td colSpan={5}>No notes yet.</td>
              </tr>
            ) : (
              page.list.map((note) => (
                <tr key={note.id}>
                  <td>{note.title}</td>
                  <td>{note.authorName}</td>
                  <td>{note.likeCount}</td>
                  <td>{STATUS[note.status] ?? note.status}</td>
                  <td>
                    <button type="button" className="ghost" onClick={() => approve(note.id).catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
                      Approve
                    </button>
                    <button type="button" className="ghost" onClick={() => withReason(note.id, 'reject').catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
                      Reject
                    </button>
                    <button type="button" className="ghost" onClick={() => withReason(note.id, 'offline').catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
                      Offline
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
