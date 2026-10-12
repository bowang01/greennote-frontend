import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { NoteWaterfall, type FeedNote } from '../components/NoteWaterfall.tsx'

type Channel = { id: string; name: string }
type Page = { list: FeedNote[]; total: number }

export function DiscoverPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [channels, setChannels] = useState<Channel[]>([])
  const [mode, setMode] = useState<string>('all')
  const [notes, setNotes] = useState<FeedNote[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    request<Channel[]>('/api/channels')
      .then(setChannels)
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
  }, [])

  useEffect(() => {
    if (mode === 'following' && !token) {
      setNotes([])
      return
    }
    const path = mode === 'following' ? '/api/member/notes/following' : mode === 'all' ? '/api/notes' : `/api/notes?channelId=${mode}`
    request<Page>(path)
      .then((page) => {
        setNotes(page.list)
        setError('')
      })
      .catch((err) => {
        setNotes([])
        setError(err instanceof Error ? err.message : 'Request failed')
      })
  }, [mode, token])

  function openFollowing() {
    if (!token) {
      navigate('/login')
      return
    }
    setMode('following')
  }

  return (
    <section className="feed-page">
      <div className="chip-row" role="tablist">
        <button type="button" className={mode === 'following' ? 'chip active' : 'chip'} onClick={openFollowing}>
          Following
        </button>
        <button type="button" className={mode === 'all' ? 'chip active' : 'chip'} onClick={() => setMode('all')}>
          For you
        </button>
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className={mode === channel.id ? 'chip active' : 'chip'}
            onClick={() => setMode(channel.id)}
          >
            {channel.name}
          </button>
        ))}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {notes.length === 0 && !error ? (
        <div className="empty" role="status">
          <h2>No notes yet</h2>
          <p>{mode === 'following' ? 'Notes from people you follow will show up here.' : 'Published notes will show up here.'}</p>
        </div>
      ) : (
        <NoteWaterfall notes={notes} />
      )}
    </section>
  )
}
