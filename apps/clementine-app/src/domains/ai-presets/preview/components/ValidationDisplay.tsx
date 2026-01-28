// Validation Display Component - Shows validation status and error/warning messages

import { memo, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ValidationState } from '../types'
import { Badge } from '@/ui-kit/ui/badge'
import { Button } from '@/ui-kit/ui/button'

type ValidationDisplayProps = {
  validation: ValidationState
  onErrorClick?: (fieldName: string) => void
}

/**
 * Displays validation status with errors and warnings for the preview panel.
 * Shows color-coded status badges and lists of validation issues with expandable sections.
 * Supports auto-scroll to first error and click-to-focus on error fields.
 * Optimized with React.memo to prevent unnecessary re-renders.
 */
function ValidationDisplayInner({
  validation,
  onErrorClick,
}: ValidationDisplayProps) {
  const { status, errors, warnings } = validation
  const [errorsExpanded, setErrorsExpanded] = useState(true)
  const [warningsExpanded, setWarningsExpanded] = useState(true)
  const firstErrorRef = useRef<HTMLLIElement>(null)

  // Auto-scroll to first error when validation fails
  useEffect(() => {
    if (errors.length > 0 && errorsExpanded && firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [errors.length, errorsExpanded])

  // Status badge configuration
  const statusConfig = {
    valid: {
      label: 'Valid',
      variant: 'default' as const,
      className: 'bg-primary hover:bg-primary text-primary-foreground',
    },
    invalid: {
      label: 'Invalid',
      variant: 'secondary' as const,
      className: 'bg-secondary hover:bg-secondary text-secondary-foreground',
    },
    incomplete: {
      label: 'Incomplete',
      variant: 'destructive' as const,
      className:
        'bg-destructive hover:bg-destructive text-destructive-foreground',
    },
  }

  const config = statusConfig[status]

  // Announce validation changes to screen readers
  const ariaMessage =
    status === 'valid'
      ? 'All inputs are valid'
      : status === 'incomplete'
        ? `${errors.length} ${errors.length === 1 ? 'error' : 'errors'} found`
        : `${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'} found`

  return (
    <div className="space-y-4">
      {/* Screen reader announcement */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {ariaMessage}
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      </div>

      {/* Errors Section - Expandable */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-sm font-medium text-destructive hover:text-destructive hover:bg-transparent"
            onClick={() => setErrorsExpanded(!errorsExpanded)}
          >
            {errorsExpanded ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            Errors ({errors.length})
          </Button>
          {errorsExpanded && (
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li
                  key={`error-${error.field}-${index}`}
                  ref={index === 0 ? firstErrorRef : null}
                  className={`text-sm text-destructive bg-destructive/10 p-2 rounded ${
                    onErrorClick ? 'cursor-pointer hover:bg-destructive/20' : ''
                  }`}
                  onClick={() => onErrorClick?.(error.field)}
                  role={onErrorClick ? 'button' : undefined}
                  tabIndex={onErrorClick ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (onErrorClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      onErrorClick(error.field)
                    }
                  }}
                >
                  <span className="font-medium">{error.field}:</span>{' '}
                  {error.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Warnings Section - Expandable */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-sm font-medium text-secondary-foreground hover:text-secondary-foreground hover:bg-transparent"
            onClick={() => setWarningsExpanded(!warningsExpanded)}
          >
            {warningsExpanded ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            Warnings ({warnings.length})
          </Button>
          {warningsExpanded && (
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li
                  key={`warning-${warning.type}-${index}`}
                  className="text-sm text-secondary-foreground bg-secondary/10 p-2 rounded"
                >
                  {warning.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Valid State - No Issues */}
      {status === 'valid' && (
        <p className="text-sm text-muted-foreground">
          All inputs are valid. Ready for test generation.
        </p>
      )}
    </div>
  )
}

export const ValidationDisplay = memo(ValidationDisplayInner)
