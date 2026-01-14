/**
 * SingleExperienceView Component
 *
 * Single experience view for single-mode slots (pregate, preshare).
 * No drag and drop, just display with details sheet.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExperienceSlotItem } from './ExperienceSlotItem'
import { ExperienceDetailsSheet } from './ExperienceDetailsSheet'
import type { ExperienceReference } from '../schemas/event-experiences.schema'
import type { SlotType } from '../constants'
import type { Experience } from '@/domains/experience/shared'
import { experienceQuery } from '@/domains/experience/shared/queries/experience.query'

export interface SingleExperienceViewProps {
  /** Slot type (for details sheet) */
  slot: SlotType

  /** Workspace ID for fetching experience data */
  workspaceId: string

  /** Workspace slug for navigation */
  workspaceSlug: string

  /** Experience reference to display */
  reference: ExperienceReference

  /** Callback when enabled state changes */
  onToggleEnabled: (enabled: boolean) => void

  /** Callback when experience is removed */
  onRemove: () => void
}

/**
 * Single experience view for single-mode slots
 *
 * Features:
 * - Fetches experience data via useQuery
 * - No drag and drop (single mode)
 * - Details sheet for settings
 *
 * @example
 * ```tsx
 * <SingleExperienceView
 *   slot="pregate"
 *   workspaceId={workspaceId}
 *   workspaceSlug={workspaceSlug}
 *   reference={pregateReference}
 *   onToggleEnabled={(enabled) => updatePregate({ enabled })}
 *   onRemove={() => removePregate()}
 * />
 * ```
 */
export function SingleExperienceView({
  slot,
  workspaceId,
  workspaceSlug,
  reference,
  onToggleEnabled,
  onRemove,
}: SingleExperienceViewProps) {
  // Details sheet state
  const [selectedExperience, setSelectedExperience] =
    useState<Experience | null>(null)

  // Fetch experience data - this is in a component, so it's safe
  const { data: experience = null } = useQuery(
    experienceQuery(workspaceId, reference.experienceId),
  )

  // Handle opening details sheet
  const handleClick = () => {
    if (experience) {
      setSelectedExperience(experience)
    }
  }

  // Handle closing details sheet
  const handleCloseDetails = () => {
    setSelectedExperience(null)
  }

  return (
    <>
      <ExperienceSlotItem
        reference={reference}
        experience={experience}
        workspaceSlug={workspaceSlug}
        onToggleEnabled={onToggleEnabled}
        onClick={handleClick}
        onRemove={onRemove}
      />

      {/* Details Sheet */}
      {selectedExperience && (
        <ExperienceDetailsSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleCloseDetails()
          }}
          reference={reference}
          experience={selectedExperience}
          slot={slot}
          workspaceSlug={workspaceSlug}
          onToggleEnabled={onToggleEnabled}
          onRemove={() => {
            onRemove()
            handleCloseDetails()
          }}
        />
      )}
    </>
  )
}
