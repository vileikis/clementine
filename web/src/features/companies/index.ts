// Companies Feature - Public API
// All imports from this feature should use this file

// ============================================================================
// Components
// ============================================================================
export { CompanyCard } from "./components/CompanyCard";
export { CompanyFilter } from "./components/CompanyFilter";
export { CompanyForm } from "./components/CompanyForm";
export { DeleteCompanyDialog } from "./components/DeleteCompanyDialog";
export { BrandColorPicker } from "./components/BrandColorPicker";
export { BrandingForm } from "./components/BrandingForm";

// ============================================================================
// Server Actions (Safe for client components to import)
// ============================================================================
export {
  createCompanyAction,
  listCompaniesAction,
  getCompanyAction,
  updateCompanyAction,
  getCompanyEventCountAction,
  deleteCompanyAction,
} from "./actions/companies";

// ============================================================================
// Types
// ============================================================================
export type { Company, CompanyStatus } from "./types/company.types";

// ============================================================================
// Validation Schemas
// ============================================================================
export { companyStatusSchema, companySchema } from "./lib/schemas";

// ============================================================================
// Server-only exports
// Note: Repository and cache functions are NOT exported from the public API
// They should only be used internally within this feature's server code.
// External code should use the server actions above instead.
// ============================================================================
