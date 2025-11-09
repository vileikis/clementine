// Runtime validation schemas using Zod

import { z } from "zod";

export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  showTitleOverlay: z.boolean(),
  status: z.enum(["draft", "live", "archived"]),
  currentSceneId: z.string(),
  joinPath: z.string(),
  qrPngPath: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const sceneSchema = z.object({
  id: z.string(),
  label: z.string(),
  mode: z.enum(["photo", "video", "gif", "boomerang"]),
  effect: z.enum(["background_swap", "deep_fake"]),
  prompt: z.string().min(1),
  defaultPrompt: z.string(),
  referenceImagePath: z.string().optional(),
  flags: z.object({
    customTextTool: z.boolean(),
    stickersTool: z.boolean(),
  }),
  status: z.enum(["active", "deprecated"]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const sessionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  sceneId: z.string(),
  state: z.enum(["created", "captured", "transforming", "ready", "error"]),
  inputImagePath: z.string().optional(),
  resultImagePath: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const mediaSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  sceneId: z.string(),
  resultImagePath: z.string(),
  createdAt: z.number(),
  width: z.number(),
  height: z.number(),
  sizeBytes: z.number(),
});

export const statsOverviewSchema = z.object({
  sessions: z.number(),
  captures: z.number(),
  transforms: z.number(),
  shares: z.number(),
  downloads: z.number(),
  uniqueGuests: z.number(),
  captureRate: z.number(),
  transformSuccessRate: z.number(),
  shareRate: z.number(),
  topMedia: z.array(
    z.object({
      mediaId: z.string(),
      sessionId: z.string(),
      resultImagePath: z.string(),
      score: z.number(),
      shares: z.number(),
      downloads: z.number(),
      views: z.number(),
    })
  ),
  updatedAt: z.number(),
});
