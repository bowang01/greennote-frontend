import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { request } from '../api/client.ts'
import { useAuth } from '../auth/AuthContext.tsx'
import { NoteWaterfall, type FeedNote } from '../components/NoteWaterfall.tsx'

type Member = { id: string; username: string; nickname: string; avatar: string | null }
type Topic = { id: string; name: string }
type SearchResult = { notes: FeedNote[]; users: Member[]; topics: Topic[] }

export function SearchPage() {
  const [params] = useSearchParams()
  const query = (params.get('q') ?? '').trim()
  const [result, setResult] = useState<SearchResult>({ notes: [], users: [], topics: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query) {
      setResult({ notes: [], users: [], topics: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    request<SearchResult>(`/api/search?q=${encodeURIComponent(query)}`)
      .then((data) => {
        setResult(data)
        setError('')
      })
      .catch((err) => {
        setResult({ notes: [], users: [], topics: [] })
        setError(err instanceof Error ? err.message : 'Request failed')
      })
      .finally(() => setLoading(false))
  }, [query])

  const empty = result.notes.length === 0 && result.users.length === 0 && result.topics.length === 0

  return (
    <section className="feed-page">
      <h1>Search</h1>
      {error ? <p className="form-error">{error}</p> : null}
      {!query ? (
        <div className="empty" role="status">
          <h2>Search GreenNote</h2>
          <p>Find notes, people, and topics.</p>
        </div>
      ) : null}
      {query && !loading && empty && !error ? (
        <div className="empty" role="status">
          <h2>No results</h2>
          <p>Nothing matches this search.</p>
        </div>
      ) : null}
      {result.users.length > 0 ? (
        <div className="search-block">
          <h2>People</h2>
          <ul className="message-list">
            {result.users.map((user) => (
              <li key={user.id} className="person-row">
                <Link to={`/users/${user.id}`}>
                  {user.avatar ? <img src={user.avatar} alt="" /> : <span className="avatar tiny" />}
                  <span>
                    <strong>{user.nickname}</strong>
                    <em>{user.username}</em>
                  </span>
                </Link>
                <FollowButton userId={user.id} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.topics.length > 0 ? (
        <div className="search-block">
          <h2>Topics</h2>
          <div className="chip-row">
            {result.topics.map((topic) => (
              <span key={topic.id} className="chip">
                #{topic.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      {result.notes.length > 0 ? (
        <div className="search-block">
          <h2>Notes</h2>
          <NoteWaterfall notes={result.notes} />
        </div>
      ) : null}
    </section>
  )
}

function FollowButton({ userId }: { userId: string }) {
  const { token } = useAuth()
  const [following, setFollowing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }
    request<{ following: boolean }>(`/api/member/follows/${userId}`)
      .then((state) => setFollowing(state.following))
      .catch(() => setFollowing(false))
  }, [token, userId])

  if (!token) {
    return <Link to="/login">Follow</Link>
  }

  async function toggle() {
    setError('')
    try {
      if (following) {
        await request(`/api/member/follows/${userId}`, { method: 'DELETE' })
        setFollowing(false)
        return
      }
      await request(`/api/member/follows/${userId}`, { method: 'PUT' })
      setFollowing(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  return (
    <span>
      <button type="button" className="ghost" onClick={() => toggle()}>
        {following ? 'Following' : 'Follow'}
      </button>
      {error ? <span className="form-error">{error}</span> : null}
    </span>
  )
}
