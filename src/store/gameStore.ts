import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  calculateStars,
  canMove,
  createSessionFromLevel,
  isSolved,
  moveNuts,
  undoMove,
} from '../domain/gameEngine'
import { DEV_UNLOCK_ALL_LEVELS } from '../config/dev'
import { getLevelById } from '../domain/levels'
import type { GameSession, GameSettings, PlayerProgress } from '../domain/types'
import { MAX_UNDOS } from '../domain/types'
import { soundService } from '../services/soundService'

type Screen = 'home' | 'game'

interface GameStore {
  screen: Screen
  session: GameSession | null
  progress: PlayerProgress
  settings: GameSettings
  setScreen: (screen: Screen) => void
  startLevel: (levelId: number) => void
  selectBolt: (boltIndex: number) => void
  undo: () => void
  resetLevel: () => void
  clearShake: () => void
  toggleSound: () => void
  getLevelStars: (levelId: number) => number
  isLevelUnlocked: (levelId: number) => boolean
}

const defaultProgress: PlayerProgress = {
  unlockedLevel: 1,
  levels: {},
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      screen: 'home',
      session: null,
      progress: defaultProgress,
      settings: defaultSettings,

      setScreen: (screen) => set({ screen }),

      startLevel: (levelId) => {
        const level = getLevelById(levelId)
        if (!level) return
        set({
          screen: 'game',
          session: createSessionFromLevel(level),
        })
      },

      selectBolt: (boltIndex) => {
        const { session, progress } = get()
        if (!session || session.isWon) return

        const level = getLevelById(session.levelId)
        if (!level) return

        const { selectedBoltIndex, bolts, capacity } = session

        if (selectedBoltIndex === null) {
          if (bolts[boltIndex].length === 0) return
          soundService.play('select')
          set({
            session: { ...session, selectedBoltIndex: boltIndex },
          })
          return
        }

        if (selectedBoltIndex === boltIndex) {
          soundService.play('deselect')
          set({
            session: { ...session, selectedBoltIndex: null },
          })
          return
        }

        if (!canMove(bolts, selectedBoltIndex, boltIndex, capacity)) {
          soundService.play('error')
          set({
            session: { ...session, shakeBoltIndex: boltIndex },
          })
          return
        }

        const result = moveNuts(
          bolts,
          selectedBoltIndex,
          boltIndex,
          capacity,
        )
        if (!result) return

        soundService.play('move')

        const nextMoves = session.moves + 1
        const nextHistory = [...session.history, result.record]
        const won = isSolved(result.bolts, capacity)

        let nextProgress = progress
        if (won) {
          soundService.play('win')
          const stars = calculateStars(nextMoves, level.minMoves)
          const existing = progress.levels[session.levelId]
          const bestStars = Math.max(existing?.stars ?? 0, stars)
          const bestMoves = Math.min(
            existing?.bestMoves ?? Number.POSITIVE_INFINITY,
            nextMoves,
          )

          nextProgress = {
            unlockedLevel: Math.max(
              progress.unlockedLevel,
              session.levelId + 1,
            ),
            levels: {
              ...progress.levels,
              [session.levelId]: {
                stars: bestStars,
                bestMoves,
                completed: true,
              },
            },
          }
        }

        set({
          progress: nextProgress,
          session: {
            ...session,
            bolts: result.bolts,
            moves: nextMoves,
            history: nextHistory,
            selectedBoltIndex: null,
            isWon: won,
            shakeBoltIndex: null,
          },
        })
      },

      undo: () => {
        const { session } = get()
        if (!session || session.history.length === 0 || session.isWon) return

        const level = getLevelById(session.levelId)
        if (!level) return

        const maxUndos = MAX_UNDOS[level.difficulty]
        if (session.undosUsed >= maxUndos) {
          soundService.play('error')
          return
        }

        soundService.play('undo')

        const lastMove = session.history[session.history.length - 1]
        const revertedBolts = undoMove(session.bolts, lastMove)

        set({
          session: {
            ...session,
            bolts: revertedBolts,
            moves: Math.max(0, session.moves - 1),
            history: session.history.slice(0, -1),
            undosUsed: session.undosUsed + 1,
            selectedBoltIndex: null,
            shakeBoltIndex: null,
          },
        })
      },

      resetLevel: () => {
        const { session } = get()
        if (!session) return
        const level = getLevelById(session.levelId)
        if (!level) return
        set({ session: createSessionFromLevel(level) })
      },

      clearShake: () => {
        const { session } = get()
        if (!session) return
        set({ session: { ...session, shakeBoltIndex: null } })
      },

      toggleSound: () => {
        const next = !get().settings.soundEnabled
        soundService.setEnabled(next)
        set({ settings: { soundEnabled: next } })
      },

      getLevelStars: (levelId) => {
        return get().progress.levels[levelId]?.stars ?? 0
      },

      isLevelUnlocked: (levelId) => {
        if (DEV_UNLOCK_ALL_LEVELS) return true
        return levelId <= get().progress.unlockedLevel
      },
    }),
    {
      name: 'nuts-bolts-progress',
      partialize: (state) => ({
        progress: state.progress,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          soundService.setEnabled(state.settings.soundEnabled)
        }
      },
    },
  ),
)
