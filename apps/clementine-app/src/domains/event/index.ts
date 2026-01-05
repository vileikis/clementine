/**
 * Event Domain Barrel Export
 *
 * Main entry point for the event domain.
 * Exports components, types, and schemas.
 */
export { EventDesignerPage } from './designer'
export type {
  ProjectEventConfig,
  ProjectEventFull,
  OverlaysConfig,
  SharingConfig,
  SocialSharingConfig,
} from './shared/types'
export {
  projectEventConfigSchema,
  projectEventFullSchema,
} from './shared/schemas'
