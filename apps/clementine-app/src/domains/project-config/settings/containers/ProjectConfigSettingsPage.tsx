import { useParams } from '@tanstack/react-router'
import { useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { GuestFlowSection, OverlaySection } from '../components'
import type { ExperienceReference } from '@/domains/project-config/experiences'
import { useUpdateProjectExperiences } from '@/domains/project-config/experiences'
import { useProject } from '@/domains/project/shared'
import { useAuth } from '@/domains/auth'
import { useWorkspace } from '@/domains/workspace'

export function ProjectConfigSettingsPage() {
  const { projectId, workspaceSlug } = useParams({ strict: false })
  const { data: project } = useProject(projectId ?? '')
  const { data: workspace } = useWorkspace(workspaceSlug)
  const { user } = useAuth()

  // Get current experiences from project
  const mainExperiences = project?.draftConfig?.experiences?.main ?? []
  const pregateExperience = project?.draftConfig?.experiences?.pregate ?? null
  const preshareExperience = project?.draftConfig?.experiences?.preshare ?? null

  // Get all assigned experience IDs across all slots
  const assignedExperienceIds = useMemo(() => {
    const ids: string[] = [...mainExperiences.map((exp) => exp.experienceId)]
    if (pregateExperience) ids.push(pregateExperience.experienceId)
    if (preshareExperience) ids.push(preshareExperience.experienceId)
    return ids
  }, [mainExperiences, pregateExperience, preshareExperience])

  // Mutation for updating experiences (use safe fallbacks)
  const updateProjectExperiences = useUpdateProjectExperiences({
    projectId: projectId ?? '',
  })

  // Handler for updating pregate experience
  const handleUpdatePregate = useCallback(
    async (experience: ExperienceReference | null) => {
      if (!projectId) return
      try {
        await updateProjectExperiences.mutateAsync({ pregate: experience })
        // No toast - changes are reflected immediately via real-time updates
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update pregate experience'
        toast.error(message)
      }
    },
    [updateProjectExperiences, projectId],
  )

  // Handler for updating preshare experience
  const handleUpdatePreshare = useCallback(
    async (experience: ExperienceReference | null) => {
      if (!projectId) return
      try {
        await updateProjectExperiences.mutateAsync({ preshare: experience })
        // No toast - changes are reflected immediately via real-time updates
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update preshare experience'
        toast.error(message)
      }
    },
    [updateProjectExperiences, projectId],
  )

  if (!project || !user || !workspace || !projectId) {
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
          workspaceId={workspace.id}
          userId={user.uid}
          overlays={project.draftConfig?.overlays || null}
        />
      </div>
    </div>
  )
}
