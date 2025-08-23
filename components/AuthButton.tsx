'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'

export default function AuthButton() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignIn = async () => {
    // 🚫🔐 AUTH BYPASSED - Direct redirect to signals page
    console.log('🔓 Log in clicked - AUTH BYPASSED, redirecting to signals page');
    router.push('/signals')
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
      router.refresh()
    } catch (error) {
      console.warn('Sign out error:', error)
      // Clear local session even if server logout fails
      router.refresh()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="ghost" 
        className="text-base font-bold"
        onClick={handleSignIn}
      >
        Log in
      </Button>
    </div>
  )
} 