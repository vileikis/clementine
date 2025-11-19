// Zod schemas for Company data model
import { z } from "zod";

// ============================================================================
// Enums
// ============================================================================

export const companyStatusSchema = z.enum(["active", "deleted"]);

// ============================================================================
// Document Schema (Firestore)
// ============================================================================

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

// ============================================================================
// Input Validation Schemas (Server Actions)
// ============================================================================

export const createCompanyInput = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name too long")
    .transform((val) => val.trim()),
  brandColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
    .optional(),
  contactEmail: z.string().email("Invalid email format").optional(),
  termsUrl: z.string().url("Invalid URL").optional(),
  privacyUrl: z.string().url("Invalid URL").optional(),
});

export const updateCompanyInput = z.object({
  companyId: z.string(),
  name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name too long")
    .transform((val) => val.trim()),
  brandColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Invalid hex color")
    .optional(),
  contactEmail: z.string().email("Invalid email format").optional(),
  termsUrl: z.string().url("Invalid URL").optional(),
  privacyUrl: z.string().url("Invalid URL").optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CompanySchema = z.infer<typeof companySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanyInput>;
export type UpdateCompanyInput = z.infer<typeof updateCompanyInput>;
