/**
 * ExperienceSlotManager Component
 *
 * Thin orchestrator for managing experiences in a slot.
 * Delegates to specialized components for list and single modes.
 */
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ExperienceSlotEmpty } from './ExperienceSlotEmpty'
import { ConnectExperienceDrawer } from './ConnectExperienceDrawer'
import { ExperienceListView } from './ExperienceListView'
import { SingleExperienceView } from './SingleExperienceView'
import type {
  ExperienceReference,
  MainExperienceReference,
} from '../schemas/event-experiences.schema'
import type { SlotMode, SlotType } from '../constants'
import { Button } from '@/ui-kit/ui/button'

export interface ExperienceSlotManagerProps {
  /**
   * Slot mode - determines cardinality and UI behavior
   * - 'list': Multiple items, drag-to-reorder, "Add" always visible
   * - 'single': 0 or 1 item, no reorder, "Add" only when empty
   */
  mode: SlotMode

  /**
   * Slot identifier - determines profile filtering
   * - 'main': freeform, survey profiles
   * - 'pregate': survey, story profiles
   * - 'preshare': survey, story profiles
   */
  slot: SlotType

  /** Workspace ID for fetching available experiences */
  workspaceId: string

  /** Workspace slug for navigation (edit/create links) */
  workspaceSlug: string

  /** Current experience references for this slot */
  experiences: (ExperienceReference | MainExperienceReference)[]

  /**
   * Callback when experiences are modified
   * Called on: add, remove, reorder, toggle enabled, toggle overlay
   */
  onUpdate: (
    experiences: (ExperienceReference | MainExperienceReference)[],
  ) => void

  /** All assigned experience IDs across all slots (to mark as "in use") */
  assignedExperienceIds: string[]

  /** Optional loading state (e.g., while saving) */
  isLoading?: boolean
}

/**
 * Slot manager component for connecting and managing experiences
 *
 * Features:
 * - List mode: Multiple items with drag-and-drop reordering
 * - Single mode: 0 or 1 item, no reordering
 * - Connect drawer for adding experiences
 * - Toggle enabled/overlay states via details sheet
 * - Remove experiences
 * - Empty state when no experiences
 *
 * @example
 * ```tsx
 * // List mode (main slot)
 * <ExperienceSlotManager
 *   mode="list"
 *   slot="main"
 *   workspaceId={workspaceId}
 *   workspaceSlug={workspaceSlug}
 *   experiences={draftConfig.experiences?.main ?? []}
 *   onUpdate={(main) => updateExperiences({ main })}
 *   assignedExperienceIds={allAssignedIds}
 * />
 *
 * // Single mode (pregate slot)
 * <ExperienceSlotManager
 *   mode="single"
 *   slot="pregate"
 *   workspaceId={workspaceId}
 *   workspaceSlug={workspaceSlug}
 *   experiences={draftConfig.experiences?.pregate ? [draftConfig.experiences.pregate] : []}
 *   onUpdate={(items) => updateExperiences({ pregate: items[0] ?? null })}
 *   assignedExperienceIds={allAssignedIds}
 * />
 * ```
 */
export function ExperienceSlotManager({
  mode,
  slot,
  workspaceId,
  workspaceSlug,
  experiences,
  onUpdate,
  assignedExperienceIds,
  isLoading,
}: ExperienceSlotManagerProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const isListMode = mode === 'list'
  const isEmpty = experiences.length === 0

  // Handle adding experience from drawer
  const handleSelect = (experienceId: string) => {
    const newReference: ExperienceReference | MainExperienceReference =
      slot === 'main'
        ? { experienceId, enabled: true, applyOverlay: true }
        : { experienceId, enabled: true }

    if (mode === 'single') {
      // Replace existing item
      onUpdate([newReference])
    } else {
      // Add to list
      onUpdate([...experiences, newReference])
    }
  }

  // Handle removing experience
  const handleRemove = (experienceId: string) => {
    onUpdate(experiences.filter((exp) => exp.experienceId !== experienceId))
  }

  // Handle toggle enabled
  const handleToggleEnabled = (experienceId: string, enabled: boolean) => {
    onUpdate(
      experiences.map((exp) =>
        exp.experienceId === experienceId ? { ...exp, enabled } : exp,
      ),
    )
  }

  // Handle toggle overlay (main slot only)
  const handleToggleOverlay = (experienceId: string, applyOverlay: boolean) => {
    onUpdate(
      experiences.map((exp) =>
        exp.experienceId === experienceId && 'applyOverlay' in exp
          ? { ...exp, applyOverlay }
          : exp,
      ),
    )
  }

  // Handle reorder (list mode only)
  const handleReorder = (
    newExperiences: (ExperienceReference | MainExperienceReference)[],
  ) => {
    onUpdate(newExperiences)
  }

  return (
    <div className="space-y-3">
      {/* Experience List or Empty State */}
      {isEmpty ? (
        <ExperienceSlotEmpty
          slot={slot}
          mode={mode}
          onAdd={() => setIsDrawerOpen(true)}
        />
      ) : (
        <>
          {isListMode ? (
            // List mode with drag-and-drop
            <ExperienceListView
              slot={slot}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              experiences={experiences as MainExperienceReference[]}
              onReorder={handleReorder}
              onToggleEnabled={handleToggleEnabled}
              onToggleOverlay={handleToggleOverlay}
              onRemove={handleRemove}
            />
          ) : (
            // Single mode - render first item only
            <SingleExperienceView
              slot={slot}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              reference={experiences[0] as ExperienceReference}
              onToggleEnabled={(enabled) =>
                handleToggleEnabled(experiences[0].experienceId, enabled)
              }
              onRemove={() => handleRemove(experiences[0].experienceId)}
            />
          )}

          {/* Add Button (list mode only) */}
          {isListMode && (
            <Button
              variant="outline"
              onClick={() => setIsDrawerOpen(true)}
              className="w-full gap-2"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              Add Experience
            </Button>
          )}
        </>
      )}

      {/* Connect Drawer */}
      <ConnectExperienceDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        slot={slot}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        assignedExperienceIds={assignedExperienceIds}
        onSelect={handleSelect}
      />
    </div>
  )
}
