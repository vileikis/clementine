import { useCallback, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/integrations/firebase/client'

interface SubmitGuestEmailParams {
  projectId: string
  sessionId: string
  email: string
}

interface SubmitGuestEmailResponse {
  success: boolean
}

/**
 * Mutation hook for submitting guest email via Firebase callable.
 *
 * Returns submit function and state (isSubmitting, isSubmitted, submittedEmail, error).
 */
export function useSubmitGuestEmail() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const submitEmail = useCallback(async (params: SubmitGuestEmailParams) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const callable = httpsCallable<
        SubmitGuestEmailParams,
        SubmitGuestEmailResponse
      >(functions, 'submitGuestEmail')
      await callable(params)
      setIsSubmitted(true)
      setSubmittedEmail(params.email)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to submit email'
      setError(message)
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return { submitEmail, isSubmitting, isSubmitted, submittedEmail, error }
}
