// Zod schemas for Company data model
import { z } from "zod";

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

export type CompanySchema = z.infer<typeof companySchema>;
