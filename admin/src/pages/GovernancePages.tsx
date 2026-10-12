import { type FormEvent, useEffect, useState } from 'react'
import { request } from '../api/client.ts'

type ReportItem = {
  id: string
  reporterName: string
  targetType: string
  targetId: string
  reason: string
  status: number
  noteTitle: string | null
  commentText: string | null
  createdAt: string | null
}
type ReportPage = { list: ReportItem[]; total: number }
type Member = { id: string; nickname: string; username: string }
type MemberPage = { list: Member[]; total: number }
type Creator = {
  userId: string
  nickname: string
  noteCount: number
  likeCount: number
  followerCount: number
}
type CreatorPage = { list: Creator[]; total: number }

const PAGE_SIZE = 20
const REPORT_STATUS: Record<number, string> = {
  0: 'Pending',
  1: 'Upheld',
  2: 'Dismissed',
}

export function ReportsPage() {
  const [status, setStatus] = useState('0')
  const [pageNo, setPageNo] = useState(1)
  const [page, setPage] = useState<ReportPage>({ list: [], total: 0 })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [reasonId, setReasonId] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (status) {
      params.set('status', status)
    }
    params.set('page', String(pageNo))
    params.set('size', String(PAGE_SIZE))
    request<ReportPage>(`/api/admin/reports?${params}`)
      .then((data) => {
        setPage(data)
        setError('')
      })
      .catch((err) => {
        setPage({ list: [], total: 0 })
        setError(err instanceof Error ? err.message : 'Request failed')
      })
  }, [status, pageNo, reloadKey])

  async function dismiss(id: string) {
    setBusy(true)
    try {
      await request(`/api/admin/reports/${id}/dismiss`, { method: 'PUT' })
      setReloadKey((current) => current + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  async function uphold(id: string, action: string, offlineReason?: string) {
    setBusy(true)
    try {
      await request(`/api/admin/reports/${id}/uphold`, {
        method: 'PUT',
        body: JSON.stringify({ action, reason: offlineReason ?? '' }),
      })
      setReasonId(null)
      setReason('')
      setReloadKey((current) => current + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(page.total / PAGE_SIZE))

  return (
    <section>
      <h1>Reports</h1>
      <div className="toolbar">
        <select
          aria-label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value)
            setPageNo(1)
          }}
        >
          <option value="0">Pending</option>
          <option value="1">Upheld</option>
          <option value="2">Dismissed</option>
          <option value="">All</option>
        </select>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {reasonId ? (
        <form
          className="panel reason-box"
          onSubmit={(event) => {
            event.preventDefault()
            uphold(reasonId, 'offline', reason)
          }}
        >
          <label>
            Offline reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} required rows={3} maxLength={255} />
          </label>
          <div className="toolbar">
            <button type="submit" disabled={busy}>
              Take offline
            </button>
            <button type="button" className="ghost" onClick={() => setReasonId(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Reporter</th>
              <th>Target</th>
              <th>Reason</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {page.list.length === 0 ? (
              <tr>
                <td colSpan={5}>No reports.</td>
              </tr>
            ) : (
              page.list.map((report) => (
                <tr key={report.id}>
                  <td>{report.reporterName}</td>
                  <td>
                    {report.targetType === 'note' ? report.noteTitle || 'Note' : report.commentText || 'Comment'}
                  </td>
                  <td>{report.reason}</td>
                  <td>{REPORT_STATUS[report.status] ?? report.status}</td>
                  <td className="row-actions">
                    {report.status === 0 ? (
                      <>
                        <button type="button" className="ghost" disabled={busy} onClick={() => uphold(report.id, 'none')}>
                          Uphold
                        </button>
                        {report.targetType === 'note' ? (
                          <button type="button" className="ghost" disabled={busy} onClick={() => setReasonId(report.id)}>
                            Offline note
                          </button>
                        ) : (
                          <button type="button" className="ghost" disabled={busy} onClick={() => uphold(report.id, 'delete-comment')}>
                            Delete comment
                          </button>
                        )}
                        <button type="button" className="ghost" disabled={busy} onClick={() => dismiss(report.id)}>
                          Dismiss
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pager pageNo={pageNo} pageCount={pageCount} onPage={setPageNo} />
      </div>
    </section>
  )
}

export function NoticesPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [userId, setUserId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    request<MemberPage>('/api/admin/members?page=1&size=50')
      .then((page) => setMembers(page.list))
      .catch(() => setMembers([]))
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await request('/api/admin/messages', {
        method: 'POST',
        body: JSON.stringify({ title, text, userId: userId || null }),
      })
      setTitle('')
      setText('')
      setMessage(userId ? 'Notice sent.' : 'Notice sent to all members.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h1>Notices</h1>
      <form className="panel" onSubmit={onSubmit}>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={128} />
        </label>
        <label>
          Message
          <textarea value={text} onChange={(event) => setText(event.target.value)} required maxLength={500} rows={4} />
        </label>
        <label>
          Recipient
          <select aria-label="Recipient" value={userId} onChange={(event) => setUserId(event.target.value)}>
            <option value="">All members</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.nickname} ({member.username})
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p>{message}</p> : null}
        <button type="submit" disabled={busy}>
          Send
        </button>
      </form>
    </section>
  )
}

export function CreatorsPage() {
  const [pageNo, setPageNo] = useState(1)
  const [page, setPage] = useState<CreatorPage>({ list: [], total: 0 })
  const [error, setError] = useState('')

  useEffect(() => {
    request<CreatorPage>(`/api/admin/creators?page=${pageNo}&size=${PAGE_SIZE}`)
      .then((data) => {
        setPage(data)
        setError('')
      })
      .catch((err) => {
        setPage({ list: [], total: 0 })
        setError(err instanceof Error ? err.message : 'Request failed')
      })
  }, [pageNo])

  const pageCount = Math.max(1, Math.ceil(page.total / PAGE_SIZE))

  return (
    <section>
      <h1>Creators</h1>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Notes</th>
              <th>Likes</th>
              <th>Followers</th>
            </tr>
          </thead>
          <tbody>
            {page.list.length === 0 ? (
              <tr>
                <td colSpan={4}>No creators.</td>
              </tr>
            ) : (
              page.list.map((creator) => (
                <tr key={creator.userId}>
                  <td>{creator.nickname}</td>
                  <td>{creator.noteCount}</td>
                  <td>{creator.likeCount}</td>
                  <td>{creator.followerCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pager pageNo={pageNo} pageCount={pageCount} onPage={setPageNo} />
      </div>
    </section>
  )
}

function Pager({ pageNo, pageCount, onPage }: { pageNo: number; pageCount: number; onPage: (page: number) => void }) {
  return (
    <div className="toolbar pager">
      <button type="button" className="ghost" disabled={pageNo <= 1} onClick={() => onPage(pageNo - 1)}>
        Previous
      </button>
      <span>
        {pageNo} / {pageCount}
      </span>
      <button type="button" className="ghost" disabled={pageNo >= pageCount} onClick={() => onPage(pageNo + 1)}>
        Next
      </button>
    </div>
  )
}
