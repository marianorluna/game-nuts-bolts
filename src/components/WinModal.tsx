import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { getStarThresholds } from '../domain/gameEngine'
import { getLevelById, MAX_LEVEL_ID } from '../domain/levels'
import { getMilestoneForLevel } from '../domain/content/campaignStructure'
import {
  getDifficultyLabel,
  getMilestoneMessage,
  getMilestoneTitle,
} from '../i18n/campaignLabels'
import { useTranslation } from '../i18n/useTranslation'
import { soundService } from '../services/soundService'

interface WinModalProps {
  levelId: number
  moves: number
  onNext: () => void
  onReplay: () => void
  onHome: () => void
}

export function WinModal({ levelId, moves, onNext, onReplay, onHome }: WinModalProps) {
  const { t } = useTranslation()
  const getLevelStars = useGameStore((s) => s.getLevelStars)
  const level = getLevelById(levelId)
  const stars = getLevelStars(levelId)
  const hasNext = levelId < MAX_LEVEL_ID
  const milestone = getMilestoneForLevel(levelId)
  const milestoneTitle = milestone ? getMilestoneTitle(t, levelId) : undefined
  const milestoneMessage = milestone ? getMilestoneMessage(t, levelId) : undefined
  const threeStarTarget = level ? getStarThresholds(level.minMoves).threeStars : null

  useEffect(() => {
    const timers = [1, 2, 3]
      .filter((s) => s <= stars)
      .map((_, i) =>
        window.setTimeout(() => soundService.play('star'), 200 + i * 120),
      )
    return () => timers.forEach(window.clearTimeout)
  }, [stars])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#3d2a6b] to-[#2d1b4e] p-6 text-center shadow-2xl"
      >
          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="mb-2 text-5xl"
          >
            {milestone?.emoji ?? '🎉'}
          </motion.div>
          <h2 className="mb-1 text-2xl font-bold text-white">
            {milestoneTitle ?? t('win.completed')}
          </h2>
          {milestoneMessage && (
            <p className="mb-3 text-sm text-amber-200">{milestoneMessage}</p>
          )}
          {level && (
            <p className="mb-4 text-sm text-purple-200">
              {t('win.difficultyLevel', {
                difficulty: getDifficultyLabel(t, level.difficulty),
                level: levelId,
              })}
            </p>
          )}

          <div className="mb-4 flex justify-center gap-2 text-3xl">
            {[1, 2, 3].map((star) => (
              <motion.span
                key={star}
                initial={{ scale: 0 }}
                animate={{ scale: star <= stars ? 1 : 0.7 }}
                transition={{ delay: 0.2 + star * 0.1, type: 'spring' }}
                className={star <= stars ? 'opacity-100' : 'opacity-30'}
              >
                ⭐
              </motion.span>
            ))}
          </div>

          <p className="mb-6 text-purple-100">
            {t('win.movesUsed', { moves })}
            {threeStarTarget !== null && stars < 3 && (
              <span className="block mt-2 text-sm text-amber-300/90">
                {t('win.threeStarHint', { count: threeStarTarget })}
              </span>
            )}
          </p>

          <div className="flex flex-col gap-3">
            {hasNext && (
              <button
                type="button"
                onClick={onNext}
                className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 py-3 font-bold text-white shadow-lg transition hover:brightness-110 hover:shadow-xl active:scale-95"
              >
                {t('win.nextLevel')}
              </button>
            )}
            <button
              type="button"
              onClick={onReplay}
              className="rounded-xl border border-white/20 py-3 font-semibold text-white transition hover:border-white/40 hover:bg-white/10 active:scale-95"
            >
              {t('win.replay')}
            </button>
            <button
              type="button"
              onClick={onHome}
              className="rounded-xl py-3 font-semibold text-purple-200 transition hover:bg-white/5 hover:text-white active:scale-95"
            >
              {t('win.backToMenu')}
            </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
