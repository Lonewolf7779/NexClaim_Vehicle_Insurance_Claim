import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ customer: false, officer: false, supreme: false, samurai: false })

  useEffect(() => {
    const initial = {
      customer: localStorage.getItem('auth_customer') === 'true',
      officer: localStorage.getItem('auth_officer') === 'true',
      supreme: localStorage.getItem('auth_supreme') === 'true',
      samurai: localStorage.getItem('auth_samurai') === 'true'
    }
    setAuth(initial)
  }, [])

  const login = (role) => {
    localStorage.setItem(`auth_${role}`, 'true')
    setAuth(prev => ({ ...prev, [role]: true }))
  }

  const setRole = (role, value) => {
    localStorage.setItem(`auth_${role}`, value ? 'true' : 'false')
    setAuth(prev => ({ ...prev, [role]: value }))
  }

  const logout = () => {
    localStorage.removeItem('auth_customer')
    localStorage.removeItem('auth_officer')
    localStorage.removeItem('auth_supreme')
    localStorage.removeItem('auth_samurai')
    setAuth({ customer: false, officer: false, supreme: false, samurai: false })
  }

  return (
    <AuthContext.Provider value={{ auth, login, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
