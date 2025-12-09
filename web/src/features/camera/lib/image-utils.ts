/**
 * Image Utility Functions
 *
 * Helpers for working with image files and dimensions.
 */

/**
 * Image dimensions result
 */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Extracts dimensions from an image file
 *
 * @param file - Image file to extract dimensions from
 * @returns Promise resolving to width and height
 * @throws Error if image cannot be loaded
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Extracts dimensions from a video element's current frame
 *
 * @param video - HTMLVideoElement with active stream
 * @returns Image dimensions from the video
 */
export function getVideoDimensions(video: HTMLVideoElement): ImageDimensions {
  return {
    width: video.videoWidth,
    height: video.videoHeight,
  };
}
