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
  isChallengeLevel,
  isStageComplete,
  isStageUnlocked,
  isStageUnlockedForLevel,
  SECTION_1_FUNDAMENTOS,
} from '../domain/content/campaignStructure'
import {
  canStartChallenge,
  consumeChallengeAttempt,
  createInitialChallenge,
  getAttemptsDisplay,
  getChallengeMapState as resolveChallengeMapState,
  getNextAttemptAt,
  isChallengeMastered,
  onChallengeVictory,
  shouldUnlockNextOnChallenge,
  tickChallengeRegen,
  type ChallengeMapState,
} from '../domain/challenges'
import { migratePlayerProgressChallenges } from '../domain/challenges/migratePlayerProgress'
import { getLevelById } from '../domain/levels'
import type {
  ChallengeProgress,
  GameSession,
  GameSettings,
  PlayerProgress,
} from '../domain/types'
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
  startLevel: (levelId: number) => boolean
  selectBolt: (boltIndex: number) => void
  undo: () => void
  resetLevel: () => void
  clearShake: () => void
  toggleSound: () => void
  setLocalePreference: (locale: LocalePreference) => void
  getLevelStars: (levelId: number) => number
  isLevelUnlocked: (levelId: number) => boolean
  replaceProgress: (progress: PlayerProgress) => void
  getChallengeProgress: (levelId: number) => ChallengeProgress | undefined
  getChallengeMapState: (levelId: number) => ChallengeMapState
  getNextChallengeAttemptAt: (levelId: number) => Date | null
  getChallengeAttemptsDisplay: (levelId: number) => { available: number; max: number }
  canStartChallengeLevel: (levelId: number) => boolean
  markChallengeIntroSeen: (levelId: number) => void
  needsChallengeIntro: (levelId: number) => boolean
}

const defaultProgress: PlayerProgress = {
  unlockedLevel: 1,
  levels: {},
}

const defaultSettings: GameSettings = {
  soundEnabled: true,
  locale: 'auto',
}

function now(): Date {
  return new Date()
}

function getChallengeState(
  progress: PlayerProgress,
  levelId: number,
): ChallengeProgress {
  const existing = progress.challenges?.[levelId]
  if (existing) {
    return tickChallengeRegen(existing, now())
  }
  return createInitialChallenge()
}

function withChallengeUpdate(
  progress: PlayerProgress,
  levelId: number,
  nextChallenge: ChallengeProgress,
): PlayerProgress {
  return {
    ...progress,
    challenges: {
      ...progress.challenges,
      [levelId]: nextChallenge,
    },
  }
}

function chargeChallengeAttemptIfNeeded(
  progress: PlayerProgress,
  levelId: number,
  session: GameSession,
): { progress: PlayerProgress; session: GameSession } {
  if (!isChallengeLevel(levelId)) {
    return { progress, session }
  }

  const state = getChallengeState(progress, levelId)
  if (isChallengeMastered(state)) {
    return { progress, session }
  }

  if (session.challengeAttemptCharged) {
    return { progress, session }
  }

  const nextChallenge = consumeChallengeAttempt(state, now())
  return {
    progress: withChallengeUpdate(progress, levelId, nextChallenge),
    session: {
      ...session,
      challengeAttemptCharged: true,
      challengeAttemptPending: false,
    },
  }
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

      setScreen: (screen) =>
        set((state) => ({
          screen,
          session: screen === 'game' ? state.session : null,
        })),

      openCampaign: (campaignId) => {
        set({ selectedCampaignId: campaignId, screen: 'campaign' })
      },

      goHome: () => set({ screen: 'home', session: null }),

      setHomeStageId: (stageId) => set({ homeStageId: stageId }),

      startLevel: (levelId) => {
        if (!get().isLevelUnlocked(levelId)) return false
        const level = getLevelById(levelId)
        if (!level) return false

        if (isChallengeLevel(levelId) && !get().canStartChallengeLevel(levelId)) {
          return false
        }

        set({
          screen: 'game',
          session: createSessionFromLevel(level),
        })
        return true
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

        let workingProgress = progress
        let workingSession = session

        if (
          isChallengeLevel(session.levelId)
          && !workingSession.challengeAttemptCharged
        ) {
          const charged = chargeChallengeAttemptIfNeeded(
            workingProgress,
            session.levelId,
            workingSession,
          )
          workingProgress = charged.progress
          workingSession = charged.session
        }

        const result = moveNuts(
          workingSession.bolts,
          selectedBoltIndex,
          boltIndex,
          capacity,
          workingSession.playContext,
        )
        if (!result) return

        soundService.play('move')

        const nextMoves = workingSession.moves + 1
        const nextHistory = [...workingSession.history, result.record]
        const won = isSolved(result.bolts, capacity)

        let nextProgress = workingProgress
        let nextHomeStageId = get().homeStageId
        if (won) {
          soundService.play('win')
          const stars = calculateStars(nextMoves, level.minMoves)
          const existing = workingProgress.levels[session.levelId]
          const bestStars = Math.max(existing?.stars ?? 0, stars)
          const bestMoves = Math.min(
            existing?.bestMoves ?? Number.POSITIVE_INFINITY,
            nextMoves,
          )

          const isChallenge = isChallengeLevel(session.levelId)
          let challengeState = getChallengeState(workingProgress, session.levelId)

          if (isChallenge) {
            challengeState = onChallengeVictory(challengeState, stars, now())
          }

          let nextUnlocked = workingProgress.unlockedLevel
          if (isChallenge) {
            if (shouldUnlockNextOnChallenge(stars)) {
              nextUnlocked = Math.max(nextUnlocked, session.levelId + 1)
            }
          } else {
            nextUnlocked = Math.max(nextUnlocked, session.levelId + 1)
          }

          nextProgress = {
            unlockedLevel: nextUnlocked,
            levels: {
              ...workingProgress.levels,
              [session.levelId]: {
                stars: bestStars,
                bestMoves,
                completed: true,
              },
            },
            challenges: isChallenge
              ? {
                  ...workingProgress.challenges,
                  [session.levelId]: challengeState,
                }
              : workingProgress.challenges,
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
              nextStage
              && isStageUnlocked(stageIndex + 1, SECTION_1_FUNDAMENTOS, isCompleted)
            ) {
              nextHomeStageId = nextStage.id
            }
          }
        }

        set({
          progress: nextProgress,
          homeStageId: nextHomeStageId,
          session: {
            ...workingSession,
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

        if (isChallengeLevel(session.levelId)) {
          const state = getChallengeState(get().progress, session.levelId)
          if (!isChallengeMastered(state)) {
            soundService.play('error')
            return
          }
        }

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
        const { session, progress } = get()
        if (!session) return
        const level = getLevelById(session.levelId)
        if (!level) return

        let nextProgress = progress
        const freshSession = createSessionFromLevel(level)

        if (isChallengeLevel(session.levelId)) {
          const state = getChallengeState(progress, session.levelId)
          if (!isChallengeMastered(state)) {
            const nextChallenge = consumeChallengeAttempt(state, now())
            nextProgress = withChallengeUpdate(
              progress,
              session.levelId,
              nextChallenge,
            )
          }
        }

        set({ progress: nextProgress, session: freshSession })
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

      replaceProgress: (progress) => {
        set({ progress: migratePlayerProgressChallenges(progress) })
      },

      getChallengeProgress: (levelId) => {
        if (!isChallengeLevel(levelId)) return undefined
        const state = get().progress.challenges?.[levelId]
        return state ? tickChallengeRegen(state, now()) : createInitialChallenge()
      },

      getChallengeMapState: (levelId) => {
        if (!isChallengeLevel(levelId)) return 'active'
        return resolveChallengeMapState(get().getChallengeProgress(levelId), now())
      },

      getNextChallengeAttemptAt: (levelId) => {
        return getNextAttemptAt(get().getChallengeProgress(levelId), now())
      },

      getChallengeAttemptsDisplay: (levelId) => {
        return getAttemptsDisplay(get().getChallengeProgress(levelId), now())
      },

      canStartChallengeLevel: (levelId) => {
        if (!isChallengeLevel(levelId)) return true
        const state = getChallengeState(get().progress, levelId)
        return canStartChallenge(state, now())
      },

      markChallengeIntroSeen: (levelId) => {
        if (!isChallengeLevel(levelId)) return
        const state = getChallengeState(get().progress, levelId)
        if (state.introSeen) return
        set({
          progress: withChallengeUpdate(get().progress, levelId, {
            ...state,
            introSeen: true,
          }),
        })
      },

      needsChallengeIntro: (levelId) => {
        if (levelId !== 20) return false
        const state = get().progress.challenges?.[levelId]
        if (!state) return true
        return !state.introSeen
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
          state.progress = migratePlayerProgressChallenges(state.progress)
        }
      },
    },
  ),
)
