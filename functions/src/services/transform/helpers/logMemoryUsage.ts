/**
 * Log current process memory usage at key execution points
 */
import { logger } from 'firebase-functions/v2'

function toMB(bytes: number): number {
  return Math.round(bytes / 1024 / 1024)
}

export function logMemoryUsage(phase: string, jobId: string): void {
  const mem = process.memoryUsage()
  logger.info('[TransformJob] Memory usage', {
    phase,
    jobId,
    heapUsedMB: toMB(mem.heapUsed),
    heapTotalMB: toMB(mem.heapTotal),
    rssMB: toMB(mem.rss),
    externalMB: toMB(mem.external),
  })
}
