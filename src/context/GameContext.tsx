import React, { createContext, useContext, useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { parseCsvText, dummyCsv, Question } from '../utils/parseCsv'
import { useBroadcast } from '../hooks/useBroadcast'

export const isDebug = false

export enum Screen {
  TITLE = 'TITLE',
  SETUP = 'SETUP',
  QUIZ = 'QUIZ',
  JUDGE = 'JUDGE',
  SCORES = 'SCORES',
  RESULT = 'RESULT',
}

type GameState = {
  screen: Screen
  questionIndex: number
  totalQuestions: number
  players: string[]
  activePlayers: boolean[]
  answers: Record<number, string | null>
  correctAnswer: string
  hintShown: boolean
  hintUser: number | null
  hintMessage: string
  hintUsed: boolean[]
  ableChange: boolean[]
  scores: number[]
  prevScores: (number | null)[]
  lastMessage: string
  questions: Question[]
  currentQuestion: Question | null
}

type GameApi = {
  state: GameState
  nextScreen: () => void
  reset: () => void
  setPlayerAnswer: (playerIndex: number, option: string) => void
  markPlayerActive: (playerIndex: number) => void
  requestHint: (playerIndex: number) => void
  updateLastMessage: (m: string) => void
  loadQuestions: (qs: Question[]) => void
  getLinksOfQuiz: (qs: Question) => string[]
  getQuizDuration: () => { duration: number; label: string }
}

const DEFAULT_TOTAL_QUESTIONS = 11

export const playersInitial = ['α','β','γ','δ','ε']

const GameContext = createContext<GameApi | null>(null)

export const get_isExistCorrect = (playersOpt: Record<number, string | null>, answer:number) => {
  let isExistCorrect = false
  const optMap: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 }
  for (let i=0; i < Object.keys(playersOpt).length; i++){
    const opt = playersOpt[i]
    if ( typeof opt === "string" && optMap[opt] === answer) isExistCorrect = true
  }
  return isExistCorrect
}

const getAnsweredNumber = (answers:  Record<number, string | null>) : number => {
  let answeredNumber = 0
  for (let i=0; i < Object.keys(answers).length; i++){
    if (answers[i] !== null){
      answeredNumber+=1
    }
  }
  return answeredNumber
}

export const isHintSuitable = (hintShown: boolean, answers: Record<number, string | null>, activePlayers: boolean[]) : boolean =>{
  if (hintShown) return true
  const answered = getAnsweredNumber(answers)
  const actives = activePlayers.filter((output, index) => {
    return output==true;
  }).length;
  return (answered === actives) || window.confirm('回答者数 < クイズ参加者数 ですが、本当にヒントを表示しますか? (ヒント表示後は使用者以外回答変更不可)')
}

const TARGET_TO_DIFFICULTY: Record<string, 'easy' | 'medium' | 'hard' | 'default'> = {
  '1〜5問目用': 'easy',
  '6〜9問目用': 'medium',
  '10問目用': 'hard',
  '全問正解者用': 'hard',
}

const DURATION_BY_DIFFICULTY: Record<'easy' | 'medium' | 'hard' | 'default', number> = {
  easy: 60,
  medium: 90,
  hard: 120,
  default: 75,
}

const DIFFICULTY_LABEL: Record<'easy' | 'medium' | 'hard' | 'default', string> = {
  easy: '簡単',
  medium: '標準',
  hard: '難しい',
  default: '',
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within GameProvider')
  return ctx
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<Screen>(Screen.TITLE)
  const [questionIndex, setQuestionIndex] = useState<number>(0)
  const totalQuestions = DEFAULT_TOTAL_QUESTIONS
  const players = useMemo(() => playersInitial, [])

  const makeEmptyAnswers = () => {
    const a: Record<number, string | null> = {}
    for (let i = 0; i < players.length; i++) a[i] = null
    return a
  }

  const makeEmptyActive = () => players.map(() => false)
  const makeEmptyHintUsed = () => players.map(() => false)
  const makeZeroScores = () => players.map(() => 0)
  const makeAnswerable = () => players.map(() => true)
  const makeAnswerLock = () =>players.map(() => false)

  const [answers, setAnswers] = useState<Record<number, string | null>>(makeEmptyAnswers)
  const [activePlayers, setActivePlayers] = useState<boolean[]>(makeEmptyActive)
  const [correctAnswer, setCorrectAnswer] = useState<string>('A')
  const [hintShown, setHintShown] = useState<boolean>(false)
  const [hintUser, setHintUser] = useState<number | null>(null)
  const [hintMessage, setHintMessage] = useState<string>('')
  const [hintUsed, setHintUsed] = useState<boolean[]>(makeEmptyHintUsed)
  const [ableChange, setAbleChange] = useState<boolean[]>(makeAnswerable)
  const [scores, setScores] = useState<number[]>(makeZeroScores)
  const [prevScores, setPrevScores] = useState<(number | null)[]>(players.map(() => null))
  const [lastMessage, setLastMessageState] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>(() => parseCsvText(dummyCsv).questions)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)

  const answersRef = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])
  const activeRef = useRef(activePlayers)
  useEffect(() => { activeRef.current = activePlayers }, [activePlayers])
  const hintShownRef = useRef(hintShown)
  useEffect(() => { hintShownRef.current = hintShown }, [hintShown])
  const hintUsedRef = useRef(hintUsed)
  useEffect(() => { hintUsedRef.current = hintUsed }, [hintUsed])
  const ableChangeRef = useRef(ableChange)
  useEffect(() => { ableChangeRef.current = ableChange }, [ableChange])
  const scoresRef = useRef(scores)
  useEffect(() => { scoresRef.current = scores }, [scores])
  const prevScoresRef = useRef(prevScores)
  useEffect(() => { prevScoresRef.current = prevScores }, [prevScores])
  const currentQuestionRef = useRef<Question | null>(currentQuestion)
  useEffect(() => { currentQuestionRef.current = currentQuestion }, [currentQuestion])

  const tabIdRef = useRef<string>('')
  useEffect(() => { tabIdRef.current = Math.random().toString(36).slice(2) }, [])

  const onRemote = useCallback((data: any) => {
    if (!data || data.sender === tabIdRef.current) return
    if (data.type === 'STATE') {
      const s = data.payload as Partial<GameState>
      if (s.screen) setScreen(s.screen)
      if (typeof s.questionIndex === 'number') setQuestionIndex(s.questionIndex)
      if (s.answers) setAnswers(s.answers)
      if (s.activePlayers) setActivePlayers(s.activePlayers)
      if (typeof s.correctAnswer === 'string') setCorrectAnswer(s.correctAnswer)
      if (typeof s.hintShown === 'boolean') setHintShown(s.hintShown)
      if (typeof s.hintUser === 'number') setHintUser(s.hintUser)
      if (typeof s.hintMessage === 'string') setHintMessage(s.hintMessage)
      if (s.hintUsed) setHintUsed(s.hintUsed)
      if (s.ableChange) setAbleChange(s.ableChange)
      if (s.scores) setScores(s.scores); console.log(s.scores)
      if (s.prevScores) setPrevScores(s.prevScores); console.log(s.scores)
      if (typeof s.lastMessage === 'string') setLastMessageState(s.lastMessage)
      if (s.questions) setQuestions(s.questions)
      if (s.currentQuestion) setCurrentQuestion(s.currentQuestion)
    }
  }, [])

  const { postMessage } = useBroadcast('quiz-skeleton', onRemote)

  const broadcastState = (s: Partial<GameState>) => {
    try { postMessage({ type: 'STATE', payload: s, sender: tabIdRef.current }) } catch (e) {}
  }

  const resetAnswers = () => { const empty = makeEmptyAnswers(); setAnswers(empty); return empty }
  const resetActive = () => { const empty = makeEmptyActive(); setActivePlayers(empty); return empty }
  const resetHintUsed = () => { const empty = makeEmptyHintUsed(); setHintUsed(empty); return empty }
  const resetScores = () => { const zeros = makeZeroScores(); setScores(zeros); setPrevScores(players.map(() => null)); return {scores:zeros, prevScores:players.map(() => null)} }
  const resetAbleChange = () => { const able = makeAnswerable(); setAbleChange(able); return able}

  function getTargetForIndex(qi: number) {
    if (qi <= 5) return '1〜5問目用'
    if (qi <= 9) return '6〜9問目用'
    if (qi <= 10) return '10問目用'
    return '全問正解者用'
  }

  function pickQuestionForIndex(qi: number): Question | null {
    const target = getTargetForIndex(qi)
    const pool = questions.filter((q) => q.target === target)
    if (pool.length === 0) return null
    // console.log(pool)
    const idx = Math.floor(Math.random() * pool.length)
    return pool[idx]
  }

  const setPlayerAnswer = (playerIndex: number, option: string) => {
    if (screen !== Screen.QUIZ) return
    if (!activeRef.current[playerIndex]) return
    // ヒント時、他プレイヤーが干渉不可能になる (オプション)↓
    if (hintShownRef.current && hintUser !== null && !(ableChangeRef.current[playerIndex])) return
    setAnswers((prev) => { const next = { ...prev, [playerIndex]: option }; broadcastState({ answers: next }); return next })
  }

  const markPlayerActive = (playerIndex: number) => {
    setActivePlayers((prev) => { if (prev[playerIndex]) return prev; const next = [...prev]; next[playerIndex] = true; broadcastState({ activePlayers: next }); return next })
  }

  const requestHint = (playerIndex: number) => {
    const tryingPlayer = playersInitial[playerIndex]
    const tryingMessage = tryingPlayer+"がヒントを使おうとしたものの、"
    if (screen !== Screen.QUIZ) { updateLastMessage(tryingMessage+'ヒントはこの画面では使えません'); return }
    if (!activeRef.current[playerIndex]) { updateLastMessage(tryingMessage+'参加していないプレイヤーはヒントを使えません'); return }
    // if (hintShownRef.current) { updateLastMessage(tryingMessage+'ヒントは表示済みです'); return }
    if (hintUsedRef.current[playerIndex]) { updateLastMessage(tryingMessage+`${tryingPlayer}は既にヒントを使用済みです`); return }
    if (state.questionIndex >= 11) { updateLastMessage(tryingMessage+"最終問題ではヒントは使えません。"); return}
    if (!hintShownRef.current){
      setAbleChange(makeAnswerLock())
    }
    setAbleChange((prev) => { const next = [...prev]; next[playerIndex] = true; return next })

    setHintUsed((prev) => { const next = [...prev]; next[playerIndex] = true; return next })
    setHintShown(true)
    setHintUser(playerIndex)
    const msg = `${players[playerIndex]}がヒントを使用しました!`
    setHintMessage(msg+state.currentQuestion?.hint)
    updateLastMessage(msg)
    broadcastState({ hintShown: true, hintUser: playerIndex, hintMessage: msg, hintUsed: [...hintUsedRef.current], ableChange: [...ableChangeRef.current] })
  }
  const updateLastMessage = (m: string) => { setLastMessageState(m); broadcastState({ lastMessage: m }) }

  const getLinksOfQuiz = (qs: Question) => {
    let links:string[] = []
    for (const l in qs.links){
      links.push(l)
      console.log(l)
    }
    return links
  }

  const computeScoresForJudge = () => {
    const prev = [...scoresRef.current]
    const next = [...scoresRef.current]
    const optMap: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 }
    const q = currentQuestionRef.current
    for (let i = 0; i < players.length; i++) {
      if (!activeRef.current[i]) continue
      const ans = answersRef.current[i]
      const ansNum = ans ? optMap[(ans as string).toUpperCase()] ?? NaN : NaN
      if (q && Number.isInteger(q.answer) && Number.isInteger(ansNum) && ansNum === q.answer) {
        next[i] = next[i] + 1
      }
    }
    setPrevScores(prev.map((v) => v))
    setScores(next)
    broadcastState({ scores: next, prevScores: prev.map((v) => v) })
  }

  const nextScreen = () => {
    let next = screen
    let newQi = questionIndex
    let newCurrentQuestion = currentQuestion
    let newAnswers = answers
    let newActivePlayers = activePlayers
    let newHintShown = hintShown
    let newAbleChange = ableChange
    let newHintUsed = hintUsed
    let newScores = scores
    let newPrevScores = prevScores
    switch (screen) {
      case Screen.TITLE:
        next = Screen.SETUP
        newActivePlayers=resetActive(); newAnswers=resetAnswers(); newHintUsed=resetHintUsed(); ({scores:newScores,prevScores:newPrevScores}=resetScores()); setHintShown(false); newHintShown=false; setHintUser(null); setHintMessage(''); updateLastMessage('')
        break
      case Screen.SETUP:
        newQi = 1; next = Screen.QUIZ; resetAnswers(); setHintShown(false); newHintShown=false; setHintUser(null); setHintMessage(''); updateLastMessage('')
        break
      case Screen.QUIZ:
        computeScoresForJudge(); next = Screen.JUDGE
        break
      case Screen.JUDGE:
        next = Screen.SCORES
        break
      case Screen.SCORES:
        if (questionIndex >= totalQuestions) { next = Screen.RESULT } else { newQi = questionIndex + 1; next = Screen.QUIZ; newAbleChange = resetAbleChange() ; resetAnswers(); setHintShown(false); newHintShown=false; setHintUser(null); setHintMessage(''); }
        break
      case Screen.RESULT:
        newQi = 0; next = Screen.TITLE; newActivePlayers=resetActive(); newAnswers=resetAnswers(); newHintUsed=resetHintUsed(); ({scores:newScores,prevScores:newPrevScores}=resetScores()); setHintShown(false); newHintShown=false; setHintUser(null); setHintMessage(''); updateLastMessage('')
        break
      default:
        next = Screen.TITLE
    }

    setScreen(next)
    setQuestionIndex(newQi)

    if (next === Screen.QUIZ) {
      newCurrentQuestion = pickQuestionForIndex(newQi)
      setCurrentQuestion(newCurrentQuestion)
    }
    // console.log(newPrevScores)
    broadcastState({ screen: next, questionIndex: newQi, answers: newAnswers, activePlayers: newActivePlayers, hintShown: newHintShown, hintUser, hintMessage, hintUsed: newHintUsed, ableChange: newAbleChange, scores: newScores, prevScores: newPrevScores, lastMessage, questions, currentQuestion: newCurrentQuestion })
    
  }

  const reset = () => {
    setScreen(Screen.TITLE); setQuestionIndex(0)
    const emptyA = makeEmptyAnswers(); const emptyActive = makeEmptyActive(); const emptyHint = makeEmptyHintUsed(); const zeros = makeZeroScores(); const able = makeAnswerable()
    setAnswers(emptyA); setActivePlayers(emptyActive); setHintUsed(emptyHint); setScores(zeros); setPrevScores(players.map(() => null)); setCorrectAnswer('A'); setHintShown(false); setHintUser(null); setHintMessage(''); setAbleChange(able); updateLastMessage('')
    broadcastState({ screen: Screen.TITLE, questionIndex: 0, answers: emptyA, activePlayers: emptyActive, hintUsed: emptyHint, scores: zeros, prevScores: players.map(() => null), hintShown: false, hintUser: null, hintMessage: '', ableChange: able, lastMessage: '', questions, currentQuestion: null })
  }

  const loadQuestions = (qs: Question[]) => { setQuestions(qs); const q = pickQuestionForIndex(questionIndex || 1); setCurrentQuestion(q); broadcastState({ questions: qs, currentQuestion: q }) }

  const getQuizDuration = (): { duration: number; label: string } => {
    const q = state.currentQuestion
    if (!q) return { duration: DURATION_BY_DIFFICULTY.default, label: '' }
    const t = (q.target ?? '') as string
    const dif = TARGET_TO_DIFFICULTY[t] ?? 'default'
    const duration = DURATION_BY_DIFFICULTY[dif] ?? DURATION_BY_DIFFICULTY.default
    const label = DIFFICULTY_LABEL[dif] ?? ''
    return { duration, label }
  }

  useEffect(() => { if (questionIndex === 0) { const q = pickQuestionForIndex(1); setCurrentQuestion(q) } }, [])

  const state = useMemo(() => ({ screen, questionIndex, totalQuestions, players, activePlayers, answers, correctAnswer, hintShown, hintUser, hintMessage, hintUsed, ableChange, scores, prevScores, lastMessage, questions, currentQuestion }), [screen, questionIndex, totalQuestions, players, activePlayers, answers, correctAnswer, hintShown, hintUser, hintMessage, hintUsed, ableChange, scores, prevScores, lastMessage, questions, currentQuestion ])

  const api: GameApi = {
    state,
    nextScreen,
    reset,
    setPlayerAnswer,
    markPlayerActive,
    requestHint,
    updateLastMessage,
    loadQuestions,
    getLinksOfQuiz,
    getQuizDuration,
  }

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>
}
