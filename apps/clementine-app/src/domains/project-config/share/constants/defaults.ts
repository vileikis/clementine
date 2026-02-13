/**
 * Share Screen Configuration Constants
 *
 * Limits and defaults for share screen configuration.
 */
import type {
  CtaConfig,
  EmailCaptureConfig,
  ShareLoadingConfig,
  ShareReadyConfig,
} from '@clementine/shared'

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
 * Default email capture configuration
 */
export const DEFAULT_EMAIL_CAPTURE: EmailCaptureConfig = {
  enabled: false,
  heading: null,
}

/**
 * Default share loading state configuration
 * Used when initializing loading form or providing fallbacks during AI generation
 */
export const DEFAULT_SHARE_LOADING: ShareLoadingConfig = {
  title: 'Creating your experience...',
  description:
    'This usually takes 30-60 seconds. Please wait while we generate your personalized result.',
  emailCapture: null,
}

/**
 * Default share ready state configuration values
 * Used when initializing form state or providing fallbacks.
 */
export const DEFAULT_SHARE_READY: ShareReadyConfig = {
  title: null,
  description: null,
  cta: null,
}
