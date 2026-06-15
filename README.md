# Nuts & Bolts Sort Puzzle

Juego mobile de puzzle: ordena tuercas por color moviéndolas entre bulones.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS 4
- Framer Motion (animaciones)
- Zustand (estado + progreso en localStorage)
- Capacitor 7 (Android)

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador o en el emulador Android.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run validate:levels` | Valida estructura y solvabilidad de los 30 niveles |
| `npm run cap:sync` | Build + sincroniza con Capacitor |
| `npm run cap:android` | Abre el proyecto en Android Studio |

## Publicar en Play Store

### Requisitos previos

1. **Cuenta Google Play Console** — $25 USD (pago único)
2. **Android Studio** — [developer.android.com/studio](https://developer.android.com/studio)
3. **JDK 17+** — incluido con Android Studio
4. **Node.js 18+**

### Paso 1: Generar keystore (solo una vez)

```bash
keytool -genkey -v -keystore nuts-bolts-release.keystore -alias nuts-bolts -keyalg RSA -keysize 2048 -validity 10000
```

Guarda el keystore y las contraseñas en un lugar seguro.

### Paso 2: Configurar firma en Android

Crea `android/keystore.properties`:

```properties
storeFile=../nuts-bolts-release.keystore
storePassword=TU_PASSWORD
keyAlias=nuts-bolts
keyPassword=TU_PASSWORD
```

Edita `android/app/build.gradle` para usar la firma en release (ver documentación de Capacitor/Android).

### Paso 3: Build y sync

```bash
npm run cap:sync
npx cap add android   # solo la primera vez
```

### Paso 4: Generar AAB en Android Studio

1. `npm run cap:android`
2. **Build → Generate Signed Bundle / APK**
3. Selecciona **Android App Bundle (AAB)**
4. Usa tu keystore
5. El AAB queda en `android/app/release/`

### Paso 5: Subir a Play Console

1. [play.google.com/console](https://play.google.com/console)
2. **Crear app** → Nombre: "Nuts & Bolts"
3. **Producción → Crear nueva versión** → subir el AAB
4. Completar la ficha:

| Asset | Tamaño |
|-------|--------|
| Ícono | 512×512 PNG |
| Feature graphic | 1024×500 PNG |
| Screenshots | Mínimo 2, recomendado 4-8 (teléfono) |

### Textos sugeridos para la ficha

**Título:** Nuts & Bolts - Sort Puzzle

**Descripción corta:** Ordena tuercas de colores en este puzzle relajante.

**Descripción larga:**
```
¡Desenrosca y ordena tuercas de colores en este puzzle adictivo!

🎮 30 niveles de dificultad creciente
⭐ Gana hasta 3 estrellas por nivel
🔩 Mecánica simple: toca para seleccionar, toca para mover
↩️ Deshacer movimientos cuando te equivoques

¿Puedes ordenar todas las tuercas?
```

**Categoría:** Puzzle  
**Clasificación de contenido:** Para todos  
**Política de privacidad:** No recopila datos (puedes usar una URL genérica o crear una página simple)

### Checklist Play Store

- [ ] Cuenta developer creada ($25)
- [ ] AAB firmado generado
- [ ] Ícono 512×512
- [ ] 2+ screenshots del juego
- [ ] Feature graphic 1024×500
- [ ] Descripción y clasificación de contenido
- [ ] Política de privacidad (URL)
- [ ] Primera versión en revisión (1-3 días)

## Estructura del proyecto

```
src/
  domain/          # Lógica pura (motor, niveles, validador)
  store/           # Zustand
  components/      # UI React
  hooks/           # useGameLogic
```

## Niveles

- **1-10:** Fácil (2→5 colores, **2 bulones vacíos**)
- **11-20:** Medio (4→6 colores, **2 bulones vacíos**)
- **21-30:** Difícil (6-7 colores, 1 bulón vacío en los últimos)

Generación híbrida:

- **Niveles 1-4 (tutorial):** scramble inverso desde estado resuelto, con 2 bulones vacíos.
- **Niveles 5-30:** mezcla Fisher-Yates (reparte colores entre bulones) + verificación BFS.

Criterios de calidad por nivel: movimientos mínimos, colores repartidos en varios bulones,
y ningún bulón ya resuelto al inicio (en niveles avanzados).

```bash
npm run bake:levels      # regenerar niveles
npm run validate:levels  # verificar estructura, unicidad y solvabilidad
```
