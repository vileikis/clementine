import { signOut } from 'firebase/auth'
import { useAuth } from '../providers/AuthProvider'
import { signOutFn } from '../server/functions'
import { auth } from '@/integrations/firebase/client'

// T039: Create WaitingMessage component for non-admin authenticated users

export function WaitingMessage() {
  const { user } = useAuth()

  const handleSignOut = async () => {
    try {
      // Sign out from Firebase (client-side)
      await signOut(auth)
      // Clear server session and redirect
      await signOutFn()
    } catch (err) {
      console.error('Sign-out error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg
              className="h-6 w-6 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Access Pending</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your account has been created successfully.
          </p>
        </div>

        {/* Waiting message card */}
        <div className="bg-white shadow rounded-lg p-8">
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
                <p className="text-sm font-medium text-gray-900">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Waiting message */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Admin Access Required
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your account is awaiting admin approval. An administrator needs
                to grant you access before you can use this application.
              </p>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">
                Please contact your administrator to request access. You'll be
                able to sign in once your account has been approved.
              </p>
            </div>

            {/* Next steps */}
            <div className="bg-blue-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                What happens next?
              </h3>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                <li>Contact your administrator to request access</li>
                <li>Administrator grants you admin privileges</li>
                <li>Sign out and sign back in to activate your access</li>
              </ol>
            </div>

            {/* Sign out button (44x44px minimum touch target) */}
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center px-6 py-3 min-h-[44px] border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
