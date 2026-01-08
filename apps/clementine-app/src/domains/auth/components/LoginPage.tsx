import { CircleAlert, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../providers/AuthProvider'
import { useEmailPasswordSignIn } from '../hooks/useEmailPasswordSignIn'
import { WaitingMessage } from './WaitingMessage'
import { Button } from '@/ui-kit/ui/button'
import { Input } from '@/ui-kit/ui/input'

export function LoginPage() {
  const { isAdmin, user, isAnonymous, isLoading } = useAuth()
  const {
    email,
    password,
    showPassword,
    isSigningIn,
    error,
    setEmail,
    setPassword,
    togglePasswordVisibility,
    signIn,
  } = useEmailPasswordSignIn()

  // Show loading state while auth initializes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Sign-in card */}
        <div className="bg-card shadow rounded-lg p-8">
          <form onSubmit={signIn} className="space-y-6">
            {/* Email input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-card-foreground mb-1"
              >
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSigningIn}
                placeholder="you@example.com"
                className="min-h-[44px]"
              />
            </div>

            {/* Password input with show/hide toggle */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-card-foreground mb-1"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSigningIn}
                  placeholder="Enter your password"
                  className="pr-12 min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 min-h-[44px] min-w-[44px]"
                  disabled={isSigningIn}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign in button (44x44px minimum touch target) */}
            <Button
              type="submit"
              disabled={isSigningIn}
              className="w-full min-h-[44px]"
              size="lg"
            >
              {isSigningIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </Button>

            {/* Error message */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <CircleAlert className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Info message */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Admin access is required to use this application.</p>
              <p className="mt-1">
                Contact your administrator if you need access.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
