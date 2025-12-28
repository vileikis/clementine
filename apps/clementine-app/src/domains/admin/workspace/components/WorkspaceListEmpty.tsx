/**
 * Empty state for workspace list
 *
 * Displayed when no active workspaces exist.
 * Shows friendly message encouraging admin to create first workspace.
 * Will include "Create workspace" button once creation feature is implemented (US2).
 */
export function WorkspaceListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <h3 className="mb-2 text-lg font-semibold">No workspaces yet</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Get started by creating your first workspace
      </p>
      {/* Create workspace button will be added in US2 (T020) */}
    </div>
  )
}
