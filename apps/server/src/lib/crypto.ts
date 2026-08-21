import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

const KEY_LENGTH = 32
const SALT_LENGTH = 16
const IV_LENGTH = 12
const SCRYPT_COST = { N: 16384, r: 8, p: 1 }

export interface EncryptedContent {
  contentEnc: string
  iv: string
  salt: string
  tag: string
}

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const hash = scryptSync(password, salt, KEY_LENGTH, SCRYPT_COST)
  return `scrypt:${salt.toString('base64')}:${hash.toString('base64')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, hashB64] = stored.split(':')
  if (scheme !== 'scrypt' || !saltB64 || !hashB64) {
    return false
  }
  const salt = Buffer.from(saltB64, 'base64')
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(password, salt, expected.length, SCRYPT_COST)
  return timingSafeEqual(actual, expected)
}

export function encryptContent(content: string, password: string): EncryptedContent {
  const salt = randomBytes(SALT_LENGTH)
  const key = scryptSync(password, salt, KEY_LENGTH, SCRYPT_COST)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(content, 'utf8'), cipher.final()])
  return {
    contentEnc: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    salt: salt.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  }
}

export class DecryptionError extends Error {
  constructor(message = 'Invalid password') {
    super(message)
    this.name = 'DecryptionError'
  }
}

export function decryptContent(enc: EncryptedContent, password: string): string {
  try {
    const salt = Buffer.from(enc.salt, 'base64')
    const key = scryptSync(password, salt, KEY_LENGTH, SCRYPT_COST)
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(enc.iv, 'base64'),
    )
    decipher.setAuthTag(Buffer.from(enc.tag, 'base64'))
    return Buffer.concat([
      decipher.update(Buffer.from(enc.contentEnc, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  }
  catch {
    throw new DecryptionError()
  }
}
