/**
 * Server Action Contracts: Photo Experience Tweaks
 *
 * This file documents the Server Action signatures for Experience CRUD operations
 * and media uploads. These are TypeScript-based Server Actions (Next.js 16 pattern),
 * not REST API endpoints.
 *
 * All Server Actions use Firebase Admin SDK for Firestore writes and Storage uploads.
 *
 * Location: web/src/lib/actions/experiences.ts
 */

import type { Experience } from "@/lib/types/firestore";

// ============================================================================
// Experience CRUD Operations
// ============================================================================

/**
 * Update Experience configuration
 *
 * Updates an existing Experience document in Firestore with partial data.
 * Used by ExperienceEditor to save changes.
 *
 * Authentication: Required (organizer must own the event)
 * Authorization: Verified via event ownership check
 * Validation: updateExperienceSchema (Zod)
 * Side Effects: Sets updatedAt timestamp
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID to update
 * @param data - Partial Experience data (validated fields only)
 * @returns Updated Experience document
 * @throws Error if validation fails or user lacks permission
 */
export async function updateExperience(
  eventId: string,
  experienceId: string,
  data: {
    label?: string;
    enabled?: boolean;
    previewPath?: string;
    previewType?: "image" | "gif" | "video";
    countdownEnabled?: boolean;
    countdownSeconds?: number;
    overlayFramePath?: string;
    aiEnabled?: boolean;
    aiModel?: string;
    aiPrompt?: string;
    aiReferenceImagePaths?: string[];
    aiAspectRatio?: "1:1" | "3:4" | "4:5" | "9:16" | "16:9";
  }
): Promise<Experience>;

/**
 * Delete Experience
 *
 * Deletes an Experience document and all associated media (preview, overlay, ref images)
 * from Firebase Storage.
 *
 * Authentication: Required (organizer must own the event)
 * Authorization: Verified via event ownership check
 * Side Effects:
 *   - Deletes Firestore document
 *   - Deletes Firebase Storage files (preview media, overlays, reference images)
 *   - Decrements event.experiencesCount counter
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID to delete
 * @returns void
 * @throws Error if user lacks permission or deletion fails
 */
export async function deleteExperience(
  eventId: string,
  experienceId: string
): Promise<void>;

// ============================================================================
// Media Upload Operations
// ============================================================================

/**
 * Upload Preview Media
 *
 * Uploads preview media (image/GIF/video) to Firebase Storage and returns public URL.
 * If experience already has preview media, deletes old file before uploading new one.
 *
 * Authentication: Required (organizer must own the event)
 * Authorization: Verified via event ownership check
 * Validation:
 *   - File type: image/jpeg, image/png, image/gif, video/mp4, video/webm
 *   - File size: ≤10MB
 * Storage Path: /events/{eventId}/experiences/{experienceId}/preview/{filename}
 * Side Effects:
 *   - Uploads file to Firebase Storage
 *   - Deletes old preview media if exists
 *   - Does NOT update Firestore (caller must call updateExperience separately)
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID to update
 * @param file - File object from form input
 * @returns Object with publicUrl and fileType
 * @throws Error if validation fails, upload fails, or user lacks permission
 */
export async function uploadPreviewMedia(
  eventId: string,
  experienceId: string,
  file: File
): Promise<{
  publicUrl: string;
  fileType: "image" | "gif" | "video";
  sizeBytes: number;
}>;

/**
 * Delete Preview Media
 *
 * Deletes preview media file from Firebase Storage.
 * Does NOT update Firestore (caller must call updateExperience to clear previewPath/previewType).
 *
 * Authentication: Required (organizer must own the event)
 * Authorization: Verified via event ownership check
 * Side Effects:
 *   - Deletes file from Firebase Storage
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID
 * @param previewPath - Public URL of preview media to delete
 * @returns void
 * @throws Error if deletion fails or user lacks permission
 */
export async function deletePreviewMedia(
  eventId: string,
  experienceId: string,
  previewPath: string
): Promise<void>;

/**
 * Upload Frame Overlay
 *
 * Uploads frame overlay image to Firebase Storage and returns public URL.
 * If experience already has frame overlay, deletes old file before uploading new one.
 *
 * Authentication: Required (organizer must own the event)
 * Authorization: Verified via event ownership check
 * Validation:
 *   - File type: image/png (PNG recommended for transparency)
 *   - File size: ≤10MB
 * Storage Path: /events/{eventId}/experiences/{experienceId}/overlay/{filename}
 * Side Effects:
 *   - Uploads file to Firebase Storage
 *   - Deletes old overlay if exists
 *   - Does NOT update Firestore (caller must call updateExperience separately)
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID to update
 * @param file - File object from form input (PNG recommended)
 * @returns Object with publicUrl
 * @throws Error if validation fails, upload fails, or user lacks permission
 */
export async function uploadFrameOverlay(
  eventId: string,
  experienceId: string,
  file: File
): Promise<{
  publicUrl: string;
  sizeBytes: number;
}>;

/**
 * Delete Frame Overlay
 *
 * Deletes frame overlay file from Firebase Storage.
 * Does NOT update Firestore (caller must call updateExperience to clear overlayFramePath).
 *
 * Authentication: Required (organizer must own the event)
 * Authorization: Verified via event ownership check
 * Side Effects:
 *   - Deletes file from Firebase Storage
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID
 * @param overlayPath - Public URL of overlay to delete
 * @returns void
 * @throws Error if deletion fails or user lacks permission
 */
export async function deleteFrameOverlay(
  eventId: string,
  experienceId: string,
  overlayPath: string
): Promise<void>;

/**
 * Upload AI Reference Image
 *
 * Uploads a single AI reference image to Firebase Storage and returns public URL.
 * Caller is responsible for maintaining array of reference image URLs in Firestore.
 *
 * Authentication: Required (organizer must own the event)
 * Authorization: Verified via event ownership check
 * Validation:
 *   - File type: image/jpeg, image/png
 *   - File size: ≤10MB
 * Storage Path: /events/{eventId}/experiences/{experienceId}/references/{filename}
 * Side Effects:
 *   - Uploads file to Firebase Storage
 *   - Does NOT update Firestore (caller must call updateExperience to add URL to aiReferenceImagePaths)
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID to update
 * @param file - File object from form input
 * @returns Object with publicUrl
 * @throws Error if validation fails, upload fails, or user lacks permission
 */
export async function uploadReferenceImage(
  eventId: string,
  experienceId: string,
  file: File
): Promise<{
  publicUrl: string;
  sizeBytes: number;
}>;

/**
 * Delete AI Reference Image
 *
 * Deletes a reference image file from Firebase Storage.
 * Does NOT update Firestore (caller must call updateExperience to remove URL from aiReferenceImagePaths).
 *
 * Authentication: Required (organizer must own the event)
 * Authorization: Verified via event ownership check
 * Side Effects:
 *   - Deletes file from Firebase Storage
 *
 * @param eventId - Event ID containing the experience
 * @param experienceId - Experience ID
 * @param imagePath - Public URL of reference image to delete
 * @returns void
 * @throws Error if deletion fails or user lacks permission
 */
export async function deleteReferenceImage(
  eventId: string,
  experienceId: string,
  imagePath: string
): Promise<void>;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error types thrown by Server Actions
 */
export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class StorageError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "StorageError";
  }
}

// ============================================================================
// Implementation Notes
// ============================================================================

/**
 * Authentication Pattern:
 *
 * All Server Actions use Next.js server-side auth via cookies/session.
 * Typical flow:
 *
 * 1. Extract user ID from session (e.g., Firebase Auth cookie)
 * 2. Verify user owns the event:
 *    - Query Event document
 *    - Check event.createdBy === userId (or similar ownership field)
 * 3. If authorized, proceed with operation
 * 4. If not authorized, throw UnauthorizedError
 *
 * Example:
 * ```typescript
 * const userId = await getCurrentUserId(); // From session
 * const event = await getEventById(eventId);
 * if (event.createdBy !== userId) {
 *   throw new UnauthorizedError("You do not have permission to modify this event");
 * }
 * ```
 */

/**
 * Validation Pattern:
 *
 * All Server Actions validate input using Zod schemas from web/src/lib/schemas/firestore.ts
 *
 * Example:
 * ```typescript
 * import { updateExperienceSchema } from "@/lib/schemas/firestore";
 *
 * export async function updateExperience(eventId, experienceId, data) {
 *   // Validate input
 *   const validatedData = updateExperienceSchema.parse(data);
 *
 *   // Proceed with update
 *   await updateDoc(experienceRef, {
 *     ...validatedData,
 *     updatedAt: Date.now(),
 *   });
 * }
 * ```
 */

/**
 * Storage Pattern:
 *
 * All media uploads use Firebase Admin SDK Storage:
 *
 * 1. Validate file (type, size)
 * 2. Generate unique filename (e.g., {timestamp}-{originalName})
 * 3. Upload to Firebase Storage bucket
 * 4. Get public URL
 * 5. Return public URL to caller
 * 6. Caller updates Firestore with public URL
 *
 * Example:
 * ```typescript
 * import { bucket } from "@/lib/firebase/admin";
 *
 * export async function uploadPreviewMedia(eventId, experienceId, file) {
 *   // Validate
 *   validateFileType(file);
 *   validateFileSize(file);
 *
 *   // Upload
 *   const filename = `${Date.now()}-${file.name}`;
 *   const path = `events/${eventId}/experiences/${experienceId}/preview/${filename}`;
 *   const fileRef = bucket.file(path);
 *
 *   await fileRef.save(await file.arrayBuffer(), {
 *     metadata: { contentType: file.type },
 *     public: true,
 *   });
 *
 *   const publicUrl = fileRef.publicUrl();
 *
 *   return { publicUrl, fileType: detectFileType(file), sizeBytes: file.size };
 * }
 * ```
 */

/**
 * Cleanup Pattern:
 *
 * When replacing or deleting media, always clean up old files from Storage:
 *
 * Example:
 * ```typescript
 * export async function uploadPreviewMedia(eventId, experienceId, file) {
 *   // Get existing experience
 *   const experience = await getExperienceById(eventId, experienceId);
 *
 *   // Delete old preview media if exists
 *   if (experience.previewPath) {
 *     await deleteFileFromStorage(experience.previewPath);
 *   }
 *
 *   // Upload new media
 *   const { publicUrl, fileType } = await uploadToStorage(file, path);
 *
 *   return { publicUrl, fileType };
 * }
 * ```
 */

/**
 * Transaction Pattern:
 *
 * For operations that modify both Firestore and Storage, handle failures gracefully:
 *
 * Example:
 * ```typescript
 * export async function deleteExperience(eventId, experienceId) {
 *   const experience = await getExperienceById(eventId, experienceId);
 *
 *   try {
 *     // Delete Firestore document first
 *     await deleteDoc(experienceRef);
 *
 *     // Then delete associated media (best effort)
 *     // If Storage deletion fails, it's non-critical (orphaned files)
 *     if (experience.previewPath) {
 *       await deleteFileFromStorage(experience.previewPath).catch(console.error);
 *     }
 *     if (experience.overlayFramePath) {
 *       await deleteFileFromStorage(experience.overlayFramePath).catch(console.error);
 *     }
 *     // ... delete reference images
 *   } catch (error) {
 *     throw new Error(`Failed to delete experience: ${error.message}`);
 *   }
 * }
 * ```
 */
