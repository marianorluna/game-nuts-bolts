import { motion } from 'framer-motion'
import type { NutColor } from '../domain/types'
import { NUT_ICONS, NUT_STYLES } from '../domain/types'

interface NutPieceProps {
  color: NutColor
  /** Tuerca incluida en el bloque que se moverá (multiNut o cima en clásico). */
  isInMovableBlock?: boolean
  /** Índice en el stack; las tuercas superiores quedan por delante al inclinarse. */
  stackLayer?: number
}

// Hexágono horizontal (ancho > alto): simula tuerca vista levemente de arriba
const HEX = 'polygon(18% 0%, 82% 0%, 100% 50%, 82% 100%, 18% 100%, 0% 50%)'

export const NUT_H = 42

/** Espacio reservado encima del stack para la tuerca superior elevada e inclinada. */
export const NUT_LIFT_Y = 22
export const NUT_LIFT_SCALE = 1.12
export const NUT_LIFT_ROTATE = 22
export const NUT_LIFT_CLEARANCE = 52

export function NutPiece({
  color,
  isInMovableBlock = false,
  stackLayer = 0,
}: NutPieceProps) {
  const s = NUT_STYLES[color]

  return (
    <motion.div
      // Al montar (nut llega a un nuevo bulón) simula enroscado: rota de +25° a 0°
      initial={{ rotate: 25, scale: 0.82, opacity: 0.6 }}
      animate={{
        y: isInMovableBlock ? -NUT_LIFT_Y : 0,
        rotate: isInMovableBlock ? -NUT_LIFT_ROTATE : 0,
        scale: isInMovableBlock ? NUT_LIFT_SCALE : 1,
        opacity: 1,
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      style={{
        position: 'relative',
        width: 64,
        height: NUT_H,
        zIndex: isInMovableBlock ? stackLayer + 1 : undefined,
        filter: isInMovableBlock
          ? `brightness(1.2) drop-shadow(0 0 12px ${s.glowColor}) drop-shadow(0 0 4px rgba(255,255,255,0.5))`
          : 'drop-shadow(0 3px 5px rgba(0,0,0,0.55))',
        transition: 'filter 0.18s ease',
        flexShrink: 0,
      }}
    >
      {/* ── Capa 3D: cara inferior / borde (más oscura, desplazada hacia abajo) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: HEX,
          background: s.edgeGradient,
          transform: 'translateY(4px)',
          opacity: 0.88,
        }}
      />

      {/* ── Cara principal de la tuerca ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: HEX,
          background: s.gradient,
        }}
      />

      {/* ── Bisel lateral: bordes oscuros para efecto facetado ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: HEX,
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 35%, rgba(0,0,0,0.25) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Reflejo especular en la parte superior ── */}
      <div
        style={{
          position: 'absolute',
          left: '24%',
          right: '24%',
          top: '9%',
          height: '28%',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.0) 100%)',
          borderRadius: '0 0 70% 70%',
          pointerEvents: 'none',
        }}
      />

      {/* ── Anillo metálico alrededor del agujero ── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.35) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.7) 100%)',
          boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2)',
        }}
      />

      {/* ── Agujero central (simula el paso del bulón) ── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 38% 32%, #2a1050 0%, #0f0520 75%)',
          boxShadow:
            'inset 0 2px 7px rgba(0,0,0,0.95), inset 0 -1px 2px rgba(80,40,160,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 12, lineHeight: 1, userSelect: 'none' }}>
          {NUT_ICONS[color]}
        </span>
      </div>
    </motion.div>
  )
}
