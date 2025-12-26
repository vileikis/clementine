import { useEffect, useRef } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { auth as firebaseAuth } from '@/integrations/firebase/client'
import { useAuth } from '@/domains/auth'

interface GuestExperiencePageProps {
  projectId: string
}

export function GuestExperiencePage({ projectId }: GuestExperiencePageProps) {
  const auth = useAuth()
  const signingInRef = useRef(false)

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
