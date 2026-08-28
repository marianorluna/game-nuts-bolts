import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface PackageJson {
  version: string
  versionCode: number
}

interface LocalizedStrings {
  es: string[]
  en: string[]
}

interface LocalizedText {
  es: string
  en: string
}

interface ReleaseUserSummary {
  newLevels?: number
  newStages?: number
}

interface ReleaseNote {
  version: string
  versionCode: number
  date: string | null
  published: boolean
  mergedInto?: string
  title: LocalizedText
  highlights: LocalizedStrings
  userSummary?: ReleaseUserSummary
  showWhatsNew?: boolean
  playStoreNotes?: LocalizedStrings
  added?: LocalizedStrings
  changed?: LocalizedStrings
  fixed?: LocalizedStrings
  compatibility?: LocalizedStrings
}

interface ReleaseNotesCatalog {
  releases: ReleaseNote[]
}

const root = resolve(import.meta.dirname, '..')
const notesPath = resolve(root, 'src/data/release-notes.json')
const changelogPath = resolve(root, 'docs/CHANGELOG.md')
const pkgPath = resolve(root, 'package.json')

const mode = process.argv[2] ?? 'sync'

function loadCatalog(): ReleaseNotesCatalog {
  return JSON.parse(readFileSync(notesPath, 'utf8')) as ReleaseNotesCatalog
}

function saveCatalog(catalog: ReleaseNotesCatalog): void {
  writeFileSync(notesPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
}

function loadPackage(): PackageJson {
  return JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson
}

function bulletList(items: string[]): string {
  if (items.length === 0) return ''
  return `${items.map((item) => `- ${item}`).join('\n')}\n`
}

function sectionEsEn(
  heading: string,
  strings: LocalizedStrings | undefined,
): string {
  if (!strings || (strings.es.length === 0 && strings.en.length === 0)) {
    return ''
  }
  let out = `### ${heading}\n\n`
  if (strings.es.length > 0) {
    out += `**ES**\n\n${bulletList(strings.es)}\n`
  }
  if (strings.en.length > 0) {
    out += `**EN**\n\n${bulletList(strings.en)}\n`
  }
  return out
}

function getMergedVersions(
  catalog: ReleaseNotesCatalog,
  version: string,
): ReleaseNote[] {
  return catalog.releases.filter((r) => r.mergedInto === version)
}

function sectionUserSummary(summary: ReleaseUserSummary | undefined): string {
  if (!summary) return ''
  const parts: string[] = []
  if (summary.newLevels) parts.push(`${summary.newLevels} niveles`)
  if (summary.newStages) parts.push(`${summary.newStages} etapas`)
  if (parts.length === 0) return ''
  return `### Modal in-app (resumen jugador)\n\n- ${parts.join(', ')}\n\n`
}

function renderRelease(
  release: ReleaseNote,
  catalog: ReleaseNotesCatalog,
): string {
  const dateSuffix = release.date ? ` — ${release.date}` : ''
  let body = `## [${release.version}]${dateSuffix} — ${release.title.es} / ${release.title.en}\n\n`
  body += `**versionCode:** ${release.versionCode}\n\n`

  const merged = getMergedVersions(catalog, release.version)
  if (merged.length > 0) {
    const labels = merged
      .map((r) => `v${r.version} (versionCode ${r.versionCode})`)
      .join(', ')
    body += `> **Play Store:** publicación única en esta versión. Incluye ${labels} — no publicadas por separado en Play.\n\n`
  }

  body += sectionUserSummary(release.userSummary)
  body += sectionEsEn('Destacado (Play Store / changelog)', release.highlights)
  body += sectionEsEn('Notas Play Console (copiar y pegar)', release.playStoreNotes)
  body += sectionEsEn('Añadido', release.added)
  body += sectionEsEn('Cambiado', release.changed)
  body += sectionEsEn('Corregido', release.fixed)
  body += sectionEsEn('Compatibilidad', release.compatibility)
  return `${body.trim()}\n\n---\n\n`
}

function generateChangelog(catalog: ReleaseNotesCatalog): string {
  const published = catalog.releases
    .filter((r) => r.published)
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))

  const planned = catalog.releases
    .filter((r) => !r.published && !r.mergedInto)
    .sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }))

  let md = `# Changelog — Nuts & Bolts\n\n`
  md += `Historial de **releases de la app** (semver + \`versionCode\`).\n\n`
  md += `**Fuente de verdad:** \`src/data/release-notes.json\` — el modal «Novedades» usa \`userSummary\`; este archivo y Play Store usan \`highlights\`.\n\n`
  md += `**Documentos relacionados:** [CONTENT_CHANGELOG.md](./CONTENT_CHANGELOG.md) (solo contenido/niveles) · [SOCIAL_FEATURES_ROADMAP.md](./SOCIAL_FEATURES_ROADMAP.md)\n\n`
  md += `## Comandos\n\n`
  md += `| Comando | Descripción |\n`
  md += `| ------- | ----------- |\n`
  md += `| \`npm run changelog:sync\` | Regenera este archivo desde \`release-notes.json\` |\n`
  md += `| \`npm run changelog:check\` | Verifica que \`package.json\` tenga entrada publicada |\n`
  md += `| \`npm run changelog:scaffold\` | Crea plantilla para la versión actual si falta |\n`
  md += `| \`npm run release:prepare\` | check + sync + sync Android version |\n\n`
  md += `### Flujo antes de publicar en Play Store\n\n`
  md += `1. Sube \`version\` y \`versionCode\` en \`package.json\`\n`
  md += `2. \`npm run changelog:scaffold\` (si la versión nueva no existe aún)\n`
  md += `3. Edita \`src/data/release-notes.json\` — \`userSummary\` (modal), \`highlights\`, secciones y \`published: true\`\n`
  md += `4. \`npm run release:prepare\`\n`
  md += `5. Copia \`playStoreNotes\` (ES/EN) de [CHANGELOG.md](./CHANGELOG.md) a las notas de la versión en Play Console\n\n`
  md += `---\n\n`

  if (planned.length > 0) {
    md += `## [Unreleased] — Planificado\n\n`
    for (const release of planned) {
      md += `### v${release.version} (versionCode ${release.versionCode}) — ${release.title.es}\n\n`
      md += sectionEsEn('Previsto', release.highlights)
      md += sectionEsEn('Añadido', release.added)
    }
    md += `---\n\n`
  }

  for (const release of published) {
    md += renderRelease(release, catalog)
  }

  return md.trimEnd() + '\n'
}

function checkCatalog(catalog: ReleaseNotesCatalog, pkg: PackageJson): void {
  const current = catalog.releases.find((r) => r.version === pkg.version)
  if (!current) {
    console.error(
      `✗ No hay entrada en release-notes.json para la versión ${pkg.version}`,
    )
    console.error('  Ejecuta: npm run changelog:scaffold')
    process.exit(1)
  }
  if (!current.published) {
    console.error(
      `✗ La versión ${pkg.version} existe pero published=false — pon published:true antes de publicar`,
    )
    process.exit(1)
  }
  if (current.versionCode !== pkg.versionCode) {
    console.error(
      `✗ versionCode en release-notes (${current.versionCode}) ≠ package.json (${pkg.versionCode})`,
    )
    process.exit(1)
  }
  if (current.highlights.es.length === 0 || current.highlights.en.length === 0) {
    console.error(
      `✗ La versión ${pkg.version} necesita highlights en ES y EN (Play Store / changelog)`,
    )
    process.exit(1)
  }
  const hasUserSummary =
    (current.userSummary?.newLevels ?? 0) > 0 ||
    (current.userSummary?.newStages ?? 0) > 0
  if (current.showWhatsNew !== false && !hasUserSummary) {
    console.warn(
      `⚠ La versión ${pkg.version} no tiene userSummary — el modal in-app no se mostrará (ok para hotfixes)`,
    )
  }
  console.log(`✓ release-notes.json OK para v${pkg.version} (versionCode ${pkg.versionCode})`)
}

function scaffoldEntry(catalog: ReleaseNotesCatalog, pkg: PackageJson): void {
  const existing = catalog.releases.find((r) => r.version === pkg.version)
  if (existing) {
    console.log(`· Ya existe entrada para v${pkg.version} — nada que crear`)
    if (existing.versionCode !== pkg.versionCode) {
      existing.versionCode = pkg.versionCode
      saveCatalog(catalog)
      console.log(`  Actualizado versionCode → ${pkg.versionCode}`)
    }
    return
  }

  const entry: ReleaseNote = {
    version: pkg.version,
    versionCode: pkg.versionCode,
    date: new Date().toISOString().slice(0, 10),
    published: false,
    title: {
      es: 'Título de la versión',
      en: 'Version title',
    },
    highlights: {
      es: ['Primer cambio visible para el jugador'],
      en: ['First player-facing change'],
    },
    userSummary: {
      newLevels: 0,
      newStages: 0,
    },
    showWhatsNew: false,
    added: {
      es: [],
      en: [],
    },
  }

  catalog.releases.unshift(entry)
  saveCatalog(catalog)
  console.log(`✓ Plantilla creada para v${pkg.version} en src/data/release-notes.json`)
  console.log('  Edita userSummary, highlights, secciones y published:true antes de release:prepare')
}

const catalog = loadCatalog()
const pkg = loadPackage()

switch (mode) {
  case 'sync': {
    writeFileSync(changelogPath, generateChangelog(catalog), 'utf8')
    console.log(`✓ ${changelogPath} regenerado`)
    break
  }
  case 'check': {
    checkCatalog(catalog, pkg)
    break
  }
  case 'scaffold': {
    scaffoldEntry(catalog, pkg)
    writeFileSync(changelogPath, generateChangelog(loadCatalog()), 'utf8')
    console.log(`✓ ${changelogPath} regenerado`)
    break
  }
  default: {
    console.error(`Modo desconocido: ${mode}. Usa: sync | check | scaffold`)
    process.exit(1)
  }
}
