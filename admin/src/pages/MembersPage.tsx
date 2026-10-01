import { useEffect, useState } from 'react'
import { request } from '../api/client.ts'

type Member = { id: number; username: string; nickname: string; status: number }
type Page = { list: Member[]; total: number }

export function MembersPage() {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState<Page>({ list: [], total: 0 })
  const [error, setError] = useState('')

  async function load(nextKeyword = keyword) {
    setError('')
    try {
      const data = await request<Page>(`/api/admin/members?keyword=${encodeURIComponent(nextKeyword)}`)
      setPage(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    }
  }

  useEffect(() => {
    load('').catch(() => undefined)
  }, [])

  async function toggle(member: Member) {
    const status = member.status === 0 ? 1 : 0
    await request(`/api/admin/members/${member.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    await load()
  }

  return (
    <section>
      <h1>Members</h1>
      <form
        className="toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          load().catch((err) => setError(err instanceof Error ? err.message : 'Request failed'))
        }}
      >
        <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Search username" />
        <button type="submit">Search</button>
      </form>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Nickname</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {page.list.length === 0 ? (
              <tr>
                <td colSpan={4}>No members yet.</td>
              </tr>
            ) : (
              page.list.map((member) => (
                <tr key={member.id}>
                  <td>{member.username}</td>
                  <td>{member.nickname}</td>
                  <td>{member.status === 0 ? 'Active' : 'Disabled'}</td>
                  <td>
                    <button type="button" className="ghost" onClick={() => toggle(member)}>
                      {member.status === 0 ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
