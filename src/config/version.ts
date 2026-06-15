import packageJson from '../../package.json'

interface AppPackageJson {
  version: string
  versionCode: number
}

const pkg = packageJson as AppPackageJson

/** Versión semver — editar solo en package.json */
export const APP_VERSION = pkg.version

/** Código entero para Play Store — editar solo en package.json */
export const ANDROID_VERSION_CODE = pkg.versionCode
