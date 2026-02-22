/**
 * Transform Pipeline Types
 *
 * Shared types for the transform pipeline execution.
 */
import type { Job, JobSnapshot, JobOutput, MediaReference } from '@clementine/shared'

/**
 * Context for pipeline execution
 *
 * Contains all information needed for transform pipeline execution.
 * Passed to pipeline-runner and node executors.
 */
export interface PipelineContext {
  /** Job document ID */
  jobId: string
  /** Project document ID */
  projectId: string
  /** Session document ID */
  sessionId: string
  /** Full job snapshot with session inputs and transform config */
  snapshot: JobSnapshot
  /** Temporary directory for intermediate files */
  tmpDir: string
}

/**
 * Result of a single node execution
 */
export interface NodeResult {
  /** Path to output file in temp directory */
  outputPath: string
  /** MIME type of output (e.g., 'image/jpeg', 'image/png') */
  mimeType: string
}

/**
 * Result of pipeline execution
 */
export interface PipelineResult {
  /** Path to final output file */
  outputPath: string
  /** Output format */
  format: 'image' | 'gif' | 'video'
  /** Output MIME type */
  mimeType: string
}

/**
 * Uploaded output metadata
 */
export interface UploadedOutput {
  /** Public URL to the output */
  url: string
  /** Storage path */
  storagePath: string
  /** Asset ID (filename without extension) */
  assetId: string
  /** Thumbnail URL */
  thumbnailUrl: string | null
  /** File size in bytes */
  sizeBytes: number
  /** Dimensions */
  dimensions: {
    width: number
    height: number
  }
}

// =============================================================================
// Outcome Dispatcher Types
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
// Prompt Resolution Types
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
// AI Image Generation Types
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
