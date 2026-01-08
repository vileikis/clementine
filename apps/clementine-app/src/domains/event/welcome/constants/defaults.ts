/**
 * Default Welcome Configuration
 *
 * Used when initializing form state or providing fallbacks.
 */
import type { WelcomeConfig } from '@/domains/event/shared'

export const DEFAULT_WELCOME: WelcomeConfig = {
  title: 'Choose your experience',
  description: null,
  media: null,
  layout: 'list',
}
