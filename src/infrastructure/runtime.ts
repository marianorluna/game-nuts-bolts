import type { Infrastructure } from './index'

let registeredInfrastructure: Infrastructure | null = null

export function registerInfrastructure(infra: Infrastructure | null): void {
  registeredInfrastructure = infra
}

export function getRegisteredInfrastructure(): Infrastructure | null {
  return registeredInfrastructure
}
