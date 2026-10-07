import { type FormEvent, useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { request, upload } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { NoteWaterfall, type FeedNote } from '../components/NoteWaterfall.tsx'

type Profile = {
  userId: string
  username: string
  nickname: string
  avatar: string
  bio: string
}
type Page = { list: FeedNote[]; total: number }

const TABS = [
  { id: 'notes', label: 'Notes', path: '/api/member/notes/mine' },
  { id: 'collects', label: 'Collects', path: '/api/member/notes/collects' },
  { id: 'likes', label: 'Liked', path: '/api/member/notes/likes' },
] as const

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: '2', label: 'Published' },
  { id: '1', label: 'Pending' },
  { id: '0', label: 'Draft' },
  { id: '3', label: 'Offline' },
]

export function ProfilePage() {
  const { token } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((item) => item.id === params.get('tab')) ? params.get('tab')! : 'notes'
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notes, setNotes] = useState<FeedNote[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }
    request<Profile>('/api/member/profile')
      .then(setProfile)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Request failed'))
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }
    const current = TABS.find((item) => item.id === tab) ?? TABS[0]
    request<Page>(current.path)
      .then((page) => {
        setNotes(page.list)
        setError('')
      })
      .catch((err) => {
        setNotes([])
        setError(err instanceof Error ? err.message : 'Request failed')
      })
  }, [tab, token])

  if (!token) {
    return <Navigate to="/login" replace />
  }

  const visible =
    tab === 'notes' && statusFilter !== 'all' ? notes.filter((note) => String(note.status) === statusFilter) : notes

  async function onAvatar(file: File | undefined) {
    if (!file || !profile) {
      return
    }
    const stored = await upload('/api/member/files', file)
    setProfile({ ...profile, avatar: stored.url })
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!profile) {
      return
    }
    setError('')
    setMessage('')
    try {
      const saved = await request<Profile>('/api/member/profile', {
        method: 'PUT',
        body: JSON.stringify({
          nickname: profile.nickname,
          bio: profile.bio,
          avatar: profile.avatar,
        }),
      })
      setProfile(saved)
      setMessage('Profile saved.')
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  return (
    <section className="profile-page">
      <div className="profile-banner" />
      <div className="profile-head">
        {profile?.avatar ? <img className="avatar" src={profile.avatar} alt="" /> : <div className="avatar" />}
        <div>
          <h1>{profile?.nickname || profile?.username || 'Profile'}</h1>
          <p className="muted">{profile?.username}</p>
          <p className="muted">{profile?.bio || 'No bio yet.'}</p>
          <button type="button" className="ghost" onClick={() => setEditing((open) => !open)}>
            Edit profile
          </button>
        </div>
      </div>
      {editing ? (
        <form className="profile-edit" onSubmit={onSubmit}>
          <label>
            Avatar
            <input type="file" accept="image/*" onChange={(event) => onAvatar(event.target.files?.[0])} />
          </label>
          <label>
            Nickname
            <input
              value={profile?.nickname ?? ''}
              onChange={(event) => profile && setProfile({ ...profile, nickname: event.target.value })}
              required
            />
          </label>
          <label>
            Bio
            <input
              value={profile?.bio ?? ''}
              onChange={(event) => profile && setProfile({ ...profile, bio: event.target.value })}
            />
          </label>
          <button type="submit">Save</button>
        </form>
      ) : null}
      <div className="profile-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? 'text-tab active' : 'text-tab'}
            onClick={() => setParams({ tab: item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'notes' ? (
        <div className="chip-row">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={statusFilter === item.id ? 'chip active' : 'chip'}
              onClick={() => setStatusFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="form-error">{error}</p> : null}
      {message ? <p className="muted">{message}</p> : null}
      {visible.length === 0 && !error ? (
        <div className="empty" role="status">
          <h2>Nothing here yet</h2>
        </div>
      ) : (
        <NoteWaterfall notes={visible} showStatus={tab === 'notes'} />
      )}
    </section>
  )
}
