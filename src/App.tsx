import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import ParticipantPage from './pages/ParticipantPage'
import AdminPage from './pages/AdminPage'
import Error404 from './pages/error404'
import express from 'express'

export default function App(): JSX.Element {
  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<ParticipantPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </GameProvider>
  )
}