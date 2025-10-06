export type Question = {
  id: number
  question: string
  answer: number | null
  hint: string
  options: string[]
  target: string
  explanation: string
  links: string[]
  author: string
}

export type AnswerMap = Record<number, string | null>

export type Player = {
  id: number
  name: string
  active: boolean
  score: number
  hintUsed: boolean
}

export const DEFAULT_PLAYER_NAMES = ['α', 'β', 'θ', 'γ', 'ε'] as const
export type DefaultPlayerName = typeof DEFAULT_PLAYER_NAMES[number]

export type GameQuestions = Question[]

export type ScoreUpdateResult = {
  prevScores: number[]
  nextScores: number[]
  changedIndexes: number[]
}
