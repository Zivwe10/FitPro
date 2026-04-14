import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Workouts from './pages/Workouts'
import Progress from './pages/Progress'
import Nutrition from './pages/Nutrition'
import Settings from './pages/Settings'
import Coach from './pages/Coach'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

function App() {
  const { userId, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  const protectedLayout = (component) => (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        {component}
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/dashboard"
          element={userId ? protectedLayout(<Dashboard />) : <Navigate to="/onboarding" replace />}
        />
        <Route
          path="/workouts"
          element={userId ? protectedLayout(<Workouts />) : <Navigate to="/onboarding" replace />}
        />
        <Route
          path="/progress"
          element={userId ? protectedLayout(<Progress />) : <Navigate to="/onboarding" replace />}
        />
        <Route
          path="/nutrition"
          element={userId ? protectedLayout(<Nutrition />) : <Navigate to="/onboarding" replace />}
        />
        <Route
          path="/settings"
          element={userId ? protectedLayout(<Settings />) : <Navigate to="/onboarding" replace />}
        />
        <Route
          path="/coach"
          element={userId ? protectedLayout(<Coach />) : <Navigate to="/onboarding" replace />}
        />
        <Route path="/" element={userId ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
