import { type FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

type Topic = { id: string; name: string }
type NoteDetail = {
  id: string
  title: string
  content: string
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
}

const STATUS: Record<number, string> = {
  0: 'Draft',
  1: 'Pending review',
  2: 'Published',
  3: 'Offline',
}
type Comment = {
  id: string
  authorName: string
  parentId: string | null
  replyToName: string
  content: string
  createdAt: string
}

export function NotePage() {
  const { id } = useParams()
  const { token } = useAuth()
  const [note, setNote] = useState<NoteDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  function load() {
    if (!id) {
      return
    }
    request<NoteDetail>(`/api/notes/${id}`)
      .then(setNote)
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
    request<Comment[]>(`/api/notes/${id}/comments`)
      .then(setComments)
      .catch(() => setComments([]))
  }

  useEffect(() => {
    load()
  }, [id])

  async function toggle(action: 'like' | 'collect') {
    await request(`/api/member/notes/${id}/${action}`, { method: 'PUT' })
    load()
  }

  async function onComment(event: FormEvent) {
    event.preventDefault()
    await request(`/api/member/notes/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId: null }),
    })
    setContent('')
    load()
  }

  if (!note && error) {
    return (
      <section className="discover">
        <p className="form-error">{error}</p>
      </section>
    )
  }

  if (!note) {
    return (
      <section className="discover">
        <p className="muted">Loading</p>
      </section>
    )
  }

  return (
    <article className="discover note-detail">
      <Link to="/">Back</Link>
      <h1>{note.title}</h1>
      <p className="note-author">
        {note.authorAvatar ? <img src={note.authorAvatar} alt="" /> : <span className="avatar tiny" />}
        <span>
          {note.authorName}
          {note.channelName ? ` · ${note.channelName}` : ''}
          {note.cityName ? ` · ${note.cityName}` : ''}
          {note.placeName ? ` · ${note.placeName}` : ''}
        </span>
      </p>
      {note.status !== 2 ? <p className="form-error">{STATUS[note.status] ?? 'Unavailable'}</p> : null}
      {note.rejectReason ? <p className="form-error">{note.rejectReason}</p> : null}
      {note.type === 2 && note.videoUrl ? (
        <p>
          <a href={note.videoUrl}>Watch video</a>
        </p>
      ) : null}
      <div className="note-images">
        {note.imageUrls?.map((url) => (
          <img key={url} src={url} alt="" />
        ))}
      </div>
      <p>{note.content}</p>
      <p className="muted">{note.topics?.map((topic) => `#${topic.name}`).join(' ')}</p>
      {error ? <p className="form-error">{error}</p> : null}
      {token && note.status === 2 ? (
        <div className="channel-bar">
          <button type="button" className="ghost" onClick={() => toggle('like').catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
            {note.liked ? 'Liked' : 'Like'} {note.likeCount}
          </button>
          <button type="button" className="ghost" onClick={() => toggle('collect').catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
            {note.collected ? 'Collected' : 'Collect'} {note.collectCount}
          </button>
        </div>
      ) : note.status === 2 ? (
        <p className="muted">
          <Link to="/login">Sign in</Link> to like, collect, or comment. {note.likeCount} likes · {note.collectCount} collects · {note.commentCount} comments
        </p>
      ) : null}
      <h2>Comments</h2>
      {comments.length === 0 ? <p className="muted">No comments yet.</p> : null}
      <ul className="comment-list">
        {comments.map((comment) => (
          <li key={comment.id}>
            <strong>{comment.authorName}</strong>
            {comment.parentId ? <span className="muted"> reply to {comment.replyToName}</span> : null}
            <p>{comment.content}</p>
            {comment.createdAt ? <p className="muted">{comment.createdAt.replace('T', ' ').slice(0, 16)}</p> : null}
          </li>
        ))}
      </ul>
      {token && note.status === 2 ? (
        <form className="comment-form" onSubmit={(event) => onComment(event).catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
          <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write a comment" required />
          <button type="submit">Send</button>
        </form>
      ) : null}
    </article>
  )
}
