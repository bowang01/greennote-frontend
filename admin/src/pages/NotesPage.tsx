import { type FormEvent, useEffect, useState } from 'react'
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
type Channel = { id: string; name: string }

const PAGE_SIZE = 20
const STATUS: Record<number, string> = {
  0: 'Draft',
  1: 'Pending',
  2: 'Published',
  3: 'Offline',
}

export function NotesPage() {
  const [status, setStatus] = useState('')
  const [channelId, setChannelId] = useState('')
  const [pageNo, setPageNo] = useState(1)
  const [page, setPage] = useState<Page>({ list: [], total: 0 })
  const [channels, setChannels] = useState<Channel[]>([])
  const [error, setError] = useState('')
  const [reasonNoteId, setReasonNoteId] = useState<string | null>(null)
  const [reasonAction, setReasonAction] = useState<'reject' | 'offline'>('reject')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    request<Channel[]>('/api/admin/channels')
      .then(setChannels)
      .catch(() => setChannels([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (status) {
      params.set('status', status)
    }
    if (channelId) {
      params.set('channelId', channelId)
    }
    params.set('page', String(pageNo))
    params.set('size', String(PAGE_SIZE))
    request<Page>(`/api/admin/notes?${params}`)
      .then((data) => {
        setPage(data)
        setError('')
      })
      .catch((err) => {
        setPage({ list: [], total: 0 })
        setError(err instanceof Error ? err.message : 'Request failed')
      })
  }, [status, channelId, pageNo, reloadKey])

  function openReason(id: string, action: 'reject' | 'offline') {
    setReasonNoteId(id)
    setReasonAction(action)
    setReason('')
    setError('')
  }

  async function approve(id: string) {
    setBusy(true)
    setError('')
    try {
      await request(`/api/admin/notes/${id}/approve`, { method: 'PUT' })
      setReasonNoteId(null)
      setReloadKey((current) => current + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  async function submitReason(event: FormEvent) {
    event.preventDefault()
    if (!reasonNoteId) {
      return
    }
    setBusy(true)
    setError('')
    try {
      await request(`/api/admin/notes/${reasonNoteId}/${reasonAction}`, {
        method: 'PUT',
        body: JSON.stringify({ reason: reason.trim() }),
      })
      setReasonNoteId(null)
      setReason('')
      setReloadKey((current) => current + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  const reasonNote = page.list.find((note) => note.id === reasonNoteId)
  const pageCount = Math.max(1, Math.ceil(page.total / PAGE_SIZE))

  return (
    <section>
      <h1>Notes</h1>
      <div className="toolbar">
        <select
          value={status}
          aria-label="Status"
          onChange={(event) => {
            setStatus(event.target.value)
            setPageNo(1)
          }}
        >
          <option value="">All statuses</option>
          <option value="1">Pending</option>
          <option value="2">Published</option>
          <option value="3">Offline</option>
          <option value="0">Draft</option>
        </select>
        <select
          value={channelId}
          aria-label="Channel"
          onChange={(event) => {
            setChannelId(event.target.value)
            setPageNo(1)
          }}
        >
          <option value="">All channels</option>
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {reasonNote ? (
        <form className="panel reason-box" onSubmit={submitReason}>
          <p>
            {reasonAction === 'reject' ? 'Reject' : 'Take offline'}: {reasonNote.title}
          </p>
          <label>
            Reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={255} required rows={3} />
          </label>
          <div className="toolbar">
            <button type="submit" disabled={busy}>
              Confirm
            </button>
            <button type="button" className="ghost" onClick={() => setReasonNoteId(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Cover</th>
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
                <td colSpan={6}>No notes yet.</td>
              </tr>
            ) : (
              page.list.map((note) => (
                <tr key={note.id}>
                  <td>{note.coverUrl ? <img className="logo-preview" src={note.coverUrl} alt="" /> : null}</td>
                  <td>{note.title}</td>
                  <td>{note.authorName}</td>
                  <td>{note.likeCount}</td>
                  <td>{STATUS[note.status] ?? note.status}</td>
                  <td className="row-actions">
                    <button type="button" className="ghost" disabled={busy} onClick={() => approve(note.id)}>
                      Approve
                    </button>
                    <button type="button" className="ghost" disabled={busy} onClick={() => openReason(note.id, 'reject')}>
                      Reject
                    </button>
                    <button type="button" className="ghost" disabled={busy} onClick={() => openReason(note.id, 'offline')}>
                      Offline
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="toolbar pager">
          <button type="button" className="ghost" disabled={pageNo <= 1} onClick={() => setPageNo(pageNo - 1)}>
            Previous
          </button>
          <span>
            {pageNo} / {pageCount}
          </span>
          <button type="button" className="ghost" disabled={pageNo >= pageCount} onClick={() => setPageNo(pageNo + 1)}>
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
