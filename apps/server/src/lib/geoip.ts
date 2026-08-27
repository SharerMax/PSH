import type { Context } from 'hono'
import type { CountryResponse } from 'mmdb-lib'
import { readFileSync } from 'node:fs'
import { getConnInfo } from '@hono/node-server/conninfo'
import { Reader } from 'mmdb-lib'
import { env } from '../env'

const reader = loadReader()

function loadReader(): Reader<CountryResponse> | null {
  if (!env.MMDB_PATH) {
    return null
  }
  try {
    return new Reader<CountryResponse>(readFileSync(env.MMDB_PATH))
  }
  catch (error) {
    console.error(`[geoip] failed to load mmdb file at ${env.MMDB_PATH}:`, error)
    return null
  }
}

/** Whether IP -> country lookup is active (MMDB_PATH configured and loaded). */
export function isGeoEnabled(): boolean {
  return reader !== null
}

/** Client IP: x-forwarded-for first, else the socket address. */
export function getRequestIp(c: Context): string | undefined {
  const forwarded = c.req.header('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim()
  }
  return getConnInfo(c)?.remote?.address
}

/** Whether the IP is private/loopback/link-local (RFC 1918, RFC 4193, etc.). */
export function isPrivateIp(ip: string): boolean {
  if (ip.startsWith('::ffff:')) {
    return isPrivateIp(ip.slice(7))
  }
  if (ip === '::1' || ip === '::') {
    return true
  }
  if (ip.includes(':')) {
    // IPv6: fc00::/7 (unique local), fe80::/10 (link local)
    const lower = ip.toLowerCase()
    return lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe8')
      || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')
  }
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) {
    return false
  }
  const [a, b] = parts
  return a === 10
    || a === 127
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 169 && b === 254)
}

/** Resolve the country ISO code for an IP, or null when unknown/disabled. */
export function countryForIp(ip: string | undefined): string | null {
  if (!ip) {
    return null
  }
  if (isPrivateIp(ip)) {
    return 'LOCAL'
  }
  if (!reader) {
    return null
  }
  const result = reader.get(ip)
  return result?.country?.iso_code ?? result?.registered_country?.iso_code ?? null
}
