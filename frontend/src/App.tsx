import { Routes, Route } from "react-router-dom"

import LoginPage from './pages/LoginPage'
import Test from './pages/Test'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Test />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Test />} /> {/* Fallback route */}
    </Routes>
  )
}

export default App