// Zod schemas for Company data model
import { z } from "zod";
import { COMPANY_CONSTRAINTS } from "../constants";

// ============================================================================
// Enums
// ============================================================================

export const companyStatusSchema = z.enum(["active", "deleted"]);

// ============================================================================
// Slug Validation
// ============================================================================

export const slugSchema = z
  .string()
  .min(COMPANY_CONSTRAINTS.SLUG_LENGTH.min, "Slug is required")
  .max(
    COMPANY_CONSTRAINTS.SLUG_LENGTH.max,
    `Slug must be ${COMPANY_CONSTRAINTS.SLUG_LENGTH.max} characters or less`
  )
  .regex(
    COMPANY_CONSTRAINTS.SLUG_PATTERN,
    "Slug must contain only lowercase letters, numbers, and hyphens (no leading/trailing hyphens)"
  );

// ============================================================================
// Document Schema (Firestore)
// ============================================================================

export const companySchema = z.object({
  id: z.string(),
  name: z
    .string()
    .min(COMPANY_CONSTRAINTS.NAME_LENGTH.min)
    .max(COMPANY_CONSTRAINTS.NAME_LENGTH.max),
  slug: slugSchema,
  status: companyStatusSchema,
  deletedAt: z.number().nullable(),

  // Optional metadata (Firestore-safe with Zod v4 validators)
  contactEmail: z.email().nullable().optional().default(null),
  termsUrl: z.url().nullable().optional().default(null),
  privacyUrl: z.url().nullable().optional().default(null),

  createdAt: z.number(),
  updatedAt: z.number(),
});

// ============================================================================
// Input Validation Schemas (Server Actions)
// ============================================================================

export const createCompanyInput = z.object({
  name: z
    .string()
    .min(COMPANY_CONSTRAINTS.NAME_LENGTH.min, "Company name is required")
    .max(COMPANY_CONSTRAINTS.NAME_LENGTH.max, "Company name too long")
    .transform((val) => val.trim()),
  slug: slugSchema.optional(), // Auto-generated from name if not provided
  contactEmail: z.email({ message: "Invalid email format" }).optional(),
  termsUrl: z.url({ message: "Invalid URL" }).optional(),
  privacyUrl: z.url({ message: "Invalid URL" }).optional(),
});

export const updateCompanyInput = z.object({
  companyId: z.string(),
  name: z
    .string()
    .min(COMPANY_CONSTRAINTS.NAME_LENGTH.min, "Company name is required")
    .max(COMPANY_CONSTRAINTS.NAME_LENGTH.max, "Company name too long")
    .transform((val) => val.trim()),
  slug: slugSchema.optional(), // Can be changed on update
  contactEmail: z.email({ message: "Invalid email format" }).optional(),
  termsUrl: z.url({ message: "Invalid URL" }).optional(),
  privacyUrl: z.url({ message: "Invalid URL" }).optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CompanySchema = z.infer<typeof companySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanyInput>;
export type UpdateCompanyInput = z.infer<typeof updateCompanyInput>;
