/**
 * Internal Interfaces for Job + Cloud Functions
 *
 * These interfaces are used internally by the transform service.
 * Not exported from the shared package.
 *
 * @see specs/062-job-cloud-functions/data-model.md
 */

import type { Job, JobSnapshot, JobOutput, MediaReference } from '@clementine/shared'

// =============================================================================
// Outcome Dispatcher
// =============================================================================

/**
 * Context for outcome execution
 *
 * Passed to all outcome executors with everything needed for processing.
 */
export interface OutcomeContext {
  /** Job document (for ID, status, metadata) */
  job: Job
  /** Job snapshot (immutable execution data) */
  snapshot: JobSnapshot
  /** Processing start timestamp (for timing metrics) */
  startTime: number
  /** Temporary directory for intermediate files */
  tmpDir: string
}

/**
 * Outcome executor function signature
 *
 * Each outcome type (image, gif, video) implements this interface.
 */
export type OutcomeExecutor = (ctx: OutcomeContext) => Promise<JobOutput>

// =============================================================================
// Prompt Resolution
// =============================================================================

/**
 * Result of resolving prompt mentions
 *
 * Contains the final prompt text and collected media references.
 */
export interface ResolvedPrompt {
  /** Resolved prompt text with @{step:...} and @{ref:...} replaced */
  text: string
  /** Media references collected from capture steps and ref media */
  mediaRefs: MediaReference[]
}

// =============================================================================
// AI Image Generation
// =============================================================================

/**
 * Request for AI image generation
 *
 * Abstraction over the Vertex AI request format.
 */
export interface GenerationRequest {
  /** Resolved prompt text */
  prompt: string
  /** AI model identifier */
  model: string
  /** Output aspect ratio */
  aspectRatio: string
  /** Source media for image-to-image (optional) */
  sourceMedia: MediaReference | null
  /** Reference media for style guidance */
  referenceMedia: MediaReference[]
}

/**
 * Result of AI image generation
 *
 * Matches the structure needed for JobOutput.
 */
export interface GeneratedImage {
  /** Path to generated image in temp directory */
  outputPath: string
  /** MIME type of generated image */
  mimeType: string
  /** File size in bytes */
  sizeBytes: number
  /** Image dimensions */
  dimensions: {
    width: number
    height: number
  }
}
