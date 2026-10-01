import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

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

export function NoteListPage({ title, path }: { title: string; path: string }) {
  const { token } = useAuth()
  const [notes, setNotes] = useState<NoteCard[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }
    request<Page>(path)
      .then((page) => setNotes(page.list))
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
  }, [path, token])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <section className="discover">
      <div className="discover-copy">
        <h1>{title}</h1>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {notes.length === 0 && !error ? (
        <div className="empty" role="status">
          <h2>Nothing here yet</h2>
        </div>
      ) : (
        <div className="note-grid">
          {notes.map((note) => (
            <Link key={note.id} className="note-card" to={`/notes/${note.id}`}>
              {note.coverUrl ? <img src={note.coverUrl} alt="" /> : <div className="note-cover" />}
              <strong>{note.title}</strong>
              <span>
                {note.authorName}
                {path.endsWith('/mine') ? ` · ${STATUS[note.status] ?? note.status}` : ` · ${note.likeCount} likes`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
