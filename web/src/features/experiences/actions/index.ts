/**
 * Types export for experience Server Actions
 *
 * Part of 003-experience-schema implementation (Phase 6 - Action File Reorganization).
 *
 * **IMPORTANT**: Do NOT import Server Actions from this barrel export!
 * Server Actions must be imported directly from their source files to avoid
 * bundling server-only code (Firebase Admin SDK, next/headers) in client bundles.
 *
 * ✅ CORRECT - Import directly from source:
 * ```ts
 * import { createPhotoExperience } from '@/features/experiences/actions/photo-create';
 * import { updatePhotoExperience } from '@/features/experiences/actions/photo-update';
 * import { deleteExperience } from '@/features/experiences/actions/shared';
 * import { uploadPreviewMedia } from '@/features/experiences/actions/photo-media';
 * ```
 *
 * ❌ WRONG - Do not import from barrel:
 * ```ts
 * import { createPhotoExperience } from '@/features/experiences/actions'; // DON'T DO THIS
 * ```
 */

// Types only (safe for client)
export type { ActionResponse, ErrorCode } from "./types";
export { ErrorCodes } from "./types";