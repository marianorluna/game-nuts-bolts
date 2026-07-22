# Migración Android API 35 → 36 (Capacitor 7 → 8)

> **Versión:** v1.5.3 (versionCode 10) — 22 jul 2026
> **Motivo:** Requisito de Google Play — a partir del 31 ago 2026 todas las actualizaciones deben apuntar a Android 16 (API 36) o superior.

**Documentación relacionada:** [PLAYSTORE.md](./PLAYSTORE.md) · [CHANGELOG.md](./CHANGELOG.md)

---

## Contexto

Google Play exige que las apps destinen su `targetSdkVersion` a Android 16 (API 36) para poder subir actualizaciones a partir del 31 ago 2026. En Capacitor, el `targetSdk` está ligado a la major version del framework:

| Capacitor | targetSdk |
| --------- | --------- |
| 7.x       | 35        |
| **8.x**   | **36**    |

La migración fue manual (el comando `npx cap migrate` requiere sesión interactiva no compatible con el entorno de CI/automatización del proyecto).

---

## Cambios aplicados

### `package.json`

| Campo | Antes | Después |
| ----- | ----- | ------- |
| `version` | `1.5.2` | `1.5.3` |
| `versionCode` | `9` | `10` |
| `@capacitor/core` | `^7.2.0` | `^8.4.2` |
| `@capacitor/android` | `^7.2.0` | `^8.4.2` |
| `@capacitor/app` | `^7.1.2` | `^8.1.1` |
| `@capacitor/browser` | `^7.0.5` | `^8.0.4` |
| `@capacitor/push-notifications` | `^7.0.7` | `^8.1.2` |
| `@capacitor/splash-screen` | `^7.0.5` | `^8.0.2` |
| `@capawesome/capacitor-app-update` | `^7.2.0` | `^8.0.3` |
| `@capacitor/cli` (dev) | `^7.2.0` | `^8.4.2` |

### `android/variables.gradle`

| Variable | Antes | Después |
| -------- | ----- | ------- |
| `minSdkVersion` | `23` | `24` — abandona Android 6 |
| `compileSdkVersion` | `35` | `36` |
| `targetSdkVersion` | `35` | `36` |
| `androidxActivityVersion` | `1.9.2` | `1.11.0` |
| `androidxAppCompatVersion` | `1.7.0` | `1.7.1` |
| `androidxCoordinatorLayoutVersion` | `1.2.0` | `1.3.0` |
| `androidxCoreVersion` | `1.15.0` | `1.17.0` |
| `androidxFragmentVersion` | `1.8.4` | `1.8.9` |
| `coreSplashScreenVersion` | `1.0.1` | `1.2.0` |
| `androidxWebkitVersion` | `1.12.1` | `1.14.0` |
| `androidxJunitVersion` | `1.2.1` | `1.3.0` |
| `androidxEspressoCoreVersion` | `3.6.1` | `3.7.0` |
| `cordovaAndroidVersion` | `10.1.1` | `14.0.1` |

### `android/build.gradle`

| Dependencia | Antes | Después |
| ----------- | ----- | ------- |
| Android Gradle Plugin | `8.7.2` | `8.13.0` |
| google-services | `4.4.2` | `4.4.4` |

### `android/gradle/wrapper/gradle-wrapper.properties`

| Campo | Antes | Después |
| ----- | ----- | ------- |
| `distributionUrl` | `gradle-8.11.1-all.zip` | `gradle-8.14.3-all.zip` |

### `android/app/build.gradle`

Actualización de sintaxis Gradle — propiedades deprecadas ahora requieren `=`:

```diff
- namespace "com.nutsandbolts.puzzle"
+ namespace = "com.nutsandbolts.puzzle"
- compileSdk rootProject.ext.compileSdkVersion
+ compileSdk = rootProject.ext.compileSdkVersion
- applicationId "com.nutsandbolts.puzzle"
+ applicationId = "com.nutsandbolts.puzzle"
- testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
+ testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
- ignoreAssetsPattern '!.svn:...'
+ ignoreAssetsPattern = '!.svn:...'
```

### `android/app/src/main/AndroidManifest.xml`

```diff
- android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation"
+ android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
```

`density` evita que el WebView se recargue al redimensionar la app en Android 16.

### `.nvmrc` (nuevo)

Fija Node 22 como versión mínima del proyecto (requerida por Capacitor 8).

---

## Notas de compatibilidad

- **minSdk 24 (Android 7):** Los dispositivos con Android 6 (API 23) dejan de recibir la app. Según Play Console, el impacto es < 0.1 % del mercado activo.
- **Edge-to-edge:** Capacitor 8 elimina `android.adjustMarginsForEdgeToEdge` (no estaba en uso en este proyecto). El manejo es ahora vía variables CSS `env()` — sin impacto visual detectado.
- **@capacitor/push-notifications v8:** `firebaseMessagingVersion` actualizado internamente por el plugin; no requiere cambios en `variables.gradle`.

---

## Verificación local

```sh
npm run cap:sync            # build web + sync Android
cd android

# IMPORTANTE: el JDK del sistema (Java 25) es incompatible con AGP 8.x.
# Usar el JDK 21 bundleado en Android Studio para builds por terminal:
JAVA_HOME="/c/Program Files/Android/Android Studio/jbr" ./gradlew assembleDebug

# Si pasa → generar AAB desde Android Studio:
# Build → Generate Signed Bundle / APK → Android App Bundle → release
# (Android Studio usa automáticamente su propio JDK 21)
```

---

## Referencias

- [Requisitos de nivel de API de destino — Google Play](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Actualización a Capacitor 8 — docs oficiales](https://capacitorjs.com/docs/updating/8-0)
- [Tabla targetSdk por versión de Capacitor](https://capacitorjs.com/docs/android/setting-target-sdk)
