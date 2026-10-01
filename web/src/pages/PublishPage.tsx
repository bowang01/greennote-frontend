import { type FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { request, upload } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

type Channel = { id: string; name: string }
type Topic = { id: string; name: string }

export function PublishPage() {
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
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    request<Channel[]>('/api/channels').then(setChannels).catch(() => undefined)
    request<Topic[]>('/api/topics').then(setTopics).catch(() => undefined)
  }, [])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  function toggleTopic(id: string) {
    setTopicIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const imageUrls: string[] = []
      for (const file of files) {
        const stored = await upload('/api/member/files', file)
        imageUrls.push(stored.url)
      }
      const id = await request<string>('/api/member/notes', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          channelId: channelId || null,
          topicIds,
          imageUrls,
          placeName,
          cityName,
        }),
      })
      navigate(`/notes/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="login-wrap">
      <form className="profile-card" onSubmit={onSubmit}>
        <h1>Publish</h1>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={128} />
        </label>
        <label>
          Content
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={6} maxLength={20000} />
        </label>
        <label>
          Channel
          <select value={channelId} onChange={(event) => setChannelId(event.target.value)}>
            <option value="">None</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="topic-picks">
          <legend>Topics</legend>
          {topics.map((topic) => (
            <label key={topic.id}>
              <input type="checkbox" checked={topicIds.includes(topic.id)} onChange={() => toggleTopic(topic.id)} />
              {topic.name}
            </label>
          ))}
        </fieldset>
        <label>
          Images
          <input type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
        </label>
        <label>
          City
          <input value={cityName} onChange={(event) => setCityName(event.target.value)} maxLength={64} />
        </label>
        <label>
          Place
          <input value={placeName} onChange={(event) => setPlaceName(event.target.value)} maxLength={128} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={busy}>
          Submit for review
        </button>
      </form>
    </section>
  )
}
