"use server";

import {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  getCompanyEventCount,
} from "@/lib/repositories/companies";
import { verifyAdminSecret } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createCompanyInput } from "@/lib/schemas/validation";
import { z } from "zod";

/**
 * Create a new company with unique name validation
 *
 * @param input - Company creation data (name and optional metadata)
 * @returns Success with companyId or failure with error message
 */
export async function createCompanyAction(
  input: z.infer<typeof createCompanyInput>
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const validated = createCompanyInput.parse(input);
    const companyId = await createCompany(validated);
    revalidatePath("/companies");
    return { success: true, companyId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create company",
    };
  }
}

/**
 * List all active companies ordered by name
 *
 * @returns Success with companies array or failure with error message
 */
export async function listCompaniesAction() {
  try {
    const companies = await listCompanies();
    return { success: true, companies };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch companies",
    };
  }
}

/**
 * Get a single company by ID
 *
 * @param companyId - Company document ID
 * @returns Success with company data or failure with error message
 */
export async function getCompanyAction(companyId: string) {
  try {
    const company = await getCompany(companyId);
    if (!company) {
      throw new Error("Company not found");
    }
    return { success: true, company };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch company",
    };
  }
}

/**
 * Update an existing company with unique name validation
 *
 * @param companyId - Company document ID
 * @param input - Company update data (name and optional metadata)
 * @returns Success or failure with error message
 */
export async function updateCompanyAction(
  companyId: string,
  input: z.infer<typeof createCompanyInput>
) {
  // Verify admin authentication
  const auth = await verifyAdminSecret();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  try {
    const validated = createCompanyInput.parse(input);
    await updateCompany(companyId, validated);
    revalidatePath("/companies");
    revalidatePath(`/companies/${companyId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update company",
    };
  }
}

/**
 * Get the count of events associated with a company
 *
 * @param companyId - Company document ID
 * @returns Success with event count or failure with error message
 */
export async function getCompanyEventCountAction(companyId: string) {
  try {
    const count = await getCompanyEventCount(companyId);
    return { success: true, count };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch event count",
    };
  }
}
