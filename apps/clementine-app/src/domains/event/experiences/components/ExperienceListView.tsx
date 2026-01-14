/**
 * ExperienceListView Component
 *
 * Drag-and-drop list view for experiences in list mode.
 * Handles reordering with drag handles and fetches experience data per item.
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
import { GripVertical } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ExperienceSlotItem } from './ExperienceSlotItem'
import { ExperienceDetailsSheet } from './ExperienceDetailsSheet'
import type { DragEndEvent } from '@dnd-kit/core'
import type { MainExperienceReference } from '../schemas/event-experiences.schema'
import type { SlotType } from '../constants'
import type { Experience } from '@/domains/experience/shared'
import { experienceQuery } from '@/domains/experience/shared/queries/experience.query'

export interface ExperienceListViewProps {
  /** Slot type (for details sheet) */
  slot: SlotType

  /** Workspace ID for fetching experience data */
  workspaceId: string

  /** Workspace slug for navigation */
  workspaceSlug: string

  /** Experience references to display */
  experiences: MainExperienceReference[]

  /** Callback when experiences are reordered */
  onReorder: (experiences: MainExperienceReference[]) => void

  /** Callback when enabled state changes */
  onToggleEnabled: (experienceId: string, enabled: boolean) => void

  /** Callback when overlay state changes */
  onToggleOverlay: (experienceId: string, applyOverlay: boolean) => void

  /** Callback when experience is removed */
  onRemove: (experienceId: string) => void
}

/**
 * Props for sortable list item
 */
interface SortableListItemProps {
  reference: MainExperienceReference
  workspaceId: string
  workspaceSlug: string
  slot: SlotType
  onToggleEnabled: (enabled: boolean) => void
  onToggleOverlay: (applyOverlay: boolean) => void
  onRemove: () => void
  onOpenDetails: (experience: Experience) => void
}

/**
 * Sortable item wrapper that fetches its own experience data
 * This is a separate component to ensure hooks are called consistently
 */
function SortableListItem({
  reference,
  workspaceId,
  workspaceSlug,
  onToggleEnabled,
  onRemove,
  onOpenDetails,
}: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: reference.experienceId })

  // Fetch experience data - each item is its own component so this is safe
  const { data: experience = null } = useQuery(
    experienceQuery(workspaceId, reference.experienceId),
  )

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Drag handle element with listeners
  const dragHandle = (
    <div
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none"
    >
      <GripVertical className="h-5 w-5" />
    </div>
  )

  const handleClick = () => {
    if (experience) {
      onOpenDetails(experience)
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <ExperienceSlotItem
        reference={reference}
        experience={experience}
        workspaceSlug={workspaceSlug}
        onToggleEnabled={onToggleEnabled}
        onClick={handleClick}
        onRemove={onRemove}
        dragHandle={dragHandle}
      />
    </div>
  )
}

/**
 * List view component for drag-and-drop experience management
 *
 * Features:
 * - Drag-and-drop reordering with drag handles
 * - Each item is a separate component (fixes hooks-in-loop bug)
 * - Experience data fetched per item
 * - Details sheet for viewing/editing settings
 *
 * @example
 * ```tsx
 * <ExperienceListView
 *   slot="main"
 *   workspaceId={workspaceId}
 *   workspaceSlug={workspaceSlug}
 *   experiences={mainExperiences}
 *   onReorder={(exps) => updateExperiences({ main: exps })}
 *   onToggleEnabled={(id, enabled) => updateEnabled(id, enabled)}
 *   onToggleOverlay={(id, overlay) => updateOverlay(id, overlay)}
 *   onRemove={(id) => removeExperience(id)}
 * />
 * ```
 */
export function ExperienceListView({
  slot,
  workspaceId,
  workspaceSlug,
  experiences,
  onReorder,
  onToggleEnabled,
  onToggleOverlay,
  onRemove,
}: ExperienceListViewProps) {
  // Details sheet state - only store the ID, derive reference from experiences prop
  const [selectedExperienceId, setSelectedExperienceId] = useState<
    string | null
  >(null)
  const [selectedExperience, setSelectedExperience] =
    useState<Experience | null>(null)

  // Derive current reference from experiences prop (stays in sync with updates)
  const selectedReference = selectedExperienceId
    ? (experiences.find((exp) => exp.experienceId === selectedExperienceId) ??
      null)
    : null

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
        onReorder(newExperiences)
      }
    }
  }

  // Handle opening details sheet
  const handleOpenDetails = (experienceId: string, experience: Experience) => {
    setSelectedExperienceId(experienceId)
    setSelectedExperience(experience)
  }

  // Handle closing details sheet
  const handleCloseDetails = () => {
    setSelectedExperienceId(null)
    setSelectedExperience(null)
  }

  // Experience IDs for sortable context
  const experienceIds = useMemo(
    () => experiences.map((exp) => exp.experienceId),
    [experiences],
  )

  return (
    <>
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
              <SortableListItem
                key={reference.experienceId}
                reference={reference}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
                slot={slot}
                onToggleEnabled={(enabled) =>
                  onToggleEnabled(reference.experienceId, enabled)
                }
                onToggleOverlay={(applyOverlay) =>
                  onToggleOverlay(reference.experienceId, applyOverlay)
                }
                onRemove={() => onRemove(reference.experienceId)}
                onOpenDetails={(experience) =>
                  handleOpenDetails(reference.experienceId, experience)
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Details Sheet */}
      {selectedReference && selectedExperience && (
        <ExperienceDetailsSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleCloseDetails()
          }}
          reference={selectedReference}
          experience={selectedExperience}
          slot={slot}
          workspaceSlug={workspaceSlug}
          onToggleEnabled={(enabled) =>
            onToggleEnabled(selectedReference.experienceId, enabled)
          }
          onToggleOverlay={(applyOverlay) =>
            onToggleOverlay(selectedReference.experienceId, applyOverlay)
          }
          onRemove={() => {
            onRemove(selectedReference.experienceId)
            handleCloseDetails()
          }}
        />
      )}
    </>
  )
}
