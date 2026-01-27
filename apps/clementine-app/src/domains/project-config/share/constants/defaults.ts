/**
 * Share Screen Configuration Constants
 *
 * Limits and defaults for share screen configuration.
 */
import type { CtaConfig, ShareConfig } from '@/domains/project-config/shared/schemas'

/**
 * Maximum character length for share title
 */
export const SHARE_TITLE_MAX_LENGTH = 100

/**
 * Maximum character length for share description
 */
export const SHARE_DESCRIPTION_MAX_LENGTH = 500

/**
 * Maximum character length for CTA button label
 */
export const CTA_LABEL_MAX_LENGTH = 50

/**
 * Default CTA configuration values
 */
export const DEFAULT_CTA: CtaConfig = {
  label: null,
  url: null,
}

/**
 * Default share configuration values
 * Used when initializing form state or providing fallbacks.
 */
export const DEFAULT_SHARE: ShareConfig = {
  title: null,
  description: null,
  cta: null,
}
