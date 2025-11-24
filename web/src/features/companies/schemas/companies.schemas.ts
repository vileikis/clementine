// Zod schemas for Company data model
import { z } from "zod";
import { COMPANY_CONSTRAINTS } from '../constants';

// ============================================================================
// Enums
// ============================================================================

export const companyStatusSchema = z.enum(["active", "deleted"]);

// ============================================================================
// Document Schema (Firestore)
// ============================================================================

export const companySchema = z.object({
  id: z.string(),
  name: z.string()
    .min(COMPANY_CONSTRAINTS.NAME_LENGTH.min)
    .max(COMPANY_CONSTRAINTS.NAME_LENGTH.max),
  status: companyStatusSchema,
  deletedAt: z.number().nullable(),

  // Optional metadata
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
    .min(COMPANY_CONSTRAINTS.NAME_LENGTH.min, "Company name is required")
    .max(COMPANY_CONSTRAINTS.NAME_LENGTH.max, "Company name too long")
    .transform((val) => val.trim()),
  contactEmail: z.string().email("Invalid email format").optional(),
  termsUrl: z.string().url("Invalid URL").optional(),
  privacyUrl: z.string().url("Invalid URL").optional(),
});

export const updateCompanyInput = z.object({
  companyId: z.string(),
  name: z
    .string()
    .min(COMPANY_CONSTRAINTS.NAME_LENGTH.min, "Company name is required")
    .max(COMPANY_CONSTRAINTS.NAME_LENGTH.max, "Company name too long")
    .transform((val) => val.trim()),
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
