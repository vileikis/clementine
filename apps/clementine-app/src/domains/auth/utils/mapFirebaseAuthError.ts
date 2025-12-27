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
    case 'auth/invalid-email':
      return 'Invalid email address.'
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email or password.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later or reset your password.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    default:
      return 'Sign-in failed. Please try again.'
  }
}
