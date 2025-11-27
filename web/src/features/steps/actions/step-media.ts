"use server";

import { storage } from "@/lib/firebase/admin";
import type { StepMediaType } from "../types";
import type { ActionResponse } from "./types";
import { detectMediaType } from "../utils/media-type";
import { MEDIA_VALIDATION } from "../utils/media-validation";
import { validateLottieFile } from "../utils/lottie-validation";

/**
 * Upload result data
 */
interface UploadResultData {
  /** Public URL to the uploaded file */
  publicUrl: string;
  /** Detected media type */
  mediaType: StepMediaType;
  /** File size in bytes */
  sizeBytes: number;
}

/**
 * Upload media to shared company storage
 *
 * @param companyId - Company ID for storage path
 * @param file - File to upload (from form input)
 * @returns Public URL and detected media type
 *
 * Storage path: media/{companyId}/{mediaType}/{timestamp}-{filename}
 *
 * Validation:
 * - Images (JPG, PNG, WebP): max 10MB
 * - GIFs: max 10MB
 * - Videos (MP4, WebM): max 25MB
 * - Lottie (JSON): max 5MB, validates structure
 */
export async function uploadStepMedia(
  companyId: string,
  file: File
): Promise<ActionResponse<UploadResultData>> {
  try {
    // Detect media type from file
    const mediaType = detectMediaType(file);

    if (!mediaType) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Unsupported file type. Please upload an image (JPG, PNG, WebP), GIF, video (MP4, WebM), or Lottie animation (JSON).",
        },
      };
    }

    // Get validation rules for this media type
    const validation = MEDIA_VALIDATION[mediaType];

    // Validate file size
    if (file.size > validation.maxSize) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `File size must be less than ${validation.maxSizeLabel}`,
        },
      };
    }

    // Validate Lottie structure for JSON files
    if (mediaType === "lottie") {
      const isValid = await validateLottieFile(file);
      if (!isValid) {
        return {
          success: false,
          error: {
            code: "INVALID_LOTTIE",
            message:
              "Invalid Lottie file. The JSON must contain valid Lottie animation data (v, fr, ip, op, w, h, layers).",
          },
        };
      }
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `media/${companyId}/${mediaType}/${timestamp}-${sanitizedFilename}`;

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
    const publicUrl = `https://storage.googleapis.com/${storage.name}/${path}`;

    return {
      success: true,
      data: {
        publicUrl,
        mediaType,
        sizeBytes: file.size,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPLOAD_ERROR",
        message: error instanceof Error ? error.message : "Upload failed",
      },
    };
  }
}
