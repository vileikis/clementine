# Companies Feature Refactor Plan

**Date**: 2025-11-24
**Feature**: `web/src/features/companies/`
**Goal**: Achieve 100% compliance with project standards

---

## Overview

This document outlines the step-by-step refactoring plan to bring the companies feature module into full compliance with project standards as documented in `standards/`.

**Estimated Effort**: 2-3 hours
**Risk Level**: Low (no breaking changes to public API behavior)
**Testing Required**: Run existing tests after each phase

### Additional Requirements

Per user request, this refactor also includes:
1. **Remove brandColor** from company schema, types, actions, and all components
2. **Delete BrandingForm.tsx** entirely (not needed)

---

## Refactor Phases

### Phase 0: Remove brandColor and BrandingForm

**Goal**: Clean up company schema and remove unused branding components

#### 0.1 Delete BrandingForm Component

```bash
# Delete BrandingForm entirely - not needed
rm web/src/features/companies/components/BrandingForm.tsx
```

#### 0.2 Update types/company.types.ts

```typescript
// Remove brandColor from Company interface
export type CompanyStatus = "active" | "deleted";

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  deletedAt: number | null;

  // Remove brandColor - no longer part of company model
  // brandColor?: string; ❌ DELETE THIS
  contactEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;

  createdAt: number;
  updatedAt: number;
}
```

#### 0.3 Update lib/schemas.ts

```typescript
// Remove brandColor from all schemas

export const companySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  status: companyStatusSchema,
  deletedAt: z.number().nullable(),

  // Remove brandColor - no longer part of company model
  // brandColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(), ❌ DELETE THIS
  contactEmail: z.string().email().optional(),
  termsUrl: z.string().url().optional(),
  privacyUrl: z.string().url().optional(),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createCompanyInput = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .max(100, "Company name too long")
    .transform((val) => val.trim()),
  // brandColor removed ❌
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
  // brandColor removed ❌
  contactEmail: z.string().email("Invalid email format").optional(),
  termsUrl: z.string().url("Invalid URL").optional(),
  privacyUrl: z.string().url("Invalid URL").optional(),
});
```

#### 0.4 Update repositories/companies.ts

```typescript
// Remove brandColor from createCompany function
export async function createCompany(
  data: CreateCompanyInput
): Promise<string> {
  const companyRef = db.collection("companies").doc();

  await db.runTransaction(async (txn) => {
    // ... transaction logic ...

    const now = Date.now();
    const company: Company = {
      id: companyRef.id,
      name: data.name.trim(),
      status: "active",
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      // Optional metadata fields (brandColor removed)
      // ...(data.brandColor && { brandColor: data.brandColor }), ❌ DELETE THIS
      ...(data.contactEmail && { contactEmail: data.contactEmail }),
      ...(data.termsUrl && { termsUrl: data.termsUrl }),
      ...(data.privacyUrl && { privacyUrl: data.privacyUrl }),
    };

    txn.set(companyRef, company);
  });

  return companyRef.id;
}

// Remove brandColor from updateCompany function
export async function updateCompany(
  companyId: string,
  data: CreateCompanyInput
): Promise<void> {
  const companyRef = db.collection("companies").doc(companyId);

  await db.runTransaction(async (txn) => {
    // ... transaction logic ...

    const now = Date.now();
    const updates: Partial<Company> = {
      name: data.name.trim(),
      updatedAt: now,
      // Optional metadata fields (brandColor removed)
      // ...(data.brandColor !== undefined && { brandColor: data.brandColor }), ❌ DELETE THIS
      ...(data.contactEmail !== undefined && {
        contactEmail: data.contactEmail,
      }),
      ...(data.termsUrl !== undefined && { termsUrl: data.termsUrl }),
      ...(data.privacyUrl !== undefined && { privacyUrl: data.privacyUrl }),
    };

    txn.update(companyRef, updates);
  });
}
```

#### 0.5 Update components/CompanyCard.tsx

```typescript
// Remove brandColor display from CompanyCard
export function CompanyCard({ company }: CompanyCardProps) {
  const formattedDate = new Date(company.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/companies/${company.id}`}>
      <div className="border rounded-lg p-6 space-y-4 hover:bg-muted/50 transition-colors cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{company.name}</h3>
          </div>

          {/* Remove brand color indicator ❌ DELETE THIS ENTIRE BLOCK */}
          {/* {company.brandColor && (
            <div
              className="w-8 h-8 rounded border flex-shrink-0"
              style={{ backgroundColor: company.brandColor }}
              title={`Brand color: ${company.brandColor}`}
            />
          )} */}
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground">
          Created {formattedDate}
        </div>
      </div>
    </Link>
  );
}
```

#### 0.6 Update index.ts (Public API)

```typescript
// Remove BrandingForm export
export { CompanyCard } from "./components/CompanyCard";
export { CompanyFilter } from "./components/CompanyFilter";
export { CompanyForm } from "./components/CompanyForm";
export { DeleteCompanyDialog } from "./components/DeleteCompanyDialog";
export { BrandColorPicker } from "./components/BrandColorPicker";
// export { BrandingForm } from "./components/BrandingForm"; ❌ DELETE THIS LINE

// ... rest of exports
```

**Note:** BrandColorPicker component can remain as it might be used elsewhere (or removed in cleanup phase if unused).

---

### Phase 1: Folder Structure Reorganization

**Goal**: Align folder structure with standard layout

#### 1.1 Create Missing Folders
```bash
# Create schemas/ folder
mkdir web/src/features/companies/schemas

# Keep lib/ for non-schema utilities (cache)
# Already exists
```

#### 1.2 Move and Rename Files

**Actions:**
```bash
# Move schemas.ts to schemas/ folder and rename
mv web/src/features/companies/lib/schemas.ts \
   web/src/features/companies/schemas/companies.schemas.ts

# Rename action files
mv web/src/features/companies/actions/companies.ts \
   web/src/features/companies/actions/companies.actions.ts
mv web/src/features/companies/actions/companies.test.ts \
   web/src/features/companies/actions/companies.actions.test.ts

# Rename repository files
mv web/src/features/companies/repositories/companies.ts \
   web/src/features/companies/repositories/companies.repository.ts
mv web/src/features/companies/repositories/companies.test.ts \
   web/src/features/companies/repositories/companies.repository.test.ts

# Rename types file
mv web/src/features/companies/types/company.types.ts \
   web/src/features/companies/types/companies.types.ts
```

**Result:**
```
features/companies/
├── actions/
│   ├── companies.actions.ts
│   └── companies.actions.test.ts
├── components/
│   ├── BrandColorPicker.tsx (consider removing if unused)
│   ├── CompanyCard.tsx
│   ├── CompanyFilter.tsx
│   ├── CompanyForm.tsx
│   └── DeleteCompanyDialog.tsx
├── schemas/
│   └── companies.schemas.ts
├── repositories/
│   ├── companies.repository.ts
│   └── companies.repository.test.ts
├── types/
│   └── companies.types.ts
├── lib/
│   └── cache.ts
└── index.ts
```

#### 1.3 Update Import Paths

After renaming, update all import statements:

**In `companies.actions.ts`:**
```typescript
// Before
import { createCompany, ... } from "../repositories/companies";
import { createCompanyInput } from "../lib/schemas";

// After
import { createCompany, ... } from "../repositories/companies.repository";
import { createCompanyInput } from "../schemas/companies.schemas";
```

**In `companies.repository.ts`:**
```typescript
// Before
import { companySchema, type CreateCompanyInput } from "../lib/schemas";

// After
import { companySchema, type CreateCompanyInput } from "../schemas/companies.schemas";
```

**In all components:**
```typescript
// Before
import type { Company } from "../types/company.types";

// After
import type { Company } from "../types/companies.types";
```

---

### Phase 2: Add Barrel Exports (index.ts)

**Goal**: Enable clean imports within feature

#### 2.1 Create index.ts Files

**actions/index.ts:**
```typescript
export * from './companies.actions';
```

**components/index.ts:**
```typescript
export * from './BrandColorPicker'; // Consider removing if unused
export * from './CompanyCard';
export * from './CompanyFilter';
export * from './CompanyForm';
export * from './DeleteCompanyDialog';
```

**schemas/index.ts:**
```typescript
export * from './companies.schemas';
```

**repositories/index.ts:**
```typescript
export * from './companies.repository';
```

**types/index.ts:**
```typescript
export * from './companies.types';
```

**lib/index.ts:**
```typescript
export * from './cache';
```

#### 2.2 Update Internal Imports

Now use barrel exports for cleaner imports:

**In `companies.actions.ts`:**
```typescript
// Before
import { createCompany, ... } from "../repositories/companies.repository";
import { createCompanyInput } from "../schemas/companies.schemas";

// After
import { createCompany, ... } from '../repositories';
import { createCompanyInput } from '../schemas';
```

**In `companies.repository.ts`:**
```typescript
// Before
import { companySchema, type CreateCompanyInput } from "../schemas/companies.schemas";
import type { Company, CompanyStatus } from "../types/companies.types";

// After
import { companySchema, type CreateCompanyInput } from '../schemas';
import type { Company, CompanyStatus } from '../types';
```

---

### Phase 3: Create constants.ts

**Goal**: Extract magic numbers and validation constraints

#### 3.1 Create constants.ts

**features/companies/constants.ts:**
```typescript
/**
 * Company validation constraints and configuration values
 * Used across schemas, UI components, and error messages
 */

export const COMPANY_CONSTRAINTS = {
  NAME_LENGTH: { min: 1, max: 100 },
  // BRAND_COLOR_REGEX removed - no longer part of company model
} as const;

export const COMPANY_CACHE = {
  TTL_MS: 60_000, // 60 seconds
  CLEANUP_INTERVAL_MS: 60_000, // 60 seconds
} as const;
```

#### 3.2 Update schemas/companies.schemas.ts

```typescript
import { z } from "zod";
import { COMPANY_CONSTRAINTS } from '../constants';

export const companyStatusSchema = z.enum(["active", "deleted"]);

export const companySchema = z.object({
  id: z.string(),
  name: z.string()
    .min(COMPANY_CONSTRAINTS.NAME_LENGTH.min)
    .max(COMPANY_CONSTRAINTS.NAME_LENGTH.max),
  status: companyStatusSchema,
  deletedAt: z.number().nullable(),

  // Optional metadata (Firestore-safe)
  // brandColor removed - no longer part of company model
  contactEmail: z.email().nullable().optional().default(null),
  termsUrl: z.url().nullable().optional().default(null),
  privacyUrl: z.url().nullable().optional().default(null),

  createdAt: z.number(),
  updatedAt: z.number(),
});

export const createCompanyInput = z.object({
  name: z
    .string()
    .min(COMPANY_CONSTRAINTS.NAME_LENGTH.min, "Company name is required")
    .max(COMPANY_CONSTRAINTS.NAME_LENGTH.max, "Company name too long")
    .transform((val) => val.trim()),
  // brandColor removed - no longer part of company model
  contactEmail: z.email("Invalid email format").optional(),
  termsUrl: z.url("Invalid URL").optional(),
  privacyUrl: z.url("Invalid URL").optional(),
});

export const updateCompanyInput = z.object({
  companyId: z.string(),
  name: z
    .string()
    .min(COMPANY_CONSTRAINTS.NAME_LENGTH.min, "Company name is required")
    .max(COMPANY_CONSTRAINTS.NAME_LENGTH.max, "Company name too long")
    .transform((val) => val.trim()),
  // brandColor removed - no longer part of company model
  contactEmail: z.email("Invalid email format").optional(),
  termsUrl: z.url("Invalid URL").optional(),
  privacyUrl: z.url("Invalid URL").optional(),
});

export type CompanySchema = z.infer<typeof companySchema>;
export type CreateCompanyInput = z.infer<typeof createCompanyInput>;
export type UpdateCompanyInput = z.infer<typeof updateCompanyInput>;
```

**Key Changes:**
1. ✅ Use `z.email()` instead of `z.string().email()` (Zod v4)
2. ✅ Use `z.url()` instead of `z.string().url()` (Zod v4)
3. ✅ Add `.nullable().optional().default(null)` to optional fields (Firestore-safe)
4. ✅ Import constraints from constants.ts
5. ✅ Regex pattern from constants

#### 3.3 Update lib/cache.ts

```typescript
import type { CompanyStatus } from "../types";
import { COMPANY_CACHE } from '../constants';

interface CacheEntry {
  status: CompanyStatus;
  expires: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedCompanyStatus(
  companyId: string
): CompanyStatus | null {
  const now = Date.now();
  const entry = cache.get(companyId);

  if (!entry || entry.expires <= now) {
    if (entry) {
      cache.delete(companyId);
    }
    return null;
  }

  return entry.status;
}

export function setCachedCompanyStatus(
  companyId: string,
  status: CompanyStatus
): void {
  const now = Date.now();
  cache.set(companyId, {
    status,
    expires: now + COMPANY_CACHE.TTL_MS,
  });
}

export function invalidateCompanyStatusCache(companyId: string): void {
  cache.delete(companyId);
}

export function clearCompanyStatusCache(): void {
  cache.clear();
}

setInterval(() => {
  const now = Date.now();
  for (const [companyId, entry] of cache.entries()) {
    if (entry.expires <= now) {
      cache.delete(companyId);
    }
  }
}, COMPANY_CACHE.CLEANUP_INTERVAL_MS);
```

#### 3.4 Update CompanyForm.tsx

```typescript
import { COMPANY_CONSTRAINTS } from '../constants';

// In component:
<Input
  maxLength={COMPANY_CONSTRAINTS.NAME_LENGTH.max}
  // ...
/>

const validateName = (value: string): boolean => {
  if (!value.trim()) {
    setNameError("Company name is required");
    return false;
  }
  if (value.length > COMPANY_CONSTRAINTS.NAME_LENGTH.max) {
    setNameError(`Company name must be ${COMPANY_CONSTRAINTS.NAME_LENGTH.max} characters or less`);
    return false;
  }
  setNameError(null);
  return true;
};
```

---

### Phase 4: Fix Public API (index.ts)

**Goal**: Remove server actions and schemas from public exports

#### 4.1 Update features/companies/index.ts

```typescript
// Companies Feature - Public API
// All imports from this feature should use this file

// ============================================================================
// Components
// ============================================================================
export * from './components';

// ============================================================================
// Types
// ============================================================================
export type { Company, CompanyStatus } from './types';

// ============================================================================
// Server-only exports
// Note: Actions, schemas, repositories, and lib are NOT exported from the public API.
// They should only be accessed via direct imports:
// - Actions: @/features/companies/actions
// - Schemas: @/features/companies/schemas (internal use only)
// - Repositories: @/features/companies/repositories (server-only)
// - Lib (cache): @/features/companies/lib (internal use only)
// ============================================================================
```

**Key Changes:**
1. ✅ Use barrel export for components (`export * from './components'`)
2. ✅ Use barrel export for types (`export type { ... } from './types'`)
3. ❌ Remove server actions exports
4. ❌ Remove schema exports
5. ❌ Remove repository exports

#### 4.2 Update Component Imports

**In CompanyForm.tsx:**
```typescript
// Before
import { createCompanyAction, updateCompanyAction } from "@/features/companies";
import type { Company } from "@/features/companies";

// After
import { createCompanyAction, updateCompanyAction } from "@/features/companies/actions";
import type { Company } from "@/features/companies";
```

**In DeleteCompanyDialog.tsx:**
```typescript
// Before
import { deleteCompanyAction } from "@/features/companies";

// After
import { deleteCompanyAction } from "@/features/companies/actions";
```

---

### Phase 5: Improve Error Handling

**Goal**: Return detailed validation errors with field paths

#### 5.1 Update actions/companies.actions.ts

```typescript
"use server";

import {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  getCompanyEventCount,
  deleteCompany,
} from "../repositories";
import { verifyAdminSecret } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createCompanyInput } from "../schemas";
import { z } from "zod";

export async function createCompanyAction(
  input: z.infer<typeof createCompanyInput>
) {
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
      // Return all validation issues with field paths
      return {
        success: false,
        error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        issues: error.issues,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create company",
    };
  }
}

export async function updateCompanyAction(
  companyId: string,
  input: z.infer<typeof createCompanyInput>
) {
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
      // Return all validation issues with field paths
      return {
        success: false,
        error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        issues: error.issues,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update company",
    };
  }
}

// ... rest of actions unchanged
```

**Key Changes:**
1. ✅ Return all validation issues, not just first one
2. ✅ Include field paths in error messages
3. ✅ Include `issues` array for client-side field mapping

---

### Phase 6: Clean Up Unused Components

**Goal**: Remove components that are no longer needed

#### 6.1 Check BrandColorPicker Usage

```bash
# Search for BrandColorPicker imports across codebase
grep -r "BrandColorPicker" web/src --exclude-dir=node_modules
```

**If only used in the deleted BrandingForm:**
```bash
# Delete BrandColorPicker if unused
rm web/src/features/companies/components/BrandColorPicker.tsx
```

**If BrandColorPicker is used elsewhere:**
- Keep it in the companies feature
- Or move it to a shared component location if it's truly generic

#### 6.2 Update components/index.ts (if BrandColorPicker deleted)

```typescript
// Remove BrandColorPicker export if deleted
export * from './CompanyCard';
export * from './CompanyFilter';
export * from './CompanyForm';
export * from './DeleteCompanyDialog';
```

#### 6.3 Update Public API (if BrandColorPicker deleted)

The public API already uses barrel export, so no changes needed if `components/index.ts` is updated.

---

### Phase 7: Clean Up and Documentation

**Goal**: Remove unused code, add documentation

#### 7.1 Remove Unused Props

**In CompanyCard.tsx:**
```typescript
// Before
interface CompanyCardProps {
  company: Company;
  eventCount?: number; // Not used
}

// After
interface CompanyCardProps {
  company: Company;
}
```

#### 7.2 Add JSDoc Comments

**In components with complex props, add documentation:**

```typescript
/**
 * Company card component for displaying company information in lists
 * @param company - Company data to display
 */
export function CompanyCard({ company }: CompanyCardProps) {
  // ...
}

/**
 * Form for creating and editing companies
 * @param company - Existing company data (for edit mode)
 * @param onSuccess - Callback fired after successful save
 * @param onCancel - Callback fired when user cancels
 */
export function CompanyForm({ company, onSuccess, onCancel }: CompanyFormProps) {
  // ...
}
```

#### 7.3 Update Test File Imports

**In `companies.actions.test.ts`:**
```typescript
import { createCompanyAction, ... } from './companies.actions';
```

**In `companies.repository.test.ts`:**
```typescript
import { createCompany, ... } from './companies.repository';
```

---

## Pre-Refactor: Check for brandColor Usage

Before starting Phase 0, search for all uses of `brandColor` in the codebase:

```bash
# Search for brandColor across the entire codebase
grep -r "brandColor" web/src --exclude-dir=node_modules

# Check for BrandingForm usage
grep -r "BrandingForm" web/src --exclude-dir=node_modules

# Check for BrandColorPicker usage
grep -r "BrandColorPicker" web/src --exclude-dir=node_modules
```

**Verify:**
- No other features depend on company.brandColor
- BrandingForm is safe to delete
- BrandColorPicker can be removed or is used elsewhere

---

## Testing Checklist

After completing all phases, verify:

### Unit Tests
- [ ] Run `pnpm test` from root
- [ ] All existing tests pass
- [ ] No import errors

### Type Checking
- [ ] Run `pnpm type-check` from root
- [ ] No TypeScript errors
- [ ] All imports resolve correctly

### Build
- [ ] Run `pnpm build` from root
- [ ] Build completes without errors
- [ ] No bundling warnings

### Manual Testing
- [ ] Company list page loads
- [ ] Create new company works (without brandColor field)
- [ ] Edit company works (without brandColor field)
- [ ] Delete company works (with dialog)
- [ ] Company filter works
- [ ] CompanyCard displays correctly (no brand color indicator)
- [ ] Form validation shows errors
- [ ] Server-side validation catches duplicates
- [ ] No broken imports or references to deleted BrandingForm

---

## Migration Risks and Mitigation

### Risk 1: Import Path Changes
**Impact**: Breaking imports across codebase
**Mitigation**:
1. Use global find/replace for systematic updates
2. Run TypeScript compiler after each phase
3. Test build after changes

### Risk 2: Zod v4 Validator Changes
**Impact**: Potential validation behavior changes
**Mitigation**:
1. Test all validation scenarios
2. Verify email/URL validation still works
3. Check error messages are correct

### Risk 3: Optional Field Null Handling
**Impact**: Firestore writes may change behavior
**Mitigation**:
1. Test company creation with/without optional fields
2. Verify existing documents parse correctly
3. Check Firestore documents don't have undefined values

### Risk 4: Removing brandColor and BrandingForm
**Impact**: Breaking existing company documents, UI references
**Mitigation**:
1. Search for all brandColor references before deletion
2. Existing Firestore documents with brandColor field will be ignored (Zod schema doesn't require it)
3. Verify no other features depend on company.brandColor
4. Check for BrandingForm imports that need removal

---

## Rollback Plan

If issues arise during refactoring:

1. **Git Revert**: Each phase should be a separate commit
   ```bash
   git revert HEAD  # Revert last commit
   ```

2. **Stash Changes**: Save work in progress
   ```bash
   git stash
   git stash pop  # When ready to resume
   ```

3. **Branch Strategy**: Work in feature branch
   ```bash
   git checkout -b refactor/companies-standards-compliance
   # Make changes
   git checkout main  # If need to abandon
   ```

---

## Post-Refactor Validation

### Code Quality Metrics
- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings
- [ ] All tests pass
- [ ] No console errors in development
- [ ] Build succeeds without warnings

### Standards Compliance Checklist
- [ ] ✅ Folder structure matches standard
- [ ] ✅ File names follow `[domain].[purpose].[ext]` pattern
- [ ] ✅ Barrel exports in all subfolders
- [ ] ✅ Public API only exports components and types
- [ ] ✅ Constants file exists with validation constraints
- [ ] ✅ Zod v4 validators used correctly
- [ ] ✅ Optional fields use `.nullable().optional().default(null)`
- [ ] ✅ Validation errors include field paths
- [ ] ✅ brandColor removed from company model
- [ ] ✅ BrandingForm deleted
- [ ] ✅ BrandColorPicker removed (if unused)
- [ ] ✅ No unused props or code

### Documentation
- [ ] Update CLAUDE.md if needed
- [ ] Update feature status in data-model-v4.md
- [ ] Add migration notes to changelog

---

## Expected Outcome

After completing this refactor:

1. **100% Standards Compliance** - All violations resolved
2. **Improved Developer Experience** - Clear file naming, clean imports
3. **Better Error Messages** - Field-specific validation feedback
4. **Reusable Constants** - Shared across schemas and UI
5. **Correct Feature Boundaries** - BrandingForm in events, not companies
6. **Future-Proof** - Zod v4 validators, Firestore-safe optional fields

**New Compliance Score: A+ (100%)**

---

## Timeline Estimate

| Phase | Duration | Complexity |
|-------|----------|------------|
| Phase 0: Remove brandColor & BrandingForm | 20 min | Low |
| Phase 1: Folder Reorganization | 30 min | Medium |
| Phase 2: Barrel Exports | 15 min | Low |
| Phase 3: Constants File | 20 min | Low-Medium |
| Phase 4: Public API Fix | 15 min | Low |
| Phase 5: Error Handling | 15 min | Low |
| Phase 6: Clean Up Unused Components | 10 min | Low |
| Phase 7: Documentation | 20 min | Low |
| Testing | 30 min | Medium |

**Total: ~2.5 hours**

---

## Questions?

If unclear about any refactoring step:
1. Check the relevant standard in `standards/`
2. Review the compliance report for context
3. Look at the events feature once it's refactored as a reference

**Note:** This plan assumes events feature will follow similar refactoring. Use companies as the reference implementation.
