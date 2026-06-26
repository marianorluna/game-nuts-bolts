import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  calculateStars,
  canMove,
  createSessionFromLevel,
  isBoltUsable,
  isSolved,
  moveNuts,
  undoMove,
} from '../domain/gameEngine'
import { DEV_UNLOCK_ALL_LEVELS } from '../config/dev'
import {
  CAMPAIGN_1_TALLER,
  getStageForLevel,
  isStageComplete,
  isStageUnlocked,
  isStageUnlockedForLevel,
  SECTION_1_FUNDAMENTOS,
} from '../domain/content/campaignStructure'
import { getLevelById } from '../domain/levels'
import type { GameSession, GameSettings, PlayerProgress } from '../domain/types'
import type { LocalePreference } from '../i18n/types'
import { MAX_UNDOS } from '../domain/types'
import { soundService } from '../services/soundService'

type Screen = 'home' | 'campaign' | 'game'

interface GameStore {
  screen: Screen
  session: GameSession | null
  progress: PlayerProgress
  settings: GameSettings
  homeStageId: string
  selectedCampaignId: string | null
  setScreen: (screen: Screen) => void
  openCampaign: (campaignId: string) => void
  goHome: () => void
  setHomeStageId: (stageId: string) => void
  startLevel: (levelId: number) => void
  selectBolt: (boltIndex: number) => void
  undo: () => void
  resetLevel: () => void
  clearShake: () => void
  toggleSound: () => void
  setLocalePreference: (locale: LocalePreference) => void
  getLevelStars: (levelId: number) => number
  isLevelUnlocked: (levelId: number) => boolean
}

const defaultProgress: PlayerProgress = {
  unlockedLevel: 1,
  levels: {},
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  locale: 'auto',
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      screen: 'home',
      session: null,
      progress: defaultProgress,
      settings: defaultSettings,
      homeStageId: SECTION_1_FUNDAMENTOS.stages[0]!.id,
      selectedCampaignId: CAMPAIGN_1_TALLER.id,

      setScreen: (screen) => set({ screen }),

      openCampaign: (campaignId) => {
        set({ selectedCampaignId: campaignId, screen: 'campaign' })
      },

      goHome: () => set({ screen: 'home', session: null }),

      setHomeStageId: (stageId) => set({ homeStageId: stageId }),

      startLevel: (levelId) => {
        if (!get().isLevelUnlocked(levelId)) return
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
          const { playContext, capacity: cap, bolts: currentBolts } = session
          if (!isBoltUsable(boltIndex, currentBolts, cap, playContext)) {
            soundService.play('error')
            set({ session: { ...session, shakeBoltIndex: boltIndex } })
            return
          }
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

        if (!canMove(bolts, selectedBoltIndex, boltIndex, capacity, session.playContext)) {
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
          session.playContext,
        )
        if (!result) return

        soundService.play('move')

        const nextMoves = session.moves + 1
        const nextHistory = [...session.history, result.record]
        const won = isSolved(result.bolts, capacity)

        let nextProgress = progress
        let nextHomeStageId = get().homeStageId
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

          const isCompleted = (id: number) =>
            nextProgress.levels[id]?.completed ?? false
          const completedStage = getStageForLevel(session.levelId)
          if (completedStage && isStageComplete(completedStage, isCompleted)) {
            const stageIndex = SECTION_1_FUNDAMENTOS.stages.findIndex(
              (s) => s.id === completedStage.id,
            )
            const nextStage = SECTION_1_FUNDAMENTOS.stages[stageIndex + 1]
            if (
              nextStage &&
              isStageUnlocked(stageIndex + 1, SECTION_1_FUNDAMENTOS, isCompleted)
            ) {
              nextHomeStageId = nextStage.id
            }
          }
        }

        set({
          progress: nextProgress,
          homeStageId: nextHomeStageId,
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
        set({ settings: { ...get().settings, soundEnabled: next } })
      },

      setLocalePreference: (locale) => {
        set({ settings: { ...get().settings, locale } })
      },

      getLevelStars: (levelId) => {
        return get().progress.levels[levelId]?.stars ?? 0
      },

      isLevelUnlocked: (levelId) => {
        if (DEV_UNLOCK_ALL_LEVELS) return true
        const { progress } = get()
        if (levelId > progress.unlockedLevel) return false
        const isCompleted = (id: number) => progress.levels[id]?.completed ?? false
        return isStageUnlockedForLevel(
          levelId,
          SECTION_1_FUNDAMENTOS,
          isCompleted,
        )
      },
    }),
    {
      name: 'nuts-bolts-progress',
      partialize: (state) => ({
        progress: state.progress,
        settings: state.settings,
        homeStageId: state.homeStageId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          soundService.setEnabled(state.settings.soundEnabled)
          if (!state.settings.locale) {
            state.settings.locale = 'auto'
          }
        }
      },
    },
  ),
)
