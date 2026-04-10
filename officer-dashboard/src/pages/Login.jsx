import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CustomerLogin from '../components/CustomerLogin'
import { useAuth } from '../contexts/AuthContext'

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const { login } = useAuth()

  const handleSuccess = (payload) => {
    if (payload?.policy) {
      localStorage.setItem('policy_number', payload.policy)
    }
    if (payload?.vehicle) {
      localStorage.setItem('vehicle_ref', payload.vehicle)
    }
    login('customer')
    navigate(next, { replace: true })
  }

  const handleClose = () => {
    navigate(-1)
  }

  return (
    <CustomerLogin onSuccess={handleSuccess} onClose={handleClose} />
  )
}

export default Login
