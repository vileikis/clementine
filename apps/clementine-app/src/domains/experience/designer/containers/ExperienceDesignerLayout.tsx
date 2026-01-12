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
import { ExperienceDesignerPage } from './ExperienceDesignerPage'
import type { Experience } from '@/domains/experience/shared'
import { TopNavBar } from '@/domains/navigation'
import { EditorChangesBadge, EditorSaveStatus } from '@/shared/editor-status'
import { Button } from '@/ui-kit/ui/button'

interface ExperienceDesignerLayoutProps {
  experience: Experience
  workspaceSlug: string
}

/**
 * Experience designer layout with domain-owned UI
 *
 * Features:
 * - TopNavBar with breadcrumbs (Experiences → Experience Name)
 * - Version-based change detection
 * - Publish workflow with loading states
 * - Toast notifications for success/error
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
}: ExperienceDesignerLayoutProps) {
  const { pendingSaves, lastCompletedAt, resetSaveState } =
    useExperienceDesignerStore()

  // Compute paths for breadcrumb navigation
  const experiencesPath = `/workspace/${workspaceSlug}/experiences`

  // Detect unpublished changes
  // Note: Experience uses same version pattern as Event
  const hasUnpublishedChanges = useMemo(() => {
    // For now, always show as unpublished since we don't have publish yet
    // TODO: Implement proper version comparison when publish is added
    return false
  }, [])

  // Cleanup: reset save state on unmount
  useEffect(() => {
    return () => resetSaveState()
  }, [resetSaveState])

  // Publish handler (placeholder for now)
  const handlePublish = async () => {
    try {
      // TODO: Implement publish mutation
      toast.success('Experience published', {
        description: 'Your changes are now live.',
      })
    } catch (error) {
      toast.error('Publish failed', {
        description:
          error instanceof Error ? error.message : 'An error occurred',
      })
    }
  }

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
            <EditorChangesBadge draftVersion={null} publishedVersion={null} />
            <Button variant="outline" disabled>
              Preview
            </Button>
            <Button onClick={handlePublish} disabled={!hasUnpublishedChanges}>
              <Loader2 className="mr-2 h-4 w-4 animate-spin hidden" />
              Publish
            </Button>
          </>
        }
      />
      <ExperienceDesignerPage />
    </div>
  )
}
