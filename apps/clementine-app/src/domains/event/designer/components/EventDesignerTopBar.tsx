/**
 * EventDesignerTopBar Component
 *
 * Top navigation bar for the event designer with breadcrumbs,
 * "New changes" badge, and publish button.
 */
import { Link } from '@tanstack/react-router'
import { FolderOpen, Loader2 } from 'lucide-react'
import { Button } from '@/ui-kit/components/button'

interface EventDesignerTopBarProps {
  projectName: string
  projectPath: string
  projectsListPath: string
  eventName: string
  hasUnpublishedChanges: boolean
  isPublishing: boolean
  onPublish: () => void
}

export function EventDesignerTopBar({
  projectName,
  projectPath,
  projectsListPath,
  eventName,
  hasUnpublishedChanges,
  isPublishing,
  onPublish,
}: EventDesignerTopBarProps) {
  return (
    <div className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {/* Folder icon - links to projects list */}
          <Link
            to={projectsListPath}
            className="hover:text-foreground transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
          </Link>

          {/* Project name - links to project page */}
          <Link
            to={projectPath}
            className="hover:text-foreground transition-colors"
          >
            {projectName}
          </Link>

          <span>/</span>

          {/* Event name - not clickable */}
          <span className="font-medium text-foreground">{eventName}</span>

          {/* New changes badge */}
          {hasUnpublishedChanges && (
            <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 dark:bg-yellow-950 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              New changes
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            Preview
          </Button>
          <Button
            onClick={onPublish}
            disabled={!hasUnpublishedChanges || isPublishing}
          >
            {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish
          </Button>
        </div>
      </div>
    </div>
  )
}
