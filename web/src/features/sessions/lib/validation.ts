// Session validation schemas
// Extracted from lib/schemas/firestore.ts

import { z } from "zod";

const sessionStateSchema = z.enum([
  "created",
  "captured",
  "transforming",
  "ready",
  "error",
]);

export const sessionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  sceneId: z.string(),
  state: sessionStateSchema,
  inputImagePath: z.string().optional(),
  resultImagePath: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type SessionSchema = z.infer<typeof sessionSchema>;
