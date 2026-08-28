import type { ExpiryOption, MyPasteItem, PasteContent, PasteCreateInput, PasteMeta, PasteUpdateInput } from '@psh/shared'
import type { NewPasteRow, PasteRow } from '../db/schema'
import {
  decryptContent,
  DecryptionError,
  encryptContent,
  hashPassword,
  verifyPassword,
} from '../lib/crypto'
import { newPasteId } from '../lib/id'
import {
  deletePasteById,
  findPasteById,
  findPasteByLink,
  insertPaste,
  listPastesByUserId,
  updatePasteById,
} from '../repositories/paste-repository'
import { getViewAggregate } from '../repositories/view-repository'

const EXPIRY_MS: Partial<Record<ExpiryOption, number>> = {
  '10min': 10 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}

function computeExpiry(expiresIn: string | undefined): Date | null {
  if (!expiresIn || expiresIn === 'forever') {
    return null
  }
  const ms = EXPIRY_MS[expiresIn as ExpiryOption]
  return ms ? new Date(Date.now() + ms) : null
}

export function isExpired(row: Pick<PasteRow, 'expiresAt'>): boolean {
  return row.expiresAt !== null && row.expiresAt.getTime() <= Date.now()
}

/** Lazily delete an expired row; returns null when the row is gone. */
function expireCheck(row: PasteRow | undefined): PasteRow | null {
  if (!row) {
    return null
  }
  if (isExpired(row)) {
    deletePasteById(row.id)
    return null
  }
  return row
}

export function getLivePasteByLink(link: string): PasteRow | null {
  return expireCheck(findPasteByLink(link))
}

export function getLivePasteById(id: number): PasteRow | null {
  return expireCheck(findPasteById(id))
}

/** Live row owned by the given user (for owner-only endpoints); null otherwise. */
export function getOwnedPasteById(id: number, userId: string): PasteRow | null {
  const row = findPasteById(id)
  if (!row || row.userId !== userId || isExpired(row)) {
    return null
  }
  return row
}

export type ReadResult
  = | { ok: true, row: PasteRow, content: string }
    | { ok: false, status: 400 | 401 | 404, message: string }

/**
 * Shared read path for the JSON content endpoint and the raw endpoint:
 * password verification/decryption, burn-after-read.
 */
function readPaste(row: PasteRow, password?: string): ReadResult {
  let content: string
  if (row.passwordHash !== null) {
    if (!password || !verifyPassword(password, row.passwordHash)) {
      return { ok: false, status: 401, message: 'Invalid or missing password' }
    }
    try {
      content = decryptContent(
        {
          contentEnc: row.contentEnc ?? '',
          iv: row.iv ?? '',
          salt: row.salt ?? '',
          tag: row.tag ?? '',
        },
        password,
      )
    }
    catch (error) {
      if (error instanceof DecryptionError) {
        return { ok: false, status: 401, message: 'Invalid or missing password' }
      }
      throw error
    }
  }
  else {
    content = row.content ?? ''
  }

  if (row.burnAfterRead) {
    deletePasteById(row.id)
  }

  return { ok: true, row, content }
}

export function readPasteByLink(link: string, password?: string): ReadResult {
  const row = getLivePasteByLink(link)
  if (!row) {
    return { ok: false, status: 404, message: 'Paste not found or expired' }
  }
  return readPaste(row, password)
}

export function readPasteById(id: number, password?: string): ReadResult {
  const row = getLivePasteById(id)
  if (!row) {
    return { ok: false, status: 404, message: 'Paste not found or expired' }
  }
  return readPaste(row, password)
}

function buildNewRow(input: PasteCreateInput, userId: string | null): NewPasteRow {
  const base = {
    link: input.link ?? newPasteId(),
    title: input.title || null,
    language: input.language,
    burnAfterRead: input.burnAfterRead ?? false,
    userId,
    expiresAt: computeExpiry(input.expiresIn),
  }

  if (input.password) {
    return {
      ...base,
      content: null,
      ...encryptContent(input.content, input.password),
      passwordHash: hashPassword(input.password),
    }
  }

  return { ...base, content: input.content }
}

export type CreatePasteResult
  = | { ok: true, link: string }
    | { ok: false, error: 'link-taken' }

export function createPaste(input: PasteCreateInput, userId: string | null): CreatePasteResult {
  if (input.link) {
    // a taken link blocks reuse even when the old paste is expired;
    // getLivePasteByLink lazily deletes expired rows, freeing them for reuse
    if (getLivePasteByLink(input.link)) {
      return { ok: false, error: 'link-taken' }
    }
  }
  const row = buildNewRow(input, userId)
  insertPaste(row)
  return { ok: true, link: row.link }
}

/** Delete a paste owned by the given user; false when missing or not owned. */
export function deleteOwnedPaste(id: number, userId: string): boolean {
  const row = findPasteById(id)
  if (!row || row.userId !== userId) {
    return false
  }
  deletePasteById(id)
  return true
}

export type UpdatePasteResult
  = | { ok: true, meta: PasteMeta }
    | { ok: false, status: 400 | 401, message: string }

export function updatePaste(row: PasteRow, input: PasteUpdateInput): UpdatePasteResult {
  const updates: Partial<NewPasteRow> = {}
  if (input.title !== undefined) {
    updates.title = input.title || null
  }
  if (input.language !== undefined) {
    updates.language = input.language
  }
  if (input.content !== undefined) {
    if (row.passwordHash !== null) {
      // re-encrypting requires the current paste password
      if (!input.password || !verifyPassword(input.password, row.passwordHash)) {
        return { ok: false, status: 401, message: 'Invalid or missing password' }
      }
      Object.assign(updates, encryptContent(input.content, input.password), {
        content: null,
      })
    }
    else {
      updates.content = input.content
    }
  }

  if (Object.keys(updates).length === 0) {
    return { ok: false, status: 400, message: 'Nothing to update' }
  }
  updatePasteById(row.id, updates)
  return { ok: true, meta: toMeta({ ...row, ...updates }) }
}

export function toMeta(row: PasteRow): PasteMeta {
  return {
    link: row.link,
    title: row.title,
    language: row.language,
    hasPassword: row.passwordHash !== null,
    burnAfterRead: row.burnAfterRead,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  }
}

export function toContentPayload(row: PasteRow, content: string): PasteContent {
  return {
    link: row.link,
    title: row.title,
    language: row.language,
    content,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
  }
}

/** List the user's pastes with view aggregates; lazily deletes expired rows. */
export function listUserPastes(userId: string): MyPasteItem[] {
  const rows = listPastesByUserId(userId)

  const items: MyPasteItem[] = []
  for (const row of rows) {
    if (isExpired(row)) {
      deletePasteById(row.id)
      continue
    }
    const { views, lastViewedAt } = getViewAggregate(row.id)
    items.push({
      id: row.id,
      link: row.link,
      title: row.title,
      language: row.language,
      hasPassword: row.passwordHash !== null,
      burnAfterRead: row.burnAfterRead,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      views,
      lastViewedAt: lastViewedAt === null ? null : new Date(lastViewedAt).toISOString(),
    })
  }

  items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return items
}
