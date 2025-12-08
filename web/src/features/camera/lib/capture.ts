/**
 * Camera Capture Utility
 *
 * Canvas-based photo capture from video element.
 * Extracted and enhanced from web/src/features/guest/lib/capture.ts
 */

import { CAPTURE_QUALITY } from "../constants";

/**
 * Captures a photo from a video element using canvas
 *
 * @param video - The HTMLVideoElement with active stream
 * @returns Promise resolving to a Blob containing the captured image
 * @throws Error if canvas context unavailable or blob creation fails
 */
export async function captureFromVideo(video: HTMLVideoElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.drawImage(video, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Capture failed: blob creation failed"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      CAPTURE_QUALITY
    );
  });
}

/**
 * Captures a mirrored photo from a video element (for front camera selfies)
 *
 * @param video - The HTMLVideoElement with active stream
 * @returns Promise resolving to a Blob containing the mirrored captured image
 * @throws Error if canvas context unavailable or blob creation fails
 */
export async function captureFromVideoMirrored(
  video: HTMLVideoElement
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  // Mirror the image horizontally for natural selfie appearance
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Capture failed: blob creation failed"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      CAPTURE_QUALITY
    );
  });
}

/**
 * Creates a File object from a Blob with a timestamped filename
 *
 * @param blob - The blob to convert to File
 * @param prefix - Optional filename prefix (default: "capture")
 * @returns File object suitable for upload
 */
export function createCaptureFile(blob: Blob, prefix = "capture"): File {
  const timestamp = Date.now();
  const filename = `${prefix}-${timestamp}.jpg`;
  return new File([blob], filename, { type: "image/jpeg" });
}
