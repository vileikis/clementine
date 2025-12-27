import { useEffect, useRef, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import * as Sentry from '@sentry/tanstackstart-react'
import { auth as firebaseAuth } from '@/integrations/firebase/client'
import { useAuth } from '@/domains/auth'

interface GuestExperiencePageProps {
  projectId: string
}

export function GuestExperiencePage({ projectId }: GuestExperiencePageProps) {
  const auth = useAuth()
  const signingInRef = useRef(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Automatically sign in anonymously if not authenticated
  useEffect(() => {
    async function ensureAuth() {
      // Prevent duplicate sign-in attempts (React Strict Mode runs effects twice)
      if (auth.user || auth.isLoading || signingInRef.current) {
        return
      }

      signingInRef.current = true
      try {
        await signInAnonymously(firebaseAuth)
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            component: 'GuestExperiencePage',
            action: 'anonymous-signin',
          },
        })
        setAuthError(
          'Failed to sign in automatically. Please refresh the page to try again.',
        )
      } finally {
        signingInRef.current = false
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

  if (authError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Authentication Error
          </h1>
          <p className="text-muted-foreground">{authError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Refresh Page
          </button>
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
