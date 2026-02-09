import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from '@tanstack/react-router'
import { FolderOpen, Loader2, Share } from 'lucide-react'
import { toast } from 'sonner'
import type { Project } from '@clementine/shared'
import type { TabItem } from '@/domains/navigation'
import { TopNavBar } from '@/domains/navigation'
import { ShareDialog } from '@/domains/project/share'
import { usePublishProjectConfig } from '@/domains/project-config/designer/hooks'
import { useProjectConfigDesignerStore } from '@/domains/project-config/designer/stores'
import { EditorChangesBadge, EditorSaveStatus } from '@/shared/editor-status'
import { Button } from '@/ui-kit/ui/button'

const projectTabs: TabItem[] = [
  {
    id: 'designer',
    label: 'Designer',
    to: '/workspace/$workspaceSlug/projects/$projectId/designer',
  },
  {
    id: 'distribute',
    label: 'Distribute',
    to: '/workspace/$workspaceSlug/projects/$projectId/distribute',
  },
  {
    id: 'connect',
    label: 'Connect',
    to: '/workspace/$workspaceSlug/projects/$projectId/connect',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    to: '/workspace/$workspaceSlug/projects/$projectId/analytics',
  },
]

interface ProjectLayoutProps {
  project: Project
  workspaceSlug: string
}

export function ProjectLayout({ project, workspaceSlug }: ProjectLayoutProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const publishConfig = usePublishProjectConfig(project.id)
  const { pendingSaves, lastCompletedAt, resetSaveState } =
    useProjectConfigDesignerStore()
  const location = useLocation()

  const projectsListPath = `/workspace/${workspaceSlug}/projects`

  // Show publish workflow on Designer and Distribute routes only
  const showPublishWorkflow = useMemo(() => {
    const path = location.pathname
    return path.includes('/designer') || path.includes('/distribute')
  }, [location.pathname])

  const hasUnpublishedChanges = useMemo(() => {
    if (project.publishedVersion === null) return true
    return (
      project.draftVersion !== null &&
      project.draftVersion > project.publishedVersion
    )
  }, [project.draftVersion, project.publishedVersion])

  useEffect(() => {
    return () => resetSaveState()
  }, [resetSaveState])

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

  // Determine if share button should show (not on distribute page — it IS the share page)
  const showShareButton = useMemo(() => {
    return !location.pathname.includes('/distribute')
  }, [location.pathname])

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
        tabs={projectTabs}
        right={
          showPublishWorkflow ? (
            <>
              <EditorSaveStatus
                pendingSaves={pendingSaves}
                lastCompletedAt={lastCompletedAt}
              />
              <EditorChangesBadge
                draftVersion={project.draftVersion}
                publishedVersion={project.publishedVersion}
              />
              {showShareButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsShareDialogOpen(true)}
                  aria-label="Share project"
                >
                  <Share className="h-4 w-4" />
                </Button>
              )}
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
          ) : undefined
        }
      />
      <ShareDialog
        projectId={project.id}
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
      <main className="h-full overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
