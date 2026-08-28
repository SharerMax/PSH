import type { AuthInput, MyPasteList, PasteContent, PasteCreatedResponse, PasteCreateInput, PasteMeta, PasteStats, PasteUpdateInput, PasteViewsPage, PasteViewsQuery, User } from '@psh/shared'
import {
  myPasteListSchema,
  pasteContentSchema,
  pasteCreatedResponseSchema,
  pasteMetaSchema,
  pasteStatsSchema,
  pasteViewsPageSchema,
  userSchema,
} from '@psh/shared'
import { z } from 'zod'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)

  if (!response.ok) {
    let message = response.statusText || 'Request failed'
    try {
      const body: unknown = await response.json()
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        message = body.error
      }
    }
    catch {
      // non-json error body
    }
    throw new ApiError(response.status, message)
  }

  const data: unknown = await response.json()
  return schema.parse(data)
}

export function createPaste(input: PasteCreateInput): Promise<PasteCreatedResponse> {
  return request('/api/pastes', pasteCreatedResponseSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function getPasteMeta(link: string): Promise<PasteMeta> {
  return request(`/api/pastes/link/${link}/meta`, pasteMetaSchema)
}

export function getPasteMetaById(id: number): Promise<PasteMeta> {
  return request(`/api/pastes/id/${id}/meta`, pasteMetaSchema)
}

export function getPasteContent(link: string, password?: string): Promise<PasteContent> {
  const query = password ? `?password=${encodeURIComponent(password)}` : ''
  return request(`/api/pastes/link/${link}/content${query}`, pasteContentSchema)
}

export function getPasteContentById(id: number, password?: string): Promise<PasteContent> {
  const query = password ? `?password=${encodeURIComponent(password)}` : ''
  return request(`/api/pastes/id/${id}/content${query}`, pasteContentSchema)
}

export function register(input: AuthInput): Promise<User> {
  return request('/api/auth/register', userSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function login(input: AuthInput): Promise<User> {
  return request('/api/auth/login', userSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function logout(): Promise<{ ok: boolean }> {
  return request('/api/auth/logout', z.object({ ok: z.boolean() }), { method: 'POST' })
}

export function getMe(): Promise<User> {
  return request('/api/auth/me', userSchema)
}

export function getMyPastes(): Promise<MyPasteList> {
  return request('/api/mine', myPasteListSchema)
}

export function getPasteStats(id: number): Promise<PasteStats> {
  return request(`/api/mine/${id}/stats`, pasteStatsSchema)
}

export function getPasteViews(id: number, query: Partial<PasteViewsQuery>): Promise<PasteViewsPage> {
  const params = new URLSearchParams()
  if (query.page) {
    params.set('page', String(query.page))
  }
  if (query.pageSize) {
    params.set('pageSize', String(query.pageSize))
  }
  if (query.country) {
    params.set('country', query.country)
  }
  if (query.ip) {
    params.set('ip', query.ip)
  }
  if (query.from) {
    params.set('from', query.from)
  }
  if (query.to) {
    params.set('to', query.to)
  }
  const qs = params.toString()
  return request(`/api/mine/${id}/views${qs ? `?${qs}` : ''}`, pasteViewsPageSchema)
}

export function updatePaste(link: string, input: PasteUpdateInput): Promise<PasteMeta> {
  return request(`/api/pastes/link/${link}`, pasteMetaSchema, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function updatePasteById(id: number, input: PasteUpdateInput): Promise<PasteMeta> {
  return request(`/api/pastes/id/${id}`, pasteMetaSchema, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}
