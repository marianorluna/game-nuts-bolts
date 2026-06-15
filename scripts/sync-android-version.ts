import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface PackageJson {
  version: string
  versionCode: number
}

const root = resolve(import.meta.dirname, '..')
const pkg: PackageJson = JSON.parse(
  readFileSync(resolve(root, 'package.json'), 'utf8'),
)

const gradlePath = resolve(root, 'android/app/build.gradle')
let gradle = readFileSync(gradlePath, 'utf8')

gradle = gradle.replace(
  /versionCode\s+\d+/,
  `versionCode ${pkg.versionCode}`,
)
gradle = gradle.replace(
  /versionName\s+"[^"]+"/,
  `versionName "${pkg.version}"`,
)

writeFileSync(gradlePath, gradle, 'utf8')

console.log(
  `✓ Android sincronizado: versionCode ${pkg.versionCode}, versionName "${pkg.version}"`,
)
