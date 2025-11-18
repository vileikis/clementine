// Canonical TypeScript types for Company domain

export type CompanyStatus = "active" | "deleted";

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  deletedAt: number | null;

  // Optional branding metadata
  brandColor?: string;
  contactEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;

  createdAt: number;
  updatedAt: number;
}
