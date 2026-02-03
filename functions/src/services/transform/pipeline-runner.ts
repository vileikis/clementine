/**
 * Pipeline Runner
 *
 * Orchestrates the execution of transform nodes in sequence.
 * Handles node dispatch, overlay application, and output upload.
 */
import { logger } from 'firebase-functions/v2'
import * as fs from 'fs/promises'

import type { TransformNode, AIImageNode } from '@clementine/shared'
import type { PipelineContext, PipelineResult, NodeResult, UploadedOutput } from './types'
import { executeAIImageNode } from './executors'
import { applyOverlayIfConfigured } from './overlay'
import {
  downloadFromStorage,
  parseStorageUrl,
  uploadToStorage,
  getOutputStoragePath,
} from '../../infra/storage'
import { generateThumbnail } from '../media-pipeline/ffmpeg'

/**
 * Execute transform pipeline
 *
 * Runs through all transform nodes in sequence. Nodes access captured media
 * directly from context. If no nodes run, falls back to first captured media.
 *
 * @param context - Pipeline execution context
 * @returns Pipeline result with output path and format
 */
export async function executeTransformPipeline(
  context: PipelineContext
): Promise<PipelineResult> {
  const { snapshot, tmpDir, jobId } = context
  const { transformNodes } = snapshot

  logger.info('[Pipeline] Starting transform pipeline', {
    jobId,
    nodeCount: transformNodes.length,
    capturedMediaCount: snapshot.sessionInputs.capturedMedia.length,
  })

  // Execute transform nodes
  const nodeOutput = await executeNodes(transformNodes, context)

  // Determine final output path
  let outputPath: string

  if (nodeOutput) {
    // Use node-generated output
    outputPath = nodeOutput.outputPath
  } else {
    // No nodes produced output - use first captured media
    outputPath = await getFallbackOutput(context)
  }

  // Apply overlay if configured
  outputPath = await applyOverlayIfConfigured(
    outputPath,
    snapshot.projectContext,
    tmpDir
  )

  logger.info('[Pipeline] Pipeline completed', { outputPath })

  return {
    outputPath,
    format: 'image', // TODO: Detect from output
    mimeType: 'image/png',
  }
}

/**
 * Execute all transform nodes in sequence
 *
 * @returns Last node's result, or null if no nodes executed
 */
async function executeNodes(
  nodes: TransformNode[],
  context: PipelineContext
): Promise<NodeResult | null> {
  if (nodes.length === 0) {
    logger.info('[Pipeline] No transform nodes to execute')
    return null
  }

  let lastResult: NodeResult | null = null

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (!node) continue

    logger.info('[Pipeline] Executing node', {
      nodeIndex: i,
      nodeId: node.id,
      nodeType: node.type,
    })

    const result = await executeNode(node, context)

    if (result) {
      lastResult = result
      logger.info('[Pipeline] Node completed', {
        nodeId: node.id,
        outputPath: result.outputPath,
      })
    }
  }

  return lastResult
}

/**
 * Execute a single transform node
 *
 * Direct dispatch based on node type for better IDE navigation.
 * Returns null for unknown/unsupported node types (graceful skip).
 */
async function executeNode(
  node: TransformNode,
  context: PipelineContext
): Promise<NodeResult | null> {
  switch (node.type) {
    case 'ai.imageGeneration':
      return executeAIImageNode(node as AIImageNode, context)

    default:
      // Log as error - unknown types indicate a bug or deployment mismatch
      // Monitor these in production alerts
      logger.error('[Pipeline] Skipping unknown node type', {
        nodeId: node.id,
        nodeType: node.type,
      })
      return null
  }
}

/**
 * Get fallback output when no nodes executed
 *
 * Downloads first captured media to use as output.
 * Throws if no captured media available.
 */
async function getFallbackOutput(context: PipelineContext): Promise<string> {
  const { snapshot, tmpDir } = context
  const firstMedia = snapshot.sessionInputs.capturedMedia[0]

  if (!firstMedia) {
    throw new Error('No transform nodes executed and no captured media available')
  }

  logger.info('[Pipeline] Using first captured media as output', {
    stepId: firstMedia.stepId,
    assetId: firstMedia.assetId,
  })

  const outputPath = `${tmpDir}/fallback-output.jpg`
  const storagePath = parseStorageUrl(firstMedia.url)
  await downloadFromStorage(storagePath, outputPath)

  return outputPath
}

/**
 * Upload pipeline output to storage and generate thumbnail
 *
 * @param pipelineResult - Result from pipeline execution
 * @param context - Pipeline execution context
 * @returns Uploaded output metadata
 */
export async function uploadPipelineOutput(
  pipelineResult: PipelineResult,
  context: PipelineContext
): Promise<UploadedOutput> {
  const { projectId, sessionId, tmpDir } = context

  // Determine file extension from format
  const extension = pipelineResult.format === 'gif' ? 'gif' : 'png'

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

  logger.info('[Pipeline] Output uploaded', {
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
