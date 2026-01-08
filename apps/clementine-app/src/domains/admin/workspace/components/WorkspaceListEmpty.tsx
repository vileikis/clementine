import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { Button } from '@/ui-kit/ui/button'

/**
 * Empty state for workspace list
 *
 * Displayed when no active workspaces exist.
 * Shows friendly message encouraging admin to create first workspace.
 * Includes "Create workspace" button to navigate to creation page.
 */
export function WorkspaceListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <h3 className="mb-2 text-lg font-semibold">No workspaces yet</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Get started by creating your first workspace
      </p>
      <Link to="/admin/workspaces/create">
        <Button className="min-h-[44px]">
          <Plus className="size-4" />
          <span>Create Workspace</span>
        </Button>
      </Link>
    </div>
  )
}
