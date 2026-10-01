import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { request } from '../api/client.ts'

type Channel = { id: string; name: string }
type NoteCard = {
  id: string
  title: string
  coverUrl: string
  authorName: string
  authorAvatar: string
  likeCount: number
}
type Page = { list: NoteCard[]; total: number }

export function DiscoverPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelId, setChannelId] = useState<string | null>(null)
  const [notes, setNotes] = useState<NoteCard[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    request<Channel[]>('/api/channels')
      .then(setChannels)
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
  }, [])

  useEffect(() => {
    const query = channelId == null ? '' : `?channelId=${channelId}`
    request<Page>(`/api/notes${query}`)
      .then((page) => {
        setNotes(page.list)
        setError('')
      })
      .catch((err) => {
        setNotes([])
        setError(err instanceof Error ? err.message : 'Request failed')
      })
  }, [channelId])

  return (
    <section className="discover">
      <div className="discover-copy">
        <h1>Discover</h1>
        <p>Published notes, one channel at a time.</p>
      </div>
      <div className="channel-bar" role="tablist">
        <button type="button" className={channelId == null ? '' : 'ghost'} onClick={() => setChannelId(null)}>
          All
        </button>
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className={channelId === channel.id ? '' : 'ghost'}
            onClick={() => setChannelId(channel.id)}
          >
            {channel.name}
          </button>
        ))}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {notes.length === 0 && !error ? (
        <div className="empty" role="status">
          <span className="mark large" aria-hidden="true" />
          <h2>No notes yet</h2>
          <p>Published notes will show up here.</p>
        </div>
      ) : (
        <div className="note-grid">
          {notes.map((note) => (
            <Link key={note.id} className="note-card" to={`/notes/${note.id}`}>
              {note.coverUrl ? <img src={note.coverUrl} alt="" /> : <div className="note-cover" />}
              <strong>{note.title}</strong>
              <span className="note-author">
                {note.authorAvatar ? <img src={note.authorAvatar} alt="" /> : <span className="avatar tiny" />}
                {note.authorName} · {note.likeCount} likes
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
