# Guía Play Store — Nuts & Bolts

Checklist paso a paso para publicar y obtener cuenta de developer habilitada.

**Documentación relacionada:** [README.md](./README.md) (índice) · [SCRIPTS.md](./SCRIPTS.md) · [CHANGELOG.md](./CHANGELOG.md) · [MIGRATION_PLAYBOOK.md](./MIGRATION_PLAYBOOK.md) · [PLAYSTORE_TESTER_FEEDBACK.md](./PLAYSTORE_TESTER_FEEDBACK.md) · [PLAYSTORE_PRODUCTION_ACCESS.md](./PLAYSTORE_PRODUCTION_ACCESS.md)

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

| Campo             | Valor                                               |
| ----------------- | --------------------------------------------------- |
| Título            | Nuts & Bolts - Sort Puzzle                          |
| Descripción corta | Ordena tuercas de colores en este puzzle relajante. |
| Categoría         | Puzzle                                              |

### Assets requeridos

| Asset                | Especificación                   |
| -------------------- | -------------------------------- |
| Ícono de app         | 512×512 PNG, 32-bit              |
| Feature graphic      | 1024×500 JPG o PNG               |
| Screenshots teléfono | Mínimo 2, máximo 8 (16:9 o 9:16) |
| Video (opcional)     | YouTube URL                      |

**Tip:** Haz screenshots desde el emulador Android o Chrome DevTools en modo móvil.

### Política de privacidad

URL pública: **https://games.marianorluna.com/nuts-and-bolts/privacy.html**

Ver [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) para el repositorio de despliegue, flujo de actualización y qué declarar en Play Console (incl. **Seguridad de los datos** en v1.2.0+).

## 7. Clasificación de contenido

1. **Política → Clasificación de contenido**
2. Completa el cuestionario IARC
3. Para este juego: sin violencia, sin compras, sin datos → **Para todos**

## 8. Subir versión

### Fuente única de versión

Edita **solo** `package.json`:

```json
{
  "version": "1.2.1",
  "versionCode": 4
}
```

| Campo         | Uso                                                                    |
| ------------- | ---------------------------------------------------------------------- |
| `version`     | Semver visible en la app (splash, créditos) y `versionName` de Android |
| `versionCode` | Entero que **debe incrementarse** en cada upload a Play Store          |

La app lee `version` vía `src/config/version.ts`. Android se sincroniza automáticamente al ejecutar `npm run cap:sync` (o manualmente con `npm run sync:version`).

> **v1.2.1 (versionCode 4):** publicación única en Play Store. Consolida cuenta/sync (v1.2.0, versionCode 3 — no subido) y retos con medallas. El salto 2 → 4 en `versionCode` es correcto.

### Pasos para publicar v1.2.1

1. Confirma `version` y `versionCode` en `package.json` (`1.2.1` / `4`)
2. `npm run release:prepare` → valida changelog, regenera `CHANGELOG.md` y sincroniza Android
3. `npm run cap:sync` → genera build web y actualiza `android/app/build.gradle`
4. Genera el AAB (`./gradlew bundleRelease` en `android/`)
5. **Producción → Crear nueva versión** → sube el AAB
6. **Notas de la versión:** copia `playStoreNotes` de [CHANGELOG.md](./CHANGELOG.md) (sección «Notas Play Console») o de `src/data/release-notes.json` → campo `playStoreNotes.es` / `.en`

### Notas listas para Play Console — v1.2.1

**Español** (pegar en Play Console):

```
<es-ES>
• Cuenta opcional con Google o correo — guarda tu progreso en la nube
• Juega sin conexión; sincronización automática al volver a tener red
• Retos en niveles 20, 40, 60, 80 y 100 con reglas de examen
• Medallas coleccionables y medallero en inicio y campaña
• 3 intentos por reto; recuperas 1 cada 8 horas
• Con 1–2 estrellas avanzas; con 3 superas el reto y ganas la medalla
• Sin deshacer en retos hasta superarlos con 3 estrellas
</es-ES>
```

**English** (si añades idioma en la ficha):

```
</en-US>
• Optional account with Google or email — save your progress to the cloud
• Play offline; automatic sync when you're back online
• Challenges on levels 20, 40, 60, 80 and 100 with exam-style rules
• Collectible medals and medal gallery on home and campaign screens
• 3 attempts per challenge; regain 1 every 8 hours
• 1–2 stars unlock the next level; 3 stars beat the challenge and earn the medal
• No undo on challenges until you beat them with 3 stars
</en-US>
```

### Changelog y modal «Novedades»

| Recurso                        | Descripción                                                              |
| ------------------------------ | ------------------------------------------------------------------------ |
| `src/data/release-notes.json`  | Fuente de verdad — `highlights` (modal), `playStoreNotes` (Play Console) |
| [CHANGELOG.md](./CHANGELOG.md) | Historial de releases (generado automáticamente)                         |
| `npm run release:prepare`      | Ejecutar antes de cada release en Play Store                             |

Flujo: sube versión en `package.json` → edita `release-notes.json` → `npm run release:prepare` → build AAB.

Al abrir la app tras actualizar, el jugador ve un modal con los `highlights` de su versión (una vez por versión).

## 9. Aviso de actualización in-app

El juego comprueba automáticamente si hay una versión nueva en Play Store al abrir la app (solo en Android/iOS nativo, no en navegador).

| Acción del jugador   | Comportamiento                                                       |
| -------------------- | -------------------------------------------------------------------- |
| **Actualizar ahora** | In-app update flexible (descarga en segundo plano) o abre Play Store |
| **Más tarde**        | Cierra el modal; no vuelve a mostrarse para esa misma versión        |
| **Reiniciar app**    | Aparece cuando la descarga flexible terminó                          |

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
