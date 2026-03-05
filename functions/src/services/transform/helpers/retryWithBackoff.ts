/**
 * Exponential backoff retry utility for Vertex AI API calls
 *
 * Retries on 429 (RESOURCE_EXHAUSTED) and 503 (Service Unavailable) errors.
 * All other errors propagate immediately.
 */
import { ApiError } from '@google/genai'
import { logger } from 'firebase-functions/v2'
import { sleep } from './sleep'

interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  backoffMultiplier: number
  jitterFraction: number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
  jitterFraction: 0.25,
}

function isRetryableApiError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 429 || error.status === 503
  }
  return false
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param label - Label for logging (e.g. 'AIImageGenerate')
 * @param config - Optional retry configuration
 * @returns Result of the function
 * @throws The last error if all retries are exhausted, or immediately for non-retryable errors
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  label: string,
  config?: Partial<RetryConfig>,
): Promise<T> {
  const { maxRetries, initialDelayMs, backoffMultiplier, jitterFraction } = {
    ...DEFAULT_CONFIG,
    ...config,
  }

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (!isRetryableApiError(error) || attempt === maxRetries) {
        throw error
      }

      const baseDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt)
      const jitter = baseDelay * jitterFraction * Math.random()
      const delay = Math.round(baseDelay + jitter)

      logger.warn(`[${label}] Retryable error, retrying`, {
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
        status: (error as ApiError).status,
      })

      await sleep(delay)
    }
  }

  throw lastError
}
