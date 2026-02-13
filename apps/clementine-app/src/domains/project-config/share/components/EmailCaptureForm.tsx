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
}

export function EmailCaptureForm({
  onSubmit,
  isSubmitted,
  submittedEmail,
  heading,
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  if (isSubmitted && submittedEmail) {
    return (
      <div className="w-full text-center">
        <ThemedText variant="body" className="opacity-90">
          We'll send your result to {submittedEmail}
        </ThemedText>
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

    if (!onSubmit) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(trimmed)
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
