export const DISPLAY_NAME_MIN_LENGTH = 3
export const DISPLAY_NAME_MAX_LENGTH = 20

export type DisplayNameValidationError =
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'blocked'
  | 'taken'

export type DisplayNameValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: DisplayNameValidationError }

/** Allowed: letters, digits, underscore, spaces (collapsed). */
const ALLOWED_PATTERN = /^[a-zA-Z0-9_ ]+$/

/**
 * Short blocklist (ES/EN). Matched as whole tokens after normalization.
 * Keep conservative to avoid false positives on common game words.
 */
const BLOCKED_WORDS = new Set([
  // EN
  'ass',
  'asshole',
  'bastard',
  'bitch',
  'cock',
  'cunt',
  'dick',
  'fag',
  'faggot',
  'fuck',
  'focker',
  'fock',
  'fuk',
  'fck',
  'fvck',
  'fucker',
  'fucking',
  'nigger',
  'nigga',
  'piss',
  'porn',
  'pussy',
  'rape',
  'shit',
  'slut',
  'whore',
  // ES
  'cabron',
  'cabrón',
  'coño',
  'cono',
  'gilipollas',
  'hijoputa',
  'joder',
  'maricón',
  'maricon',
  'mierda',
  'pendejo',
  'puta',
  'puto',
  'putos',
  'putas',
  'verga',
])

function collapseSpaces(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** Lowercase + light leetspeak for blocklist checks. */
export function normalizeForBlocklist(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
}

export function containsBlockedWord(value: string): boolean {
  const normalized = normalizeForBlocklist(value)
  const compact = normalized.replace(/[^a-z0-9]/g, '')

  for (const word of BLOCKED_WORDS) {
    const needle = normalizeForBlocklist(word).replace(/[^a-z0-9]/g, '')
    if (!needle) continue
    if (compact.includes(needle)) return true
  }
  return false
}

export function normalizeDisplayName(raw: string): string {
  return collapseSpaces(raw)
}

/**
 * Validates format and blocklist. Does not check uniqueness (`taken` is for callers).
 */
export function validateDisplayName(raw: string): DisplayNameValidationResult {
  const normalized = normalizeDisplayName(raw)

  if (normalized.length < DISPLAY_NAME_MIN_LENGTH) {
    return { ok: false, error: 'too_short' }
  }
  if (normalized.length > DISPLAY_NAME_MAX_LENGTH) {
    return { ok: false, error: 'too_long' }
  }
  if (!ALLOWED_PATTERN.test(normalized)) {
    return { ok: false, error: 'invalid_chars' }
  }
  if (containsBlockedWord(normalized)) {
    return { ok: false, error: 'blocked' }
  }

  return { ok: true, normalized }
}

/**
 * Provisional nick from a seed (typically user id). Always valid length.
 * Format: Player_XXXXX (5 hex chars).
 */
export function generateProvisionalDisplayName(seed: string): string {
  const hex = seed.replace(/[^a-fA-F0-9]/g, '').toUpperCase()
  const fragment = (hex.slice(0, 5) || '00000').padEnd(5, '0').slice(0, 5)
  return `Player_${fragment}`
}

export function isBlankDisplayName(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0
}
