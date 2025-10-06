import type { Question } from '../types'
import { computeScoreUpdate } from '../utils/scoring'

export enum Screen {
  TITLE = 'TITLE',
  SETUP = 'SETUP',
  QUIZ = 'QUIZ',
  JUDGE = 'JUDGE',
  SCORES = 'SCORES',
  RESULT = 'RESULT',
}

export type GameStateForReducer = {
  screen: Screen
  questionIndex: number
  totalQuestions: number
  players: string[]
  activePlayers: boolean[]
  answers: Record<number, string | null>
  hintShown: boolean
  hintUser: number | null
  hintMessage: string
  hintUsed: boolean[]
  scores: number[]
  prevScores: (number | null)[]
  lastMessage: string
  questions: Question[]
  currentQuestion: Question | null
}

export type GameAction =
  | { type: 'RESET_ALL' }
  | { type: 'SET_SCREEN'; payload: Screen }
  | { type: 'SET_QINDEX'; payload: number }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'LOAD_QUESTIONS'; payload: Question[] }
  | { type: 'SET_CURRENT_QUESTION'; payload: Question | null }
  | { type: 'SET_SCORES'; payload: { prev: number[]; next: number[] } }
  | { type: 'SET_LAST_MESSAGE'; payload: string }
  | { type: 'SET_ANSWERS'; payload: Record<number, string | null> }
  | { type: 'SET_ACTIVE'; payload: boolean[] }
  | { type: 'SET_HINT_STATE'; payload: { hintShown: boolean; hintUser: number | null; hintMessage: string; hintUsed: boolean[] } }
  | { type: 'MARK_ACTIVE'; payload: number }
  | { type: 'SET_PLAYER_ANSWER'; payload: { player: number; option: string } }
  | { type: 'REQUEST_HINT'; payload: number }
  | { type: 'JUDGE_SCORES' }
  | { type: 'RESET_ANSWERS' }
  | { type: 'RESET_ACTIVE' }
  | { type: 'RESET_HINT_USED' }
  | { type: 'RESET_SCORES' }
  | { type: 'NEXT_SCREEN' }

function makeEmptyAnswers(length: number) {
  const a: Record<number, string | null> = {}
  for (let i = 0; i < length; i++) a[i] = null
  return a
}

function makeEmptyBoolArray(length: number) {
  return Array.from({ length }, () => false)
}

function makeZeroScores(length: number) {
  return Array.from({ length }, () => 0)
}

export function initialReducerState(playerNames: string[] = ['α', 'β', 'θ', 'γ', 'ε'], totalQuestions = 11, csvQuestions: Question[] = []): GameStateForReducer {
  return {
    screen: Screen.TITLE,
    questionIndex: 0,
    totalQuestions,
    players: playerNames,
    activePlayers: makeEmptyBoolArray(playerNames.length),
    answers: makeEmptyAnswers(playerNames.length),
    hintShown: false,
    hintUser: null,
    hintMessage: '',
    hintUsed: makeEmptyBoolArray(playerNames.length),
    scores: makeZeroScores(playerNames.length),
    prevScores: playerNames.map(() => null),
    lastMessage: '',
    questions: csvQuestions,
    currentQuestion: null,
  }
}

function getTargetForIndex(qi: number) {
  if (qi <= 5) return '1〜5問目用'
  if (qi <= 9) return '6〜9問目用'
  if (qi <= 10) return '10問目用'
  return '全問正解者用'
}

function pickQuestionForIndex(qs: Question[], qi: number): Question | null {
  const target = getTargetForIndex(qi)
  const pool = qs.filter((q) => q.target === target)
  if (pool.length === 0) return null
  const idx = (qi - 1) % pool.length
  return pool[idx]
}

export function gameReducer(state: GameStateForReducer, action: GameAction): GameStateForReducer {
  switch (action.type) {
    case 'RESET_ALL': {
      return initialReducerState(state.players, state.totalQuestions, state.questions)
    }
    case 'SET_SCREEN': {
      return { ...state, screen: action.payload }
    }
    case 'SET_QINDEX': {
      const qi = action.payload
      const current = qi > 0 ? pickQuestionForIndex(state.questions, qi) : null
      return { ...state, questionIndex: qi, currentQuestion: current }
    }
    case 'SET_QUESTIONS':
    case 'LOAD_QUESTIONS': {
      const qs = action.payload
      const qi = state.questionIndex === 0 ? 1 : state.questionIndex
      const current = qi > 0 ? pickQuestionForIndex(qs, qi) : null
      return { ...state, questions: qs, currentQuestion: current }
    }
    case 'SET_CURRENT_QUESTION': {
      return { ...state, currentQuestion: action.payload }
    }
    case 'SET_SCORES': {
      const { prev, next } = action.payload
      return { ...state, prevScores: prev.map((v) => v), scores: next }
    }
    case 'SET_LAST_MESSAGE': {
      return { ...state, lastMessage: action.payload }
    }
    case 'SET_ANSWERS': {
      return { ...state, answers: action.payload }
    }
    case 'SET_ACTIVE': {
      return { ...state, activePlayers: action.payload }
    }
    case 'SET_HINT_STATE': {
      const p = action.payload
      return { ...state, hintShown: p.hintShown, hintUser: p.hintUser, hintMessage: p.hintMessage, hintUsed: p.hintUsed }
    }
    case 'MARK_ACTIVE': {
      const i = action.payload
      const next = [...state.activePlayers]
      next[i] = true
      return { ...state, activePlayers: next }
    }
    case 'SET_PLAYER_ANSWER': {
      const { player, option } = action.payload
      const next = { ...state.answers, [player]: option }
      return { ...state, answers: next }
    }
    case 'REQUEST_HINT': {
      const p = action.payload
      if (!state.activePlayers[p]) return { ...state, lastMessage: `${state.players[p]}は参加していません` }
      if (state.hintShown) return { ...state, lastMessage: 'ヒントは表示済みです' }
      if (state.hintUsed[p]) return { ...state, lastMessage: `${state.players[p]}は既にヒントを使用済みです` }
      const used = [...state.hintUsed]
      used[p] = true
      return { ...state, hintUsed: used, hintShown: true, hintUser: p, hintMessage: `${state.players[p]}がヒントを使用しました!`, lastMessage: `${state.players[p]}がヒントを使用しました!` }
    }
    case 'RESET_ANSWERS': {
      return { ...state, answers: makeEmptyAnswers(state.players.length) }
    }
    case 'RESET_ACTIVE': {
      return { ...state, activePlayers: makeEmptyBoolArray(state.players.length) }
    }
    case 'RESET_HINT_USED': {
      return { ...state, hintUsed: makeEmptyBoolArray(state.players.length) }
    }
    case 'RESET_SCORES': {
      return { ...state, scores: makeZeroScores(state.players.length), prevScores: state.players.map(() => null) }
    }
    case 'JUDGE_SCORES': {
      const prev = state.scores.slice()
      const { nextScores } = computeScoreUpdate(prev, state.answers, state.currentQuestion, state.activePlayers)
      return { ...state, prevScores: prev.map((v) => v), scores: nextScores }
    }
    case 'NEXT_SCREEN': {
      // We'll perform scoring and question selection inside this atomic transition
      let nextScreen = state.screen
      let newQi = state.questionIndex
      let nextState = { ...state }

      switch (state.screen) {
        case Screen.TITLE:
          nextScreen = Screen.SETUP
          break
        case Screen.SETUP:
          newQi = 1
          nextScreen = Screen.QUIZ
          // pick question for first quiz
          nextState.currentQuestion = pickQuestionForIndex(state.questions, newQi)
          nextState.questionIndex = newQi
          break
        case Screen.QUIZ:
          // When moving from QUIZ -> JUDGE, compute scores here based on currentQuestion
          {
            const prev = state.scores.slice()
            const { nextScores } = computeScoreUpdate(prev, state.answers, state.currentQuestion, state.activePlayers)
            nextState.prevScores = prev.map((v) => v)
            nextState.scores = nextScores
            nextScreen = Screen.JUDGE
            // do not change question here
          }
          break
        case Screen.JUDGE:
          nextScreen = Screen.SCORES
          break
        case Screen.SCORES:
          if (state.questionIndex >= state.totalQuestions) {
            nextScreen = Screen.RESULT
            newQi = state.questionIndex
          } else {
            newQi = state.questionIndex + 1
            nextScreen = Screen.QUIZ
            // pick next question when entering QUIZ
            nextState.currentQuestion = pickQuestionForIndex(state.questions, newQi)
            nextState.questionIndex = newQi
          }
          break
        case Screen.RESULT:
          newQi = 0
          nextScreen = Screen.TITLE
          break
        default:
          nextScreen = Screen.TITLE
      }

      nextState.screen = nextScreen
      return nextState
    }
    default:
      return state
  }
}
