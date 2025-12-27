import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useServerFn } from '@tanstack/react-start'
import { useAuth } from '../providers/AuthProvider'
import { createSessionFn } from '../server'
import { WaitingMessage } from './WaitingMessage'
import { auth } from '@/integrations/firebase/client'

// T140: Replace Google OAuth button with email/password login form
// T141: Implement email input field with validation (email format)
// T142: Implement password input field with show/hide toggle
// T143: Implement form submission with signInWithEmailAndPassword()
// T144: Add error handling for email/password errors
// T151: Apply mobile-first styles (320px-768px viewport)
// T152: Ensure form inputs meet 44x44px minimum touch target

export function LoginPage() {
  const { isAdmin, user, isAnonymous, isLoading } = useAuth()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const createSession = useServerFn(createSessionFn)

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningIn(true)
    setError(null)

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      setIsSigningIn(false)
      return
    }

    if (!password) {
      setError('Please enter your password.')
      setIsSigningIn(false)
      return
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      )

      // Create session after successful authentication
      const idToken = await userCredential.user.getIdToken()
      await createSession({ data: { idToken } })

      // After sign-in, redirect logic is handled by beforeLoad in route
    } catch (err) {
      console.error('Sign-in error:', err)

      // Handle specific Firebase auth errors
      if (err instanceof Error) {
        const errorCode = (err as any).code
        switch (errorCode) {
          case 'auth/invalid-email':
            setError('Invalid email address.')
            break
          case 'auth/wrong-password':
          case 'auth/user-not-found':
          case 'auth/invalid-credential':
            setError('Invalid email or password.')
            break
          case 'auth/too-many-requests':
            setError(
              'Too many failed attempts. Please try again later or reset your password.',
            )
            break
          case 'auth/network-request-failed':
            setError('Network error. Please check your connection.')
            break
          default:
            setError('Sign-in failed. Please try again.')
        }
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setIsSigningIn(false)
    }
  }

  // Show loading state while auth initializes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is authenticated and not anonymous but not admin, show waiting message
  if (user && !isAnonymous && !isAdmin) {
    return <WaitingMessage />
  }

  // Show login page for unauthenticated or anonymous users
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Sign-in card */}
        <div className="bg-white shadow rounded-lg p-8">
          <form onSubmit={handleEmailPasswordSignIn} className="space-y-6">
            {/* Email input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 min-h-[44px] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSigningIn}
                placeholder="you@example.com"
              />
            </div>

            {/* Password input with show/hide toggle */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 min-h-[44px] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSigningIn}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 min-h-[44px] min-w-[44px]"
                  disabled={isSigningIn}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Sign in button (44x44px minimum touch target) */}
            <button
              type="submit"
              disabled={isSigningIn}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 min-h-[44px] border border-transparent rounded-md shadow-sm bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSigningIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info message */}
            <div className="text-center text-sm text-gray-500">
              <p>Admin access is required to use this application.</p>
              <p className="mt-1">
                Contact your administrator if you need access.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
