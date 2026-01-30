import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import {
  ExperienceCollectPage,
  ExperienceDesignerLayout,
  useWorkspaceExperience,
} from '@/domains/experience'
import { useWorkspace } from '@/domains/workspace'
import { NotFound } from '@/shared/components/NotFound'
import { Skeleton } from '@/ui-kit/ui/skeleton'

/**
 * Search params schema for Collect tab (step selection)
 */
const collectSearchSchema = z.object({
  step: z.string().optional(),
})

export type CollectSearch = z.infer<typeof collectSearchSchema>

/**
 * Experience designer - Collect tab
 *
 * Route: /workspace/:workspaceSlug/experiences/:experienceId/collect
 * Access: Admin only (enforced by parent route requireAdmin guard)
 *
 * Manages data collection steps (info, input, capture steps).
 * Search params: ?step={stepId} for deep linking to specific steps
 */
export const Route = createFileRoute(
  '/workspace/$workspaceSlug/experiences/$experienceId/collect',
)({
  component: ExperienceCollectRoute,
  notFoundComponent: ExperienceNotFound,
  validateSearch: collectSearchSchema,
})

function ExperienceCollectRoute() {
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
      <ExperienceCollectPage
        experience={experience}
        workspaceSlug={workspaceSlug}
        workspaceId={workspace.id}
      />
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
