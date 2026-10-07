import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

type InboxItem = {
  id: string
  kind: string
  actorName: string
  actorAvatar: string | null
  noteId: string
  noteTitle: string
  text: string | null
  createdAt: string | null
}

const TABS = [
  { id: 'like', label: 'Likes' },
  { id: 'comment', label: 'Comments' },
  { id: 'message', label: 'Messages' },
] as const

export function MessagesPage() {
  const { token } = useAuth()
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('like')
  const [items, setItems] = useState<InboxItem[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      return
    }
    setLoading(true)
    request<InboxItem[]>(`/api/member/inbox?kind=${tab}`)
      .then((rows) => {
        setItems(rows)
        setError('')
      })
      .catch((err) => {
        setItems([])
        setError(err instanceof Error ? err.message : 'Request failed')
      })
      .finally(() => setLoading(false))
  }, [tab, token])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <section className="messages-page">
      <h1>Messages</h1>
      <div className="message-shortcuts">
        {TABS.map((item) => (
          <button key={item.id} type="button" className={tab === item.id ? 'shortcut active' : 'shortcut'} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {!loading && items.length === 0 && !error ? (
        <div className="empty" role="status">
          <h2>Nothing here yet</h2>
          <p>
            {tab === 'like'
              ? 'Likes and collects on your notes show up here.'
              : tab === 'comment'
                ? 'Comments on your notes show up here.'
                : 'Direct messages are not available yet.'}
          </p>
        </div>
      ) : (
        <ul className="message-list">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <Link to={`/notes/${item.noteId}`}>
                {item.actorAvatar ? <img src={item.actorAvatar} alt="" /> : <span className="avatar tiny" />}
                <span>
                  <strong>{item.actorName}</strong>
                  <em>
                    {item.kind === 'like' ? 'liked' : item.kind === 'collect' ? 'collected' : 'commented on'} {item.noteTitle}
                  </em>
                  {item.text ? <p>{item.text}</p> : null}
                </span>
                {item.createdAt ? <time>{item.createdAt.replace('T', ' ').slice(0, 16)}</time> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
