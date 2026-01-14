import { useParams } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { GuestFlowSection, OverlaySection, SharingSection } from '../components'
import type { ExperienceReference } from '@/domains/event/experiences'
import { useUpdateEventExperiences } from '@/domains/event/experiences'
import { useProjectEvent } from '@/domains/event/shared'
import { useAuth } from '@/domains/auth'
import { useWorkspace } from '@/domains/workspace'

export function EventSettingsPage() {
  const { projectId, eventId, workspaceSlug } = useParams({ strict: false })
  const { data: event } = useProjectEvent(projectId ?? '', eventId ?? '')
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { user } = useAuth()

  // Get current experiences from event
  const mainExperiences = event?.draftConfig?.experiences?.main ?? []
  const pregateExperience = event?.draftConfig?.experiences?.pregate ?? null
  const preshareExperience = event?.draftConfig?.experiences?.preshare ?? null

  // Get all assigned experience IDs across all slots
  const assignedExperienceIds = useMemo(() => {
    const ids: string[] = [...mainExperiences.map((exp) => exp.experienceId)]
    if (pregateExperience) ids.push(pregateExperience.experienceId)
    if (preshareExperience) ids.push(preshareExperience.experienceId)
    return ids
  }, [mainExperiences, pregateExperience, preshareExperience])

  // Mutation for updating experiences (use safe fallbacks)
  const updateEventExperiences = useUpdateEventExperiences({
    projectId: projectId ?? '',
    eventId: eventId ?? '',
  })

  // Handler for updating pregate experience
  const handleUpdatePregate = useCallback(
    async (experience: ExperienceReference | null) => {
      if (!projectId || !eventId) return
      try {
        await updateEventExperiences.mutateAsync({ pregate: experience })
        // No toast - changes are reflected immediately via real-time updates
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update pregate experience'
        toast.error(message)
      }
    },
    [updateEventExperiences],
  )

  // Handler for updating preshare experience
  const handleUpdatePreshare = useCallback(
    async (experience: ExperienceReference | null) => {
      if (!projectId || !eventId) return
      try {
        await updateEventExperiences.mutateAsync({ preshare: experience })
        // No toast - changes are reflected immediately via real-time updates
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update preshare experience'
        toast.error(message)
      }
    },
    [updateEventExperiences, projectId, eventId],
  )

  if (!event || !user || !workspace || !projectId || !eventId) {
    return null
  }

  return (
    <div className="flex justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        <GuestFlowSection
          workspaceId={workspace.id}
          workspaceSlug={workspaceSlug!}
          pregateExperience={pregateExperience}
          preshareExperience={preshareExperience}
          assignedExperienceIds={assignedExperienceIds}
          onUpdatePregate={handleUpdatePregate}
          onUpdatePreshare={handleUpdatePreshare}
        />

        <OverlaySection
          projectId={projectId}
          eventId={eventId}
          workspaceId={workspace.id}
          userId={user.uid}
          overlays={event.draftConfig?.overlays || null}
        />

        <SharingSection event={event} projectId={projectId} eventId={eventId} />
      </div>
    </div>
  )
}
