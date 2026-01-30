import { createFileRoute, notFound } from '@tanstack/react-router'

import {
  ExperienceDesignerLayout,
  useWorkspaceExperience,
} from '@/domains/experience'
import { useWorkspace } from '@/domains/workspace'
import { NotFound } from '@/shared/components/NotFound'

/**
 * Experience designer layout route
 *
 * Route: /workspace/:workspaceSlug/experiences/:experienceId
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Layout for experience designer routes (collect, generate).
 * Loads experience data and renders the designer layout with tabs.
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId',
)({
  component: ExperienceLayout,
  notFoundComponent: ExperienceNotFound,
})

type ExperienceLayoutContentProps = {
  workspace: NonNullable<ReturnType<typeof useWorkspace>['data']>
  workspaceSlug: string
  experienceId: string
}

function ExperienceLayout() {
  const { workspaceSlug, experienceId } = Route.useParams()
  const { data: workspace } = useWorkspace(workspaceSlug)

  // Wait for workspace to load before setting up experience listener
  if (!workspace) {
    return null
  }

  return (
    <ExperienceLayoutContent
      workspace={workspace}
      workspaceSlug={workspaceSlug}
      experienceId={experienceId}
    />
  )
}

function ExperienceLayoutContent({
  workspace,
  workspaceSlug,
  experienceId,
}: ExperienceLayoutContentProps) {
  const { data: experience } = useWorkspaceExperience(
    workspace.id,
    experienceId,
  )

  if (!experience) {
    return null
  }

  // Soft-deleted experience
  if (experience.status === 'deleted') {
    throw notFound()
  }

  return (
    <ExperienceDesignerLayout
      experience={experience}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
    />
  )
}

function ExperienceNotFound() {
  const { workspaceSlug } = Route.useParams()

  return (
    <NotFound
      title="Experience Not Found"
      message="The experience you're looking for doesn't exist or has been deleted."
      actionLabel="View All Experiences"
      actionHref={`/workspace/${workspaceSlug}/experiences`}
    />
  )
}
