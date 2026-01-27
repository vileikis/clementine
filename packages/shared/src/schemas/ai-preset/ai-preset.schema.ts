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
 */
import { z } from 'zod'

import { presetMediaEntrySchema } from './preset-media.schema'
import { presetVariableSchema } from './preset-variable.schema'

/**
 * AI Preset status enum schema
 * Lifecycle state of a preset (soft delete pattern)
 */
export const aiPresetStatusSchema = z.enum(['active', 'deleted'])

/**
 * Supported AI models for image generation
 */
export const aiModelSchema = z.enum([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3.0',
])

/**
 * Supported aspect ratios for generated images
 */
export const aspectRatioSchema = z.enum([
  '1:1',
  '3:2',
  '2:3',
  '9:16',
  '16:9',
])

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
   * CONFIGURATION
   */

  /** Media registry - images available for prompt references */
  mediaRegistry: z.array(presetMediaEntrySchema).default([]),

  /** Variable definitions */
  variables: z.array(presetVariableSchema).default([]),

  /** Prompt template with @variable and @media references */
  promptTemplate: z.string().default(''),

  /**
   * MODEL SETTINGS
   */

  /** AI model for generation */
  model: aiModelSchema.default('gemini-2.5-flash'),

  /** Output aspect ratio */
  aspectRatio: aspectRatioSchema.default('1:1'),
})

/**
 * TypeScript types exported from schemas
 */
export type AIPreset = z.infer<typeof aiPresetSchema>
export type AIPresetStatus = z.infer<typeof aiPresetStatusSchema>
export type AIModel = z.infer<typeof aiModelSchema>
export type AspectRatio = z.infer<typeof aspectRatioSchema>
