import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { NoteWaterfall, type FeedNote } from '../components/NoteWaterfall.tsx'

type PublicProfile = {
  userId: string
  nickname: string
  avatar: string | null
  bio: string
  noteCount: number
  likeCount: number
  followerCount: number
  following: boolean
}
type Page = { list: FeedNote[]; total: number }

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

export function UserPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [notes, setNotes] = useState<FeedNote[]>([])
  const [error, setError] = useState('')
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    if (!id) {
      return
    }
    request<PublicProfile>(`/api/users/${id}`)
      .then((data) => {
        setProfile(data)
        setFollowing(data.following)
        setError('')
      })
      .catch((err) => {
        setProfile(null)
        setError(err instanceof Error ? err.message : 'Request failed')
      })
    request<Page>(`/api/users/${id}/notes`)
      .then((page) => setNotes(page.list))
      .catch(() => setNotes([]))
  }, [id, token])

  const mine = Boolean(token && profile && userIdFromToken(token) === profile.userId)

  async function toggleFollow() {
    if (!profile) {
      return
    }
    if (following) {
      await request(`/api/member/follows/${profile.userId}`, { method: 'DELETE' })
      setFollowing(false)
      setProfile({ ...profile, followerCount: Math.max(0, profile.followerCount - 1) })
      return
    }
    await request(`/api/member/follows/${profile.userId}`, { method: 'PUT' })
    setFollowing(true)
    setProfile({ ...profile, followerCount: profile.followerCount + 1 })
  }

  return (
    <section className="profile-page">
      <div className="profile-banner" />
      <div className="profile-head">
        {profile?.avatar ? <img className="avatar" src={profile.avatar} alt="" /> : <div className="avatar" />}
        <div>
          <h1>{profile?.nickname || 'Member'}</h1>
          <p className="muted">{profile?.bio || 'No bio yet.'}</p>
          <p className="muted">
            {profile ? `${profile.noteCount} notes · ${profile.likeCount} likes · ${profile.followerCount} followers` : ''}
          </p>
          {token && profile && !mine ? (
            <button type="button" className="ghost" onClick={() => toggleFollow().catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))}>
              {following ? 'Following' : 'Follow'}
            </button>
          ) : null}
          {mine ? <Link to="/profile">Edit profile</Link> : null}
          {!token && profile ? <Link to="/login">Sign in to follow</Link> : null}
        </div>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {!profile && !error ? <p className="muted">Loading</p> : null}
      {profile && notes.length === 0 ? (
        <div className="empty" role="status">
          <h2>No published notes</h2>
        </div>
      ) : null}
      {notes.length > 0 ? <NoteWaterfall notes={notes} /> : null}
    </section>
  )
}
