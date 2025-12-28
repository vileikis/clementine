import { Plus } from 'lucide-react'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { WorkspaceListEmpty } from './WorkspaceListEmpty'
import { WorkspaceListItem } from './WorkspaceListItem'
import { CreateWorkspaceSheet } from './CreateWorkspaceSheet'
import { Button } from '@/ui-kit/components/button'

/**
 * List of active workspaces with loading and empty states
 *
 * Displays all active workspaces in a vertical list, with real-time updates.
 * Shows empty state when no workspaces exist.
 */
export function WorkspaceList() {
  const { data: workspaces, isLoading, error } = useWorkspaces()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading workspaces...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">
          Error loading workspaces: {error.message}
        </p>
      </div>
    )
  }

  if (!workspaces || workspaces.length === 0) {
    return <WorkspaceListEmpty />
  }

  return (
    <div className="space-y-4">
      {/* Header with Create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Workspaces</h2>
          <p className="text-sm text-muted-foreground">
            {workspaces.length}{' '}
            {workspaces.length === 1 ? 'workspace' : 'workspaces'}
          </p>
        </div>
        <CreateWorkspaceSheet
          trigger={
            <Button className="min-h-[44px]">
              <Plus className="size-4" />
              <span>Create Workspace</span>
            </Button>
          }
        />
      </div>

      {/* Workspace list */}
      <div className="space-y-2">
        {workspaces.map((workspace) => (
          <WorkspaceListItem key={workspace.id} workspace={workspace} />
        ))}
      </div>
    </div>
  )
}
