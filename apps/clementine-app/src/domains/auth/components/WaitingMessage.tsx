import { useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { useServerFn } from '@tanstack/react-start'
import { useAuth } from '../providers/AuthProvider'
import { logoutFn } from '../server/functions'
import { auth } from '@/integrations/firebase/client'
import { Button } from '@/ui-kit/components/button'

// T039: Create WaitingMessage component for non-admin authenticated users

export function WaitingMessage() {
  const { user } = useAuth()
  const serverLogout = useServerFn(logoutFn)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      // Sign out from Firebase (client-side)
      await signOut(auth)
      // Clear server session and redirect
      await serverLogout()
    } catch (err) {
      console.error('Sign-out error:', err)
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-warning/20 mb-4">
            <TriangleAlert className="h-6 w-6 text-warning-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Access Pending</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account has been created successfully.
          </p>
        </div>

        {/* Waiting message card */}
        <div className="bg-card shadow rounded-lg p-8">
          <div className="space-y-6">
            {/* User info */}
            <div className="flex items-center space-x-4">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-12 w-12 rounded-full"
                />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Waiting message */}
            <div className="border-t border-border pt-6">
              <h2 className="text-lg font-medium text-card-foreground mb-2">
                Admin Access Required
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your account is awaiting admin approval. An administrator needs
                to grant you access before you can use this application.
              </p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Please contact your administrator to request access. You'll be
                able to sign in once your account has been approved.
              </p>
            </div>

            {/* Next steps */}
            <div className="bg-info rounded-md p-4">
              <h3 className="text-sm font-medium text-info-foreground mb-2">
                What happens next?
              </h3>
              <ol className="list-decimal list-inside text-sm text-info-foreground space-y-1">
                <li>Contact your administrator to request access</li>
                <li>Administrator grants you admin privileges</li>
                <li>Sign out and sign back in to activate your access</li>
              </ol>
            </div>

            {/* Sign out button (44x44px minimum touch target) */}
            <div className="border-t border-border pt-6">
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="lg"
                className="w-full min-h-[44px]"
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground"></div>
                    <span>Signing out...</span>
                  </>
                ) : (
                  <span>Sign Out</span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
