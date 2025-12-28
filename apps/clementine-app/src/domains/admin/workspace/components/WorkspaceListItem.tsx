import { Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import { DeleteWorkspaceDialog } from './DeleteWorkspaceDialog'
import type { Workspace } from '@/domains/workspace/types/workspace.types'
import { Button } from '@/ui-kit/components/button'

interface WorkspaceListItemProps {
  workspace: Workspace
}

/**
 * Single workspace item in the list
 *
 * Displays workspace name, slug, and provides navigation to workspace detail page.
 * Includes delete button that opens confirmation dialog.
 */
export function WorkspaceListItem({ workspace }: WorkspaceListItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <Link
        to="/workspace/$workspaceId"
        params={{ workspaceId: workspace.slug }}
        className="flex flex-col gap-1 flex-1 hover:opacity-80 transition-opacity"
      >
        <h3 className="font-semibold text-foreground">{workspace.name}</h3>
        <p className="text-sm text-muted-foreground">/{workspace.slug}</p>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          to="/workspace/$workspaceId"
          params={{ workspaceId: workspace.slug }}
        >
          <Button variant="ghost" size="sm" className="min-h-[44px]">
            View
          </Button>
        </Link>

        <DeleteWorkspaceDialog
          workspace={workspace}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
              aria-label={`Delete ${workspace.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          }
        />
      </div>
    </div>
  )
}
