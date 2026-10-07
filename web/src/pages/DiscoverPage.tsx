import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { request } from '../api/client.ts'
import { NoteWaterfall, type FeedNote } from '../components/NoteWaterfall.tsx'

type Channel = { id: string; name: string }
type Page = { list: FeedNote[]; total: number }

export function DiscoverPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim().toLowerCase()
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelId, setChannelId] = useState<string | null>(null)
  const [notes, setNotes] = useState<FeedNote[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    request<Channel[]>('/api/channels')
      .then(setChannels)
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
  }, [])

  useEffect(() => {
    const search = channelId == null ? '' : `?channelId=${channelId}`
    request<Page>(`/api/notes${search}`)
      .then((page) => {
        setNotes(page.list)
        setError('')
      })
      .catch((err) => {
        setNotes([])
        setError(err instanceof Error ? err.message : 'Request failed')
      })
  }, [channelId])

  const visible = query
    ? notes.filter((note) => note.title.toLowerCase().includes(query) || note.authorName.toLowerCase().includes(query))
    : notes

  return (
    <section className="feed-page">
      <div className="chip-row" role="tablist">
        <button type="button" className={channelId == null ? 'chip active' : 'chip'} onClick={() => setChannelId(null)}>
          For you
        </button>
        {channels.map((channel) => (
          <button
            key={channel.id}
            type="button"
            className={channelId === channel.id ? 'chip active' : 'chip'}
            onClick={() => setChannelId(channel.id)}
          >
            {channel.name}
          </button>
        ))}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {visible.length === 0 && !error ? (
        <div className="empty" role="status">
          <h2>No notes yet</h2>
          <p>{query ? 'Nothing matches this search.' : 'Published notes will show up here.'}</p>
        </div>
      ) : (
        <NoteWaterfall notes={visible} />
      )}
    </section>
  )
}
