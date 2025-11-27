// Session validation schemas

import { z } from "zod";

const sessionStateSchema = z.enum([
  "created",
  "captured",
  "transforming",
  "ready",
  "error",
]);

// Schema for dynamic step data
const sessionDataSchema = z.object({
  selected_experience_id: z.string().optional(),
}).passthrough(); // Allow additional keys

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
