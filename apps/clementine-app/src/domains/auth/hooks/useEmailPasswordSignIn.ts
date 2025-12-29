import { useReducer } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useServerFn } from '@tanstack/react-start'
import { useRouter } from '@tanstack/react-router'
import * as Sentry from '@sentry/tanstackstart-react'
import { createSessionFn } from '../server/functions'
import { mapFirebaseAuthError } from '../utils/mapFirebaseAuthError'
import { auth } from '@/integrations/firebase/client'

// State type
interface SignInState {
  email: string
  password: string
  showPassword: boolean
  isSigningIn: boolean
  error: string | null
}

// Action types
type SignInAction =
  | { type: 'SET_EMAIL'; payload: string }
  | { type: 'SET_PASSWORD'; payload: string }
  | { type: 'TOGGLE_PASSWORD_VISIBILITY' }
  | { type: 'SIGN_IN_START' }
  | { type: 'SIGN_IN_SUCCESS' }
  | { type: 'SIGN_IN_ERROR'; payload: string }

// Initial state
const initialState: SignInState = {
  email: '',
  password: '',
  showPassword: false,
  isSigningIn: false,
  error: null,
}

// Reducer
function signInReducer(state: SignInState, action: SignInAction): SignInState {
  switch (action.type) {
    case 'SET_EMAIL':
      return { ...state, email: action.payload, error: null }
    case 'SET_PASSWORD':
      return { ...state, password: action.payload, error: null }
    case 'TOGGLE_PASSWORD_VISIBILITY':
      return { ...state, showPassword: !state.showPassword }
    case 'SIGN_IN_START':
      return { ...state, isSigningIn: true, error: null }
    case 'SIGN_IN_SUCCESS':
      return { ...state, isSigningIn: false, error: null }
    case 'SIGN_IN_ERROR':
      return { ...state, isSigningIn: false, error: action.payload }
    default:
      return state
  }
}

/**
 * Custom hook for email/password sign-in with Firebase Auth
 * Manages form state and sign-in flow using useReducer
 */
export function useEmailPasswordSignIn() {
  const [state, dispatch] = useReducer(signInReducer, initialState)
  const createSession = useServerFn(createSessionFn)
  const router = useRouter()

  const setEmail = (email: string) => {
    dispatch({ type: 'SET_EMAIL', payload: email })
  }

  const setPassword = (password: string) => {
    dispatch({ type: 'SET_PASSWORD', payload: password })
  }

  const togglePasswordVisibility = () => {
    dispatch({ type: 'TOGGLE_PASSWORD_VISIBILITY' })
  }

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'SIGN_IN_START' })

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        state.email,
        state.password,
      )

      // Create session after successful authentication
      const idToken = await userCredential.user.getIdToken()
      await createSession({ data: { idToken } })

      dispatch({ type: 'SIGN_IN_SUCCESS' })

      // Invalidate and navigate to workspace landing page
      // This will redirect to last visited workspace (if exists) or /admin/workspaces
      await router.invalidate()
      router.navigate({ to: '/workspace' })
    } catch (err) {
      Sentry.captureException(err, {
        tags: { component: 'useEmailPasswordSignIn', action: 'sign-in' },
      })
      const errorMessage = mapFirebaseAuthError(err)
      dispatch({ type: 'SIGN_IN_ERROR', payload: errorMessage })
    }
  }

  return {
    // State
    email: state.email,
    password: state.password,
    showPassword: state.showPassword,
    isSigningIn: state.isSigningIn,
    error: state.error,
    // Actions
    setEmail,
    setPassword,
    togglePasswordVisibility,
    signIn,
  }
}
