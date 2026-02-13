/**
 * Firebase Functions Parameters
 *
 * Centralized definitions for environment variables and secrets.
 * - defineString: loaded from functions/.env
 * - defineSecret: loaded from functions/.secret.local (dev) or Secret Manager (prod)
 *
 * Secrets must be listed in the `secrets` config of each function that uses them.
 */
import { defineString, defineSecret } from 'firebase-functions/params'

// Vertex AI
export const VERTEX_AI_LOCATION = defineString('VERTEX_AI_LOCATION', {
  default: 'us-central1',
})

// Dropbox OAuth
export const DROPBOX_APP_KEY = defineString('DROPBOX_APP_KEY')
export const DROPBOX_APP_SECRET = defineSecret('DROPBOX_APP_SECRET')
export const DROPBOX_TOKEN_ENCRYPTION_KEY = defineSecret('DROPBOX_TOKEN_ENCRYPTION_KEY')

// Email (SMTP via Google Workspace)
export const SMTP_APP_PASSWORD = defineSecret('SMTP_APP_PASSWORD')
