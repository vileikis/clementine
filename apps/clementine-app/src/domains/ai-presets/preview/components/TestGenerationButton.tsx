/**
 * TestGenerationButton Component
 *
 * UI placeholder button for future test generation functionality (Phase 5).
 * Shows disabled state when validation fails with explanatory tooltip.
 * Shows enabled state when validation passes (but does nothing on click per spec).
 *
 * T061-T070: Test Generation Button (User Story 5)
 */

import { Sparkles } from 'lucide-react'
import type { ValidationState } from '../types'
import { Button } from '@/ui-kit/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/ui-kit/ui/tooltip'

interface TestGenerationButtonProps {
  validation: ValidationState
}

/**
 * Placeholder button for test generation feature (Phase 5).
 *
 * Button states:
 * - **Disabled** (validation incomplete/invalid): Shows tooltip explaining specific errors
 * - **Enabled** (validation valid): Appears clickable but does nothing (Phase 5 will implement)
 *
 * @example
 * ```tsx
 * <TestGenerationButton validation={validation} />
 * ```
 */
export function TestGenerationButton({
  validation,
}: TestGenerationButtonProps) {
  const isDisabled = validation.status !== 'valid'
  const hasErrors = validation.errors.length > 0
  const hasWarnings = validation.warnings.length > 0

  // Generate tooltip message based on validation state
  const getTooltipMessage = () => {
    if (hasErrors) {
      return `Cannot run test generation: ${validation.errors.length} error${validation.errors.length > 1 ? 's' : ''} must be fixed`
    }
    if (hasWarnings) {
      return `Cannot run test generation: ${validation.warnings.length} warning${validation.warnings.length > 1 ? 's' : ''} must be addressed`
    }
    return 'Test generation will be available in Phase 5'
  }

  // No-op handler (Phase 5 will implement actual functionality)
  const handleClick = () => {
    // Placeholder: Phase 5 will implement test generation logic
    console.log('Test generation button clicked (Phase 5 placeholder)')
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block">
            <Button
              onClick={handleClick}
              disabled={isDisabled}
              size="lg"
              className="w-full gap-2 sm:w-auto"
            >
              <Sparkles className="size-4" />
              Run Test Generation
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{getTooltipMessage()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
