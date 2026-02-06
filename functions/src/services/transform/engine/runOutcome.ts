/**
 * Outcome Dispatcher
 *
 * Routes job execution to the appropriate outcome executor based on outcome type.
 * Replaces the deprecated node-based pipeline execution.
 *
 * @see data-model.md for OutcomeContext and executor patterns
 */
import { logger } from 'firebase-functions/v2'
import type { JobOutput, OutcomeType } from '@clementine/shared'
import type { OutcomeContext, OutcomeExecutor } from '../types'
import { imageOutcome } from '../outcomes/imageOutcome'

/**
 * Outcome executor registry
 *
 * Maps outcome types to their executor functions.
 * null indicates the outcome type is recognized but not yet implemented.
 */
const outcomeRegistry: Record<OutcomeType, OutcomeExecutor | null> = {
  image: imageOutcome,
  gif: null, // Not implemented yet
  video: null, // Not implemented yet
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
 * Dispatches to the correct outcome executor based on outcome.type.
 * Throws a non-retryable error for invalid or unimplemented outcomes.
 *
 * @param ctx - Outcome execution context
 * @returns JobOutput with generated media
 * @throws OutcomeError for invalid configuration or unimplemented types
 */
export async function runOutcome(ctx: OutcomeContext): Promise<JobOutput> {
  const { snapshot, job } = ctx
  const { outcome } = snapshot

  // Validate outcome exists
  if (!outcome) {
    logger.error('[Outcome] No outcome configuration in snapshot', {
      jobId: job.id,
    })
    throw new OutcomeError(
      'Job snapshot has no outcome configuration',
      'INVALID_INPUT',
    )
  }

  // Validate outcome type
  if (!outcome.type) {
    logger.error('[Outcome] Outcome type is null', { jobId: job.id })
    throw new OutcomeError(
      'Experience has no outcome type configured',
      'INVALID_INPUT',
    )
  }

  logger.info('[Outcome] Dispatching to outcome executor', {
    jobId: job.id,
    outcomeType: outcome.type,
    aiEnabled: outcome.aiEnabled,
    captureStepId: outcome.captureStepId,
  })

  // Look up executor
  const executor = outcomeRegistry[outcome.type]

  if (executor === null) {
    // Recognized but not implemented
    logger.error('[Outcome] Outcome type not implemented', {
      jobId: job.id,
      outcomeType: outcome.type,
    })
    throw new OutcomeError(
      `Outcome type '${outcome.type}' is not implemented`,
      'INVALID_INPUT',
    )
  }

  if (!executor) {
    // Unknown type (shouldn't happen with proper validation)
    logger.error('[Outcome] Unknown outcome type', {
      jobId: job.id,
      outcomeType: outcome.type,
    })
    throw new OutcomeError(
      `Unknown outcome type: ${outcome.type}`,
      'INVALID_INPUT',
    )
  }

  // Execute
  const startTime = Date.now()
  const output = await executor(ctx)

  logger.info('[Outcome] Outcome execution completed', {
    jobId: job.id,
    outcomeType: outcome.type,
    durationMs: Date.now() - startTime,
    assetId: output.assetId,
  })

  return output
}
