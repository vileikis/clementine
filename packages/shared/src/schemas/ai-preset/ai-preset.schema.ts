/**
 * AI Preset Schema (Shared)
 *
 * Defines the structure for AI Preset documents stored in Firestore.
 * An AI Preset is a reusable configuration for AI image generation within a workspace.
 *
 * Firestore Path: /workspaces/{workspaceId}/aiPresets/{presetId}
 *
 * This schema uses Firestore-safe patterns:
 * - Optional fields use `.nullable().default(null)` (Firestore doesn't support undefined)
 * - Uses `z.looseObject()` for forward compatibility with future fields
 *
 * Draft/Published Model (Phase 5.5):
 * - `draft`: Working configuration edited in the editor (auto-saved)
 * - `published`: Live configuration used by experiences (set via Publish button)
 * - `draftVersion`: Increments on each draft save
 * - `publishedVersion`: Set to draftVersion when published
 */
import { z } from 'zod'

import { aiPresetConfigSchema } from './ai-preset-config.schema'

// Re-export from config schema for backwards compatibility
export {
  aiModelSchema,
  aspectRatioSchema,
  aiPresetConfigSchema,
  type AIPresetConfig,
  type AIModel,
  type AspectRatio,
} from './ai-preset-config.schema'

/**
 * AI Preset status enum schema
 * Lifecycle state of a preset (soft delete pattern)
 */
export const aiPresetStatusSchema = z.enum(['active', 'deleted'])

/**
 * AI Preset document schema
 * Stored at /workspaces/{workspaceId}/aiPresets/{presetId}
 */
export const aiPresetSchema = z.looseObject({
  /**
   * IDENTITY
   */

  /** Preset ID (Firestore document ID) */
  id: z.string().min(1),

  /** Preset display name */
  name: z.string().min(1).max(100),

  /** Optional description */
  description: z.string().max(500).nullable().default(null),

  /**
   * LIFECYCLE
   */

  /** Preset status (soft delete) */
  status: aiPresetStatusSchema.default('active'),

  /** Creation timestamp (Unix ms) */
  createdAt: z.number(),

  /** Last update timestamp (Unix ms) */
  updatedAt: z.number(),

  /** Soft delete timestamp (Unix ms) */
  deletedAt: z.number().nullable().default(null),

  /** UID of admin who created the preset */
  createdBy: z.string().min(1),

  /**
   * DRAFT/PUBLISHED WORKFLOW
   *
   * Editor writes to `draft` (auto-save)
   * Publish button copies `draft` → `published`
   * Experiences use `published` for execution
   */

  /** Draft configuration (edited in editor) - defaults for backwards compatibility */
  draft: aiPresetConfigSchema.default({
    model: 'gemini-2.5-flash',
    aspectRatio: '1:1',
    mediaRegistry: [],
    variables: [],
    promptTemplate: '',
  }),

  /** Published configuration (used by runtime) - null if never published */
  published: aiPresetConfigSchema.nullable().default(null),

  /** Draft version number - increments on each save */
  draftVersion: z.number().default(1),

  /** Published version number - set to draftVersion when published */
  publishedVersion: z.number().nullable().default(null),

  /** Timestamp when last published (Unix ms) */
  publishedAt: z.number().nullable().default(null),

  /** UID of user who last published */
  publishedBy: z.string().nullable().default(null),
})

/**
 * TypeScript types exported from schemas
 */
export type AIPreset = z.infer<typeof aiPresetSchema>
export type AIPresetStatus = z.infer<typeof aiPresetStatusSchema>
