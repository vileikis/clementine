# Data Model: Company Context Architecture

**Feature**: 012-company-context
**Date**: 2025-12-01

## Entity Changes

### Company (Extended)

**Collection**: `/companies/{companyId}`

The Company entity is extended with a new `slug` field for URL-friendly identification.

#### Updated Schema

```typescript
interface Company {
  // Existing fields
  id: string;
  name: string;
  status: "active" | "deleted";
  deletedAt: number | null;
  contactEmail: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
  createdAt: number;
  updatedAt: number;

  // NEW field
  slug: string;  // URL-friendly identifier, unique across all active companies
}
```

#### Field Specifications

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `slug` | `string` | Yes | 1-50 chars, pattern: `^[a-z0-9-]+$`, unique among active companies | URL-friendly identifier for routing |

#### Validation Rules

```typescript
// Zod schema addition
const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(50, "Slug must be 50 characters or less")
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
    "Slug must contain only lowercase letters, numbers, and hyphens (no leading/trailing hyphens)"
  );

// Extended company schema
const companySchema = z.object({
  // ... existing fields
  slug: slugSchema,
});

// Create input (slug optional - auto-generated from name if not provided)
const createCompanyInput = z.object({
  name: z.string().min(1).max(100),
  slug: slugSchema.optional(), // Auto-generated if not provided
  contactEmail: z.string().email().nullish(),
  termsUrl: z.string().url().nullish(),
  privacyUrl: z.string().url().nullish(),
});

// Update input (slug can be changed)
const updateCompanyInput = createCompanyInput.partial().extend({
  slug: slugSchema.optional(),
});
```

#### Uniqueness Constraint

- Slug MUST be unique among all companies with `status: "active"`
- Deleted companies (soft-deleted) do not participate in uniqueness check
- Uniqueness enforced via Firestore query before create/update

#### Migration Strategy

Existing companies without slugs will have slugs auto-generated:
1. On first access via new routes, generate slug from name
2. Or via data migration script (optional)

**Auto-generation Algorithm**:
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 50);             // Enforce max length
}
```

#### Indexes

**New Index Required**:
```
Collection: companies
Fields: slug (Ascending), status (Ascending)
Purpose: Efficient slug lookup for routing
```

## Repository Additions

### New Functions

```typescript
// Look up company by slug
async function getCompanyBySlug(slug: string): Promise<Company | null>

// Check slug availability (for validation)
async function isSlugAvailable(
  slug: string,
  excludeCompanyId?: string
): Promise<boolean>
```

### Modified Functions

```typescript
// createCompany - generate slug if not provided, validate uniqueness
async function createCompany(data: CreateCompanyInput): Promise<Company>

// updateCompany - validate slug uniqueness if changed
async function updateCompany(
  companyId: string,
  data: UpdateCompanyInput
): Promise<Company>
```

## Server Action Additions

```typescript
// New action for slug-based routing
export async function getCompanyBySlugAction(
  slug: string
): Promise<ActionResult<Company>>
```

## Constants Additions

```typescript
// features/companies/constants.ts
export const COMPANY_CONSTRAINTS = {
  NAME_LENGTH: { min: 1, max: 100 },
  // NEW
  SLUG_LENGTH: { min: 1, max: 50 },
  SLUG_PATTERN: /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
} as const;
```

## State Transitions

No new state transitions. Slug is a data field, not a state machine.

## Relationships

```text
Company (1) ──slug──> URL Route (/[companySlug])
Company (1) ──id────> Events (N) via event.companyId
Company (1) ──id────> Experiences (N) via experience.companyId
```

The slug provides an alternative lookup key for the Company entity, used exclusively for routing. Internal references continue to use the company `id`.
