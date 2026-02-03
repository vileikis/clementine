/**
 * Transform Pipeline Types
 *
 * Shared types for the transform pipeline execution.
 */
import type { JobSnapshot } from '@clementine/shared'

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
