/**
 * Admin workspace management module
 *
 * Public API for admin-scoped workspace operations (list all, create, delete).
 * For workspace-scoped features (view one, update), use domains/workspace/ instead.
 */

// Hooks (admin operations)
export { useWorkspaces } from './hooks/useWorkspaces'
export { useCreateWorkspace } from './hooks/useCreateWorkspace'
export { useDeleteWorkspace } from './hooks/useDeleteWorkspace'

// Components (admin UI)
export { WorkspaceList } from './components/WorkspaceList'
export { WorkspaceListEmpty } from './components/WorkspaceListEmpty'
export { WorkspaceListItem } from './components/WorkspaceListItem'
export { CreateWorkspaceSheet } from './components/CreateWorkspaceSheet'
export { DeleteWorkspaceDialog } from './components/DeleteWorkspaceDialog'

// Containers (page components)
export { WorkspacesPage } from './containers/WorkspacesPage'
