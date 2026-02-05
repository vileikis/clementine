/**
 * Prompt Mention Resolution
 *
 * Resolves @{step:stepName} and @{ref:displayName} mentions in prompts.
 * Collects media references for AI generation requests.
 *
 * @see data-model.md for SessionResponse and MediaReference structures
 */
import { logger } from 'firebase-functions/v2'
import type { SessionResponse, MediaReference } from '@clementine/shared'
import type { ResolvedPrompt } from '../types'

/**
 * Resolve prompt mentions to actual values
 *
 * Handles two types of mentions:
 * - @{step:stepName} - Replaced with session response data
 * - @{ref:displayName} - Replaced with reference media placeholder
 *
 * For capture steps and reference media, adds a [IMAGE: name] placeholder
 * and collects the MediaReference for the AI request.
 *
 * @param prompt - Original prompt with @{...} mentions
 * @param responses - Session responses from job snapshot
 * @param refMedia - Reference media from outcome.imageGeneration.refMedia
 * @returns ResolvedPrompt with text and collected media references
 */
export function resolvePromptMentions(
  prompt: string,
  responses: SessionResponse[],
  refMedia: MediaReference[],
): ResolvedPrompt {
  const mediaRefs: MediaReference[] = []
  const seenMediaIds = new Set<string>()

  // Helper to add media ref without duplicates
  const addMediaRef = (ref: MediaReference): void => {
    if (!seenMediaIds.has(ref.mediaAssetId)) {
      seenMediaIds.add(ref.mediaAssetId)
      mediaRefs.push(ref)
    }
  }

  // Resolve @{step:stepName} mentions
  const stepPattern = /@\{step:([^}]+)\}/g
  let resolvedText = prompt.replace(stepPattern, (match, stepName: string) => {
    const response = responses.find((r) => r.stepName === stepName)

    if (!response) {
      logger.warn('[PromptResolution] Step not found, preserving original', {
        stepName,
        placeholder: match,
      })
      return match
    }

    return resolveStepData(response, addMediaRef)
  })

  // Resolve @{ref:displayName} mentions
  const refPattern = /@\{ref:([^}]+)\}/g
  resolvedText = resolvedText.replace(refPattern, (match, displayName: string) => {
    const ref = refMedia.find((r) => r.displayName === displayName)

    if (!ref) {
      logger.warn('[PromptResolution] Reference not found, preserving original', {
        displayName,
        placeholder: match,
      })
      return match
    }

    addMediaRef(ref)
    return `[IMAGE: ${displayName}]`
  })

  return {
    text: resolvedText,
    mediaRefs,
  }
}

/**
 * Resolve session response data to a string value
 *
 * Handles different data types:
 * - string: Returns directly (input.scale, input.shortText, etc.)
 * - MultiSelectOption[]: Returns comma-separated values
 * - MediaReference[]: Returns placeholder and collects media refs
 * - null: Returns empty string
 */
function resolveStepData(
  response: SessionResponse,
  addMediaRef: (ref: MediaReference) => void,
): string {
  const { stepName, stepType, data } = response

  // Null data
  if (data === null || data === undefined) {
    return ''
  }

  // String data (input.scale, input.shortText, input.yesNo, input.longText)
  if (typeof data === 'string') {
    return data
  }

  // Array data
  if (Array.isArray(data)) {
    // Empty array
    if (data.length === 0) {
      // For capture steps, still return the placeholder
      if (stepType.startsWith('capture.')) {
        return `[IMAGE: ${stepName}]`
      }
      return ''
    }

    // MultiSelectOption[] - has 'value' property
    if (isMultiSelectArray(data)) {
      return data.map((opt) => opt.value).join(', ')
    }

    // MediaReference[] - has 'mediaAssetId' property (capture steps)
    if (isMediaReferenceArray(data)) {
      for (const ref of data) {
        addMediaRef(ref)
      }
      return `[IMAGE: ${stepName}]`
    }
  }

  // Unknown data type - log warning and return empty string
  logger.warn('[PromptResolution] Unknown data type', {
    stepName,
    stepType,
    dataType: typeof data,
  })
  return ''
}

/**
 * Type guard for MultiSelectOption array
 */
function isMultiSelectArray(
  data: unknown[],
): data is Array<{ value: string; promptFragment?: string | null; promptMedia?: unknown | null }> {
  return data.length > 0 && typeof data[0] === 'object' && data[0] !== null && 'value' in data[0]
}

/**
 * Type guard for MediaReference array
 */
function isMediaReferenceArray(data: unknown[]): data is MediaReference[] {
  return (
    data.length > 0 &&
    typeof data[0] === 'object' &&
    data[0] !== null &&
    'mediaAssetId' in data[0]
  )
}
