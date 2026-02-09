import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { FolderOpen, Loader2, Share } from 'lucide-react'
import { toast } from 'sonner'
import type { Project } from '@clementine/shared'
import { TopNavBar } from '@/domains/navigation'
import { ShareDialog } from '@/domains/project/share'
import { usePublishProjectConfig } from '@/domains/project-config/designer/hooks'
import { useProjectConfigDesignerStore } from '@/domains/project-config/designer/stores'
import { EditorChangesBadge, EditorSaveStatus } from '@/shared/editor-status'
import { cn } from '@/shared/utils/style-utils'
import { Button } from '@/ui-kit/ui/button'

const projectTabs = [
  {
    id: 'designer',
    label: 'Design',
    to: '/workspace/$workspaceSlug/projects/$projectId/designer' as const,
  },
  {
    id: 'connect',
    label: 'Connect',
    to: '/workspace/$workspaceSlug/projects/$projectId/connect' as const,
  },
  {
    id: 'distribute',
    label: 'Share',
    to: '/workspace/$workspaceSlug/projects/$projectId/distribute' as const,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    to: '/workspace/$workspaceSlug/projects/$projectId/analytics' as const,
  },
]

function ProjectPillTabs({
  workspaceSlug,
  projectId,
}: {
  workspaceSlug: string
  projectId: string
}) {
  const params = { workspaceSlug, projectId }

  return (
    <nav className="flex gap-1">
      {projectTabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.to}
          params={params}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
          activeProps={{
            className: 'bg-muted text-foreground',
          }}
          inactiveProps={{
            className:
              'text-muted-foreground hover:bg-muted hover:text-foreground',
          }}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  )
}

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

  // Show publish workflow on Designer, Distribute, and Connect (not Analytics)
  const showPublishWorkflow = useMemo(() => {
    const path = location.pathname
    return !path.includes('/analytics')
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

  // Hide share button on distribute page (it IS the share page)
  const showShareButton = useMemo(() => {
    return !location.pathname.includes('/distribute')
  }, [location.pathname])

  // Hide TopNavBar border on designer route (designer sub-tabs provide their own border)
  const isDesignerRoute = location.pathname.includes('/designer')

  return (
    <div className="flex h-screen flex-col">
      <TopNavBar
        className="shrink-0"
        borderless={isDesignerRoute}
        breadcrumbs={[
          {
            label: project.name,
            icon: FolderOpen,
            iconHref: projectsListPath,
          },
        ]}
        center={
          <ProjectPillTabs
            workspaceSlug={workspaceSlug}
            projectId={project.id}
          />
        }
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
