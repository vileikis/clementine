/**
 * ExperienceSlotEmpty Component
 *
 * Empty state component when no experiences are connected to a slot.
 * Shows contextual message and add button.
 */
import { Plus } from 'lucide-react'
import type { SlotMode, SlotType } from '../constants'
import { Button } from '@/ui-kit/ui/button'

export interface ExperienceSlotEmptyProps {
  /** Slot type for context message */
  slot: SlotType

  /** Mode determines button visibility */
  mode: SlotMode

  /** Callback when add button is clicked */
  onAdd: () => void
}

/**
 * Slot-specific empty state messages
 */
const EMPTY_STATE_MESSAGES: Record<
  SlotType,
  { title: string; description: string }
> = {
  main: {
    title: 'No experiences added',
    description: 'Add experiences to let guests choose what to do.',
  },
  pregate: {
    title: 'No pregate experience',
    description: 'Add one to collect info before welcome screen.',
  },
  preshare: {
    title: 'No preshare experience',
    description: 'Add one to show content before sharing.',
  },
}

/**
 * Empty state component for experience slots
 *
 * Features:
 * - Contextual message based on slot type
 * - Add button for connecting experiences
 * - Responsive layout
 *
 * @example
 * ```tsx
 * <ExperienceSlotEmpty
 *   slot="main"
 *   mode="list"
 *   onAdd={() => setDrawerOpen(true)}
 * />
 * ```
 */
export function ExperienceSlotEmpty({
  slot,
  mode: _mode,
  onAdd,
}: ExperienceSlotEmptyProps) {
  const { title, description } = EMPTY_STATE_MESSAGES[slot]

  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/20">
      <div className="text-center space-y-2 mb-4">
        <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onAdd} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Experience
      </Button>
    </div>
  )
}
