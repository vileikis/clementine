/**
 * Workspace name validation constraints
 */
export const WORKSPACE_NAME = {
  min: 1,
  max: 100,
} as const

/**
 * Workspace slug validation constraints
 */
export const WORKSPACE_SLUG = {
  min: 1,
  max: 50,
  pattern: /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
} as const
