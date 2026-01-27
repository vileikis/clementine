/**
 * Welcome Subdomain Barrel Export
 *
 * Public API for the welcome editor module.
 */

// Containers
export { WelcomeEditorPage } from './containers'

// Components
export {
  WelcomeRenderer,
  WelcomeConfigPanel,
  ExperienceCard,
} from './components'
export type {
  WelcomeRendererProps,
  ExperienceCardProps,
  ExperienceCardData,
} from './components'

// Hooks
export { useUpdateWelcome, useUploadAndUpdateHeroMedia } from './hooks'

// Constants
export { DEFAULT_WELCOME } from './constants'

// Types - re-export from schemas
export type { UpdateWelcome, WelcomeConfig } from './schemas'
