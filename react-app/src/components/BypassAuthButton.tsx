import { Link } from 'react-router-dom'
import { Button } from './ui/button'
import { useNavigate } from 'react-router-dom'

interface BypassAuthButtonProps {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  className?: string
}

export default function BypassAuthButton({ children, variant = "default", className }: BypassAuthButtonProps) {
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('🔓 BYPASS AUTH: Redirecting to signals page without authentication')
    
    // Method 1: React Router navigate
    navigate('/signals')
    
    // Method 2: Fallback with window location
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        console.log('🔓 BACKUP: Using window.location redirect')
        window.location.href = '/signals'
      }, 200)
    }
  }

  return (
    <>
      {/* Button with onClick handler */}
      <Button 
        variant={variant} 
        className={className}
        onClick={handleClick}
      >
        {children}
      </Button>
      
      {/* Invisible backup Link - in case JavaScript fails */}
      <Link to="/signals" className="hidden">
        Backup Link
      </Link>
    </>
  )
}