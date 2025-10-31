import React, { useEffect, useRef, useState } from 'react'
import { useGame } from '../context/GameContext'
import { Screen } from '../context/GameContext'

/**
 * TutorialPanel
 * - SETUP（画面2）上で動作する参加者ごとの逐次チュートリアル
 * - プレイヤーごとに独立して進行（誰かを待たない）
 * - 前提: GameContext.state.answers が運営キー入力で更新されること
 */

/* 物理キー配列（行 = 選択肢 A,B,C,D / 列 = プレイヤー α..ε） */
const playerKeysRows = [
  ['1', '2', '3', '4', '5'], // A
  ['q', 'w', 'e', 'r', 't'], // B
  ['a', 's', 'd', 'f', 'g'], // C
  ['z', 'x', 'c', 'v', 'b'], // D
]

const optionLetters = ['A', 'B', 'C', 'D']

export default function TutorialPanel(): JSX.Element {
  const { state } = useGame()
  const { players, activePlayers, answers, screen } = state

  // Refs for low-latency / mutation-based tracking
  const pressedRef = useRef<Array<Set<string>>>(players.map(() => new Set<string>()))
  const stepRef = useRef<number[]>(players.map(() => 0))
  const completedRef = useRef<boolean[]>(players.map(() => false))

  // Reactive state for rendering
  const [pressedSets, setPressedSets] = useState<Array<Set<string>>>(players.map(() => new Set()))
  const [steps, setSteps] = useState<number[]>(players.map(() => 0))
  const [completed, setCompleted] = useState<boolean[]>(players.map(() => false))

  // Reset when entering SETUP or when players length changes
  useEffect(() => {
    if (screen === Screen.SETUP) {
      pressedRef.current = players.map(() => new Set())
      stepRef.current = players.map(() => 0)
      completedRef.current = players.map(() => false)
      setPressedSets(players.map(() => new Set()))
      setSteps(players.map(() => 0))
      setCompleted(players.map(() => false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, players.length])

  // Commit refs into reactive state for rendering
  const commitRefsToState = () => {
    setPressedSets(pressedRef.current.map((s) => new Set(s)))
    setSteps([...stepRef.current])
    setCompleted([...completedRef.current])
  }

  // Watch answers (updated by admin keypresses) and update per-player tutorial progress
  useEffect(() => {
    if (screen !== Screen.SETUP) return
    players.forEach((_, i) => {
      if (!activePlayers[i]) return
      const ans = answers[i] as string | null | undefined
      if (!ans) return
      const upper = ans.toUpperCase()
      // record pressed option if newly observed
      if (!pressedRef.current[i].has(upper)) {
        pressedRef.current[i].add(upper)
      }
      // advance tutorial steps according to spec
      if (!completedRef.current[i]) {
        const curStep = stepRef.current[i]
        if (curStep === 0 && upper === 'A') {
          stepRef.current[i] = 1
        } else if (curStep === 1 && upper === 'C') {
          stepRef.current[i] = 2
        } else if (curStep === 2) {
          const hasAll = optionLetters.every((L) => pressedRef.current[i].has(L))
          if (hasAll) {
            completedRef.current[i] = true
          }
        }
      }
    })
    commitRefsToState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, activePlayers, screen])

  // helper to produce the hint text per player
  const hintTextFor = (playerIndex: number): string => {
    if (!activePlayers[playerIndex]) return '参加者求ム!'
    return '参加登録済み!!!'
  }

  return (
    <div className="tutorial">
      {players.map((name, i) => {
        const isActive = !!activePlayers[i]
        const pressed = pressedSets[i] ?? new Set<string>()
        const done = completed[i] ?? false

        return (
          <div key={i} className="tutorial__col">
            <div className="tutorial__name">{name}</div>

            {!isActive && (
              <div className="tutorial__status tutorial__status--need">
                参加者求ム!
              </div>
            )}

            {isActive && (
              <>
                <div className="tutorial__choices" role={`group`} aria-label={`player-${name}-choices`}>
                </div>

                <div className="tutorial__hint">
                  {done ? 'おめでとう！準備完了です。' : hintTextFor(i)}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
