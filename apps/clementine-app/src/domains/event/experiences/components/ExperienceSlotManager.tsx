/**
 * ExperienceSlotManager Component
 *
 * Main orchestrator component for managing experiences in a slot.
 * Handles display, drag-and-drop reordering, and connecting/removing experiences.
 */
import { useMemo, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ExperienceSlotItem } from './ExperienceSlotItem'
import { ExperienceSlotEmpty } from './ExperienceSlotEmpty'
import { ConnectExperienceDrawer } from './ConnectExperienceDrawer'
import type { DragEndEvent } from '@dnd-kit/core'
import type {
  ExperienceReference,
  MainExperienceReference,
} from '../schemas/event-experiences.schema'
import type { SlotMode, SlotType } from '../constants'
import { experienceQuery } from '@/domains/experience/shared/queries/experience.query'
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
 * Sortable wrapper component for drag-and-drop
 */
function SortableExperienceItem({
  reference,
  workspaceId,
  workspaceSlug,
  slot,
  isListMode,
  assignedExperienceIds,
  onToggleEnabled,
  onToggleOverlay,
  onRemove,
}: {
  reference: ExperienceReference | MainExperienceReference
  workspaceId: string
  workspaceSlug: string
  slot: SlotType
  isListMode: boolean
  assignedExperienceIds: string[]
  onToggleEnabled: (enabled: boolean) => void
  onToggleOverlay?: (applyOverlay: boolean) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: reference.experienceId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Fetch experience details
  const { data: experience = null } = useQuery(
    experienceQuery(workspaceId, reference.experienceId),
  )

  // Handle edit in new tab
  const handleEdit = () => {
    window.open(
      `/workspace/${workspaceSlug}/experiences/${reference.experienceId}`,
      '_blank',
    )
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ExperienceSlotItem
        reference={reference}
        experience={experience}
        slot={slot}
        isListMode={isListMode}
        workspaceSlug={workspaceSlug}
        onToggleEnabled={onToggleEnabled}
        onToggleOverlay={onToggleOverlay}
        onRemove={onRemove}
        onEdit={handleEdit}
      />
    </div>
  )
}

/**
 * Slot manager component for connecting and managing experiences
 *
 * Features:
 * - List mode: Multiple items with drag-and-drop reordering
 * - Single mode: 0 or 1 item, no reordering
 * - Connect drawer for adding experiences
 * - Toggle enabled/overlay states
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

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Handle drag end to reorder experiences
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = experiences.findIndex(
        (exp) => exp.experienceId === active.id,
      )
      const newIndex = experiences.findIndex(
        (exp) => exp.experienceId === over.id,
      )

      if (oldIndex !== -1 && newIndex !== -1) {
        const newExperiences = [...experiences]
        const [movedItem] = newExperiences.splice(oldIndex, 1)
        newExperiences.splice(newIndex, 0, movedItem)
        onUpdate(newExperiences)
      }
    }
  }

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

  // Experience IDs for sortable context
  const experienceIds = useMemo(
    () => experiences.map((exp) => exp.experienceId),
    [experiences],
  )

  return (
    <div className="space-y-3">
      {/* Experience List */}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={experienceIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {experiences.map((reference) => (
                    <SortableExperienceItem
                      key={reference.experienceId}
                      reference={reference}
                      workspaceId={workspaceId}
                      workspaceSlug={workspaceSlug}
                      slot={slot}
                      isListMode={isListMode}
                      assignedExperienceIds={assignedExperienceIds}
                      onToggleEnabled={(enabled) =>
                        handleToggleEnabled(reference.experienceId, enabled)
                      }
                      onToggleOverlay={
                        slot === 'main'
                          ? (applyOverlay) =>
                              handleToggleOverlay(
                                reference.experienceId,
                                applyOverlay,
                              )
                          : undefined
                      }
                      onRemove={() => handleRemove(reference.experienceId)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            // Single mode without drag-and-drop
            <div className="space-y-2">
              {experiences.map((reference) => {
                // Fetch experience details
                const { data: experience = null } = useQuery(
                  experienceQuery(workspaceId, reference.experienceId),
                )

                const handleEdit = () => {
                  window.open(
                    `/workspace/${workspaceSlug}/experiences/${reference.experienceId}`,
                    '_blank',
                  )
                }

                return (
                  <ExperienceSlotItem
                    key={reference.experienceId}
                    reference={reference}
                    experience={experience}
                    slot={slot}
                    isListMode={false}
                    workspaceSlug={workspaceSlug}
                    onToggleEnabled={(enabled) =>
                      handleToggleEnabled(reference.experienceId, enabled)
                    }
                    onToggleOverlay={
                      slot === 'main' && 'applyOverlay' in reference
                        ? (applyOverlay) =>
                            handleToggleOverlay(
                              reference.experienceId,
                              applyOverlay,
                            )
                        : undefined
                    }
                    onRemove={() => handleRemove(reference.experienceId)}
                    onEdit={handleEdit}
                  />
                )
              })}
            </div>
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
