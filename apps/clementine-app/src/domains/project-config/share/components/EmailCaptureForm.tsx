/**
 * EmailCaptureForm Component
 *
 * Email input + submit button for the guest loading screen.
 * Client-side validation, mobile-first with 44x44px touch targets.
 * Shows confirmation message after successful submission.
 *
 * Uses themed components for consistent guest-facing styling.
 */

import { useState } from 'react'
import { Send } from 'lucide-react'
import { EMAIL_REGEX } from '../constants'
import type { FormEvent } from 'react'
import { ThemedButton, ThemedInput, ThemedText } from '@/shared/theming'

export interface EmailCaptureFormProps {
  onSubmit?: (email: string) => Promise<void>
  isSubmitted: boolean
  submittedEmail: string | null
  heading?: string | null
  successMessage?: string | null
}

export function EmailCaptureForm({
  onSubmit,
  isSubmitted,
  submittedEmail,
  heading,
  successMessage,
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [localSubmittedEmail, setLocalSubmittedEmail] = useState<string | null>(
    null,
  )

  // Derive success state from either local optimistic state or session prop
  const effectiveEmail = localSubmittedEmail ?? submittedEmail
  const showSuccess = isSubmitted || !!localSubmittedEmail

  if (showSuccess && effectiveEmail) {
    const message = successMessage
      ? successMessage.replace('{email}', effectiveEmail)
      : `We'll send your result to ${effectiveEmail}`

    return (
      <div className="w-full space-y-3 text-center">
        <ThemedText variant="body" className="opacity-90">
          {message}
        </ThemedText>
        <ThemedButton
          variant="outline"
          size="sm"
          onClick={() => {
            setLocalSubmittedEmail(null)
            setEmail(effectiveEmail)
          }}
        >
          Change email
        </ThemedButton>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setValidationError('Please enter your email')
      return
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setValidationError('Please enter a valid email')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit?.(trimmed)
      setLocalSubmittedEmail(trimmed)
    } catch {
      setValidationError('Failed to submit. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-3">
      <ThemedText variant="body" className="text-center opacity-90">
        {heading || 'Get your result by email'}
      </ThemedText>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <ThemedInput
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (validationError) setValidationError(null)
          }}
          disabled={isSubmitting}
          className="min-h-[44px] flex-1"
          autoComplete="email"
        />
        <ThemedButton
          type="submit"
          disabled={isSubmitting}
          size="sm"
          className="min-h-[44px] min-w-[44px]"
        >
          <Send className="h-4 w-4" />
        </ThemedButton>
      </form>
      {validationError && (
        <ThemedText variant="small" className="text-center">
          {validationError}
        </ThemedText>
      )}
    </div>
  )
}
