// Session validation schemas

import { z } from "zod";

export const sessionStateSchema = z.enum([
  "created",
  "captured",
  "transforming",
  "ready",
  "error",
]);

/**
 * Discriminated union for type-safe step input storage.
 * Each step type maps to a specific value format.
 */
export const stepInputValueSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), value: z.string() }),
  z.object({ type: z.literal("boolean"), value: z.boolean() }),
  z.object({ type: z.literal("number"), value: z.number() }),
  z.object({ type: z.literal("selection"), selectedId: z.string() }),
  z.object({ type: z.literal("selections"), selectedIds: z.array(z.string()) }),
  z.object({ type: z.literal("photo"), url: z.string().url() }),
]);

export type StepInputValue = z.infer<typeof stepInputValueSchema>;

/**
 * Schema for dynamic step data.
 * Keys are step IDs, values are StepInputValue or string (for selected_experience_id).
 */
export const sessionDataSchema = z
  .object({
    selected_experience_id: z.string().optional(),
  })
  .catchall(stepInputValueSchema.optional());

export const sessionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  state: sessionStateSchema,
  inputImagePath: z.string().optional(),
  resultImagePath: z.string().optional(),
  error: z.string().optional(),

  // Journey support
  journeyId: z.string().optional(),
  currentStepIndex: z.number().int().min(0).optional(),
  data: sessionDataSchema.optional(),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export type SessionSchema = z.infer<typeof sessionSchema>;
export type SessionStateSchema = z.infer<typeof sessionStateSchema>;
export type SessionDataSchema = z.infer<typeof sessionDataSchema>;
