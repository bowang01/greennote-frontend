import { useEffect, useState } from 'react'
import { request } from '../api/client.ts'

function useRows<T>(path: string) {
  const [rows, setRows] = useState<T[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    request<T[]>(path)
      .then(setRows)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Request failed'))
  }, [path])
  return { rows, error }
}

export function DepartmentsPage() {
  const { rows, error } = useRows<{ id: number; name: string; sortNo: number; status: number }>('/api/admin/departments')
  return (
    <section>
      <h1>Departments</h1>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Sort</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.sortNo}</td>
                <td>{row.status === 0 ? 'Enabled' : 'Disabled'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function DictionariesPage() {
  const { rows, error } = useRows<{ dictType: string; typeName: string; label: string; value: string }>('/api/admin/dictionaries')
  return (
    <section>
      <h1>Dictionaries</h1>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Label</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.dictType}-${row.value}`}>
                <td>{row.typeName}</td>
                <td>{row.label}</td>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function FilesPage() {
  const { rows, error } = useRows<{ id: number; name: string; url: string; size: number }>('/api/admin/files')
  return (
    <section>
      <h1>Files</h1>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3}>No files yet.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.url}</td>
                  <td>{row.size}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export function LogsPage() {
  const { rows, error } = useRows<{ id: number; operatorName: string; action: string; detail: string; createdAt: string }>('/api/admin/logs')
  return (
    <section>
      <h1>Operation logs</h1>
      {error ? <p className="form-error">{error}</p> : null}
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Who</th>
              <th>Action</th>
              <th>Detail</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.operatorName}</td>
                <td>{row.action}</td>
                <td>{row.detail}</td>
                <td>{row.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
