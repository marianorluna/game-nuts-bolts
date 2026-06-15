# Guía Play Store — Nuts & Bolts

Checklist paso a paso para publicar y obtener cuenta de developer habilitada.

## 1. Cuenta Google Play Console

1. Ve a [play.google.com/console/signup](https://play.google.com/console/signup)
2. Paga la tarifa única de **$25 USD**
3. Completa el perfil de desarrollador (nombre, email de contacto)
4. Verifica tu identidad si Google lo solicita

## 2. Generar keystore de firma

```bash
keytool -genkey -v \
  -keystore nuts-bolts-release.keystore \
  -alias nuts-bolts \
  -keyalg RSA -keysize 2048 -validity 10000
```

Guarda:
- `nuts-bolts-release.keystore` (fuera del repo)
- Contraseña del keystore
- Contraseña del alias

## 3. Configurar firma

```bash
cp android/keystore.properties.example android/keystore.properties
# Edita android/keystore.properties con tus contraseñas
```

## 4. Build del AAB

```bash
npm run cap:sync
npm run cap:android
```

En Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. **Android App Bundle**
3. Selecciona tu keystore
4. Build variant: **release**
5. Output: `android/app/release/app-release.aab`

Alternativa por terminal (con keystore configurado):

```bash
cd android
./gradlew bundleRelease
```

## 5. Crear la app en Play Console

1. **Todas las apps → Crear app**
2. Nombre: `Nuts & Bolts`
3. Idioma predeterminado: Español
4. Tipo: App / Juego
5. Gratis

## 6. Ficha de Play Store

### Textos

| Campo | Valor |
|-------|-------|
| Título | Nuts & Bolts - Sort Puzzle |
| Descripción corta | Ordena tuercas de colores en este puzzle relajante. |
| Categoría | Puzzle |

### Assets requeridos

| Asset | Especificación |
|-------|----------------|
| Ícono de app | 512×512 PNG, 32-bit |
| Feature graphic | 1024×500 JPG o PNG |
| Screenshots teléfono | Mínimo 2, máximo 8 (16:9 o 9:16) |
| Video (opcional) | YouTube URL |

**Tip:** Haz screenshots desde el emulador Android o Chrome DevTools en modo móvil.

### Política de privacidad

La app no recopila datos personales. Opciones:
- Crear una página simple en GitHub Pages
- Usar un generador de política de privacidad gratuito
- URL ejemplo: `https://tudominio.com/privacy`

## 7. Clasificación de contenido

1. **Política → Clasificación de contenido**
2. Completa el cuestionario IARC
3. Para este juego: sin violencia, sin compras, sin datos → **Para todos**

## 8. Subir versión

### Fuente única de versión

Edita **solo** `package.json`:

```json
{
  "version": "1.1.0",
  "versionCode": 2
}
```

| Campo | Uso |
|-------|-----|
| `version` | Semver visible en la app (splash, créditos) y `versionName` de Android |
| `versionCode` | Entero que **debe incrementarse** en cada upload a Play Store |

La app lee `version` vía `src/config/version.ts`. Android se sincroniza automáticamente al ejecutar `npm run cap:sync` (o manualmente con `npm run sync:version`).

### Pasos para publicar v1.1.0

1. Sube `version` y `versionCode` en `package.json`
2. `npm run cap:sync` → genera build web y actualiza `android/app/build.gradle`
3. Genera el AAB (`./gradlew bundleRelease` en `android/`)
4. **Producción → Crear nueva versión** → sube el AAB
5. Notas de la versión: describe cambios para el jugador (ej. "10 niveles nuevos")

## 9. Aviso de actualización in-app

El juego comprueba automáticamente si hay una versión nueva en Play Store al abrir la app (solo en Android/iOS nativo, no en navegador).

| Acción del jugador | Comportamiento |
|--------------------|----------------|
| **Actualizar ahora** | In-app update flexible (descarga en segundo plano) o abre Play Store |
| **Más tarde** | Cierra el modal; no vuelve a mostrarse para esa misma versión |
| **Reiniciar app** | Aparece cuando la descarga flexible terminó |

### Probar antes de producción

Google exige [Internal app sharing](https://developer.android.com/guide/playcore/in-app-updates/test) para probar in-app updates:

1. Sube un AAB con `versionCode` 1 a internal app sharing
2. Instala en el dispositivo
3. Sube otro AAB con `versionCode` 2
4. Abre la app v1 → debería aparecer el modal

En desarrollo local (`npm run dev`) el aviso **no aparece** porque no es plataforma nativa.

Plugin: [`@capawesome/capacitor-app-update`](https://capawesome.io/plugins/app-update/)

## 10. Revisión y publicación

- Primera revisión: **1-3 días hábiles**
- Tras aprobación, la cuenta queda habilitada como developer
- Puedes publicar actualizaciones sin volver a pagar

## 11. Checklist final

- [ ] Cuenta Play Console creada ($25)
- [ ] Keystore generado y guardado de forma segura
- [ ] AAB release firmado
- [ ] Ícono 512×512
- [ ] Feature graphic 1024×500
- [ ] 2+ screenshots
- [ ] Política de privacidad (URL)
- [ ] Clasificación de contenido completada
- [ ] Ficha de la tienda completada
- [ ] Versión subida a Producción o Prueba interna

## Prueba interna (recomendado antes de producción)

1. **Pruebas → Prueba interna → Crear nueva versión**
2. Sube el mismo AAB
3. Añade tu email como tester
4. Instala desde el enlace de prueba
5. Verifica que el juego funciona en dispositivo real
