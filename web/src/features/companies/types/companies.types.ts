// Canonical TypeScript types for Company domain

export type CompanyStatus = "active" | "deleted";

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  deletedAt: number | null;

  // Optional metadata (Firestore-safe: null instead of undefined)
  contactEmail: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;

  createdAt: number;
  updatedAt: number;
}
