'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getAuth, onIdTokenChanged } from 'firebase/auth'
import type { User } from 'firebase/auth'
import type { AuthState, TypedIdTokenResult } from '../types/auth.types'

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
    const auth = getAuth()

    // Use onIdTokenChanged to detect custom claims changes
    const unsubscribe = onIdTokenChanged(auth, async (user: User | null) => {
      if (user) {
        const idTokenResult =
          (await user.getIdTokenResult()) as TypedIdTokenResult

        setAuthState({
          user,
          isAdmin: idTokenResult.claims.admin === true,
          isAnonymous: user.isAnonymous,
          isLoading: false,
          idTokenResult,
        })
      } else {
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
