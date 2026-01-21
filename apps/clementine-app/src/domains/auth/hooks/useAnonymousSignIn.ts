import { useCallback, useRef, useState } from 'react'
import { signInAnonymously } from 'firebase/auth'
import { useServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { createSessionFn } from '../server/functions'
import { auth } from '@/integrations/firebase/client'

export interface UseAnonymousSignInReturn {
  /** True while sign-in is in progress */
  isSigningIn: boolean
  /** Error message if sign-in failed */
  error: string | null
  /** Trigger anonymous sign-in */
  signIn: () => Promise<void>
}

/**
 * Hook for anonymous Firebase authentication
 *
 * Used for guest experiences where users don't need to create an account.
 * Creates a server session after successful authentication.
 *
 * @example
 * ```tsx
 * function GuestPage() {
 *   const { user, isLoading: authLoading } = useAuth()
 *   const { signIn, isSigningIn, error } = useAnonymousSignIn()
 *
 *   useEffect(() => {
 *     if (!authLoading && !user) {
 *       signIn()
 *     }
 *   }, [authLoading, user, signIn])
 *
 *   if (authLoading || isSigningIn) return <Loading />
 *   if (error) return <Error message={error} />
 *   // User is now authenticated
 * }
 * ```
 */
export function useAnonymousSignIn(): UseAnonymousSignInReturn {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const signingInRef = useRef(false)

  const createSession = useServerFn(createSessionFn)

  const signIn = useCallback(async () => {
    // Prevent duplicate sign-in attempts (React Strict Mode)
    if (signingInRef.current) {
      return
    }

    signingInRef.current = true
    setIsSigningIn(true)
    setError(null)

    try {
      const userCredential = await signInAnonymously(auth)

      // Create server session after successful authentication
      const idToken = await userCredential.user.getIdToken()
      await createSession({ data: { idToken } })
    } catch (err) {
      Sentry.captureException(err, {
        tags: { component: 'useAnonymousSignIn', action: 'sign-in' },
      })
      setError('Failed to sign in. Please refresh and try again.')
    } finally {
      signingInRef.current = false
      setIsSigningIn(false)
    }
  }, [createSession])

  return {
    isSigningIn,
    error,
    signIn,
  }
}
