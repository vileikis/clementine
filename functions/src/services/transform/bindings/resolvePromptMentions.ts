/**
 * Prompt Mention Resolution
 *
 * Resolves @{step:stepName} and @{ref:displayName} mentions in prompts.
 * Collects media references for AI generation requests.
 *
 * @see data-model.md for SessionResponse and MediaReference structures
 */
import { logger } from 'firebase-functions/v2'
import type { SessionResponse, MediaReference, MultiSelectOption } from '@clementine/shared'
import type { ResolvedPrompt } from '../types'

// =============================================================================
// Types
// =============================================================================

/** Function signature for adding media references */
type AddMediaRef = (ref: MediaReference) => void

/** Data resolver function signature */
type DataResolver = (
  response: SessionResponse,
  addMediaRef: AddMediaRef,
) => string

// =============================================================================
// Constants
// =============================================================================

/** Pattern for @{step:stepName} mentions - resolves to session response data */
const STEP_MENTION_PATTERN = /@\{step:([^}]+)\}/g

/** Pattern for @{ref:displayName} mentions - resolves to reference media */
const REF_MENTION_PATTERN = /@\{ref:([^}]+)\}/g

/** Registry of step type resolvers */
const STEP_TYPE_RESOLVERS: Record<string, DataResolver> = {
  'input.multiSelect': resolveMultiSelectData,
  'capture.photo': resolveCaptureData,
  'capture.video': resolveCaptureData,
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Resolve prompt mentions to actual values
 *
 * Handles two types of mentions:
 * - @{step:stepName} - Replaced with session response data
 * - @{ref:displayName} - Replaced with reference media placeholder
 *
 * For capture steps and reference media, adds a <displayName> placeholder
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
  let resolvedText = prompt.replace(STEP_MENTION_PATTERN, (match, stepName: string) => {
    const response = responses.find((r) => r.stepName === stepName)

    if (!response) {
      logger.warn('[PromptResolution] Step not found, preserving placeholder', {
        stepName,
        placeholder: match,
      })
      return match  // Preserve unresolved placeholders
    }

    return resolveStepData(response, addMediaRef)
  })

  // Resolve @{ref:displayName} mentions
  resolvedText = resolvedText.replace(REF_MENTION_PATTERN, (match, displayName: string) => {
    const ref = refMedia.find((r) => r.displayName === displayName)

    if (!ref) {
      logger.warn('[PromptResolution] Reference not found, preserving placeholder', {
        displayName,
        placeholder: match,
      })
      return match  // Preserve unresolved placeholders
    }

    addMediaRef(ref)
    return `<${displayName}>`
  })

  return {
    text: resolvedText,
    mediaRefs,
  }
}

// =============================================================================
// Step Data Resolution
// =============================================================================

/**
 * Resolve session response data to a string value
 *
 * Uses registry pattern to dispatch to type-specific resolvers based on stepType.
 * Falls back to string resolution for simple input types.
 */
function resolveStepData(
  response: SessionResponse,
  addMediaRef: AddMediaRef,
): string {
  const { stepType, data } = response

  // Null data
  if (data === null || data === undefined) {
    return ''
  }

  // Check for registered resolver
  const resolver = STEP_TYPE_RESOLVERS[stepType]
  if (resolver) {
    return resolver(response, addMediaRef)
  }

  // Default: string data (input.scale, input.shortText, input.yesNo, input.longText)
  return resolveStringData(response)
}

// =============================================================================
// Type-Specific Resolvers
// =============================================================================

/**
 * Resolve string data (input.scale, input.shortText, input.yesNo, input.longText)
 */
function resolveStringData(response: SessionResponse): string {
  const { data } = response

  if (typeof data === 'string') {
    return data
  }

  // Unexpected type for string step
  logger.warn('[PromptResolution] Expected string data', {
    stepName: response.stepName,
    stepType: response.stepType,
    dataType: typeof data,
  })
  return ''
}

/**
 * Resolve multi-select data with promptFragment and promptMedia support
 *
 * Resolution priority per option:
 * - promptFragment + promptMedia → "promptFragment (use <displayName>)"
 * - promptFragment only → "promptFragment"
 * - promptMedia only → "(use <displayName>)"
 * - neither → "value"
 *
 * Multiple options are joined with comma.
 */
function resolveMultiSelectData(
  response: SessionResponse,
  addMediaRef: AddMediaRef,
): string {
  const { data } = response

  if (!Array.isArray(data)) {
    logger.warn('[PromptResolution] Expected array for multiSelect', {
      stepName: response.stepName,
      stepType: response.stepType,
      dataType: typeof data,
    })
    return ''
  }

  if (data.length === 0) {
    return ''
  }

  const options = data as MultiSelectOption[]
  const resolvedParts = options.map((opt) => resolveMultiSelectOption(opt, addMediaRef))

  return resolvedParts.join(', ')
}

/**
 * Resolve a single multi-select option
 */
function resolveMultiSelectOption(
  option: MultiSelectOption,
  addMediaRef: AddMediaRef,
): string {
  const { value, promptFragment, promptMedia } = option

  const hasFragment = promptFragment !== null && promptFragment !== undefined && promptFragment !== ''
  const hasMedia = promptMedia !== null && promptMedia !== undefined

  // Collect media reference if present
  if (hasMedia) {
    addMediaRef(promptMedia)
  }

  // Both promptFragment and promptMedia
  if (hasFragment && hasMedia) {
    return `${promptFragment} (use <${promptMedia.displayName}>)`
  }

  // Only promptFragment
  if (hasFragment) {
    return promptFragment
  }

  // Only promptMedia
  if (hasMedia) {
    return `(use <${promptMedia.displayName}>)`
  }

  // Neither - use value
  return value
}

/**
 * Resolve capture step data (MediaReference[])
 *
 * Collects all media references and returns comma-separated <displayName> placeholders.
 */
function resolveCaptureData(
  response: SessionResponse,
  addMediaRef: AddMediaRef,
): string {
  const { data } = response

  if (!Array.isArray(data)) {
    logger.warn('[PromptResolution] Expected array for capture step', {
      stepName: response.stepName,
      stepType: response.stepType,
      dataType: typeof data,
    })
    return ''
  }

  if (data.length === 0) {
    return ''
  }

  const mediaRefs = data as MediaReference[]
  const placeholders: string[] = []

  for (const ref of mediaRefs) {
    addMediaRef(ref)
    placeholders.push(`<${ref.displayName}>`)
  }

  return placeholders.join(', ')
}
