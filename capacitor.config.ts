import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.nutsandbolts.puzzle',
  appName: 'Nuts & Bolts',
  webDir: 'dist',
  android: {
    backgroundColor: '#2d1b4e',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#2d1b4e',
      androidScaleType: 'CENTER_CROP',
    },
  },
}

export default config
