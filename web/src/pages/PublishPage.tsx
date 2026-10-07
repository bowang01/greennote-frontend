import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { request, upload } from '../api/client.ts'

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
  type: number
  videoUrl: string | null
}
type Mode = 'image' | 'video' | 'text'

export function PublishDialog({ noteId, onClose }: { noteId: string | null; onClose: () => void }) {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [mode, setMode] = useState<Mode>('image')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [channelId, setChannelId] = useState('')
  const [topicIds, setTopicIds] = useState<string[]>([])
  const [placeName, setPlaceName] = useState('')
  const [cityName, setCityName] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    request<Channel[]>('/api/channels').then(setChannels).catch(() => undefined)
    request<Topic[]>('/api/topics').then(setTopics).catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!noteId) {
      return
    }
    request<EditableNote>(`/api/notes/${noteId}`)
      .then((note) => {
        setTitle(note.title ?? '')
        setContent(note.content ?? '')
        setChannelId(note.channelId ?? '')
        setTopicIds(note.topics?.map((topic) => topic.id) ?? [])
        setPlaceName(note.placeName ?? '')
        setCityName(note.cityName ?? '')
        setImageUrls(note.imageUrls ?? [])
        setVideoUrl(note.videoUrl ?? '')
        setMode(note.type === 2 ? 'video' : note.imageUrls?.length ? 'image' : 'text')
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
  }, [noteId])

  useEffect(() => {
    const next = files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }))
    setPreviews(next)
    return () => {
      next.forEach((preview) => URL.revokeObjectURL(preview.url))
    }
  }, [files])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleTopic(topicId: string) {
    setTopicIds((current) => (current.includes(topicId) ? current.filter((item) => item !== topicId) : [...current, topicId]))
  }

  async function save(draft: boolean) {
    if (!draft && !title.trim()) {
      setError('Title is required')
      return
    }
    if (!draft && mode === 'video' && !videoUrl.trim()) {
      setError('Video URL is required')
      return
    }
    setBusy(true)
    setError('')
    try {
      const uploadedUrls: string[] = []
      if (mode === 'image' || mode === 'video') {
        for (const file of files) {
          const stored = await upload('/api/member/files', file)
          uploadedUrls.push(stored.url)
        }
      }
      const body = {
        title: title.trim() || 'Untitled',
        content,
        channelId: channelId || null,
        topicIds,
        imageUrls: mode === 'text' ? [] : [...imageUrls, ...uploadedUrls],
        type: mode === 'video' ? 2 : 1,
        videoUrl: mode === 'video' ? videoUrl : null,
        placeName,
        cityName,
        draft,
      }
      if (noteId) {
        await request(`/api/member/notes/${noteId}`, { method: 'PUT', body: JSON.stringify(body) })
        navigate(`/notes/${noteId}`)
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
    <div className="compose-backdrop" onMouseDown={onClose}>
      <section className="compose-dialog" role="dialog" aria-labelledby="compose-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="compose-bar">
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            ×
          </button>
          <h2 id="compose-title">{noteId ? 'Edit' : 'Publish'}</h2>
          <div className="compose-actions">
            <button type="button" className="ghost" disabled={busy} onClick={() => save(true)}>
              Save draft
            </button>
            <button type="button" disabled={busy} onClick={() => save(false)}>
              Publish
            </button>
          </div>
        </header>
        <div className="compose-modes" role="tablist">
          {(['image', 'video', 'text'] as Mode[]).map((item) => (
            <button key={item} type="button" className={mode === item ? 'text-tab active' : 'text-tab'} onClick={() => setMode(item)}>
              {item === 'image' ? 'Image' : item === 'video' ? 'Video' : 'Note'}
            </button>
          ))}
        </div>
        {mode !== 'text' ? (
          <div className="compose-photos">
            {imageUrls.map((url) => (
              <button key={url} type="button" className="photo-tile" onClick={() => setImageUrls(imageUrls.filter((item) => item !== url))}>
                <img src={url} alt="" />
              </button>
            ))}
            {previews.map((preview) => (
              <span key={preview.name} className="photo-tile">
                <img src={preview.url} alt="" />
              </span>
            ))}
            <button type="button" className="photo-add" onClick={() => fileRef.current?.click()}>
              +
              <span>Upload</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </div>
        ) : null}
        {mode === 'video' ? (
          <input
            className="compose-title"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            placeholder="Video URL"
          />
        ) : null}
        <input
          className="compose-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a title"
          maxLength={128}
        />
        <p className="compose-count">{title.length}/128</p>
        <textarea
          className="compose-body"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Add a caption"
          rows={6}
          maxLength={20000}
        />
        <div className="compose-foot">
          <select value={channelId} aria-label="Channel" onChange={(event) => setChannelId(event.target.value)}>
            <option value="">Channel</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
              </option>
            ))}
          </select>
          <input value={cityName} onChange={(event) => setCityName(event.target.value)} placeholder="City" maxLength={64} />
          <input value={placeName} onChange={(event) => setPlaceName(event.target.value)} placeholder="Place" maxLength={128} />
        </div>
        <div className="compose-topics">
          {topics.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className={topicIds.includes(topic.id) ? 'chip active' : 'chip'}
              onClick={() => toggleTopic(topic.id)}
            >
              #{topic.name}
            </button>
          ))}
        </div>
        {error ? <p className="form-error">{error}</p> : null}
      </section>
    </div>
  )
}
