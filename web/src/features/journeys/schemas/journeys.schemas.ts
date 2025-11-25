import { z } from "zod";
import { JOURNEY_CONSTRAINTS } from "../constants";

export const journeyStatusSchema = z.enum(["active", "deleted"]);

export const journeySchema = z.object({
  id: z.string(),
  eventId: z.string(),
  name: z
    .string()
    .min(JOURNEY_CONSTRAINTS.NAME_LENGTH.min)
    .max(JOURNEY_CONSTRAINTS.NAME_LENGTH.max),
  stepOrder: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  status: journeyStatusSchema,
  deletedAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type JourneySchema = z.infer<typeof journeySchema>;

// Create journey input validation
export const createJourneyInput = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  name: z
    .string()
    .min(JOURNEY_CONSTRAINTS.NAME_LENGTH.min, "Journey name is required")
    .max(JOURNEY_CONSTRAINTS.NAME_LENGTH.max, "Journey name too long")
    .transform((val) => val.trim()),
});

export type CreateJourneyInput = z.infer<typeof createJourneyInput>;
