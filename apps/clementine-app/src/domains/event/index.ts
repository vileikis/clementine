/**
 * Event Domain Barrel Export
 *
 * Main entry point for the event domain.
 * Exports components, types, schemas, hooks, and queries.
 */

// Components & Containers
export { EventDesignerPage, EventDesignerLayout } from './designer'
export { WelcomeEditorPage } from './welcome'
export { ThemeEditorPage } from './theme'
export { EventSettingsPage } from './settings'

// Types
export type {
  ProjectEventConfig,
  ProjectEventFull,
  OverlaysConfig,
  SharingConfig,
  SocialSharingConfig,
} from './shared/types'

// Schemas
export {
  projectEventConfigSchema,
  projectEventFullSchema,
} from './shared/schemas'

// Hooks
export { useProjectEvent } from './shared/hooks'

// Queries
export { projectEventQuery } from './shared/queries'
