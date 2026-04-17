import { Routes, Route } from "react-router-dom"

import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import Test from "./pages/Test"
import Layout from "./layouts/MainLayout"
import TabsLayout from "./layouts/TabsLayout"
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TabsLayout />}>
        <Route index element={<Test />} />
        <Route path="*" element={<Test />} /> {/* Fallback route */}
      </Route>
      <Route path="/" element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
        <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  )
}

export default App
