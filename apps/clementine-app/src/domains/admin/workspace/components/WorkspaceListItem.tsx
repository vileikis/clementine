import type { Workspace } from '@/domains/workspace/types/workspace.types'
import { Button } from '@/ui-kit/components/button'

interface WorkspaceListItemProps {
  workspace: Workspace
}

/**
 * Single workspace item in the list
 *
 * Displays workspace name, slug, and provides navigation to workspace detail page.
 * Clickable card that navigates to /workspace/[slug].
 *
 * NOTE: Navigation to workspace detail page will be implemented in US3 (T022-T025)
 */
export function WorkspaceListItem({ workspace }: WorkspaceListItemProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold">{workspace.name}</h3>
        <p className="text-sm text-muted-foreground">/{workspace.slug}</p>
      </div>
      <Button variant="ghost" size="sm">
        View
      </Button>
    </div>
  )
}
