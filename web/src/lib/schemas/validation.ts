// Zod validation schemas for Server Action inputs
import { z } from "zod";

// Company input validation schemas
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

export type CreateCompanyInput = z.infer<typeof createCompanyInput>;
export type UpdateCompanyInput = z.infer<typeof updateCompanyInput>;
