/**
 * Shared types for Lexical prompt editor
 */
import type { ExperienceStepType } from '@clementine/shared'

/**
 * Step option for autocomplete menu
 * Used to populate the mentions autocomplete with available experience steps
 */
export interface StepOption {
  /** Step UUID */
  id: string
  /** Step display name (used for both display and storage) */
  name: string
  /** Step type for icon selection */
  type: ExperienceStepType
}

/**
 * Media option for autocomplete menu
 * Used to populate the mentions autocomplete with available reference media
 */
export interface MediaOption {
  /** mediaAssetId */
  id: string
  /** displayName (used for both display and storage) */
  name: string
}

/**
 * Mention match result from regex parsing
 * Used when parsing plain text to find @{type:name} patterns
 */
export interface MentionMatch {
  /** Character index where the mention starts */
  index: number
  /** Total length of the mention string */
  length: number
  /** Type of mention: step or reference media */
  type: 'step' | 'ref'
  /** Name of the step or media asset */
  name: string
}
