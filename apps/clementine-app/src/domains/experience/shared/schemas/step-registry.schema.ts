/**
 * Step Registry Schema
 *
 * Zod schemas for step configurations.
 * These are placeholder schemas for Phase 0 - will be populated in future phases.
 *
 * Each step category has its own config schema that validates the step-specific
 * configuration options.
 */
import { z } from 'zod'

/**
 * Info step config schema (placeholder)
 * Will contain: title, description, media, etc.
 */
export const infoStepConfigSchema = z.looseObject({})

/**
 * Input step config schema (placeholder)
 * Will contain: question, options, validation, etc.
 */
export const inputStepConfigSchema = z.looseObject({})

/**
 * Capture step config schema (placeholder)
 * Will contain: duration, quality, countdown, overlays, etc.
 */
export const captureStepConfigSchema = z.looseObject({})

/**
 * Transform step config schema (placeholder)
 * Will contain: pipelineId, parameters, etc.
 */
export const transformStepConfigSchema = z.looseObject({})

/**
 * TypeScript types inferred from schemas
 */
export type InfoStepConfig = z.infer<typeof infoStepConfigSchema>
export type InputStepConfig = z.infer<typeof inputStepConfigSchema>
export type CaptureStepConfig = z.infer<typeof captureStepConfigSchema>
export type TransformStepConfig = z.infer<typeof transformStepConfigSchema>
