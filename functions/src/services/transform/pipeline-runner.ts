/**
 * Pipeline Runner
 *
 * Orchestrates the execution of transform nodes in sequence.
 * Downloads initial input, runs each node's executor, and returns final output.
 */
import { logger } from 'firebase-functions/v2'
import * as fs from 'fs/promises'
import * as path from 'path'

import type { JobSnapshot, TransformNode } from '@clementine/shared'
import type { ExecutionContext, NodeExecutor, NodeExecutionResult } from './node-executor'
import { AIImageExecutor } from './executors/ai-image.executor'
import {
  downloadFromStorage,
  parseStorageUrl,
  uploadToStorage,
  getOutputStoragePath,
} from '../../infra/storage'
import { applyOverlayToMedia, generateThumbnail } from '../media-pipeline/ffmpeg'

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
 * Uploaded output result
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

// Registry of available executors
const executors: NodeExecutor[] = [new AIImageExecutor()]

/**
 * Get executor for a node type
 *
 * @param nodeType - Node type discriminator
 * @returns Executor that can handle the node type
 * @throws Error if no executor found
 */
function getExecutor(nodeType: string): NodeExecutor {
  const executor = executors.find((e) => e.canHandle(nodeType))
  if (!executor) {
    throw new Error(`No executor found for node type: ${nodeType}`)
  }
  return executor
}

/**
 * Execute transform pipeline
 *
 * Runs through all transform nodes in sequence, using each node's output
 * as the next node's input.
 *
 * @param context - Execution context with job/session info
 * @param tmpDir - Temporary directory for intermediate files
 * @returns Pipeline result with output path and format
 */
export async function executeTransformPipeline(
  context: ExecutionContext,
  tmpDir: string
): Promise<PipelineResult> {
  const { snapshot } = context
  const { sessionInputs, transformNodes } = snapshot

  logger.info('[PipelineRunner] Starting transform pipeline', {
    jobId: context.jobId,
    nodeCount: transformNodes.length,
    capturedMediaCount: sessionInputs.capturedMedia.length,
  })

  // Get first captured media as initial input
  const firstMedia = sessionInputs.capturedMedia[0]
  if (!firstMedia) {
    throw new Error('No captured media found in session')
  }

  // Download initial input
  const initialInputPath = `${tmpDir}/input-captured.jpg`
  const storagePath = parseStorageUrl(firstMedia.url)
  await downloadFromStorage(storagePath, initialInputPath)

  logger.info('[PipelineRunner] Downloaded initial input', {
    url: firstMedia.url,
    storagePath,
    localPath: initialInputPath,
  })

  // Execute nodes in sequence
  let currentInputPath = initialInputPath
  let currentMimeType = 'image/jpeg'

  for (let i = 0; i < transformNodes.length; i++) {
    const node = transformNodes[i]
    if (!node) continue

    logger.info('[PipelineRunner] Executing node', {
      nodeIndex: i,
      nodeId: node.id,
      nodeType: node.type,
    })

    // Skip nodes with empty config (defensive check)
    if (shouldSkipNode(node)) {
      logger.info('[PipelineRunner] Skipping node', {
        nodeId: node.id,
        reason: 'empty prompt or disabled',
      })
      continue
    }

    // Get executor for node type
    const executor = getExecutor(node.type)

    // Execute node
    const result = await executor.execute(currentInputPath, node, context, tmpDir)

    // Update for next iteration
    currentInputPath = result.outputPath
    currentMimeType = result.mimeType

    logger.info('[PipelineRunner] Node completed', {
      nodeId: node.id,
      outputPath: result.outputPath,
    })
  }

  // Apply overlay if configured
  if (snapshot.projectContext.applyOverlay && snapshot.projectContext.overlay) {
    logger.info('[PipelineRunner] Applying overlay', {
      overlay: snapshot.projectContext.overlay.displayName,
    })

    const overlayedPath = await applyOverlay(
      currentInputPath,
      snapshot.projectContext.overlay,
      tmpDir
    )
    currentInputPath = overlayedPath
  }

  logger.info('[PipelineRunner] Pipeline completed', {
    finalOutputPath: currentInputPath,
  })

  return {
    outputPath: currentInputPath,
    format: 'image', // TODO: Detect from output (gif/video support)
    mimeType: currentMimeType,
  }
}

/**
 * Check if node should be skipped
 *
 * @param node - Transform node
 * @returns True if node should be skipped
 */
function shouldSkipNode(node: TransformNode): boolean {
  // For AI image nodes, skip if prompt is empty
  if (node.type === 'ai.imageGeneration') {
    const config = node.config as { prompt?: string }
    return !config.prompt || config.prompt.trim().length === 0
  }
  return false
}

/**
 * Apply overlay to output image
 *
 * @param inputPath - Path to input image
 * @param overlay - Overlay media reference
 * @param tmpDir - Temporary directory
 * @returns Path to overlayed output
 */
async function applyOverlay(
  inputPath: string,
  overlay: { url: string; filePath: string | null },
  tmpDir: string
): Promise<string> {
  // Download overlay from storage
  const overlayPath = `${tmpDir}/overlay.png`
  const storagePath = overlay.filePath ?? parseStorageUrl(overlay.url)
  await downloadFromStorage(storagePath, overlayPath)

  // Apply overlay using FFmpeg
  const outputPath = `${tmpDir}/output-with-overlay.png`
  await applyOverlayToMedia(inputPath, overlayPath, outputPath)

  return outputPath
}

/**
 * Upload pipeline output to storage and generate thumbnail
 *
 * @param pipelineResult - Result from pipeline execution
 * @param context - Execution context
 * @param tmpDir - Temporary directory
 * @returns Uploaded output metadata
 */
export async function uploadPipelineOutput(
  pipelineResult: PipelineResult,
  context: ExecutionContext,
  tmpDir: string
): Promise<UploadedOutput> {
  const { projectId, sessionId } = context

  // Determine file extension from format
  const extension = pipelineResult.format === 'gif' ? 'gif' : 'png'
  const contentType = pipelineResult.format === 'gif' ? 'image/gif' : 'image/png'

  // Get output storage path
  const storagePath = getOutputStoragePath(projectId, sessionId, 'output', extension)

  // Upload output
  const url = await uploadToStorage(pipelineResult.outputPath, storagePath)

  // Get file stats
  const stats = await fs.stat(pipelineResult.outputPath)

  // Generate thumbnail
  const thumbPath = `${tmpDir}/thumb.jpg`
  await generateThumbnail(pipelineResult.outputPath, thumbPath, 300)

  const thumbStoragePath = getOutputStoragePath(projectId, sessionId, 'thumb', 'jpg')
  const thumbnailUrl = await uploadToStorage(thumbPath, thumbStoragePath)

  // Extract asset ID from session ID
  const assetId = `${sessionId}-output`

  logger.info('[PipelineRunner] Output uploaded', {
    url,
    storagePath,
    thumbnailUrl,
    sizeBytes: stats.size,
  })

  return {
    url,
    storagePath,
    assetId,
    thumbnailUrl,
    sizeBytes: stats.size,
    dimensions: {
      width: 1024, // TODO: Get actual dimensions from image
      height: 1024,
    },
  }
}
