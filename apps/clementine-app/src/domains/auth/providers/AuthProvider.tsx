'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onIdTokenChanged } from 'firebase/auth'
import { useServerFn } from '@tanstack/react-start'
import { createSessionFn } from '../server/functions'
import type { User } from 'firebase/auth'
import type { AuthState, TypedIdTokenResult } from '../types/auth.types'
import { auth } from '@/integrations/firebase/client'

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isAnonymous: false,
    isLoading: true,
    idTokenResult: null,
  })

  // Wrap server function with useServerFn hook
  const createSession = useServerFn(createSessionFn)

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

  return (
    <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
