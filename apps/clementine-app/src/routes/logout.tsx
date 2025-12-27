import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { signOut } from 'firebase/auth'
import { useEffect } from 'react'
import { auth } from '@/integrations/firebase/client'
import { logoutFn } from '@/domains/auth/server/functions'

// Logout route - handles user logout
// Clears both client-side Firebase auth and server-side session

function LogoutPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Step 1: Clear client-side Firebase auth state
        await signOut(auth)

        // Step 2: Clear server-side session (this may throw a redirect)
        await logoutFn()

        // If logoutFn doesn't redirect, navigate manually
        navigate({ to: '/login' })
      } catch (error) {
        // logoutFn throws a redirect, catch it and navigate manually
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

export const Route = createFileRoute('/logout')({
  component: LogoutPage,
})
