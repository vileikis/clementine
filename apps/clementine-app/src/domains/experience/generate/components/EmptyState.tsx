/**
 * EmptyState Component
 *
 * Displayed when no transform nodes exist.
 * Centered layout with message and AddNodeButton.
 */
import { Network } from 'lucide-react'

import { AddNodeButton } from './AddNodeButton'

export interface EmptyStateProps {
  /** Click handler for add button */
  onAddNode: () => void | Promise<void>
  /** Whether add operation is pending */
  isPending?: boolean
}

/**
 * Empty State
 *
 * Features:
 * - Centered layout
 * - Icon for visual clarity
 * - Clear message
 * - Call-to-action button
 */
export function EmptyState({ onAddNode, isPending = false }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
      <Network className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">No Transform Nodes</h3>
        <p className="text-sm text-muted-foreground">
          Get started by adding your first AI Image node to the pipeline.
        </p>
      </div>
      <AddNodeButton onClick={onAddNode} isPending={isPending} />
    </div>
  )
}
