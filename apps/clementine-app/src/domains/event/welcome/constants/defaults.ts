/**
 * Welcome Configuration Constants
 *
 * Limits and defaults for welcome screen configuration.
 */
import type { WelcomeConfig } from '@/domains/event/shared'

/**
 * Maximum character length for welcome title
 */
export const WELCOME_TITLE_MAX_LENGTH = 100

/**
 * Maximum character length for welcome description
 */
export const WELCOME_DESCRIPTION_MAX_LENGTH = 500

/**
 * Default welcome configuration values
 * Used when initializing form state or providing fallbacks.
 */
export const DEFAULT_WELCOME: WelcomeConfig = {
  title: 'Choose your experience',
  description: null,
  media: null,
  layout: 'list',
}
