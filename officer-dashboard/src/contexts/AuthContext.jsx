import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ customer: false, officer: false, supreme: false, samurai: false })
  const [customerUser, setCustomerUser] = useState(null)

  useEffect(() => {
    // Load customer session from localStorage on mount
    const savedCustomerSession = localStorage.getItem('customer_session')
    if (savedCustomerSession) {
      try {
        const parsedSession = JSON.parse(savedCustomerSession)
        const normalized = (parsedSession && typeof parsedSession === 'object')
          ? {
            ...parsedSession,
            policeholderName: parsedSession.policeholderName || parsedSession.policyHolderName || parsedSession.name,
            name: parsedSession.name || parsedSession.policeholderName || parsedSession.policyHolderName
          }
          : parsedSession
        setCustomerUser(normalized)
        setAuth(prev => ({ ...prev, customer: true }))
      } catch (err) {
        console.error('Failed to parse customer session:', err)
        localStorage.removeItem('customer_session')
      }
    }

    // Forcing officer roles to fresh start on page load for testing
    localStorage.removeItem('auth_officer')
    localStorage.removeItem('auth_supreme')
    localStorage.removeItem('auth_samurai')
  }, [])

  const loginCustomer = (policyNumber, policeholderName) => {
    const session = {
      policyNumber,
      policeholderName,
      name: policeholderName,
      loginTime: new Date().toISOString()
    }
    localStorage.setItem('customer_session', JSON.stringify(session))
    setCustomerUser(session)
    setAuth(prev => ({ ...prev, customer: true }))
  }

  const logoutCustomer = () => {
    localStorage.removeItem('customer_session')
    setCustomerUser(null)
    setAuth(prev => ({ ...prev, customer: false }))
  }

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
    localStorage.removeItem('customer_session')
    setCustomerUser(null)
    setAuth({ customer: false, officer: false, supreme: false, samurai: false })
  }

  return (
    <AuthContext.Provider value={{ 
      auth, 
      login, 
      logout, 
      setRole,
      customerUser,
      loginCustomer,
      logoutCustomer
    }}>
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
