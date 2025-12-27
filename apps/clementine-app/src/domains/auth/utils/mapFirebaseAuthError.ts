/**
 * Maps Firebase Auth error codes to user-friendly error messages
 * @param error - The error object from Firebase Auth
 * @returns User-friendly error message
 */
export function mapFirebaseAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred.'
  }

  const errorCode = (error as { code?: string }).code

  switch (errorCode) {
    // Email/password authentication errors
    case 'auth/invalid-email':
      return 'Invalid email address.'
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support for assistance.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'

    // Rate limiting
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later or reset your password.'

    // Network errors
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.'

    // Popup/redirect errors (OAuth flows)
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.'
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups for this site.'
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled due to another popup being opened.'
    case 'auth/redirect-operation-pending':
      return 'A sign-in operation is already in progress.'

    // Session errors
    case 'auth/timeout':
      return 'Sign-in timed out. Please try again.'
    case 'auth/internal-error':
      return 'An internal error occurred. Please try again.'

    // Anonymous auth errors
    case 'auth/operation-not-allowed':
      return 'This authentication method is not enabled. Contact support.'

    // Generic fallback
    default:
      return 'Sign-in failed. Please try again.'
  }
}
