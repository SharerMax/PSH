import type { PasteContent, PasteCreatedResponse, PasteCreateInput, PasteMeta } from '@psh/shared'
import type { z } from 'zod'
import {

  pasteContentSchema,

  pasteCreatedResponseSchema,

  pasteMetaSchema,
} from '@psh/shared'

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

export function getPasteMeta(id: string): Promise<PasteMeta> {
  return request(`/api/pastes/${id}/meta`, pasteMetaSchema)
}

export function getPasteContent(id: string, password?: string): Promise<PasteContent> {
  const query = password ? `?password=${encodeURIComponent(password)}` : ''
  return request(`/api/pastes/${id}/content${query}`, pasteContentSchema)
}
