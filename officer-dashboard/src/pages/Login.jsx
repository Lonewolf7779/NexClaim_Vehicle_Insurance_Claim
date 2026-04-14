import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CustomerLogin from '../components/CustomerLogin'
import { useAuth } from '../contexts/AuthContext'

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const { loginCustomer } = useAuth()

  const handleSuccess = (payload) => {
    // The loginCustomer function has already been called in CustomerLogin
    // and the session has been persisted to localStorage
    // Just navigate to the next destination
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
