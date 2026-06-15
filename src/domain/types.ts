export type NutColor =
  | 'orange'
  | 'blue'
  | 'pink'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type Bolt = NutColor[]

export interface LevelDefinition {
  id: number
  difficulty: Difficulty
  capacity: number
  bolts: Bolt[]
  /** Mínimo de movimientos para resolver (BFS al hornear). */
  minMoves: number
  /** Alias de minMoves; conservado por compatibilidad. */
  parMoves: number
}

export interface MoveRecord {
  fromIndex: number
  toIndex: number
  count: number
}

export interface GameSession {
  levelId: number
  bolts: Bolt[]
  capacity: number
  moves: number
  history: MoveRecord[]
  undosUsed: number
  selectedBoltIndex: number | null
  isWon: boolean
  shakeBoltIndex: number | null
}

export interface LevelProgress {
  stars: number
  bestMoves: number
  completed: boolean
}

export interface PlayerProgress {
  unlockedLevel: number
  levels: Record<number, LevelProgress>
}

export interface GameSettings {
  soundEnabled: boolean
}

export const NUT_COLORS: NutColor[] = [
  'orange',
  'blue',
  'pink',
  'green',
  'yellow',
  'red',
  'purple',
]

export const NUT_ICONS: Record<NutColor, string> = {
  orange: '⚡',
  blue: '💧',
  pink: '👑',
  green: '🍀',
  yellow: '☀️',
  red: '❤️',
  purple: '⭐',
}

export interface NutStyle {
  gradient: string
  edgeGradient: string
  glowColor: string
}

export const NUT_STYLES: Record<NutColor, NutStyle> = {
  orange: {
    gradient: 'linear-gradient(145deg, #ffb347 0%, #ff7c00 45%, #c45300 100%)',
    edgeGradient: 'linear-gradient(180deg, #ff9520 0%, #8a3800 100%)',
    glowColor: 'rgba(255,130,0,0.75)',
  },
  blue: {
    gradient: 'linear-gradient(145deg, #55aaff 0%, #1166ee 45%, #0033bb 100%)',
    edgeGradient: 'linear-gradient(180deg, #2288ff 0%, #001d88 100%)',
    glowColor: 'rgba(20,110,255,0.75)',
  },
  pink: {
    gradient: 'linear-gradient(145deg, #ff77bb 0%, #dd2288 45%, #aa0055 100%)',
    edgeGradient: 'linear-gradient(180deg, #ff44aa 0%, #800033 100%)',
    glowColor: 'rgba(220,30,120,0.75)',
  },
  green: {
    gradient: 'linear-gradient(145deg, #55dd55 0%, #22aa22 45%, #006600 100%)',
    edgeGradient: 'linear-gradient(180deg, #33cc33 0%, #004000 100%)',
    glowColor: 'rgba(20,180,20,0.75)',
  },
  yellow: {
    gradient: 'linear-gradient(145deg, #ffee66 0%, #ffbb00 45%, #cc8800 100%)',
    edgeGradient: 'linear-gradient(180deg, #ffdd22 0%, #996600 100%)',
    glowColor: 'rgba(255,200,0,0.75)',
  },
  red: {
    gradient: 'linear-gradient(145deg, #ff6644 0%, #ee2200 45%, #aa0000 100%)',
    edgeGradient: 'linear-gradient(180deg, #ff4422 0%, #660000 100%)',
    glowColor: 'rgba(220,20,0,0.75)',
  },
  purple: {
    gradient: 'linear-gradient(145deg, #cc88ff 0%, #9922ee 45%, #6600bb 100%)',
    edgeGradient: 'linear-gradient(180deg, #aa44ff 0%, #3a0077 100%)',
    glowColor: 'rgba(130,30,210,0.75)',
  },
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'FÁCIL',
  medium: 'MEDIO',
  hard: 'DIFÍCIL',
}

export const MAX_UNDOS: Record<Difficulty, number> = {
  easy: 4,
  medium: 2,
  hard: 1,
}
