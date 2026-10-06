import { type FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { request, upload } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

type Channel = { id: string; name: string }
type Topic = { id: string; name: string }
type EditableNote = {
  title: string
  content: string
  channelId: string | null
  imageUrls: string[]
  topics: Topic[]
  placeName: string | null
  cityName: string | null
  status: number
}

export function PublishPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const { token } = useAuth()
  const navigate = useNavigate()
  const [channels, setChannels] = useState<Channel[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [channelId, setChannelId] = useState('')
  const [topicIds, setTopicIds] = useState<string[]>([])
  const [placeName, setPlaceName] = useState('')
  const [cityName, setCityName] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [locked, setLocked] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    request<Channel[]>('/api/channels').then(setChannels).catch(() => undefined)
    request<Topic[]>('/api/topics').then(setTopics).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!id || !token) {
      return
    }
    request<EditableNote>(`/api/notes/${id}`)
      .then((note) => {
        setTitle(note.title ?? '')
        setContent(note.content ?? '')
        setChannelId(note.channelId ?? '')
        setTopicIds(note.topics?.map((topic) => topic.id) ?? [])
        setPlaceName(note.placeName ?? '')
        setCityName(note.cityName ?? '')
        setImageUrls(note.imageUrls ?? [])
        if (note.status !== 0 && note.status !== 1) {
          setLocked(true)
          setError('Note cannot be edited')
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
  }, [id, token])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  function toggleTopic(topicId: string) {
    setTopicIds((current) => (current.includes(topicId) ? current.filter((item) => item !== topicId) : [...current, topicId]))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (locked) {
      return
    }
    setBusy(true)
    setError('')
    try {
      const uploadedUrls: string[] = []
      for (const file of files) {
        const stored = await upload('/api/member/files', file)
        uploadedUrls.push(stored.url)
      }
      const body = {
        title,
        content,
        channelId: channelId || null,
        topicIds,
        imageUrls: [...imageUrls, ...uploadedUrls],
        placeName,
        cityName,
      }
      if (id) {
        await request(`/api/member/notes/${id}`, { method: 'PUT', body: JSON.stringify(body) })
        navigate(`/notes/${id}`)
        return
      }
      const createdId = await request<string>('/api/member/notes', { method: 'POST', body: JSON.stringify(body) })
      navigate(`/notes/${createdId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="login-wrap">
      <form className="profile-card" onSubmit={onSubmit}>
        <h1>{editing ? 'Edit note' : 'Publish'}</h1>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={128} disabled={locked} />
        </label>
        <label>
          Content
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={6} maxLength={20000} disabled={locked} />
        </label>
        <label>
          Channel
          <select value={channelId} onChange={(event) => setChannelId(event.target.value)} disabled={locked}>
            <option value="">None</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="topic-picks" disabled={locked}>
          <legend>Topics</legend>
          {topics.map((topic) => (
            <label key={topic.id}>
              <input type="checkbox" checked={topicIds.includes(topic.id)} onChange={() => toggleTopic(topic.id)} />
              {topic.name}
            </label>
          ))}
        </fieldset>
        {imageUrls.length > 0 ? (
          <div className="note-images">
            {imageUrls.map((url) => (
              <figure key={url}>
                <img src={url} alt="" />
                <button type="button" className="ghost" disabled={locked} onClick={() => setImageUrls(imageUrls.filter((item) => item !== url))}>
                  Remove
                </button>
              </figure>
            ))}
          </div>
        ) : null}
        <label>
          Images
          <input type="file" accept="image/*" multiple disabled={locked} onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
        </label>
        <label>
          City
          <input value={cityName} onChange={(event) => setCityName(event.target.value)} maxLength={64} disabled={locked} />
        </label>
        <label>
          Place
          <input value={placeName} onChange={(event) => setPlaceName(event.target.value)} maxLength={128} disabled={locked} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={busy || locked}>
          {editing ? 'Save and publish' : 'Publish'}
        </button>
      </form>
    </section>
  )
}
