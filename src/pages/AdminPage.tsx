import React, { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useGame, playersInitial, isHintSuitable } from '../context/GameContext'
import ScreenRenderer from '../components/ScreenRenderer'
import { useKeyHandler } from '../hooks/useKeyHandler'
import MediaTester from '../components/MediaTester'
import MicrobitWebSerial, { normalizeToPcolonOption } from '../components/parseSerial'
import { parseCsvText } from '../utils/parseCsv'

export const keyMap: Record<string, { player: number; option: string }> = {
  '1': { player: 0, option: 'A' },
  'q': { player: 0, option: 'B' },
  'a': { player: 0, option: 'C' },
  'z': { player: 0, option: 'D' },
  '2': { player: 1, option: 'A' },
  'w': { player: 1, option: 'B' },
  's': { player: 1, option: 'C' },
  'x': { player: 1, option: 'D' },
  '3': { player: 2, option: 'A' },
  'e': { player: 2, option: 'B' },
  'd': { player: 2, option: 'C' },
  'c': { player: 2, option: 'D' },
  '4': { player: 3, option: 'A' },
  'r': { player: 3, option: 'B' },
  'f': { player: 3, option: 'C' },
  'v': { player: 3, option: 'D' },
  '5': { player: 4, option: 'A' },
  't': { player: 4, option: 'B' },
  'g': { player: 4, option: 'C' },
  'b': { player: 4, option: 'D' },
}

const playerKeys: string[][] = [
  ['1','q','a','z'],
  ['2','w','s','x'],
  ['3','e','d','c'],
  ['4','r','f','v'],
  ['5','t','g','b'],
]


export default function AdminPage() {
  const { state, nextScreen, reset, setPlayerAnswer, markPlayerActive, requestHint, updateLastMessage, loadQuestions , getLinksOfQuiz} = useGame()
  const pressed = useRef<Set<string>>(new Set())
  const [csvErrors, setCsvErrors] = useState<string[] | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (k === 'l') { e.preventDefault(); nextScreen(); return }
    pressed.current.add(k)
    const m = keyMap[k]
    if (m) {
      if (state.screen === 'SETUP') { markPlayerActive(m.player) }
      else if (state.screen === 'QUIZ') { setPlayerAnswer(m.player, m.option) }
    }
    for (let i = 0; i < playerKeys.length; i++) {
      const allDown = playerKeys[i].every((kk) => pressed.current.has(kk))
      if (allDown) requestHint(i)
    }
  }, [nextScreen, setPlayerAnswer, markPlayerActive, requestHint, state.screen])

  const handleKeyUp = useCallback((e: KeyboardEvent) => { pressed.current.delete(e.key.toLowerCase()) }, [])

  useKeyHandler(handleKeyDown, handleKeyUp)


  const onFile = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      const { questions, errors } = parseCsvText(text)
      if (errors.length) {
        setCsvErrors(errors)
        updateLastMessage('CSVにエラーがあります（管理画面で確認してください）')
        return
      }
      setCsvErrors(null)
      loadQuestions(questions)
      updateLastMessage('CSVを読み込みました: ' + questions.length + ' 件')
    }
    reader.readAsText(file, 'utf-8')
  }

  let LinksLi: JSX.Element[] = []
  if (state.currentQuestion){
    console.log(state.currentQuestion)
    for (let l in state.currentQuestion.links){
      LinksLi.push(
        <li key={l}><a href={state.currentQuestion.links[l]}>
          {state.currentQuestion.links[l]}
        </a></li>
      )
    }
  }
  
  const HintRequestButton = (participants: boolean[], usedHint: boolean[], hintShown:boolean, answers: Record<number, string | null>): React.JSX.Element => {
    let Buttons: JSX.Element[] = []
    for (let i=0; i<participants.length; i++){
      if (participants[i]){
        if (usedHint[i]){
        Buttons.push(
          <button key={i} onClick={() => requestHint(i)} className='hint-used'>{playersInitial[i]}</button>
        )
        }else{
        Buttons.push(
          <button key={i} onClick={() => isHintSuitable(hintShown, answers, participants) && requestHint(i)} className='hint-not-used'>{playersInitial[i]}</button>
        )
        }
      }

    }
    return(
      <>
      {Buttons}
      </>
    )
  }

  const handleLine = (line: string) => {
    // normalize をコンポーネント側（フックが使える場所）で実行し、
    // setPlayerAnswer を安全に呼ぶ
    const normalized = normalizeToPcolonOption(line);
    if (!normalized) return;
    const player = Number(normalized.slice(1, 2))-1;
    const option = normalized.slice(3, 4);
    setPlayerAnswer(player, option);
  };
  

  return (
    <div className="page">
      <h1>運営用Document</h1>
      <div className="page__card">
        <h2>管理パネル</h2>
        <div>現在の画面: <strong>{state.screen}</strong></div>
        <div>
          <button onClick={nextScreen} className="page__button">次の画面に進める (l と同じ)</button>
          <button onClick={reset} className="page__button" style={{ marginLeft: 8 }}>リセット (結果 {"->"} タイトル)</button>
        </div>
        <div>
          <label>CSV アップロード: <input type="file" accept="text/csv" onChange={(e) => onFile(e.target.files?.[0])} /></label>
        </div>
        {csvErrors ? (
          <div style={{ marginTop: 12, color: '#b91c1c' }}>
            <strong>CSV エラー一覧</strong>
            <ul>{csvErrors.map((er, idx) => <li key={idx}>{er}</li>)}</ul>
          </div>
        ) : null}
      </div>
      <div className="microbit-connecter">
        <MicrobitWebSerial onLine={handleLine}/>
      </div>
      <div>
        <h3 className='admin-info'>ヒント表示ボタン-1人1回まで</h3>
        {HintRequestButton(state.activePlayers, state.hintUsed, state.hintShown, state.answers)}
      </div>
      <div>
        <h3 className='admin-info'>ヒント</h3>
        <div>{state.currentQuestion?.hint}</div>
      </div>
      <div>
        <h3 className='admin-info'>解答</h3>
        <div>{state.correctAnswer} - {state.currentQuestion?.explanation}</div>
      </div>
      <div className = "styles.accent-pink">{state.lastMessage}</div>
      <div>
        <h3 className='admin-info'>参考リンク</h3>
        <ul>
        {LinksLi}
        </ul>
      </div>
      <div style={{ marginTop: 18, border: 'solid' }}>
        <h3>プレビュー（参加者表示）</h3>
        <div className="page__preview-box"><ScreenRenderer state={state} isAdmin={true} /></div>
      </div>
      <div style={{ marginTop: 18 }}>
        <Link to="/" target="_blank" rel="noreferrer">参加者用Document を別タブで開く</Link>
      </div>
    </div>
  )
}
