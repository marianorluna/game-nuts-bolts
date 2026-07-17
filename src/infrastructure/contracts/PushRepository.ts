export type PushPlatform = 'android' | 'ios' | 'web'

export interface NotificationPreferences {
  pushEnabled: boolean
  rankOvertaken: boolean
}

export interface RegisterPushDeviceInput {
  userId: string
  fcmToken: string
  platform: PushPlatform
}

export type PushNotificationActionHandler = (data: Record<string, string>) => void

export interface PushRepository {
  /** Solicita permiso del sistema (Android 13+). */
  requestPermission(): Promise<boolean>
  /** Registra listeners nativos y persiste el token FCM. */
  registerDevice(input: RegisterPushDeviceInput): Promise<void>
  /** Elimina el token del servidor y limpia listeners locales. */
  unregisterDevice(userId: string, fcmToken?: string): Promise<void>
  getPreferences(userId: string): Promise<NotificationPreferences>
  setPreferences(
    userId: string,
    prefs: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences>
  /** Deep link al tocar una notificación (ej. abrir ranking). */
  onNotificationAction(handler: PushNotificationActionHandler): () => void
  /** True si el runtime soporta push nativo (Capacitor Android/iOS). */
  isNativeSupported(): boolean
}
