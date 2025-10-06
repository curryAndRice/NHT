import type { Question } from '../types'

export function optionLetterToNumber(opt?: string | null): number | null {
  if (!opt || typeof opt !== 'string') return null
  const letter = opt.trim().toUpperCase()
  if (letter === 'A') return 1
  if (letter === 'B') return 2
  if (letter === 'C') return 3
  if (letter === 'D') return 4
  const asNum = Number(letter)
  if (Number.isInteger(asNum) && asNum >= 1 && asNum <= 4) return asNum
  return null
}

export type ScoreUpdateResult = {
  prevScores: number[]
  nextScores: number[]
  changedIndexes: number[]
}

export function computeScoreUpdate(
  prevScores: number[],
  answers: Record<number, string | null>,
  currentQuestion: Question | null,
  activePlayers: boolean[]
): ScoreUpdateResult {
  const prev = prevScores.slice()
  const next = prevScores.slice()
  const changed: number[] = []

  if (!currentQuestion || !Number.isInteger(currentQuestion.answer)) {
    return { prevScores: prev, nextScores: next, changedIndexes: [] }
  }

  const correct = currentQuestion.answer as number

  for (let i = 0; i < prev.length; i++) {
    if (!activePlayers[i]) continue
    const rawAns = answers[i] ?? null
    const ansNum = optionLetterToNumber(rawAns)
    if (ansNum !== null && ansNum === correct) {
      next[i] = next[i] + 1
      if (next[i] !== prev[i]) changed.push(i)
    }
  }

  return { prevScores: prev, nextScores: next, changedIndexes: changed }
}

export function calculateScores(
  prevScores: number[],
  answers: Record<number, string | null>,
  currentQuestion: Question | null,
  activePlayers: boolean[]
): { prev: number[]; next: number[]; changed: number[] } {
  const r = computeScoreUpdate(prevScores, answers, currentQuestion, activePlayers)
  return { prev: r.prevScores, next: r.nextScores, changed: r.changedIndexes }
}

export function formatScoreDisplay(
  playerNames: string[],
  activePlayers: boolean[],
  prev: (number | null)[],
  next: number[]
): string[] {
  const out: string[] = []
  for (let i = 0; i < playerNames.length; i++) {
    if (!activePlayers[i]) continue
    const name = playerNames[i]
    const before = prev[i]
    const after = next[i]
    if (typeof before === 'number' && before !== after) {
      out.push(`${name}:${before}点 → ${after}点`)
    } else {
      out.push(`${name}:${after}点`)
    }
  }
  return out
}

export function getPrizeMessage(name: string, score: number): string {
  if (score >= 10) return `${name}さんは景品Aを獲得しました!! あなたは高専生より賢いです!!`
  if (score > 5) return `${name}さんは景品Bを獲得しました!`
  return `${name}さんは留年記念おみくじを獲得しました。`
}
