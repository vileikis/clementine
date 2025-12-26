import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { useAuth } from '@/domains/auth'

export const Route = createFileRoute('/guest/$projectId/')({
  component: GuestPage,
})

function GuestPage() {
  const { projectId } = Route.useParams()
  const auth = useAuth()

  // Automatically sign in anonymously if not authenticated
  useEffect(() => {
    async function ensureAuth() {
      if (!auth.user && !auth.isLoading) {
        const firebaseAuth = getAuth()
        await signInAnonymously(firebaseAuth)
      }
    }
    ensureAuth()
  }, [auth.user, auth.isLoading])

  if (auth.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Guest Experience</h1>
        <p className="text-muted-foreground mt-2">Project ID: {projectId}</p>
        {auth.isAnonymous && (
          <p className="text-sm text-muted-foreground mt-4">
            You have been automatically signed in as a guest
          </p>
        )}
        {auth.user && !auth.isAnonymous && (
          <p className="text-sm text-muted-foreground mt-4">
            Signed in as: {auth.user.email}
          </p>
        )}
      </div>
    </div>
  )
}
