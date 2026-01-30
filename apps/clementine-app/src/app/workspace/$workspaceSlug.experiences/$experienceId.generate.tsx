import { createFileRoute } from '@tanstack/react-router'

import {
  ExperienceDesignerLayout,
  ExperienceGeneratePage,
  useWorkspaceExperience,
} from '@/domains/experience'
import { useWorkspace } from '@/domains/workspace'
import { NotFound } from '@/shared/components/NotFound'
import { Skeleton } from '@/ui-kit/ui/skeleton'

/**
 * Experience designer - Generate tab
 *
 * Route: /workspace/:workspaceSlug/experiences/:experienceId/generate
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Configure AI transformation settings (placeholder/WIP).
 * No search params (ignores query params).
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId/generate',
)({
  component: ExperienceGenerateRoute,
  notFoundComponent: ExperienceNotFound,
})

function ExperienceGenerateRoute() {
  const { workspaceSlug, experienceId } = Route.useParams()
  const { data: workspace, isLoading: isWorkspaceLoading } =
    useWorkspace(workspaceSlug)
  const { data: experience, isLoading: isExperienceLoading } =
    useWorkspaceExperience(workspace?.id ?? '', experienceId)

  // Loading state
  if (isWorkspaceLoading || isExperienceLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex h-16 items-center justify-between border-b bg-background px-6">
          <Skeleton className="h-6 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // Not found
  if (!workspace || !experience) {
    return <ExperienceNotFound />
  }

  // Soft-deleted experience
  if (experience.status === 'deleted') {
    return <ExperienceNotFound />
  }

  return (
    <ExperienceDesignerLayout
      experience={experience}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
    >
      <ExperienceGeneratePage />
    </ExperienceDesignerLayout>
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
