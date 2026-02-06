/**
 * Aspect Ratio Schema
 *
 * Canonical aspect ratio definitions for the Clementine platform.
 * Single source of truth for all aspect ratio values across frontend and backend.
 *
 * Supported ratios:
 * - 1:1  - Square (images, GIFs, videos)
 * - 3:2  - Landscape (images, GIFs only)
 * - 2:3  - Portrait/tall (images, GIFs only)
 * - 9:16 - Vertical/stories (images, GIFs, videos)
 */
import { z } from 'zod'

/**
 * Canonical aspect ratios supported by the platform.
 * Used for AI generation output dimensions and overlay matching.
 */
export const aspectRatioSchema = z.enum(['1:1', '3:2', '2:3', '9:16'])

/**
 * Overlay configuration keys.
 * Extends aspect ratios with 'default' fallback option.
 */
export const overlayKeySchema = z.enum(['1:1', '3:2', '2:3', '9:16', 'default'])

/**
 * Image-specific aspect ratios (all 4 ratios supported).
 */
export const imageAspectRatioSchema = aspectRatioSchema

/**
 * Video-specific aspect ratios (subset: only 9:16 and 1:1).
 */
export const videoAspectRatioSchema = z.enum(['9:16', '1:1'])

// Type exports
export type AspectRatio = z.infer<typeof aspectRatioSchema>
export type OverlayKey = z.infer<typeof overlayKeySchema>
export type ImageAspectRatio = z.infer<typeof imageAspectRatioSchema>
export type VideoAspectRatio = z.infer<typeof videoAspectRatioSchema>

/**
 * Array of all aspect ratios for UI rendering.
 */
export const ASPECT_RATIOS = aspectRatioSchema.options

/**
 * Array of all overlay keys including default.
 */
export const OVERLAY_KEYS = overlayKeySchema.options

/**
 * Array of image aspect ratios.
 */
export const IMAGE_ASPECT_RATIOS = imageAspectRatioSchema.options

/**
 * Array of video aspect ratios.
 */
export const VIDEO_ASPECT_RATIOS = videoAspectRatioSchema.options
