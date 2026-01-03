// Workspace shared subdomain barrel export

// Re-export from shared package (document types)
export {
  workspaceSchema,
  workspaceStatusSchema,
  type Workspace,
  type WorkspaceStatus,
} from '@clementine/shared'

// Local schemas (input/operation types)
export {
  slugSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
  deleteWorkspaceSchema,
  type CreateWorkspaceSchemaType,
  type UpdateWorkspaceSchemaType,
  type DeleteWorkspaceSchemaType,
} from './schemas/workspace.schemas'

// Constants
export { WORKSPACE_NAME, WORKSPACE_SLUG } from './constants/workspace.constants'

// Hooks
export { useWorkspace } from './hooks/useWorkspace'
