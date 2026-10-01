const TOKEN_KEY = 'greennote.admin.token'

export type LoginResult = {
  userId: number
  username: string
  accessToken: string
  expiresAt: string
}

export type Profile = {
  userId: number
  username: string
}

type ApiBody<T> = {
  code: number
  msg: string
  data: T
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function readToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function writeToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export async function request<T>(path: string, init: RequestInit = {}, auth = true): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const token = readToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(path, { ...init, headers })
  let body: ApiBody<T>
  try {
    body = (await response.json()) as ApiBody<T>
  } catch {
    throw new ApiError('Invalid response', response.status)
  }

  if (!response.ok || body.code !== 0) {
    if (response.status === 401 || body.code === 401) {
      writeToken(null)
    }
    throw new ApiError(body.msg || 'Request failed', response.status || body.code)
  }
  return body.data
}

export async function upload(path: string, file: File): Promise<{ id: number; url: string; name: string }> {
  const headers = new Headers()
  const token = readToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const body = new FormData()
  body.append('file', file)
  const response = await fetch(path, { method: 'POST', body, headers })
  const payload = (await response.json()) as ApiBody<{ id: number; url: string; name: string }>
  if (!response.ok || payload.code !== 0) {
    throw new ApiError(payload.msg || 'Upload failed', response.status || payload.code)
  }
  return payload.data
}
