/**
 * ExperienceEditorPage Container
 *
 * Shell page for the experience editor. Shows experience info with breadcrumb
 * and placeholder content for future step editing (E2).
 */
import { Link } from '@tanstack/react-router'

import { ProfileBadge } from '../components'
import { useWorkspaceExperience } from '@/domains/experience/shared'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/ui-kit/ui/breadcrumb'
import { Skeleton } from '@/ui-kit/ui/skeleton'
import { Card } from '@/ui-kit/ui/card'

interface ExperienceEditorPageProps {
  /** Workspace ID containing the experience */
  workspaceId: string
  /** Workspace slug for navigation */
  workspaceSlug: string
  /** Experience ID to edit */
  experienceId: string
}

/**
 * Experience editor shell page
 *
 * Features:
 * - Breadcrumb navigation back to library
 * - Experience name and profile display
 * - Placeholder content for E2 step editing
 *
 * @example
 * ```tsx
 * <ExperienceEditorPage
 *   workspaceId="abc123"
 *   workspaceSlug="my-workspace"
 *   experienceId="exp456"
 * />
 * ```
 */
export function ExperienceEditorPage({
  workspaceId,
  workspaceSlug,
  experienceId,
}: ExperienceEditorPageProps) {
  const { data: experience, isLoading } = useWorkspaceExperience(
    workspaceId,
    experienceId,
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // Not found state
  if (!experience) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold">Experience not found</h2>
          <p className="text-muted-foreground mt-2">
            The experience you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            to="/workspace/$workspaceSlug/experiences"
            params={{ workspaceSlug }}
            className="text-primary underline mt-4 inline-block"
          >
            Back to Experiences
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/workspace/$workspaceSlug/experiences"
                params={{ workspaceSlug }}
              >
                Experiences
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{experience.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">{experience.name}</h1>
        <ProfileBadge profile={experience.profile} />
      </div>

      {/* Placeholder content for E2 */}
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Step editor coming in E2. This is a placeholder for the experience
          editor interface.
        </p>
      </Card>
    </div>
  )
}
