/**
 * GuestFlowSection Component
 *
 * Section for configuring guest flow experiences (pregate and preshare).
 * Allows admins to connect experiences that run before welcome screen (pregate)
 * and after main experience but before share screen (preshare).
 */

import type { ExperienceReference } from '@/domains/project-config/experiences'
import { ExperienceSlotManager } from '@/domains/project-config/experiences'

export interface GuestFlowSectionProps {
  /** Workspace ID for fetching experiences */
  workspaceId: string
  /** Workspace slug for experience links */
  workspaceSlug: string
  /** Pregate experience (single slot) */
  pregateExperience: ExperienceReference | null
  /** Preshare experience (single slot) */
  preshareExperience: ExperienceReference | null
  /** All assigned experience IDs across all slots */
  assignedExperienceIds: string[]
  /** Callback when pregate experience is updated */
  onUpdatePregate: (experience: ExperienceReference | null) => void
  /** Callback when preshare experience is updated */
  onUpdatePreshare: (experience: ExperienceReference | null) => void
  /** Whether controls are disabled (e.g., during save) */
  disabled?: boolean
}

export function GuestFlowSection({
  workspaceId,
  workspaceSlug,
  pregateExperience,
  preshareExperience,
  assignedExperienceIds,
  onUpdatePregate,
  onUpdatePreshare,
  disabled = false,
}: GuestFlowSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Guest Flow</h2>
        <p className="text-sm text-muted-foreground">
          Configure experiences that run before the welcome screen or after the
          main experience
        </p>
      </div>

      {/* Pregate Experience */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium mb-1">Pregate Experience</h3>
          <p className="text-xs text-muted-foreground">
            Runs before guests see the welcome screen. Use for data collection
            (surveys) or disclaimers (story experiences).
          </p>
        </div>
        <ExperienceSlotManager
          mode="single"
          slot="pregate"
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          experiences={pregateExperience ? [pregateExperience] : []}
          onUpdate={(experiences) => onUpdatePregate(experiences[0] ?? null)}
          assignedExperienceIds={assignedExperienceIds}
          isLoading={disabled}
        />
      </div>

      {/* Preshare Experience */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium mb-1">Preshare Experience</h3>
          <p className="text-xs text-muted-foreground">
            Runs after the main experience but before the share screen. Use for
            feedback collection or upsells.
          </p>
        </div>
        <ExperienceSlotManager
          mode="single"
          slot="preshare"
          workspaceId={workspaceId}
          workspaceSlug={workspaceSlug}
          experiences={preshareExperience ? [preshareExperience] : []}
          onUpdate={(experiences) => onUpdatePreshare(experiences[0] ?? null)}
          assignedExperienceIds={assignedExperienceIds}
          isLoading={disabled}
        />
      </div>
    </div>
  )
}
