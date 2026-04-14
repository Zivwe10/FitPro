import React, { createContext, useState, useContext, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user_id exists in localStorage on mount
    const storedUserId = localStorage.getItem('user_id')
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10))
    }
    setIsLoading(false)
  }, [])

  const login = (newUserId, userData) => {
    localStorage.setItem('user_id', newUserId.toString())
    setUserId(newUserId)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('user_id')
    setUserId(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ userId, user, setUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
