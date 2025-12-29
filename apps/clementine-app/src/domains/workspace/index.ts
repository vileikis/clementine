// Types (public API - reused by admin and workspace contexts)
export type * from './types/workspace.types'

// Schemas (public API - reused for validation)
export {
  workspaceSchema,
  workspaceStatusSchema,
  slugSchema,
  createWorkspaceSchema,
  deleteWorkspaceSchema,
  updateWorkspaceSchema,
} from './schemas/workspace.schemas'

// Schema types (public API)
export type {
  WorkspaceSchema,
  CreateWorkspaceSchemaType,
  DeleteWorkspaceSchemaType,
  UpdateWorkspaceSchemaType,
} from './schemas/workspace.schemas'

// Constants (public API for validation messages)
export { WORKSPACE_NAME, WORKSPACE_SLUG } from './constants/workspace.constants'

// Workspace-scoped hooks (view one, update workspace settings)
export { useWorkspace } from './hooks/useWorkspace'
export { useUpdateWorkspace } from './hooks/useUpdateWorkspace'

// Zustand store (session persistence)
export { useWorkspaceStore } from './store/useWorkspaceStore'

// Components (workspace-specific UI components)
export { WorkspaceSettingsForm } from './components/WorkspaceSettingsForm'

// Containers (workspace-scoped pages)
export { WorkspacePage } from './containers/WorkspacePage'

// NOTE: Admin hooks (list all, create, delete) → domains/admin/workspace/hooks
