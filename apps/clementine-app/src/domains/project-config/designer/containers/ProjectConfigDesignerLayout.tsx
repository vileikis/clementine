/**
 * ProjectConfigDesignerLayout Container
 *
 * Domain-owned layout for project config designer. Handles publish workflow,
 * change detection, and integrates TopNavBar + ProjectConfigDesignerPage.
 */
import { useEffect, useMemo } from 'react'
import { FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePublishProjectConfig } from '../hooks'
import { useProjectConfigDesignerStore } from '../stores'
import { ProjectConfigDesignerPage } from './ProjectConfigDesignerPage'
import type { Project } from '@clementine/shared'
import type { TabItem } from '@/domains/navigation'
import { TopNavBar } from '@/domains/navigation'
import { EditorChangesBadge, EditorSaveStatus } from '@/shared/editor-status'
import { Button } from '@/ui-kit/ui/button'

// Project config designer tabs configuration
const projectConfigDesignerTabs: TabItem[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    to: '/workspace/$workspaceSlug/projects/$projectId/welcome',
  },
  {
    id: 'share',
    label: 'Share',
    to: '/workspace/$workspaceSlug/projects/$projectId/share',
  },
  {
    id: 'theme',
    label: 'Theme',
    to: '/workspace/$workspaceSlug/projects/$projectId/theme',
  },
  {
    id: 'settings',
    label: 'Settings',
    to: '/workspace/$workspaceSlug/projects/$projectId/settings',
  },
]

interface ProjectConfigDesignerLayoutProps {
  project: Project
  workspaceSlug: string
}

/**
 * Project config designer layout with domain-owned UI
 *
 * Features:
 * - Version-based change detection (draftVersion > publishedVersion)
 * - Publish workflow with loading states
 * - Toast notifications for success/error
 * - Self-contained (no route file dependencies)
 *
 * @example
 * ```tsx
 * function ProjectRoute() {
 *   const { project, workspaceSlug } = Route.useLoaderData()
 *   return <ProjectConfigDesignerLayout project={project} workspaceSlug={workspaceSlug} />
 * }
 * ```
 */
export function ProjectConfigDesignerLayout({
  project,
  workspaceSlug,
}: ProjectConfigDesignerLayoutProps) {
  const publishConfig = usePublishProjectConfig(project.id)
  const { pendingSaves, lastCompletedAt, resetSaveState } =
    useProjectConfigDesignerStore()

  // Compute paths for breadcrumb navigation
  const projectsListPath = `/workspace/${workspaceSlug}/projects`

  // Detect unpublished changes
  const hasUnpublishedChanges = useMemo(() => {
    if (project.publishedVersion === null) return true // Never published
    return (
      project.draftVersion !== null &&
      project.draftVersion > project.publishedVersion
    )
  }, [project.draftVersion, project.publishedVersion])

  // Cleanup: reset save state on unmount
  useEffect(() => {
    return () => resetSaveState()
  }, [resetSaveState])

  // Publish handler
  const handlePublish = async () => {
    try {
      await publishConfig.mutateAsync()
      toast.success('Project published', {
        description: 'Your changes are now live for guests.',
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
            label: project.name,
            icon: FolderOpen,
            iconHref: projectsListPath,
          },
        ]}
        tabs={projectConfigDesignerTabs}
        right={
          <>
            <EditorSaveStatus
              pendingSaves={pendingSaves}
              lastCompletedAt={lastCompletedAt}
            />
            <EditorChangesBadge
              draftVersion={project.draftVersion}
              publishedVersion={project.publishedVersion}
            />
            <Button variant="outline" disabled>
              Preview
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!hasUnpublishedChanges || publishConfig.isPending}
            >
              {publishConfig.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Publish
            </Button>
          </>
        }
      />
      <ProjectConfigDesignerPage />
    </div>
  )
}
