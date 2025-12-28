import { useWorkspaces } from '../hooks/useWorkspaces'
import { WorkspaceListEmpty } from './WorkspaceListEmpty'
import { WorkspaceListItem } from './WorkspaceListItem'

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
    <div className="space-y-2">
      {workspaces.map((workspace) => (
        <WorkspaceListItem key={workspace.id} workspace={workspace} />
      ))}
    </div>
  )
}
