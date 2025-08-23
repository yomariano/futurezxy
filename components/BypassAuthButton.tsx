'use client'

import Link from 'next/link'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'

interface BypassAuthButtonProps {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
  className?: string
}

export default function BypassAuthButton({ children, variant = "default", className }: BypassAuthButtonProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('🔓 BYPASS AUTH: Redirecting to signals page without authentication')
    
    // Method 1: Next.js router
    router.push('/signals')
    
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
      <Link href="/signals" className="hidden">
        Backup Link
      </Link>
    </>
  )
}