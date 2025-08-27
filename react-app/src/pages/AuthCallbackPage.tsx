import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // Handle auth callback logic here
    // For now, just redirect to signals page
    navigate('/signals')
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Completing authentication...</h2>
        <p className="text-gray-600">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  )
}