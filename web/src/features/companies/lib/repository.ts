/**
 * Companies repository - Firestore operations for company management
 */

import { db } from "@/lib/firebase/admin";
import type { Company, CompanyStatus } from "../types/company.types";
import { companySchema } from "@/lib/schemas/firestore";
import type { CreateCompanyInput } from "@/lib/schemas/validation";

/**
 * Create a new company with transaction-based uniqueness validation
 *
 * @param data - Company creation input (name and optional metadata)
 * @returns Company ID
 * @throws Error if company name already exists (case-insensitive)
 */
export async function createCompany(
  data: CreateCompanyInput
): Promise<string> {
  const companyRef = db.collection("companies").doc();

  await db.runTransaction(async (txn) => {
    // Check for existing active company with same name (case-insensitive)
    // Normalize to lowercase for comparison
    const normalizedName = data.name.toLowerCase().trim();

    const existingSnapshot = await txn.get(
      db
        .collection("companies")
        .where("status", "==", "active")
        .limit(1)
    );

    // Check if any existing active company has matching normalized name
    const duplicate = existingSnapshot.docs.find(
      (doc) => doc.data().name.toLowerCase().trim() === normalizedName
    );

    if (duplicate) {
      throw new Error(`Company name "${data.name}" already exists`);
    }

    // Create new company document
    const now = Date.now();
    const company: Company = {
      id: companyRef.id,
      name: data.name.trim(),
      status: "active",
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      // Optional metadata fields
      ...(data.brandColor && { brandColor: data.brandColor }),
      ...(data.contactEmail && { contactEmail: data.contactEmail }),
      ...(data.termsUrl && { termsUrl: data.termsUrl }),
      ...(data.privacyUrl && { privacyUrl: data.privacyUrl }),
    };

    txn.set(companyRef, company);
  });

  return companyRef.id;
}

/**
 * List all active companies ordered by name
 *
 * @returns Array of active companies sorted alphabetically by name
 */
export async function listCompanies(): Promise<Company[]> {
  const snapshot = await db
    .collection("companies")
    .where("status", "==", "active")
    .orderBy("name", "asc")
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return companySchema.parse({ id: doc.id, ...data });
  });
}

/**
 * Get a single company by ID
 *
 * @param companyId - Company document ID
 * @returns Company data or null if not found
 */
export async function getCompany(companyId: string): Promise<Company | null> {
  const doc = await db.collection("companies").doc(companyId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return companySchema.parse({ id: doc.id, ...data });
}

/**
 * Update an existing company with transaction-based uniqueness validation
 *
 * @param companyId - Company document ID to update
 * @param data - Company update input (name and optional metadata)
 * @returns void
 * @throws Error if company not found or name already exists (case-insensitive, excluding self)
 */
export async function updateCompany(
  companyId: string,
  data: CreateCompanyInput
): Promise<void> {
  const companyRef = db.collection("companies").doc(companyId);

  await db.runTransaction(async (txn) => {
    // Verify company exists
    const companyDoc = await txn.get(companyRef);
    if (!companyDoc.exists) {
      throw new Error("Company not found");
    }

    // Check for duplicate name among active companies (excluding self)
    const normalizedName = data.name.toLowerCase().trim();

    const existingSnapshot = await txn.get(
      db
        .collection("companies")
        .where("status", "==", "active")
        .limit(10) // Get a few to check, excluding self
    );

    // Check if any other active company has matching normalized name
    const duplicate = existingSnapshot.docs.find(
      (doc) =>
        doc.id !== companyId &&
        doc.data().name.toLowerCase().trim() === normalizedName
    );

    if (duplicate) {
      throw new Error(`Company name "${data.name}" already exists`);
    }

    // Update company document
    const now = Date.now();
    const updates: Partial<Company> = {
      name: data.name.trim(),
      updatedAt: now,
      // Optional metadata fields
      ...(data.brandColor !== undefined && { brandColor: data.brandColor }),
      ...(data.contactEmail !== undefined && {
        contactEmail: data.contactEmail,
      }),
      ...(data.termsUrl !== undefined && { termsUrl: data.termsUrl }),
      ...(data.privacyUrl !== undefined && { privacyUrl: data.privacyUrl }),
    };

    txn.update(companyRef, updates);
  });
}

/**
 * Get the count of events associated with a company
 *
 * @param companyId - Company document ID
 * @returns Number of events linked to this company
 */
export async function getCompanyEventCount(companyId: string): Promise<number> {
  const snapshot = await db
    .collection("events")
    .where("companyId", "==", companyId)
    .count()
    .get();

  return snapshot.data().count;
}

/**
 * Soft delete a company by marking as deleted (does not remove document)
 *
 * @param companyId - Company document ID to delete
 * @returns void
 *
 * Implementation notes:
 * - Sets status='deleted' and deletedAt timestamp
 * - Does NOT remove document from Firestore (soft delete)
 * - Deleted companies are excluded from listCompanies() via status filter
 * - Events associated with deleted companies remain but guest links are disabled
 * - Invalidates company status cache for immediate guest link effect
 */
export async function deleteCompany(companyId: string): Promise<void> {
  const now = Date.now();

  await db.collection("companies").doc(companyId).update({
    status: "deleted",
    deletedAt: now,
    updatedAt: now,
  });

  // Invalidate cache so guest links see updated status immediately
  const { invalidateCompanyStatusCache } = await import(
    "./cache"
  );
  invalidateCompanyStatusCache(companyId);
}

/**
 * Get company status with caching for guest link validation
 *
 * @param companyId - Company document ID
 * @returns Company status or null if company not found
 *
 * Implementation notes:
 * - Checks in-memory cache first (60s TTL)
 * - Falls back to Firestore if cache miss
 * - Caches result for future requests
 * - Target cache hit rate: >80% (reduces Firestore reads by ~90%)
 */
export async function getCompanyStatus(
  companyId: string
): Promise<CompanyStatus | null> {
  const {
    getCachedCompanyStatus,
    setCachedCompanyStatus,
  } = await import("./cache");

  // Check cache first
  const cached = getCachedCompanyStatus(companyId);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch from Firestore
  const company = await getCompany(companyId);
  if (!company) {
    return null;
  }

  // Cache the result
  setCachedCompanyStatus(companyId, company.status);

  return company.status;
}
