import { type FormEvent, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { request, upload } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'

type Profile = {
  userId: number
  username: string
  nickname: string
  avatar: string
  bio: string
}

export function ProfilePage() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
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

  if (!token) {
    return <Navigate to="/login" replace />
  }

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  return (
    <section className="login-wrap">
      <form className="profile-card" onSubmit={onSubmit}>
        <h1>Profile</h1>
        {profile?.avatar ? <img className="avatar" src={profile.avatar} alt="" /> : <div className="avatar" />}
        <label>
          Avatar
          <input type="file" accept="image/*" onChange={(event) => onAvatar(event.target.files?.[0])} />
        </label>
        <label>
          Username
          <input value={profile?.username ?? ''} disabled />
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
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p>{message}</p> : null}
        <button type="submit">Save</button>
      </form>
    </section>
  )
}
