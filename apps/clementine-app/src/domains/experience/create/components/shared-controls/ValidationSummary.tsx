/**
 * ValidationSummary Component
 *
 * Displays validation errors at the top of the form.
 * Uses Alert component with destructive variant for clear visibility.
 *
 * @see spec.md - US6 (Validate and Publish)
 */
import { AlertCircle } from 'lucide-react'

import type { FieldValidationError } from '../../hooks/useExperienceConfigValidation'
import { Alert, AlertDescription, AlertTitle } from '@/ui-kit/ui/alert'

export interface ValidationSummaryProps {
  /** Array of validation errors to display */
  errors: FieldValidationError[]
}

/**
 * ValidationSummary - Displays validation errors at form top
 *
 * Only renders when there are errors. Shows a summary count
 * and lists all error messages.
 */
export function ValidationSummary({ errors }: ValidationSummaryProps) {
  if (errors.length === 0) {
    return null
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {errors.length === 1
          ? '1 issue to fix before publishing'
          : `${errors.length} issues to fix before publishing`}
      </AlertTitle>
      <AlertDescription>
        <ul className="list-inside list-disc space-y-1">
          {errors.map((error) => (
            <li key={`${error.field}-${error.message}`}>{error.message}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
