import { motion } from 'framer-motion'
import type { Bolt } from '../domain/types'
import { NUT_H, NutPiece } from './NutPiece'

interface BoltStackProps {
  bolt: Bolt
  capacity: number
  index: number
  isSelected: boolean
  isShaking: boolean
  onSelect: (index: number) => void
}

const SHAFT_TOP_OVERHANG = 8 // vástago visible por encima del stack
const SHAFT_W = 18 // vástago más grueso

// Gradiente metálico plateado del vástago
const SHAFT_GRADIENT =
  'linear-gradient(to right, #3e5060 0%, #7a8e9e 18%, #d4e4ee 46%, #b0c4d0 68%, #5a6e7e 88%, #3e5060 100%)'

// Patrón de rosca (estrías horizontales)
const SHAFT_THREAD =
  'repeating-linear-gradient(0deg, transparent 0px, transparent 3.5px, rgba(0,0,0,0.16) 3.5px, rgba(0,0,0,0.16) 5px)'

const shaftBg = `${SHAFT_THREAD}, ${SHAFT_GRADIENT}`

export function BoltStack({
  bolt,
  capacity,
  index,
  isSelected,
  isShaking,
  onSelect,
}: BoltStackProps) {
  const emptySlots = capacity - bolt.length
  const nutsStackH = capacity * NUT_H
  const nutsAreaH = nutsStackH + SHAFT_TOP_OVERHANG

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(index)}
      animate={{
        x: isShaking ? [-8, 8, -5, 5, -2, 2, 0] : 0,
        scale: isSelected ? 1.06 : 1,
      }}
      transition={{
        x: { duration: 0.38, ease: 'easeOut' },
        scale: { type: 'spring', stiffness: 280, damping: 22 },
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 70,
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        // Eleva el bulón seleccionado para que la tuerca levantada
        // nunca quede detrás de otros bulones ni de elementos adyacentes
        position: 'relative',
        zIndex: isSelected ? 100 : 1,
      }}
      aria-label={`Bulón ${index + 1}`}
    >
      {/* ── Zona de tuercas con vástago detrás ── */}
      <div style={{ position: 'relative', width: 68, height: nutsAreaH }}>

        {/* Vástago roscado (z=0, detrás de las tuercas).
            Sobrepasa 6px hacia abajo para empalmar con la arandela. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: -6,
            left: '50%',
            transform: 'translateX(-50%)',
            width: SHAFT_W,
            backgroundImage: shaftBg,
            zIndex: 0,
            borderRadius: '3px 3px 0 0',
          }}
        />

        {/* Tuercas apiladas (z=1, encima del vástago) */}
        <div
          style={{
            position: 'absolute',
            top: SHAFT_TOP_OVERHANG,
            left: 0,
            right: 0,
            height: nutsStackH,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
            zIndex: 1,
          }}
        >
          {/* Slots vacíos: el vástago se ve a través de ellos */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <div key={`empty-${i}`} style={{ height: NUT_H, width: 64, flexShrink: 0 }} />
          ))}

          {/* Tuercas: top nut primero (arriba visual), bottom nut al final (abajo visual) */}
          {[...bolt].reverse().map((color, revIndex) => {
            const nutIndex = bolt.length - 1 - revIndex
            return (
              <NutPiece
                key={`${index}-${nutIndex}-${color}`}
                color={color}
                isSelected={isSelected}
                isTop={nutIndex === bolt.length - 1}
              />
            )
          })}
        </div>
      </div>

      {/* ── Arandela ancha (washer) — directamente bajo las tuercas ── */}
      <div
        style={{
          width: 54,
          height: 12,
          borderRadius: '4px',
          background:
            'linear-gradient(180deg, #c8d6e2 0%, #8898a8 52%, #546070 100%)',
          boxShadow: '0 3px 7px rgba(0,0,0,0.5)',
          position: 'relative',
          zIndex: 3,
        }}
      />

      {/* ── Base / pie del bulón ── */}
      <div
        style={{
          width: 44,
          height: 22,
          borderRadius: '3px 3px 12px 12px',
          background:
            'linear-gradient(180deg, #7a8c9e 0%, #506070 52%, #384858 100%)',
          boxShadow:
            '0 6px 12px rgba(0,0,0,0.55), inset 0 1px 2px rgba(255,255,255,0.12)',
          position: 'relative',
          zIndex: 3,
        }}
      />
    </motion.button>
  )
}
