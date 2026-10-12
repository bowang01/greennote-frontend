import { type FormEvent, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

type Topic = { id: string; name: string }
type NoteDetail = {
  id: string
  title: string
  content: string
  authorId: string
  authorName: string
  authorAvatar: string
  channelName: string
  type: number
  videoUrl: string
  imageUrls: string[]
  topics: Topic[]
  placeName: string
  cityName: string
  status: number
  rejectReason: string
  likeCount: number
  collectCount: number
  commentCount: number
  liked: boolean
  collected: boolean
  createdAt: string | null
}
type Comment = {
  id: string
  userId: string
  authorName: string
  parentId: string | null
  replyToName: string
  content: string
  createdAt: string
}

function userIdFromToken(token: string): string | null {
  const part = token.split('.')[1]
  if (!part) {
    return null
  }
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'))
    const payload = JSON.parse(json) as { uid?: string }
    return payload.uid ?? null
  } catch {
    return null
  }
}

const STATUS: Record<number, string> = {
  0: 'Draft',
  1: 'Pending review',
  2: 'Published',
  3: 'Offline',
}

export function NotePage({ noteId }: { noteId: string }) {
  const { token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [note, setNote] = useState<NoteDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [following, setFollowing] = useState(false)
  const [reportTarget, setReportTarget] = useState<{ type: 'note' | 'comment'; id: string } | null>(null)
  const [reason, setReason] = useState('')
  const [imageIndex, setImageIndex] = useState(0)
  const [imageBroken, setImageBroken] = useState(false)

  function close() {
    const background = (location.state as { backgroundLocation?: { pathname: string; search: string } } | null)?.backgroundLocation
    if (background) {
      navigate({ pathname: background.pathname, search: background.search }, { replace: true })
      return
    }
    navigate('/')
  }

  function load() {
    request<NoteDetail>(`/api/notes/${noteId}`)
      .then((data) => {
        setNote(data)
        setError('')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
    request<Comment[]>(`/api/notes/${noteId}/comments`)
      .then(setComments)
      .catch(() => setComments([]))
  }

  useEffect(() => {
    setImageIndex(0)
    setImageBroken(false)
    load()
  }, [noteId])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [location.state])

  useEffect(() => {
    if (!token || !note) {
      return
    }
    const viewerId = userIdFromToken(token)
    if (!viewerId || viewerId === note.authorId) {
      return
    }
    request<{ following: boolean }>(`/api/member/follows/${note.authorId}`)
      .then((state) => setFollowing(state.following))
      .catch(() => setFollowing(false))
  }, [token, note])

  async function toggle(action: 'like' | 'collect') {
    await request(`/api/member/notes/${noteId}/${action}`, { method: 'PUT' })
    load()
  }

  async function toggleFollow() {
    if (!note) {
      return
    }
    if (following) {
      await request(`/api/member/follows/${note.authorId}`, { method: 'DELETE' })
      setFollowing(false)
      return
    }
    await request(`/api/member/follows/${note.authorId}`, { method: 'PUT' })
    setFollowing(true)
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault()
    if (!reportTarget) {
      return
    }
    await request('/api/member/reports', {
      method: 'POST',
      body: JSON.stringify({ targetType: reportTarget.type, targetId: reportTarget.id, reason }),
    })
    setReportTarget(null)
    setReason('')
    setError('')
  }

  async function onComment(event: FormEvent) {
    event.preventDefault()
    await request(`/api/member/notes/${noteId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId: null }),
    })
    setContent('')
    load()
  }

  const viewerId = token ? userIdFromToken(token) : null
  const ownNote = Boolean(note && viewerId && viewerId === note.authorId)
  const images = note?.imageUrls ?? []
  const image = images[imageIndex] ?? images[0]
  const place = [note?.cityName, note?.placeName].filter(Boolean).join(' · ')

  return (
    <div className="note-backdrop" onMouseDown={close}>
      <button type="button" className="note-close" aria-label="Close" onMouseDown={(event) => event.stopPropagation()} onClick={close}>
        ×
      </button>
      <section className="note-stage" role="dialog" aria-label={note?.title || 'Note'} onMouseDown={(event) => event.stopPropagation()}>
        <div className="note-media">
          {image && !imageBroken ? (
            <img src={image} alt="" onError={() => setImageBroken(true)} />
          ) : (
            <span className="feed-cover" />
          )}
          {images.length > 1 ? (
            <div className="note-media-nav">
              <button type="button" className="ghost" onClick={() => {
                setImageBroken(false)
                setImageIndex((index) => (index - 1 + images.length) % images.length)
              }}>
                Prev
              </button>
              <span>
                {imageIndex + 1} / {images.length}
              </span>
              <button type="button" className="ghost" onClick={() => {
                setImageBroken(false)
                setImageIndex((index) => (index + 1) % images.length)
              }}>
                Next
              </button>
            </div>
          ) : null}
        </div>
        <div className="note-side">
          {!note && error ? <p className="form-error">{error}</p> : null}
          {!note && !error ? <p className="muted">Loading</p> : null}
          {note ? (
            <>
              <header className="note-author-row">
                <Link to={`/users/${note.authorId}`} className="note-author-link">
                  {note.authorAvatar ? <img src={note.authorAvatar} alt="" /> : <span className="avatar tiny" />}
                  <strong>{note.authorName}</strong>
                </Link>
                {token && !ownNote ? (
                  <button type="button" className="ghost" onClick={() => toggleFollow().catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
                    {following ? 'Following' : 'Follow'}
                  </button>
                ) : null}
                {ownNote ? (
                  <Link className="ghost note-edit" to={`/notes/${note.id}/edit`} state={location.state}>
                    Edit
                  </Link>
                ) : null}
                {token && note.status === 2 ? (
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => {
                      setReportTarget({ type: 'note', id: note.id })
                      setReason('')
                    }}
                  >
                    Report
                  </button>
                ) : null}
              </header>
              <div className="note-side-scroll">
                {note.status !== 2 ? <p className="form-error">{STATUS[note.status] ?? 'Unavailable'}</p> : null}
                {note.rejectReason ? <p className="form-error">{note.rejectReason}</p> : null}
                <h2>{note.title}</h2>
                {note.content ? <p>{note.content}</p> : null}
                {note.topics?.length ? <p className="muted">{note.topics.map((topic) => `#${topic.name}`).join(' ')}</p> : null}
                <p className="muted">
                  {note.createdAt ? note.createdAt.replace('T', ' ').slice(0, 16) : ''}
                  {place ? ` · ${place}` : ''}
                  {note.channelName ? ` · ${note.channelName}` : ''}
                </p>
                {note.type === 2 && note.videoUrl ? (
                  <p>
                    <a href={note.videoUrl}>Watch video</a>
                  </p>
                ) : null}
                <h3>
                  {note.commentCount} {note.commentCount === 1 ? 'comment' : 'comments'}
                </h3>
                {comments.length === 0 ? <p className="muted">No comments yet.</p> : null}
                <ul className="comment-list">
                  {comments.map((comment) => (
                    <li key={comment.id}>
                      <Link to={`/users/${comment.userId}`}>{comment.authorName}</Link>
                      {comment.parentId ? <span className="muted"> reply to {comment.replyToName}</span> : null}
                      <p>{comment.content}</p>
                      {comment.createdAt ? <p className="muted">{comment.createdAt.replace('T', ' ').slice(0, 16)}</p> : null}
                      {token && note.status === 2 ? (
                        <button
                          type="button"
                          className="ghost"
                          onClick={() => {
                            setReportTarget({ type: 'comment', id: comment.id })
                            setReason('')
                          }}
                        >
                          Report
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {error ? <p className="form-error">{error}</p> : null}
                {reportTarget ? (
                  <form className="comment-form" onSubmit={(event) => submitReport(event).catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
                    <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why are you reporting this?" required maxLength={500} />
                    <button type="submit">Send report</button>
                    <button type="button" className="ghost" onClick={() => setReportTarget(null)}>
                      Cancel
                    </button>
                  </form>
                ) : null}
              </div>
              <footer className="note-side-foot">
                {token && note.status === 2 ? (
                  <div className="note-actions">
                    <button type="button" className="ghost" onClick={() => toggle('like').catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
                      {note.liked ? 'Liked' : 'Like'} {note.likeCount}
                    </button>
                    <button type="button" className="ghost" onClick={() => toggle('collect').catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
                      {note.collected ? 'Collected' : 'Collect'} {note.collectCount}
                    </button>
                    <span className="muted">{note.commentCount}</span>
                  </div>
                ) : note.status === 2 ? (
                  <p className="muted">
                    <Link to="/login">Sign in</Link> to like, collect, or comment.
                  </p>
                ) : null}
                {token && note.status === 2 ? (
                  <form className="comment-form" onSubmit={(event) => onComment(event).catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
                    <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write a comment" required />
                    <button type="submit">Send</button>
                  </form>
                ) : null}
              </footer>
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}
