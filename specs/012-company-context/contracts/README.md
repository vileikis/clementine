# API Contracts: Company Context Architecture

**Feature**: 012-company-context
**Date**: 2025-12-01

## Overview

This feature does not introduce external API endpoints. All functionality is implemented via:

1. **Server Actions** - Next.js Server Actions for data mutations
2. **Route Parameters** - URL-based company lookup via slug

## Server Actions

### getCompanyBySlugAction

**Purpose**: Retrieve a company by its URL-friendly slug (for route resolution)

**Signature**:
```typescript
export async function getCompanyBySlugAction(
  slug: string
): Promise<ActionResult<Company>>
```

**Input**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | `string` | Yes | URL-friendly company identifier |

**Output**:
```typescript
// Success
{ success: true, data: Company }

// Error
{ success: false, error: string }
```

**Error Cases**:
- `"Not authenticated"` - Admin auth failed
- `"Company not found"` - No active company with slug
- Validation errors from Zod

### createCompanyAction (Extended)

**Changed Behavior**: Now accepts optional `slug` field. If not provided, slug is auto-generated from `name`.

**Input Addition**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | `string` | No | Custom slug (auto-generated if not provided) |

**New Error Cases**:
- `"Slug already in use"` - Duplicate slug

### updateCompanyAction (Extended)

**Changed Behavior**: Now accepts `slug` field for updates.

**Input Addition**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | `string` | No | New slug value |

**New Error Cases**:
- `"Slug already in use"` - Duplicate slug (excluding current company)

## Route Parameters

### Company Context Routes

All routes under `(workspace)/(company)/[companySlug]/` receive the company slug as a route parameter.

**Parameter**:
| Name | Type | Description |
|------|------|-------------|
| `companySlug` | `string` | URL-friendly company identifier |

**Resolution**:
- Layout calls `getCompanyBySlugAction(companySlug)`
- Returns `notFound()` if company doesn't exist
- Passes company data to child routes via context or props

### Project/Event/Experience Context Routes

Routes with nested entity IDs:

| Route Pattern | Parameters |
|---------------|------------|
| `(project)/[companySlug]/[projectId]/` | companySlug, projectId |
| `(event)/[companySlug]/[projectId]/[eventId]/` | companySlug, projectId, eventId |
| `(experience)/[companySlug]/exps/[expId]/` | companySlug, expId |

**Note**: projectId, eventId, expId continue to use Firestore document IDs.

## No External APIs

This feature does not expose REST or GraphQL endpoints. All interactions are:
- Server-side: Server Actions called from Server Components
- Client-side: Server Actions called via form submissions or useTransition
