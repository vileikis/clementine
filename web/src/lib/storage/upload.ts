// Firebase Storage operations for images and files using Admin SDK
// All file uploads use this module to ensure consistent paths and metadata

import { storage } from "@/lib/firebase/admin";
import { getDownloadURL } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Validates an image file for size and type
 */
function validateImageFile(
  file: File
): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File too large (max 10MB)" };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, WebP allowed.",
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["jpg", "jpeg", "png", "webp"].includes(ext || "")) {
    return { valid: false, error: "Invalid file extension" };
  }

  return { valid: true };
}

/**
 * Uploads guest input photo to Storage
 * Path: events/{eventId}/sessions/{sessionId}/input.jpg
 */
export async function uploadInputImage(
  eventId: string,
  sessionId: string,
  file: File
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const path = `events/${eventId}/sessions/${sessionId}/input.jpg`;
  const blob = storage.file(path);

  await blob.save(Buffer.from(await file.arrayBuffer()), {
    contentType: "image/jpeg",
  });

  return path;
}

/**
 * Uploads AI-transformed result image to Storage
 * Path: events/{eventId}/sessions/{sessionId}/result.jpg
 */
export async function uploadResultImage(
  eventId: string,
  sessionId: string,
  buffer: Buffer
): Promise<string> {
  const path = `events/${eventId}/sessions/${sessionId}/result.jpg`;
  const blob = storage.file(path);

  await blob.save(buffer, {
    contentType: "image/jpeg",
  });

  return path;
}

/**
 * Copies input image to result location for passthrough mode (no AI transformation)
 * Used when scene prompt is empty/null
 * Path: events/{eventId}/sessions/{sessionId}/input.jpg → events/{eventId}/sessions/{sessionId}/result.jpg
 */
export async function copyImageToResult(
  inputPath: string,
  resultPath: string
): Promise<string> {
  const inputFile = storage.file(inputPath);
  const resultFile = storage.file(resultPath);

  // Download the input image
  const [inputBuffer] = await inputFile.download();

  // Upload it to the result location
  await resultFile.save(inputBuffer, {
    contentType: "image/jpeg",
  });

  return resultPath;
}

/**
 * Uploads scene reference image to Storage
 * Path: events/{eventId}/refs/{timestamp}-{filename}
 */
export async function uploadReferenceImage(
  eventId: string,
  file: File
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const filename = `${Date.now()}-${file.name}`;
  const path = `events/${eventId}/refs/${filename}`;
  const blob = storage.file(path);

  await blob.save(Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  });

  return path;
}

/**
 * Uploads QR code PNG to Storage
 * Path: events/{eventId}/qr/join.png or events/{eventId}/qr/sessions/{sessionId}.png
 */
export async function uploadQrCode(
  storagePath: string,
  buffer: Buffer
): Promise<string> {
  const blob = storage.file(storagePath);

  await blob.save(buffer, {
    contentType: "image/png",
  });

  return storagePath;
}

/**
 * Generates a temporary signed URL for file access
 * Default expiration: 1 hour
 */
export async function getSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const [url] = await storage.file(path).getSignedUrl({
    action: "read",
    expires: Date.now() + expiresIn * 1000,
  });
  return url;
}

/**
 * Generates a public download URL for file access
 * Uses Firebase Admin SDK's getDownloadURL method
 */
export async function getPublicUrl(path: string): Promise<string> {
  const file = storage.file(path);

  try {
    // Get the download URL using Firebase Admin SDK
    const downloadUrl = await getDownloadURL(file);

    console.log("[Storage] Generated download URL:", {
      path,
      url: downloadUrl,
    });

    return downloadUrl;
  } catch (error) {
    console.error("[Storage] Failed to generate download URL:", error);
    throw new Error(
      `Failed to get download URL for file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ============================================================================
// Generic Image Upload (for forms/components)
// ============================================================================

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
  destination: "welcome" | "experience-preview" | "experience-overlay" | "ai-reference"
): Promise<
  | { success: true; data: { path: string; url: string } }
  | { success: false; error: { code: string; message: string } }
> {
  "use server";

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
