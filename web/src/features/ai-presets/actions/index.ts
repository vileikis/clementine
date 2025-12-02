/**
 * Types export for AI Presets Server Actions
 *
 * **IMPORTANT**: Do NOT import Server Actions from this barrel export!
 * Server Actions must be imported directly from their source files to avoid
 * bundling server-only code (Firebase Admin SDK, next/headers) in client bundles.
 *
 * ✅ CORRECT - Import directly from source:
 * ```ts
 * import { createPhotoExperience } from '@/features/ai-presets/actions/photo-create';
 * import { updatePhotoExperience } from '@/features/ai-presets/actions/photo-update';
 * import { deleteExperience } from '@/features/ai-presets/actions/shared';
 * import { uploadPreviewMedia } from '@/features/ai-presets/actions/photo-media';
 * ```
 *
 * ❌ WRONG - Do not import from barrel:
 * ```ts
 * import { createPhotoExperience } from '@/features/ai-presets/actions'; // DON'T DO THIS
 * ```
 */

// Types only (safe for client)
export type { ActionResponse, ErrorCode } from "./types";
export { ErrorCodes } from "./types";