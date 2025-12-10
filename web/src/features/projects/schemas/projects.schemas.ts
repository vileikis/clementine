// Zod schemas for Project data models
import { z } from "zod";
import { NAME_LENGTH } from "../constants";
import {
  themeSchema,
  themeTextSchema,
  themeButtonSchema,
  themeBackgroundSchema,
} from "@/features/theming";

// Project schemas
export const projectStatusSchema = z.enum(["draft", "live", "archived", "deleted"]);

// Re-export theme schemas for backward compatibility
export const projectThemeTextSchema = themeTextSchema;
export const projectThemeButtonSchema = themeButtonSchema;
export const projectThemeBackgroundSchema = themeBackgroundSchema;
export const projectThemeSchema = themeSchema;

export const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(NAME_LENGTH.MIN).max(NAME_LENGTH.MAX),
  status: projectStatusSchema,
  companyId: z.string().nullable().default(null), // renamed from ownerId
  sharePath: z.string(), // renamed from joinPath
  qrPngPath: z.string(),
  publishStartAt: z.number().nullable().optional().default(null),
  publishEndAt: z.number().nullable().optional().default(null),

  // Switchboard pattern - controls which event/experience is active
  activeEventId: z.string().nullable().optional().default(null), // renamed from activeJourneyId

  // Nested object configurations
  theme: projectThemeSchema,

  // Soft delete timestamp
  deletedAt: z.number().nullable().optional().default(null),

  createdAt: z.number(),
  updatedAt: z.number(),
});

// Project update schemas (for Server Actions)
export { updateThemeSchema as updateProjectThemeSchema } from "@/features/theming";

export type ProjectSchema = z.infer<typeof projectSchema>;
