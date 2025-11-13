"use server";

/**
 * Server Actions for Firebase Storage operations.
 * Phase 2 implementation: Stub actions with type signatures only.
 * Full implementation will be added in later phases.
 */

// Action response types
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

/**
 * Uploads an image to Firebase Storage and returns the storage path.
 * @param file - Image file to upload
 * @param destination - Storage destination category
 * @returns Success response with storage path and public URL, or error
 */
export async function uploadImage(
  file: File,
  destination: "welcome" | "experience-preview" | "experience-overlay" | "ai-reference"
): Promise<ActionResponse<{ path: string; url: string }>> {
  // TODO: Implement in Phase 5+ (when image upload is needed)
  throw new Error("Not implemented");
}
