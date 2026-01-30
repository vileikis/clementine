/**
 * Transform Schema Contracts
 *
 * TypeScript interfaces representing the updated transform schemas for Phase 1a.
 * These contracts serve as documentation and can be used for validation
 * in other tools (e.g., backend functions, API integrations).
 *
 * Generated from: packages/shared/src/schemas/experience/transform.schema.ts
 */

import { MediaReference } from './step-schemas'

/**
 * Aspect Ratio Options
 */
export type OutputAspectRatio = '1:1' | '9:16' | '3:2' | '2:3' | '16:9'

/**
 * Output Format Configuration
 *
 * Defines post-processing settings for the pipeline output.
 */
export interface OutputFormat {
  /** Target aspect ratio for resize/crop */
  aspectRatio: OutputAspectRatio | null

  /** Compression quality (0-100) */
  quality: number | null
}

/**
 * Transform Node Base
 *
 * Base interface for all transform nodes.
 */
export interface TransformNodeBase {
  /** Unique node identifier */
  id: string

  /** Node type discriminator */
  type: string

  /** Node-specific configuration */
  config: Record<string, unknown>
}

/**
 * RefMedia Entry (NEW in Phase 1a)
 *
 * Extends MediaReference with displayName for prompt editor autocomplete.
 */
export interface RefMediaEntry extends MediaReference {
  /**
   * Display name for prompt editor autocomplete
   *
   * Auto-generated from fileName on upload, editable by user.
   * Must be unique within AI node's refMedia array.
   */
  displayName: string
}

/**
 * AI Image Node Configuration (NEW in Phase 1a)
 *
 * Configuration for AI image generation with inline prompts.
 */
export interface AIImageNodeConfig {
  /**
   * AI model identifier
   *
   * Examples: "gemini-2.5-pro", "gemini-2.5-flash", "gemini-3.0"
   */
  model: string

  /**
   * Output aspect ratio
   */
  aspectRatio: '1:1' | '3:2' | '2:3' | '9:16' | '16:9'

  /**
   * Prompt template with placeholders
   *
   * Supports two types of references:
   * - Step references: @{step:stepName} (e.g., "@{step:Pet Choice}")
   * - Media references: @{ref:mediaAssetId} (e.g., "@{ref:abc-123}")
   *
   * Step names may contain spaces (e.g., "Pet Choice", "User Photo").
   * Media references use mediaAssetId from refMedia array.
   *
   * Example: "A photo of @{step:Pet Choice} in a park with @{ref:style-guide}"
   */
  prompt: string

  /**
   * Reference media array
   *
   * Media files used as style guides, overlays, or context for AI generation.
   * Managed in Phase 1c UI (out of scope for Phase 1a/1b).
   */
  refMedia: RefMediaEntry[]
}

/**
 * AI Image Node (NEW in Phase 1a)
 *
 * Transform pipeline node for AI image generation.
 */
export interface AIImageNode extends TransformNodeBase {
  type: 'ai.imageGeneration'
  config: AIImageNodeConfig
}

/**
 * Transform Node (Discriminated Union)
 *
 * All possible transform node types.
 */
export type TransformNode =
  | AIImageNode
  // Add other node types as needed (filter.resize, etc.)
  | TransformNodeBase // Fallback for unknown types

/**
 * Transform Configuration (UPDATED in Phase 1a)
 *
 * Configuration for experience transform pipeline.
 */
export interface TransformConfig {
  /** Pipeline node definitions */
  nodes: TransformNode[]

  /**
   * Variable mappings (REMOVED in Phase 1a)
   *
   * This field was removed because inline prompt architecture replaces
   * variable mappings with direct step name references in prompts.
   *
   * OLD: variableMappings: VariableMapping[]
   * NEW: Direct references in AI node prompts (@{step:stepName})
   */
  // variableMappings: REMOVED

  /** Output format specification */
  outputFormat: OutputFormat | null
}

/**
 * Example Usage:
 *
 * ```typescript
 * const transformConfig: TransformConfig = {
 *   nodes: [
 *     {
 *       id: 'node-1',
 *       type: 'ai.imageGeneration',
 *       config: {
 *         model: 'gemini-2.5-pro',
 *         aspectRatio: '3:2',
 *         prompt: 'A @{step:Pet Choice} playing in a park with @{ref:style-guide}',
 *         refMedia: [
 *           {
 *             mediaAssetId: 'style-guide-1',
 *             url: 'https://storage.googleapis.com/.../style-1.jpg',
 *             filePath: 'ref-media/workspace-id/style-1.jpg',
 *             fileName: 'park-style.jpg',
 *             displayName: 'Park Style'  // NEW: used in autocomplete
 *           }
 *         ]
 *       }
 *     }
 *   ],
 *   outputFormat: {
 *     aspectRatio: '3:2',
 *     quality: 90
 *   }
 * }
 * ```
 */

/**
 * Prompt Placeholder Patterns
 *
 * Regex patterns for parsing prompt templates.
 */
export const STEP_MENTION_PATTERN = /@\{step:([^}]+)\}/g
export const MEDIA_MENTION_PATTERN = /@\{ref:([^}]+)\}/g

/**
 * Parse Step Mentions
 *
 * Extract all step name references from a prompt template.
 *
 * @param prompt - Prompt template string
 * @returns Array of step names referenced in the prompt
 *
 * @example
 * parseStepMentions("A @{step:Pet Choice} with @{step:User Photo}")
 * // Returns: ["Pet Choice", "User Photo"]
 */
export function parseStepMentions(prompt: string): string[] {
  const matches = [...prompt.matchAll(STEP_MENTION_PATTERN)]
  return matches.map((match) => match[1])
}

/**
 * Parse Media Mentions
 *
 * Extract all media asset ID references from a prompt template.
 *
 * @param prompt - Prompt template string
 * @returns Array of media asset IDs referenced in the prompt
 *
 * @example
 * parseMediaMentions("A cat with @{ref:style-1} and @{ref:overlay-2}")
 * // Returns: ["style-1", "overlay-2"]
 */
export function parseMediaMentions(prompt: string): string[] {
  const matches = [...prompt.matchAll(MEDIA_MENTION_PATTERN)]
  return matches.map((match) => match[1])
}

/**
 * Validation Helpers
 */
export const AI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.0',
] as const

export const ASPECT_RATIOS = ['1:1', '3:2', '2:3', '9:16', '16:9'] as const

/**
 * Type Guards
 */
export function isAIImageNode(node: TransformNode): node is AIImageNode {
  return node.type === 'ai.imageGeneration'
}

/**
 * Prompt Resolution (Placeholder)
 *
 * Full resolution logic implemented in Phase 1f.
 * This is a simplified example for documentation.
 *
 * @example
 * const resolved = resolvePrompt(
 *   "@{step:Pet Choice}",
 *   { "Pet Choice": "Cat" },
 *   {}
 * )
 * // Returns: "Cat"
 */
export function resolvePrompt(
  template: string,
  stepValues: Record<string, string>,
  mediaReferences: Record<string, string>,
): string {
  let resolved = template

  // Replace step mentions
  resolved = resolved.replace(STEP_MENTION_PATTERN, (_, stepName) => {
    return stepValues[stepName] || `<missing:${stepName}>`
  })

  // Replace media mentions
  resolved = resolved.replace(MEDIA_MENTION_PATTERN, (_, mediaId) => {
    return mediaReferences[mediaId] || `<missing:${mediaId}>`
  })

  return resolved
}
