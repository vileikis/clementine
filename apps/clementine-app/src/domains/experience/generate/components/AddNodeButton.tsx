/**
 * AddNodeButton Component
 *
 * Button for adding a new AI Image node to the pipeline.
 * Displays Plus icon with loading state, 44px minimum touch target.
 */
import { Plus } from 'lucide-react'

import { Button } from '@/ui-kit/ui/button'

export interface AddNodeButtonProps {
  /** Click handler for adding node */
  onClick: () => void | Promise<void>
  /** Whether mutation is pending */
  isPending?: boolean
  /** Optional additional className */
  className?: string
}

/**
 * Add Node Button
 *
 * Features:
 * - Plus icon for visual clarity
 * - 44px minimum height for touch targets
 * - Loading state during mutation
 * - Disabled while pending
 */
export function AddNodeButton({
  onClick,
  isPending = false,
  className,
}: AddNodeButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={isPending}
      className={className}
      size="default"
    >
      <Plus className="mr-2 h-4 w-4" />
      {isPending ? 'Adding...' : 'Add Node'}
    </Button>
  )
}
