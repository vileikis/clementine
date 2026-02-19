/**
 * Upload Output Operation
 *
 * Uploads an output file to Firebase Storage and generates a thumbnail.
 * Returns metadata needed for JobOutput (excluding processingTimeMs — caller handles timing).
 */
import * as fs from 'fs/promises'
import type { JobOutput } from '@clementine/shared'
import {
  uploadToStorage,
  getOutputStoragePath,
} from '../../../infra/storage'
import { generateThumbnail } from '../../ffmpeg'

export interface UploadOutputParams {
  /** Path to the output file on disk */
  outputPath: string
  /** Project document ID */
  projectId: string
  /** Session document ID */
  sessionId: string
  /** Temporary directory for intermediate files (thumbnail) */
  tmpDir: string
}

/**
 * Upload output to storage and generate thumbnail
 *
 * Returns a JobOutput without processingTimeMs — caller should set it.
 */
export async function uploadOutput({
  outputPath,
  projectId,
  sessionId,
  tmpDir,
}: UploadOutputParams): Promise<Omit<JobOutput, 'processingTimeMs'>> {
  const stats = await fs.stat(outputPath)

  const storagePath = getOutputStoragePath(
    projectId,
    sessionId,
    'output',
    'jpg',
  )
  const url = await uploadToStorage(outputPath, storagePath)

  const thumbPath = `${tmpDir}/thumb.jpg`
  await generateThumbnail(outputPath, thumbPath, 300)

  const thumbStoragePath = getOutputStoragePath(
    projectId,
    sessionId,
    'thumb',
    'jpg',
  )
  const thumbnailUrl = await uploadToStorage(thumbPath, thumbStoragePath)

  const assetId = `${sessionId}-output`

  return {
    assetId,
    url,
    filePath: storagePath,
    format: 'image',
    dimensions: {
      width: 1024,
      height: 1024,
    },
    sizeBytes: stats.size,
    thumbnailUrl,
  }
}
