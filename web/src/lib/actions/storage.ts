"use server";

import { storage } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";

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
  try {
    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: {
          code: "INVALID_FILE_TYPE",
          message: "File must be PNG, JPEG, or WebP",
        },
      };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return {
        success: false,
        error: {
          code: "FILE_TOO_LARGE",
          message: "File size must be less than 10MB",
        },
      };
    }

    // Generate unique filename
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${uuidv4()}.${extension}`;
    const path = `images/${destination}/${filename}`;

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Firebase Storage
    const fileRef = storage.file(path);
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get public URL
    const url = `https://storage.googleapis.com/${storage.name}/${path}`;

    return {
      success: true,
      data: { path, url },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPLOAD_FAILED",
        message: error instanceof Error ? error.message : "Upload failed",
      },
    };
  }
}
