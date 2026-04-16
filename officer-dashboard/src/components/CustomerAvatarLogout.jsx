import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const extractCustomerName = (user) => {
  if (!user || typeof user !== 'object') return 'Customer'
  return user.name || user.policeholderName || user.policyHolderName || 'Customer'
}

const toInitials = (name) => {
  const cleaned = String(name || '')
    .trim()
    .replace(/\s+/g, ' ')

  if (!cleaned) return 'CU'

  const parts = cleaned.split(' ')
  const first = parts[0]?.[0] || ''
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : parts[0]?.[1] || ''
  return `${first}${second}`.toUpperCase() || 'CU'
}

function CustomerAvatarLogout({ className = '' }) {
  const navigate = useNavigate()
  const { auth, customerUser, logoutCustomer } = useAuth()

  if (!auth.customer) return null

  const customerName = extractCustomerName(customerUser)
  const initials = toInitials(customerName)

  const handleLogout = () => {
    logoutCustomer()
    navigate('/', { replace: true })
  }

  return (
    <button
      type="button"
      className={`nx-avatar-pill ${className}`.trim()}
      onClick={handleLogout}
      aria-label={`Logout ${customerName}`}
      title={`Wanna logout ${customerName}?`}
    >
      <span className="nx-avatar-circle">{initials}</span>
      <span className="nx-avatar-text">Wanna logout {customerName}?</span>
    </button>
  )
}

export default CustomerAvatarLogout
