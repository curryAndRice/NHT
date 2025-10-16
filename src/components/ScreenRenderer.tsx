import React, { useEffect, useState, useRef } from 'react'
import { fetchPublicMedia } from '../utils/fetchPublicMedia'
import { Screen, useGame, isDebug, get_isExistCorrect} from '../context/GameContext'
import TutorialPanel from './TutorialPanel'
import useSound from 'use-sound';

type typeOfParticipantInfo = (
  id:number, player:string, score: number, hintUsed: boolean
) => JSX.Element;


type typeOfParticipantsTable = (
  players: string[], activePlayers: boolean[], scores: number[], hintUsed: boolean[]
) => JSX.Element;

const ParticipantInfo : typeOfParticipantInfo = function (id, player, score, hintUsed){

  return (
    <li key = {id}>
      <h2 className='scoreboard--name'>{player}</h2>
      <p className='scoreboard--score'>{score}点</p>
      <p className='scoreboard--hint-used'>{hintUsed || "ヒント可" }</p>
    </li>
  )
}

const ParticipantsTable: typeOfParticipantsTable = function ( players, activePlayers, scores, hintUsed ){
  let isPlayerExist = false
  for(let i = 0; i<activePlayers.length; i++){
    isPlayerExist = isPlayerExist || activePlayers[i]
  }
  if (!isPlayerExist) return <></>
  let Participants :JSX.Element[] = [] 
  for (let i = 0; i<players.length; i++){
    if (activePlayers[i]){
      Participants.push(ParticipantInfo(i, players[i], scores[i], hintUsed[i]))
    }
  }
  return <ul className='scoreboard'>{Participants}</ul>
}

export default function ScreenRenderer({
  state,
  isAdmin,
  nextScreen,
  getQuizDuration
  }: {
    state: { screen: Screen; questionIndex: number; totalQuestions: number; players: string[]; activePlayers: boolean[]; answers: Record<number, string | null>; correctAnswer: string; hintShown: boolean; hintUser: number | null; hintMessage: string; scores: number[]; prevScores: (number | null)[]; questions: any[]; currentQuestion: any; hintUsed: boolean[]},
    isAdmin : boolean,
    nextScreen : () => void,
    getQuizDuration : () => { duration: number; label: string; },
  }) {
  const options = ['A', 'B', 'C', 'D']
  const hintText = 'ヒント: この選択肢のいずれかに注目してください。'
  const explanation = state.currentQuestion?.explanation || '解説: ここに解説文が入ります。'
  
  // rendering state
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [difficultyLabel, setDifficultyLabel] = useState<string>('')

  // internal refs
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null) // performance.now() at start
  const durationRef = useRef<number>(0)
  const firedRef = useRef<boolean>(false)
  const lastRenderedRemRef = useRef<number | null>(null)

  //sound player
  const [correctPlay, {stop: correctStop}]   = useSound('../../public/software/sfx/correct.mp3');
  const [incorrectPlay, {stop: incorrectStop}] = useSound('../../public/software/sfx/incorrect.mp3');


  // Start / stop timer when entering/leaving QUIZ
  useEffect(() => {
    // cleanup any previous raf
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    firedRef.current = false
    startRef.current = null
    lastRenderedRemRef.current = null
    setRemainingSeconds(null)
    setProgress(0)
    setDifficultyLabel('')

    if (state.screen !== Screen.QUIZ) return

    const durInfo = getQuizDuration() // { duration, label }
    durationRef.current = durInfo.duration
    setDifficultyLabel(durInfo.label || '')

    // initialize
    startRef.current = performance.now()
    setRemainingSeconds(Math.ceil(durationRef.current))
    setProgress(0)

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const elapsedMs = now - startRef.current
      const elapsedS = elapsedMs / 1000
      const remaining = Math.max(0, durationRef.current - elapsedS)
      const prog = Math.min(1, Math.max(0, elapsedS / durationRef.current))

      const remInt = Math.ceil(remaining)
      if (lastRenderedRemRef.current !== remInt) {
        setRemainingSeconds(remInt)
        lastRenderedRemRef.current = remInt
      }
      setProgress(prog)

      if (!firedRef.current && elapsedS >= durationRef.current) {
        firedRef.current = true
        // call nextScreen once
        // try { nextScreen() } catch (e) { /* ignore */ }
        // stop here; cleanup will cancel raf on effect cleanup
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      firedRef.current = true
    }
    // only depend on screen and quiz question change as exposed via getQuizDuration
  }, [state.screen, state.currentQuestion, state.hintUser])

  // simple inline styles (can be moved to CSS)
  const barContainerStyle: React.CSSProperties = {
    height: 18,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    boxSizing: 'border-box',
  }
  const barFillStyle: React.CSSProperties = {
    width: `${Math.round(progress * 100)}%`,
    height: '100%',
    background: 'linear-gradient(90deg, rgba(255,255,146,0.95), rgba(126,203,220,0.95))',
    transition: 'width 120ms linear',
  }
  const labelStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
  }


  let debugInfo: JSX.Element[] = []
  debugInfo.push(<h3>Debug Info, turn off at /src/context/GameContext.tsx</h3>)
  for (const key of Object.keys(state)){
    debugInfo.push(<div> {key}: {String(state[key])}</div>);
  }
  if (state.currentQuestion){
      debugInfo.push(<div>currentQuestion.id: { state.currentQuestion.id}</div>)
  }

  for (const key of Object.keys(state.answers)){
    debugInfo.push(<div> answers.{key}: {String(state.answers[Number(key)])}</div>);
  }
  let DebugInfoDiv = isDebug && debugInfo

  // const playerNum = state.activePlayers.length
  const playerNum = 0
  const bgRightDownPath = '../../public/software/img/8bit_'+String(playerNum)+'.png'
  const BgRightDown = (
  <div className="bgrd--decor" aria-hidden="true">
    <img className="bgrd" src={bgRightDownPath} alt=""/>
  </div>
  )

  if (state.screen === Screen.TITLE) {
    return (
      <div>
        {ParticipantsTable(state.players, state.activePlayers, state.scores, state.hintUsed)}
        <img className='title__banner' src="../../public/software/img/AreYouSmarterThan_banner.png"></img>
        <p className='title__description'>
          <span className='title__description-blue-underbar'>現役高専生</span>
          が本気で考えた問題を救済を駆使して解き、
          <span className='title__description-blue-underbar'>豪華景品</span>
          を掴み取れ!
        </p>
        <div className='title__property'>
          <div>
          <p className='title__property-diff'>
            難しさ:赤点再試マシマシ
          </p>
          <p className='title__property-price-text'>
            価格:300円/人
          </p>
          <p className='title__property-chikuwa'>
            ちくわ大明神
          </p>
        </div>
          <img className='title__property-price-img' src="../../public/software/img/300yen.png"></img>
        </div>
        {BgRightDown}
        {DebugInfoDiv}
      </div>
    )
  }
  if (state.screen === Screen.SETUP) {
    return (
      <div>
        {ParticipantsTable(state.players, state.activePlayers, state.scores, state.hintUsed)}
        <h3>参加者数の決定 & チュートリアル</h3>
        <p>画面2: 参加する人はこの画面中に（その人に割り当てられた）キーを押してください。</p>
        <div style={{ marginTop: 12 }}>
          <strong>参加者一覧</strong>
          <div style={{ marginTop: 8 }}>{state.players.map((p, i) => (<div key={p}>{p}: {state.activePlayers[i] ? '参加' : '不参加'}</div>))}</div>
          <TutorialPanel />
          {DebugInfoDiv}
        </div>
      </div>
    )
  }

  if (state.screen === Screen.QUIZ || state.screen === Screen.JUDGE) {
    const q = state.currentQuestion
    let isExistCorrect = false
    isExistCorrect = get_isExistCorrect(state.answers, state.currentQuestion.answer)
    const questionImgPath = "/img/id"+ String(state.currentQuestion.id) +"-1.png"
    const answerImgPath = "/img/id"+ String(state.currentQuestion.id) +"-explain.png"

    //参加者用画面において、正誤判定画面のとき、音を1回だけ鳴らす
    // 1人でも正解していたら正解音を
    // そうでなければ不正解音を
    if (state.screen === Screen.JUDGE && !isAdmin){
      if (isExistCorrect){
        correctStop() //すでに鳴り始めていたら停止 (二度鳴り防止)
        correctPlay()
      }else{
        incorrectStop() //すでに鳴り始めていたら停止 
        incorrectPlay()
      }
    }

    return (
      <div>
        {ParticipantsTable(state.players, state.activePlayers, state.scores, state.hintUsed)}
        {q ? (
          <div className='quiz-screen'>
            <div className="screen-timer" style={{ width: '100%', maxWidth: 980 }}>
              <div style={barContainerStyle}>
                <div style={barFillStyle} />
              </div>
              <div style={labelStyle}>
                <div style={{ fontWeight: 700 }}>{difficultyLabel ? `難易度: ${difficultyLabel}` : ''}</div>
                <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                  残り: {remainingSeconds !== null ? `${remainingSeconds}s` : '---'}
                </div>
              </div>
            </div>
            <h3 className='quiz-screen--index'>{state.questionIndex}問目</h3>
            <div className='quiz-screen--id'>問題ID: {q.id}</div>
            <div className='quiz-screen--section'>{q.target}</div>
            <p className='quiz-screen--problem-statement'>{q.question}</p>
            <img src={questionImgPath} alt="" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              {q.options.map((opt: string, idx: number) => {
                const key = ['A','B','C','D'][idx]
                const playersForOpt = state.players.reduce<string[]>((acc, name, i) => {
                    if (state.activePlayers[i] && state.answers[i] === key) acc.push(name)
                    return acc
                  }, []
                )
                const isCorrect = state.currentQuestion && state.currentQuestion.answer === (idx+1)
                const reveal = state.screen !== Screen.QUIZ
                return (
                  <div key={key} className='quiz-screen--option'>
                    <div className='quiz-screen--option-content'>
                      <div className='quiz-screen--option-statement'>{key} {opt}</div>
                      {(reveal || isAdmin) ? 
                      <>
                        <div className='quiz-screen--option-participant'>{playersForOpt.length ? playersForOpt.join(' ') : <span style={{ color: '#888' }}>回答なし</span>}</div>
                        <div className='quiz-screen--option-iscorrect'>({isCorrect ? '正解' : '不正解'})</div>
                      </>
                      : null}
                    </div>
                    <span className={`quiz-screen--option-overlay ${reveal && isCorrect ? 'is-visible' : ''}`} aria-hidden="true" />
                  </div>
                )
                
              })}
            </div>
            <div className="quiz-screen--hint-title">ヒント(↑↓→←同時押しで表示)</div>
            {state.hintShown ? (
              <div className="quiz-screen--hint-statement">{state.hintMessage}<div style={{ marginTop: 6 }}>{q.hint || hintText}</div></div>
            ) : (
              <div>ヒントは未表示です</div>
            )}
            {state.screen === Screen.JUDGE ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700 }}>解説（ここで表示）</div>
                <div className="quiz-screen--explanation">{["0",'A','B','C','D'][state.currentQuestion.answer]} - {explanation}</div>
                <img alt="" src={answerImgPath} />
              </div>
            ) : null}
          </div>
        ) : (
          <div>出題可能な問題が見つかりません。</div>
        )}
        {DebugInfoDiv}
      </div>
    )
  }

  if (state.screen === Screen.SCORES) {
    return (
      <div>
        {ParticipantsTable(state.players, state.activePlayers, state.scores, state.hintUsed)}
        <h3>各参加者の得点表示</h3>
        <div style={{ marginTop: 12 }}>
          {state.players.map((p, i) => {
            if (!state.activePlayers[i]) return null
            const before = state.prevScores[i]
            const after = state.scores[i]
            if (typeof before === 'number' && before !== after) {
              return <div key={p} className="score-intermediate">{p}: {before}点 → {after}点</div>
            }
            return <div key={p} className="score-intermediate">{p}: {after}点</div>
          })}
        </div>
        {DebugInfoDiv}
      </div>
    )
  }

  if (state.screen === Screen.RESULT) {
    return (
      <div>
        {ParticipantsTable(state.players, state.activePlayers, state.scores, state.hintUsed)}
        <h3>結果発表</h3>
        <div style={{ marginTop: 12 }}>{state.players.map((p, i) => state.activePlayers[i] ? (
          <div key={p}>{(() => {
            const score = state.scores[i]
            if (score >= 10) return `${p}さんは景品Aを獲得しました!! あなたは高専生より賢いです!!`
            if (score > 5) return `${p}さんは景品Bを獲得しました!`
            return `${p}さんは留年記念おみくじを獲得しました。`
          })()}</div>
        ) : null)}</div>
        {DebugInfoDiv}
      </div>
    )
  }

  return <div>Unknown</div>
}
