import { MotionConfig } from 'motion/react'
import { BrowserRouter, Route, Routes } from 'react-router'

import { HomePage } from './pages/HomePage'
import { PollPage } from './pages/PollPage'

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/p/:shareCode" element={<PollPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  )
}

export default App
