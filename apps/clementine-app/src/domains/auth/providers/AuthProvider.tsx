'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { onIdTokenChanged, signOut } from 'firebase/auth'
import { useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import * as Sentry from '@sentry/tanstackstart-react'
import { clearSessionFn, createSessionFn } from '../server/functions'
import type { User } from 'firebase/auth'
import type {
  AuthContextValue,
  AuthState,
  TypedIdTokenResult,
} from '../types/auth.types'
import { auth } from '@/integrations/firebase/client'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isAnonymous: false,
    isLoading: true,
    idTokenResult: null,
  })

  const router = useRouter()

  // Wrap server functions with useServerFn hook
  const createSession = useServerFn(createSessionFn)
  const clearSession = useServerFn(clearSessionFn)

  /**
   * Logout user (clears both Firebase auth and server session)
   * Automatically navigates to /login after logout
   */
  const logout = useCallback(async () => {
    try {
      // 1. Clear Firebase client auth
      await signOut(auth)

      // 2. Clear server session
      await clearSession()

      // 3. Navigate to login
      router.navigate({ to: '/login' })
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: 'AuthProvider', action: 'logout' },
      })
      // Defensive: Navigate to login even if error occurred
      router.navigate({ to: '/login' })
    }
  }, [clearSession, router])

  useEffect(() => {
    // Use onIdTokenChanged to detect custom claims changes
    const unsubscribe = onIdTokenChanged(auth, async (user: User | null) => {
      if (user) {
        // Get ID token and custom claims
        const idToken = await user.getIdToken()
        const idTokenResult =
          (await user.getIdTokenResult()) as TypedIdTokenResult

        // Create server session with ID token
        await createSession({ data: { idToken } })

        setAuthState({
          user,
          isAdmin: idTokenResult.claims.admin === true,
          isAnonymous: user.isAnonymous,
          isLoading: false,
          idTokenResult,
        })
      } else {
        // User signed out - client state only (session cleared by signOutFn)
        setAuthState({
          user: null,
          isAdmin: false,
          isAnonymous: false,
          isLoading: false,
          idTokenResult: null,
        })
      }
    })

    return () => unsubscribe()
  }, [createSession])

  const value: AuthContextValue = {
    ...authState,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
