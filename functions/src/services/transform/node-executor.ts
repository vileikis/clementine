/**
 * Node Executor Framework
 *
 * Defines the interface for transform node executors and execution context.
 * Each node type (ai.imageGeneration, filter, etc.) has its own executor implementation.
 */
import type { TransformNode, JobSnapshot, CapturedMedia, MediaReference } from '@clementine/shared'

/**
 * Execution context passed to node executors
 *
 * Contains all information needed for node execution:
 * - Job/session identifiers for logging and storage paths
 * - Full job snapshot for accessing inputs and config
 */
export interface ExecutionContext {
  /** Job document ID */
  jobId: string
  /** Project document ID */
  projectId: string
  /** Session document ID */
  sessionId: string
  /** Full job snapshot with session inputs and transform config */
  snapshot: JobSnapshot
}

/**
 * Result of node execution
 */
export interface NodeExecutionResult {
  /** Path to output file in temp directory */
  outputPath: string
  /** MIME type of output (e.g., 'image/jpeg', 'image/png') */
  mimeType: string
}

/**
 * Interface for transform node executors
 *
 * Each node type implements this interface to handle its specific transformation logic.
 * Executors are stateless - all state is passed via context and node config.
 */
export interface NodeExecutor {
  /**
   * Execute the transformation for a single node
   *
   * @param inputPath - Path to input file (previous node's output or captured media)
   * @param node - Transform node configuration from job snapshot
   * @param context - Execution context with job/session info and snapshot
   * @param tmpDir - Temporary directory for intermediate files
   * @returns Promise resolving to output path
   * @throws Error if transformation fails
   */
  execute(
    inputPath: string,
    node: TransformNode,
    context: ExecutionContext,
    tmpDir: string
  ): Promise<NodeExecutionResult>

  /**
   * Check if this executor can handle the given node type
   *
   * @param nodeType - Node type discriminator (e.g., 'ai.imageGeneration')
   * @returns True if this executor handles the node type
   */
  canHandle(nodeType: string): boolean
}

/**
 * Get captured media by step ID from session inputs
 *
 * @param capturedMedia - Array of captured media from session
 * @param stepId - Step ID to find
 * @returns CapturedMedia if found, undefined otherwise
 */
export function getCapturedMediaByStepId(
  capturedMedia: CapturedMedia[],
  stepId: string
): CapturedMedia | undefined {
  return capturedMedia.find((m) => m.stepId === stepId)
}

/**
 * Get first captured media from session inputs
 *
 * @param capturedMedia - Array of captured media from session
 * @returns First CapturedMedia if exists, undefined otherwise
 */
export function getFirstCapturedMedia(
  capturedMedia: CapturedMedia[]
): CapturedMedia | undefined {
  return capturedMedia[0]
}

/**
 * Get media reference by asset ID from reference array
 *
 * @param refMedia - Array of media references
 * @param mediaAssetId - Asset ID to find
 * @returns MediaReference if found, undefined otherwise
 */
export function getMediaReferenceById(
  refMedia: MediaReference[],
  mediaAssetId: string
): MediaReference | undefined {
  return refMedia.find((r) => r.mediaAssetId === mediaAssetId)
}
