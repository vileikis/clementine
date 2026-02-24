/**
 * Outcome Dispatcher
 *
 * Routes job execution to the appropriate outcome executor based on experience type.
 * Registry maps all 5 outcome types to their executor (or null for unimplemented).
 *
 * @see specs/081-experience-type-flattening
 */
import { logger } from 'firebase-functions/v2'
import type { JobOutput, OutcomeType } from '@clementine/shared'
import type { OutcomeContext, OutcomeExecutor } from '../types'
import { aiImageOutcome } from '../outcomes/aiImageOutcome'
import { aiVideoOutcome } from '../outcomes/aiVideoOutcome'
import { photoOutcome } from '../outcomes/photoOutcome'

/**
 * Outcome executor registry
 *
 * Maps outcome types to their executor functions.
 * null indicates the outcome type is recognized but not yet implemented.
 */
const outcomeRegistry: Record<OutcomeType, OutcomeExecutor | null> = {
  photo: photoOutcome,
  gif: null,
  video: null,
  'ai.image': aiImageOutcome,
  'ai.video': aiVideoOutcome,
}

/**
 * Non-retryable error for invalid outcome configurations
 */
class OutcomeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'OutcomeError'
  }
}

/**
 * Execute the appropriate outcome based on job snapshot configuration
 *
 * Dispatches to the correct outcome executor based on snapshot.type.
 * Throws a non-retryable error for invalid or unimplemented outcomes.
 */
export async function runOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { snapshot, job } = ctx
  const { type } = snapshot

  // Validate type is set
  if (!type) {
    logger.error('[Outcome] No experience type in snapshot', {
      jobId: job.id,
    })
    throw new OutcomeError(
      'Job snapshot has no experience type configured',
      'INVALID_INPUT',
    )
  }

  // Survey type should never reach here (rejected at pipeline entry)
  if (type === 'survey') {
    logger.error('[Outcome] Survey type cannot produce output', {
      jobId: job.id,
    })
    throw new OutcomeError(
      'Survey experiences do not produce output',
      'INVALID_INPUT',
    )
  }

  logger.info('[Outcome] Dispatching to outcome executor', {
    jobId: job.id,
    outcomeType: type,
  })

  // Look up executor
  const executor = outcomeRegistry[type as OutcomeType]

  if (executor === null) {
    logger.error('[Outcome] Outcome type not implemented', {
      jobId: job.id,
      outcomeType: type,
    })
    throw new OutcomeError(
      `Outcome type '${type}' is not implemented`,
      'INVALID_INPUT',
    )
  }

  if (!executor) {
    logger.error('[Outcome] Unknown outcome type', {
      jobId: job.id,
      outcomeType: type,
    })
    throw new OutcomeError(
      `Unknown outcome type: ${type}`,
      'INVALID_INPUT',
    )
  }

  // Execute
  const startTime = Date.now()
  const output = await executor(ctx)

  logger.info('[Outcome] Outcome execution completed', {
    jobId: job.id,
    outcomeType: type,
    durationMs: Date.now() - startTime,
    assetId: output.assetId,
  })

  return output
}
