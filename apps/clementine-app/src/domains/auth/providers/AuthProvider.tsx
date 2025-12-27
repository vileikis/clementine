'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onIdTokenChanged } from 'firebase/auth'
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

  useEffect(() => {
    // Use onIdTokenChanged to detect custom claims changes
    const unsubscribe = onIdTokenChanged(auth, async (user: User | null) => {
      if (user) {
        // Get ID token and custom claims
        const idToken = await user.getIdToken()
        const idTokenResult =
          (await user.getIdTokenResult()) as TypedIdTokenResult

        // Create server session with ID token
        await createSessionFn({ data: { idToken } })

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
  }, [])

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
