import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const esPath = join(root, 'src/i18n/locales/es.json')
const enPath = join(root, 'src/i18n/locales/en.json')

function collectKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return []
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      keys.push(path)
    } else if (value !== null && typeof value === 'object') {
      keys.push(...collectKeys(value, path))
    }
  }
  return keys.sort()
}

const es = JSON.parse(readFileSync(esPath, 'utf8')) as unknown
const en = JSON.parse(readFileSync(enPath, 'utf8')) as unknown

const esKeys = collectKeys(es)
const enKeys = collectKeys(en)

const esSet = new Set(esKeys)
const enSet = new Set(enKeys)

const missingInEn = esKeys.filter((k) => !enSet.has(k))
const missingInEs = enKeys.filter((k) => !esSet.has(k))

if (missingInEn.length > 0 || missingInEs.length > 0) {
  if (missingInEn.length > 0) {
    console.error('Missing in en.json:')
    missingInEn.forEach((k) => console.error(`  - ${k}`))
  }
  if (missingInEs.length > 0) {
    console.error('Missing in es.json:')
    missingInEs.forEach((k) => console.error(`  - ${k}`))
  }
  process.exit(1)
}

console.log(`Locale parity OK (${esKeys.length} keys)`)
