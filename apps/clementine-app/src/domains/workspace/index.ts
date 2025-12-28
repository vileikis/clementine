// Types (public API - reused by admin and workspace contexts)
export type {
  Workspace,
  WorkspaceStatus,
  CreateWorkspaceInput,
  DeleteWorkspaceInput,
} from './types/workspace.types'

// Schemas (public API - reused for validation)
export {
  workspaceSchema,
  workspaceStatusSchema,
  slugSchema,
  createWorkspaceSchema,
  deleteWorkspaceSchema,
} from './schemas/workspace.schemas'

// Schema types (public API)
export type {
  WorkspaceSchema,
  CreateWorkspaceSchemaType,
  DeleteWorkspaceSchemaType,
} from './schemas/workspace.schemas'

// Constants (public API for validation messages)
export { WORKSPACE_NAME, WORKSPACE_SLUG } from './constants/workspace.constants'

// Workspace-scoped hooks (view one, update workspace settings)
export { useWorkspace } from './hooks/useWorkspace'

// Containers (workspace-scoped pages)
export { WorkspacePage } from './containers/WorkspacePage'

// NOTE: Admin hooks (list all, create, delete) → domains/admin/workspace/hooks
