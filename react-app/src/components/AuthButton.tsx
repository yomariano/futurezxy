import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'

export default function AuthButton() {
  const navigate = useNavigate()

  const handleSignIn = () => {
    // 🚫🔐 AUTH COMPLETELY BYPASSED - Direct redirect to signals page
    console.log('🔓 Log in clicked - AUTH BYPASSED, redirecting to signals page');
    
    // Navigate to signals page
    navigate('/signals');
    
    // Fallback: direct window location redirect
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/signals';
      }, 100);
    }
  }

  const handleSignOut = () => {
    // 🚫🔐 AUTH BYPASSED - No sign out needed, just redirect to home
    console.log('🔓 Sign out clicked - AUTH BYPASSED, redirecting to home');
    navigate('/');
  }

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        className="text-base font-bold"
        onClick={handleSignIn}
      >
        Log in (Auth Bypassed)
      </Button>
    </div>
  )
} 