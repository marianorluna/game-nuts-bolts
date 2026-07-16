# Playbook de migración — jugadores beta

> **Estado:** Release **v1.2.1** en producción. La migración real es **offline-first** + merge al vincular cuenta (Prompts 3–4). Los planes A/B/C de soporte abajo siguen como referencia opcional.

**Documentación relacionada:** [SOCIAL_FEATURES_ROADMAP.md](./SOCIAL_FEATURES_ROADMAP.md) · [PLAYSTORE.md](./PLAYSTORE.md)

## Qué ya aplica (v1.2.1)

- Jugadores sin cuenta: el progreso en `localStorage` no se borra al actualizar.
- Al vincular Google o correo: merge dominio (`max` estrellas / `unlockedLevel`, etc.).
- Cuenta opcional: el juego funciona igual offline sin login.
- Retos/medallas: migración automática de niveles 20/40/60/80/100 ya completados (ver `release-notes` v1.2.1).

## Referencia — planes de soporte (opcional)

- **Plan A:** vinculación automática al iniciar sesión con Google
- **Plan B:** export manual de progreso desde la app (soporte) — _no implementado_
- **Plan C:** merge si tienen progreso en dos dispositivos — _cubierto por merge al login_

## Mensaje sugerido a testers / beta (si hace falta)

> Actualizamos a v1.2.1: puedes seguir jugando sin cuenta. Si quieres respaldo en la nube, vincula Google o correo en Ajustes → Cuenta. Tu progreso local no se pierde.
