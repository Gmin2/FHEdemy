import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import PlaygroundPage from './pages/PlaygroundPage'
import StepsPage from './pages/StepsPage'
import { TopNav } from './components/TopNav'
import { initializeContent } from './mapping'

export default function App() {
  useEffect(() => {
    initializeContent()
  }, [])

  return (
    <BrowserRouter>
      <div className="page">
        <TopNav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/steps" element={<StepsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
