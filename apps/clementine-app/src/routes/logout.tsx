import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '@/domains/auth'

// Logout route - handles user logout
// Clears both client-side Firebase auth and server-side session via AuthProvider

function LogoutPage() {
  const { logout } = useAuth()

  useEffect(() => {
    logout()
  }, [logout])

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
