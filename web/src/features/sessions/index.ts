// ============================================================================
// Server Actions - Safe (marked "use server")
// ============================================================================
export {
  startSessionAction,
  saveCaptureAction,
  getSessionAction,
  triggerTransformAction,
} from './lib/actions';

// ============================================================================
// Types - Safe (compile-time only)
// ============================================================================
export type {
  Session,
  SessionState,
} from './types/session.types';

// ============================================================================
// Repository - NOT EXPORTED
// Contains server-only code (Firebase Admin SDK)
// Import directly when needed: @/features/sessions/lib/repository
// ============================================================================
