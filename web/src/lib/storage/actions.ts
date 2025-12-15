"use server";

import { v4 as uuidv4 } from "uuid";
import { storage } from "@/lib/firebase/admin";
import { getPublicUrl } from "./upload";

/**
 * Server action for uploading images from client components.
 *
 * This is separated from upload.ts because it needs to be a server action
 * (safe for client components to import), while upload.ts contains server-only
 * utilities that use Firebase Admin SDK directly.
 */

/**
 * Generic image upload for client-side forms
 * Uploads an image to Firebase Storage and returns the storage path and public URL.
 * Used by ImageUploadField component for welcome screens, experience previews, overlays, and AI references.
 *
 * @param file - Image file to upload
 * @param destination - Storage destination category
 * @returns Success response with storage path and public URL, or error
 */
export async function uploadImage(
  file: File,
  destination: "welcome" | "experience-preview" | "experience-overlay" | "ai-reference" | "logos" | "backgrounds" | "frames"
): Promise<
  | { success: true; data: { path: string; url: string } }
  | { success: false; error: { code: string; message: string } }
> {
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

/**
 * Get public URL for a storage path
 * @param path - Storage path
 * @returns Success response with public URL, or error
 */
export async function getImageUrlAction(path: string) {
  try {
    const url = await getPublicUrl(path);
    return { success: true, url };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get image URL",
    };
  }
}
