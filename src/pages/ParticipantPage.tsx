import React from 'react'
import { useGame } from '../context/GameContext'
import ScreenRenderer from '../components/ScreenRenderer'

export default function ParticipantPage() {
  const { state, nextScreen, getQuizDuration } = useGame()
  return (
    <div className="page">
      <div className="page__card">
        <div className="page__screen-box"><ScreenRenderer state={state} isAdmin = {false} nextScreen={nextScreen} getQuizDuration={getQuizDuration}/></div>
      </div>
      <div className= "accent-pink" >{state.lastMessage}</div>
    </div>
  )
}
