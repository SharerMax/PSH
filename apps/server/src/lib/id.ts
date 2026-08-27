import { nanoid } from 'nanoid'

export function newPasteId(): string {
  return nanoid(8)
}

export function newUserId(): string {
  return nanoid(16)
}

export function newSessionToken(): string {
  return nanoid(48)
}
