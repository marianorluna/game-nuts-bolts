import { useEffect, useState } from 'react'
import { NUT_H, NUT_LIFT_CLEARANCE } from '../components/NutPiece'

const BOLT_WIDTH = 70
const BOLT_GAP_MOBILE = 8
const BOLT_GAP_DESKTOP = 12
const ROW_GAP = 40
const BOARD_HORIZONTAL_PADDING = 16
const BOLT_EXTRA_HEIGHT = 42 // vástago + arandela + base
const BOLT_SELECTED_SCALE = 1.06
const BOARD_PADDING = 48
const BOARD_INSET = 12 // margen de respiración dentro del área del tablero
const MAX_SCALE = 1.85
const MIN_SCALE = 0.55

/** Estimación conservadora cuando aún no hay medición del contenedor. */
function estimateChromeVertical(viewportWidth: number): number {
  if (viewportWidth >= 768) return 320
  if (viewportWidth >= 640) return 280
  return 250
}

export interface BoardBounds {
  width: number
  height: number
}

function getContainerMaxWidth(viewportWidth: number): number {
  return Math.min(viewportWidth - BOARD_PADDING, 1400)
}

function getBoltGap(viewportWidth: number): number {
  return viewportWidth >= 640 ? BOLT_GAP_DESKTOP : BOLT_GAP_MOBILE
}

function getAvailableBoardArea(
  viewportWidth: number,
  viewportHeight: number,
  boardBounds?: BoardBounds | null,
): { width: number; height: number } {
  if (boardBounds && boardBounds.width > 0 && boardBounds.height > 0) {
    return {
      width: Math.max(0, boardBounds.width - BOARD_INSET * 2),
      height: Math.max(0, boardBounds.height - BOARD_INSET * 2),
    }
  }

  return {
    width: getContainerMaxWidth(viewportWidth) - BOARD_PADDING,
    height: Math.max(
      0,
      viewportHeight - estimateChromeVertical(viewportWidth),
    ),
  }
}

function getBoltHeight(capacity: number): number {
  return (
    NUT_LIFT_CLEARANCE +
    capacity * NUT_H +
    BOLT_EXTRA_HEIGHT +
    // Margen por el scale del bulón seleccionado (origen centrado)
    Math.ceil((capacity * NUT_H + BOLT_EXTRA_HEIGHT) * (BOLT_SELECTED_SCALE - 1) * 0.5)
  )
}

export function getBoardDimensions(
  boltsPerRow: number,
  rowCount: number,
  capacity: number,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 360,
): { width: number; height: number } {
  const gap = getBoltGap(viewportWidth)
  const width =
    boltsPerRow * BOLT_WIDTH +
    Math.max(0, boltsPerRow - 1) * gap +
    BOARD_HORIZONTAL_PADDING
  const boltHeight = getBoltHeight(capacity)
  const height = rowCount * boltHeight + Math.max(0, rowCount - 1) * ROW_GAP
  return { width, height }
}

function computeScale(
  boltsPerRow: number,
  rowCount: number,
  capacity: number,
  viewportWidth: number,
  availableWidth: number,
  availableHeight: number,
): number {
  const gap = getBoltGap(viewportWidth)
  const naturalWidth =
    boltsPerRow * BOLT_WIDTH + Math.max(0, boltsPerRow - 1) * gap
  const naturalHeight =
    rowCount * getBoltHeight(capacity) + Math.max(0, rowCount - 1) * ROW_GAP

  const widthScale = naturalWidth > 0 ? availableWidth / naturalWidth : 1
  const heightScale = naturalHeight > 0 ? availableHeight / naturalHeight : 1

  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, widthScale, heightScale))
}

export function getBoardRowIndices(
  boltCount: number,
  singleRow: boolean,
): number[][] {
  if (boltCount <= 4 || singleRow) {
    return [Array.from({ length: boltCount }, (_, i) => i)]
  }
  const mid = Math.ceil(boltCount / 2)
  return [
    Array.from({ length: mid }, (_, i) => i),
    Array.from({ length: boltCount - mid }, (_, i) => i + mid),
  ]
}

export interface BoardLayout {
  rows: number[][]
  scale: number
  width: number
  height: number
}

export function getBoardLayout(
  boltCount: number,
  capacity: number,
  viewportWidth: number,
  viewportHeight: number,
  boardBounds?: BoardBounds | null,
): BoardLayout {
  const { width: availableWidth, height: availableHeight } =
    getAvailableBoardArea(viewportWidth, viewportHeight, boardBounds)

  if (boltCount <= 4) {
    const scale = computeScale(
      boltCount,
      1,
      capacity,
      viewportWidth,
      availableWidth,
      availableHeight,
    )
    const { width, height } = getBoardDimensions(
      boltCount,
      1,
      capacity,
      viewportWidth,
    )
    return {
      rows: getBoardRowIndices(boltCount, true),
      scale,
      width,
      height,
    }
  }

  const twoRowBoltsPerRow = Math.ceil(boltCount / 2)
  const twoRowScale = computeScale(
    twoRowBoltsPerRow,
    2,
    capacity,
    viewportWidth,
    availableWidth,
    availableHeight,
  )
  const oneRowScale = computeScale(
    boltCount,
    1,
    capacity,
    viewportWidth,
    availableWidth,
    availableHeight,
  )

  // Dos filas en móviles altos; una fila si no cabe o rinde mejor en ancho
  const useSingleRow =
    twoRowScale <= MIN_SCALE || oneRowScale > twoRowScale * 1.02

  const rowCount = useSingleRow ? 1 : 2
  const boltsPerRow = useSingleRow ? boltCount : twoRowBoltsPerRow
  const scale = useSingleRow ? oneRowScale : twoRowScale
  const { width, height } = getBoardDimensions(
    boltsPerRow,
    rowCount,
    capacity,
    viewportWidth,
  )

  return {
    rows: getBoardRowIndices(boltCount, useSingleRow),
    scale,
    width,
    height,
  }
}

export function useBoardLayout(
  boltCount: number,
  capacity: number,
  boardBounds?: BoardBounds | null,
): BoardLayout {
  const [layout, setLayout] = useState<BoardLayout>(() =>
    typeof window !== 'undefined'
      ? getBoardLayout(
          boltCount,
          capacity,
          window.innerWidth,
          window.innerHeight,
          boardBounds,
        )
      : getBoardLayout(boltCount, capacity, 360, 640, boardBounds),
  )

  useEffect(() => {
    const update = () =>
      setLayout(
        getBoardLayout(
          boltCount,
          capacity,
          window.innerWidth,
          window.innerHeight,
          boardBounds,
        ),
      )
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [boltCount, capacity, boardBounds?.width, boardBounds?.height])

  return layout
}
