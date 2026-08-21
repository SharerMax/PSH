import { nanoid } from 'nanoid'

export function newPasteId(): string {
  return nanoid(8)
}
