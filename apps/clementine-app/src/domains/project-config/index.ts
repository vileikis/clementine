/**
 * Project Config Domain Barrel Export
 *
 * Main entry point for the project config domain.
 * Exports components, types, schemas, hooks, and queries.
 *
 * Note: This domain handles project configuration (formerly event configuration).
 * Config is now stored directly on the project document.
 */

// Components & Containers
export {
  ProjectConfigDesignerPage,
  ProjectConfigDesignerLayout,
} from './designer'
export { WelcomeEditorPage } from './welcome'
export { ThemeEditorPage } from './theme'
export { ShareEditorPage } from './share'
export { ProjectConfigSettingsPage } from './settings'

// Types
export type {
  ProjectConfig,
  Project,
  OverlaysConfig,
  ShareOptionsConfig,
} from './shared/types'

// Schemas
export { projectConfigSchema } from './shared/schemas'

// Hooks
export { useProjectConfig } from './shared/hooks'

// Queries
export { projectConfigQuery } from './shared/queries'
