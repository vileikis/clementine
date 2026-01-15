/**
 * ExperienceDesignerLayout Container
 *
 * Domain-owned layout for experience designer. Handles publish workflow,
 * change detection, and integrates TopNavBar + ExperienceDesignerPage.
 */
import { useEffect, useMemo } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { useExperienceDesignerStore } from '../stores'
import {
  formatValidationErrors,
  isValidationError,
  usePublishExperience,
} from '../hooks'
import { ExperienceDesignerPage } from './ExperienceDesignerPage'
import type { Experience } from '@/domains/experience/shared'
import type { Step } from '@/domains/experience/steps'
import { TopNavBar } from '@/domains/navigation'
import { EditorChangesBadge, EditorSaveStatus } from '@/shared/editor-status'
import { Button } from '@/ui-kit/ui/button'

interface ExperienceDesignerLayoutProps {
  experience: Experience
  workspaceSlug: string
  workspaceId: string
}

/**
 * Experience designer layout with domain-owned UI
 *
 * Features:
 * - TopNavBar with breadcrumbs (Experiences → Experience Name)
 * - Version-based change detection
 * - Publish workflow with loading states
 * - Toast notifications for success/error
 * - Validation error display on publish failure
 *
 * @example
 * ```tsx
 * function ExperienceRoute() {
 *   const { experience, workspaceSlug } = Route.useLoaderData()
 *   return <ExperienceDesignerLayout experience={experience} workspaceSlug={workspaceSlug} />
 * }
 * ```
 */
export function ExperienceDesignerLayout({
  experience,
  workspaceSlug,
  workspaceId,
}: ExperienceDesignerLayoutProps) {
  const { pendingSaves, lastCompletedAt, resetSaveState } =
    useExperienceDesignerStore()

  const publishExperience = usePublishExperience()

  // Compute paths for breadcrumb navigation
  const experiencesPath = `/workspace/${workspaceSlug}/experiences`

  // Detect unpublished changes using version-based comparison
  const hasUnpublishedChanges = useMemo(() => {
    // Never published: always has unpublished changes (if draft exists)
    if (experience.publishedVersion === null) {
      return experience.draft !== null
    }
    // Has changes if draft version is higher than published version
    return experience.draftVersion > experience.publishedVersion
  }, [experience.draftVersion, experience.publishedVersion, experience.draft])

  // Cleanup: reset save state on unmount
  useEffect(() => {
    return () => resetSaveState()
  }, [resetSaveState])

  // Publish handler
  const handlePublish = async () => {
    const result = await publishExperience.mutateAsync({
      workspaceId,
      experience,
    })

    // Handle validation errors
    if (isValidationError(result) && result.errors.length > 0) {
      const steps = (experience.draft?.steps ?? []) as Step[]
      const formattedErrors = formatValidationErrors(result.errors, steps)

      // Show validation errors in a toast
      toast.error('Cannot publish experience', {
        description: (
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
            {formattedErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        ),
        duration: 8000,
      })
      return
    }

    // Show success toast
    toast.success('Experience published', {
      description: 'Your changes are now live.',
    })
  }

  // Handle publish mutation errors (network errors, etc.)
  useEffect(() => {
    if (publishExperience.error) {
      toast.error('Failed to publish experience', {
        description: publishExperience.error.message,
      })
    }
  }, [publishExperience.error])

  return (
    <div className="flex h-screen flex-col">
      <TopNavBar
        className="shrink-0"
        breadcrumbs={[
          {
            label: experience.name,
            icon: Sparkles,
            iconHref: experiencesPath,
          },
        ]}
        right={
          <>
            <EditorSaveStatus
              pendingSaves={pendingSaves}
              lastCompletedAt={lastCompletedAt}
            />
            <EditorChangesBadge
              draftVersion={experience.draftVersion}
              publishedVersion={experience.publishedVersion}
            />
            <Button variant="outline" disabled>
              Preview
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!hasUnpublishedChanges || publishExperience.isPending}
            >
              {publishExperience.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Publish
            </Button>
          </>
        }
      />
      <ExperienceDesignerPage
        experience={experience}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
      />
    </div>
  )
}
