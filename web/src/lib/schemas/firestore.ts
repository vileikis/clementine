// Zod schemas for Firestore data models
import { z } from "zod";

// Event schema matching Event interface from types/firestore.ts
export const eventStatusSchema = z.enum(["draft", "live", "archived"]);

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  showTitleOverlay: z.boolean(),
  status: eventStatusSchema,
  currentSceneId: z.string(),
  companyId: z.string().nullable().default(null),
  joinPath: z.string(),
  qrPngPath: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Scene schema matching Scene interface from types/firestore.ts
export const captureModeSchema = z.enum(["photo", "video", "gif", "boomerang"]);
export const sceneStatusSchema = z.enum(["active", "deprecated"]);

export const sceneSchema = z.object({
  id: z.string(),
  label: z.string(),
  mode: captureModeSchema,
  prompt: z.string().nullable(),
  referenceImagePath: z.string().optional(),
  flags: z.object({
    customTextTool: z.boolean(),
    stickersTool: z.boolean(),
  }),
  status: sceneStatusSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Session schema matching Session interface from types/firestore.ts
export const sessionStateSchema = z.enum([
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

// Company schema matching Company interface from types/firestore.ts
export const companyStatusSchema = z.enum(["active", "deleted"]);

export const companySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  status: companyStatusSchema,
  deletedAt: z.number().nullable(),

  // Optional branding metadata
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  contactEmail: z.string().email().optional(),
  termsUrl: z.string().url().optional(),
  privacyUrl: z.string().url().optional(),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export type EventSchema = z.infer<typeof eventSchema>;
export type SceneSchema = z.infer<typeof sceneSchema>;
export type SessionSchema = z.infer<typeof sessionSchema>;
export type CompanySchema = z.infer<typeof companySchema>;
