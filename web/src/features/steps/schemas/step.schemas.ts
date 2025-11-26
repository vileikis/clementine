// Zod schemas for all 11 step types

import { z } from "zod";
import { STEP_CONSTANTS } from "../constants";

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Variable name schema - valid identifier for session variables
 */
const variableNameSchema = z
  .string()
  .min(1)
  .max(STEP_CONSTANTS.MAX_VARIABLE_NAME_LENGTH)
  .regex(
    /^[a-zA-Z_][a-zA-Z0-9_]*$/,
    "Must start with letter or underscore, followed by letters, numbers, or underscores"
  );

/**
 * Step base schema - fields shared by all step types
 */
const stepBaseSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  journeyId: z.string(),
  title: z.string().max(STEP_CONSTANTS.MAX_TITLE_LENGTH).nullish(),
  description: z.string().max(STEP_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullish(),
  mediaUrl: z.string().url().nullish(),
  ctaLabel: z.string().max(STEP_CONSTANTS.MAX_CTA_LABEL_LENGTH).nullish(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// ============================================================================
// Step Type Schemas
// ============================================================================

/**
 * Info step schema
 */
export const infoStepSchema = stepBaseSchema.extend({
  type: z.literal("info"),
});

/**
 * Experience picker option schema
 */
const experiencePickerOptionSchema = z.object({
  id: z.string(),
  experienceId: z.string(),
  label: z.string().min(1).max(STEP_CONSTANTS.MAX_OPTION_LABEL_LENGTH),
  imageUrl: z.string().url().nullish(),
});

/**
 * Experience picker step schema
 */
export const experiencePickerStepSchema = stepBaseSchema.extend({
  type: z.literal("experience-picker"),
  config: z.object({
    layout: z.enum(["grid", "list", "carousel"]),
    variable: variableNameSchema,
    options: z
      .array(experiencePickerOptionSchema)
      .max(STEP_CONSTANTS.MAX_EXPERIENCE_OPTIONS),
  }),
});

/**
 * Capture step schema
 */
export const captureStepSchema = stepBaseSchema.extend({
  type: z.literal("capture"),
  config: z.object({
    source: variableNameSchema,
    fallbackExperienceId: z.string().nullish(),
  }),
});

/**
 * Short text step schema
 */
export const shortTextStepSchema = stepBaseSchema.extend({
  type: z.literal("short_text"),
  config: z.object({
    variable: variableNameSchema,
    placeholder: z.string().max(200).nullish(),
    maxLength: z.number().min(1).max(STEP_CONSTANTS.MAX_SHORT_TEXT_LENGTH),
    required: z.boolean(),
  }),
});

/**
 * Long text step schema
 */
export const longTextStepSchema = stepBaseSchema.extend({
  type: z.literal("long_text"),
  config: z.object({
    variable: variableNameSchema,
    placeholder: z.string().max(200).nullish(),
    maxLength: z.number().min(1).max(STEP_CONSTANTS.MAX_LONG_TEXT_LENGTH),
    required: z.boolean(),
  }),
});

/**
 * Multiple choice option schema
 */
const multipleChoiceOptionSchema = z.object({
  label: z.string().min(1).max(STEP_CONSTANTS.MAX_OPTION_LABEL_LENGTH),
  value: z
    .string()
    .min(1)
    .max(STEP_CONSTANTS.MAX_OPTION_VALUE_LENGTH)
    .regex(/^[a-zA-Z0-9_]+$/, "Must be alphanumeric with underscores"),
});

/**
 * Multiple choice step schema
 */
export const multipleChoiceStepSchema = stepBaseSchema.extend({
  type: z.literal("multiple_choice"),
  config: z.object({
    variable: variableNameSchema,
    options: z
      .array(multipleChoiceOptionSchema)
      .min(STEP_CONSTANTS.MIN_OPTIONS)
      .max(STEP_CONSTANTS.MAX_OPTIONS),
    allowMultiple: z.boolean(),
    required: z.boolean(),
  }),
});

/**
 * Yes/No step schema
 */
export const yesNoStepSchema = stepBaseSchema.extend({
  type: z.literal("yes_no"),
  config: z.object({
    variable: variableNameSchema,
    yesLabel: z.string().min(1).max(50),
    noLabel: z.string().min(1).max(50),
    required: z.boolean(),
  }),
});

/**
 * Opinion scale step schema
 */
export const opinionScaleStepSchema = stepBaseSchema.extend({
  type: z.literal("opinion_scale"),
  config: z
    .object({
      variable: variableNameSchema,
      scaleMin: z
        .number()
        .min(STEP_CONSTANTS.MIN_SCALE_VALUE)
        .max(STEP_CONSTANTS.MAX_SCALE_VALUE),
      scaleMax: z
        .number()
        .min(2)
        .max(STEP_CONSTANTS.MAX_SCALE_VALUE),
      minLabel: z.string().max(50).nullish(),
      maxLabel: z.string().max(50).nullish(),
      required: z.boolean(),
    })
    .refine((data) => data.scaleMax > data.scaleMin, {
      message: "scaleMax must be greater than scaleMin",
      path: ["scaleMax"],
    }),
});

/**
 * Email step schema
 */
export const emailStepSchema = stepBaseSchema.extend({
  type: z.literal("email"),
  config: z.object({
    variable: variableNameSchema,
    placeholder: z.string().max(100).nullish(),
    required: z.boolean(),
  }),
});

/**
 * Processing step schema
 */
export const processingStepSchema = stepBaseSchema.extend({
  type: z.literal("processing"),
  config: z.object({
    messages: z
      .array(z.string().min(1).max(STEP_CONSTANTS.MAX_PROCESSING_MESSAGE_LENGTH))
      .min(STEP_CONSTANTS.MIN_PROCESSING_MESSAGES)
      .max(STEP_CONSTANTS.MAX_PROCESSING_MESSAGES),
    estimatedDuration: z
      .number()
      .min(STEP_CONSTANTS.MIN_ESTIMATED_DURATION)
      .max(STEP_CONSTANTS.MAX_ESTIMATED_DURATION),
  }),
});

/**
 * Share social enum schema
 */
const shareSocialSchema = z.enum([
  "instagram",
  "facebook",
  "twitter",
  "linkedin",
  "tiktok",
  "whatsapp",
]);

/**
 * Reward step schema
 */
export const rewardStepSchema = stepBaseSchema.extend({
  type: z.literal("reward"),
  config: z.object({
    allowDownload: z.boolean(),
    allowSystemShare: z.boolean(),
    allowEmail: z.boolean(),
    socials: z.array(shareSocialSchema).max(6),
  }),
});

// ============================================================================
// Discriminated Union
// ============================================================================

/**
 * Step schema - discriminated union of all step types
 */
export const stepSchema = z.discriminatedUnion("type", [
  infoStepSchema,
  experiencePickerStepSchema,
  captureStepSchema,
  shortTextStepSchema,
  longTextStepSchema,
  multipleChoiceStepSchema,
  yesNoStepSchema,
  opinionScaleStepSchema,
  emailStepSchema,
  processingStepSchema,
  rewardStepSchema,
]);

// ============================================================================
// Input Schemas
// ============================================================================

/**
 * Step type schema
 */
export const stepTypeSchema = z.enum([
  "info",
  "experience-picker",
  "capture",
  "short_text",
  "long_text",
  "multiple_choice",
  "yes_no",
  "opinion_scale",
  "email",
  "processing",
  "reward",
]);

/**
 * Create step input schema
 */
export const createStepInputSchema = z.object({
  eventId: z.string().min(1),
  journeyId: z.string().min(1),
  type: stepTypeSchema,
  title: z.string().max(STEP_CONSTANTS.MAX_TITLE_LENGTH).nullish(),
  description: z.string().max(STEP_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullish(),
  mediaUrl: z.string().url().nullish(),
  ctaLabel: z.string().max(STEP_CONSTANTS.MAX_CTA_LABEL_LENGTH).nullish(),
  config: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Update step input schema
 */
export const updateStepInputSchema = z.object({
  title: z.string().max(STEP_CONSTANTS.MAX_TITLE_LENGTH).nullish(),
  description: z.string().max(STEP_CONSTANTS.MAX_DESCRIPTION_LENGTH).nullish(),
  mediaUrl: z.string().url().nullish(),
  ctaLabel: z.string().max(STEP_CONSTANTS.MAX_CTA_LABEL_LENGTH).nullish(),
  config: z.record(z.string(), z.unknown()).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type StepSchema = z.infer<typeof stepSchema>;
export type CreateStepInput = z.infer<typeof createStepInputSchema>;
export type UpdateStepInput = z.infer<typeof updateStepInputSchema>;
