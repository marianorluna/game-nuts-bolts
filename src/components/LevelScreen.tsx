import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { BoardBounds } from '../hooks/useResponsiveBoardScale'
import { useGameLogic } from '../hooks/useGameLogic'
import { useGameStore } from '../store/gameStore'
import { GameBoard } from './GameBoard'
import { WinModal } from './WinModal'
import { MovesInfoModal } from './MovesInfoModal'
import { MovesCoachMark } from './MovesCoachMark'
import { MultiNutCoachMark } from './MultiNutCoachMark'
import { LockedBoltCoachMark } from './LockedBoltCoachMark'
import { SettingsModal } from './SettingsModal'
import { BackArrowIcon, UndoArrowIcon, LevelHomeIcon, InfoCircleIcon } from './icons/GameIcons'
import { getStarThresholds } from '../domain/gameEngine'
import { MAX_LEVEL_ID } from '../domain/levels'
import { getStageForLevel, isChallengeLevel } from '../domain/content/campaignStructure'
import { getDifficultyLabel, getStageName, getChallengeLabel } from '../i18n/campaignLabels'
import { useTranslation } from '../i18n/useTranslation'
import { MAX_UNDOS } from '../domain/types'
import { useMechanicCoachMarks } from '../hooks/useMechanicCoachMarks'
import { EndOfContentModal } from './EndOfContentModal'
import { ChallengeIntroModal } from './ChallengeIntroModal'
import {
  hasSeenEndOfContentModal,
  markEndOfContentModalSeen,
} from '../services/endOfContentService'

export function LevelScreen() {
  const { t } = useTranslation()
  const boardAreaRef = useRef<HTMLDivElement>(null)
  const [boardBounds, setBoardBounds] = useState<BoardBounds | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [movesInfoOpen, setMovesInfoOpen] = useState(false)
  const [endOfContentOpen, setEndOfContentOpen] = useState(false)
  const [winOverlayOpen, setWinOverlayOpen] = useState(false)
  const [challengeIntroOpen, setChallengeIntroOpen] = useState(false)
  const [challengeIntroFirstTime, setChallengeIntroFirstTime] = useState(false)
  const pendingWinAction = useRef<(() => void) | null>(null)
  const pendingWinOverlayAction = useRef<(() => void) | null>(null)
  const soundEnabled = useGameStore((s) => s.settings.soundEnabled)
  const getChallengeMapState = useGameStore((s) => s.getChallengeMapState)
  const getChallengeAttemptsDisplay = useGameStore((s) => s.getChallengeAttemptsDisplay)
  const needsChallengeIntro = useGameStore((s) => s.needsChallengeIntro)
  const { session, level, selectBolt, undo, resetLevel, startLevel, setScreen } =
    useGameLogic()
  const {
    movesCoachVisible,
    multiNutCoachVisible,
    lockedBoltCoachVisible,
    dismissMovesCoach,
    dismissMultiNutCoach,
    dismissLockedBoltCoach,
  } = useMechanicCoachMarks(level?.id)

  useEffect(() => {
    if (session?.levelId === 20 && needsChallengeIntro(20)) {
      setChallengeIntroFirstTime(true)
      setChallengeIntroOpen(true)
    }
  }, [session?.levelId, needsChallengeIntro])

  useEffect(() => {
    if (session?.isWon) {
      setWinOverlayOpen(true)
    }
  }, [session?.isWon, session?.levelId])

  useEffect(() => {
    if (session && !session.isWon) {
      setWinOverlayOpen(false)
    }
  }, [session?.isWon, session?.levelId])

  useEffect(() => {
    const node = boardAreaRef.current
    if (!node) return

    const measure = () => {
      setBoardBounds({
        width: node.clientWidth,
        height: node.clientHeight,
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const dismissCoachMark = dismissMovesCoach

  const openMovesInfo = () => {
    dismissCoachMark()
    setMovesInfoOpen(true)
  }

  const dismissEndOfContent = () => {
    markEndOfContentModalSeen()
    setEndOfContentOpen(false)
    pendingWinAction.current?.()
    pendingWinAction.current = null
  }

  const runWinAction = (action: () => void) => {
    if (session?.levelId === MAX_LEVEL_ID && !hasSeenEndOfContentModal()) {
      pendingWinAction.current = action
      setEndOfContentOpen(true)
      return
    }
    action()
  }

  const runAfterWinOverlay = (action: () => void) => {
    pendingWinOverlayAction.current = action
    setWinOverlayOpen(false)
  }

  const handleWinOverlayExit = () => {
    const action = pendingWinOverlayAction.current
    pendingWinOverlayAction.current = null
    action?.()
  }

  if (!session || !level) return null

  const isChallenge = isChallengeLevel(level.id)
  const challengeMastered = isChallenge && getChallengeMapState(level.id) === 'mastered'
  const maxUndos = challengeMastered || !isChallenge ? MAX_UNDOS[level.difficulty] : 0
  const undosRemaining = maxUndos - session.undosUsed
  const stage = getStageForLevel(level.id)
  const canUndo =
    !isChallenge || challengeMastered
      ? session.history.length > 0 && !session.isWon && undosRemaining > 0
      : false
  const { threeStars } = getStarThresholds(level.minMoves)
  const onTrackForThreeStars = session.moves <= threeStars
  const stageLabel = stage
    ? getStageName(t, stage.id)
    : getDifficultyLabel(t, level.difficulty)
  const challengeName = isChallenge ? getChallengeLabel(t, level.id) : undefined
  const attempts = isChallenge && !challengeMastered
    ? getChallengeAttemptsDisplay(level.id)
    : null
  const showLowAttempts =
    attempts !== null && attempts.available > 0 && attempts.available <= 1

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-safe sm:px-6 md:px-8">
        <header className="relative py-4 text-center md:py-5">
          <button
            type="button"
            onClick={() => setScreen('campaign')}
            className="absolute left-0 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25 md:top-5 md:h-12 md:w-12"
            aria-label={t('level.back')}
          >
            <BackArrowIcon className="h-6 w-6 md:h-7 md:w-7" />
          </button>

          <button
            type="button"
            onClick={resetLevel}
            className="absolute right-0 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25 md:top-5 md:h-12 md:w-12"
            aria-label={t('level.resetLevel')}
          >
            <LevelHomeIcon className="h-6 w-6 md:h-7 md:w-7" />
          </button>

          <div className="mb-1 flex min-h-9 items-center justify-center md:min-h-11">
            <p className="text-sm font-black tracking-[0.22em] text-amber-300 uppercase md:text-base">
              {stageLabel}
            </p>
          </div>
          <h1
            className="text-3xl font-black text-white md:text-4xl"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.45)' }}
          >
            {isChallenge && challengeName
              ? t('level.challengeTitle', { name: challengeName })
              : t('level.levelNumber', { level: level.id })}
          </h1>
          {attempts && (
            <p className="mt-1 text-sm font-semibold text-amber-300/90">
              {t('level.challengeAttempts', {
                available: attempts.available,
                max: attempts.max,
              })}
            </p>
          )}
          {isChallenge && !challengeMastered && (
            <p className="mt-0.5 text-[11px] text-purple-300/80">{t('level.challengeNoUndo')}</p>
          )}
          {showLowAttempts && (
            <p className="mt-0.5 text-xs font-bold text-amber-400">{t('level.challengeLowAttempts')}</p>
          )}
        </header>
      </div>

      <div
        ref={boardAreaRef}
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden py-4 md:py-6"
      >
        <GameBoard
          key={session.levelId}
          session={session}
          onSelectBolt={selectBolt}
          boardBounds={boardBounds}
        />
      </div>

      <footer
        className="flex shrink-0 items-center justify-between px-6 py-3 sm:px-8 md:px-10"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
      >
        <div className="flex w-[4.5rem] justify-start md:w-[5.5rem]">
          {(!isChallenge || challengeMastered) && (
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25 disabled:opacity-30 md:h-14 md:w-14"
            aria-label={t('level.undoRemaining', { count: undosRemaining })}
          >
            <UndoArrowIcon className="h-5 w-5 md:h-6 md:w-6" />
            <span className="mt-0.5 text-[11px] font-bold leading-none md:text-xs">
              {undosRemaining}
            </span>
          </button>
          )}
          {isChallenge && !challengeMastered && (
            <button
              type="button"
              onClick={() => {
                setChallengeIntroFirstTime(false)
                setChallengeIntroOpen(true)
              }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white transition active:scale-95 hover:bg-white/25 md:h-14 md:w-14"
              aria-label={t('level.challengeInfoAria')}
            >
              <InfoCircleIcon className="h-6 w-6 md:h-7 md:w-7" />
            </button>
          )}
        </div>

        <div className="relative overflow-visible">
          {lockedBoltCoachVisible && (
            <LockedBoltCoachMark onDismiss={dismissLockedBoltCoach} />
          )}
          {multiNutCoachVisible && (
            <MultiNutCoachMark onDismiss={dismissMultiNutCoach} />
          )}
          {movesCoachVisible && <MovesCoachMark onDismiss={dismissCoachMark} />}

          <button
            type="button"
            onClick={openMovesInfo}
            className="relative min-h-12 min-w-[4.5rem] rounded-2xl bg-white/15 px-5 py-3 text-center transition active:scale-95 hover:bg-white/25 md:min-h-14 md:min-w-[5.5rem] md:px-6"
            aria-label={t('level.movesAria', { moves: session.moves })}
          >
            <span
              className="absolute top-1.5 right-2 text-[11px] font-bold leading-none text-purple-200 md:text-xs"
              aria-hidden="true"
            >
              ⓘ
            </span>
            <span
              className={`block text-5xl font-black md:text-6xl ${onTrackForThreeStars ? 'text-white' : 'text-amber-300'}`}
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
            >
              {session.moves}
            </span>
          </button>
        </div>

        <div className="flex w-[4.5rem] justify-end md:w-[5.5rem]">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-xl text-white transition active:scale-95 hover:bg-white/25 md:h-14 md:w-14 md:text-2xl"
            aria-label={t('common.settings')}
          >
            {soundEnabled ? '⚙️' : '🔇'}
          </button>
        </div>
      </footer>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <MovesInfoModal
        open={movesInfoOpen}
        onClose={() => setMovesInfoOpen(false)}
        minMoves={level.minMoves}
        currentMoves={session.moves}
      />

      <AnimatePresence onExitComplete={handleWinOverlayExit}>
        {winOverlayOpen && session.isWon && (
          <WinModal
            key={session.levelId}
            levelId={session.levelId}
            moves={session.moves}
            onNext={() =>
              runAfterWinOverlay(() =>
                runWinAction(() => {
                  const nextId = session.levelId + 1
                  if (nextId <= MAX_LEVEL_ID) {
                    startLevel(nextId)
                  } else {
                    setScreen('campaign')
                  }
                }),
              )
            }
            onReplay={() => runAfterWinOverlay(() => runWinAction(resetLevel))}
            onHome={() =>
              runAfterWinOverlay(() => runWinAction(() => setScreen('campaign')))
            }
          />
        )}
      </AnimatePresence>

      <EndOfContentModal open={endOfContentOpen} onClose={dismissEndOfContent} />
      <ChallengeIntroModal
        open={challengeIntroOpen}
        levelId={20}
        isFirstTime={challengeIntroFirstTime}
        onClose={() => setChallengeIntroOpen(false)}
      />
    </div>
  )
}
