import React, { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext(null)
const CUSTOMER_SESSION_KEY = 'customer_session'

const normalizeCustomerSession = (session) => {
  if (!session || typeof session !== 'object') return null

  const normalizedName = session.policeholderName || session.policyHolderName || session.name
  if (!normalizedName) return null

  return {
    ...session,
    policeholderName: normalizedName,
    name: normalizedName
  }
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({ customer: false, officer: false, supreme: false, samurai: false })
  const [customerUser, setCustomerUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const savedCustomerSession = sessionStorage.getItem(CUSTOMER_SESSION_KEY)
    const legacyCustomerSession = localStorage.getItem(CUSTOMER_SESSION_KEY)

    // Remove stale persistent customer session so a fresh portal visit starts logged out.
    if (legacyCustomerSession && !savedCustomerSession) {
      localStorage.removeItem(CUSTOMER_SESSION_KEY)
    }

    if (savedCustomerSession) {
      try {
        const parsedSession = JSON.parse(savedCustomerSession)
        const normalized = normalizeCustomerSession(parsedSession)
        if (normalized) {
          setCustomerUser(normalized)
          setAuth(prev => ({ ...prev, customer: true }))
        } else {
          sessionStorage.removeItem(CUSTOMER_SESSION_KEY)
        }
      } catch (err) {
        console.error('Failed to parse customer session:', err)
        sessionStorage.removeItem(CUSTOMER_SESSION_KEY)
      }
    }

    // Forcing officer roles to fresh start on page load for testing
    localStorage.removeItem('auth_officer')
    localStorage.removeItem('auth_supreme')
    localStorage.removeItem('auth_samurai')

    setAuthReady(true)
  }, [])

  const loginCustomer = (policyNumber, policeholderName) => {
    const session = {
      policyNumber,
      policeholderName,
      name: policeholderName,
      loginTime: new Date().toISOString()
    }
    sessionStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session))
    localStorage.removeItem(CUSTOMER_SESSION_KEY)
    setCustomerUser(session)
    setAuth(prev => ({ ...prev, customer: true }))
  }

  const logoutCustomer = () => {
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY)
    localStorage.removeItem(CUSTOMER_SESSION_KEY)
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
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY)
    localStorage.removeItem(CUSTOMER_SESSION_KEY)
    setCustomerUser(null)
    setAuth({ customer: false, officer: false, supreme: false, samurai: false })
  }

  return (
    <AuthContext.Provider value={{ 
      authReady,
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
