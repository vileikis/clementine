import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { signOut } from 'firebase/auth'
import { auth } from '@/integrations/firebase/client'
import { logoutFn } from '@/domains/auth/server/functions'
import { useEffect } from 'react'

// Logout route - handles user logout
// Clears both client-side Firebase auth and server-side session

function LogoutPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const performLogout = async () => {
      try {
        console.log('Starting logout process...')

        // Step 1: Clear client-side Firebase auth state
        await signOut(auth)
        console.log('Client-side auth cleared')

        // Step 2: Clear server-side session
        await logoutFn()
        console.log('Server-side session cleared')
      } catch (error) {
        // logoutFn throws a redirect, catch it and navigate manually
        console.log('Logout completed, navigating to /login')
        navigate({ to: '/login' })
      }
    }

    performLogout()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Logging out...</h1>
        <p className="mt-2 text-gray-600">Please wait</p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/logout/')({
  component: LogoutPage,
})
