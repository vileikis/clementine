# API Contracts: Sidebar Navigation System

**Feature**: 013-sidebar-nav
**Date**: 2025-12-02

## Overview

This feature does **not** introduce new API endpoints. The sidebar is a client-side navigation component that:

1. **Reads** existing company data via `getCompanyBySlugAction()` (from 012-company-context)
2. **Persists** UI state to browser localStorage (no backend)
3. **Navigates** using Next.js App Router client-side navigation

## Existing Actions Used

### getCompanyBySlugAction

**Source**: `web/src/features/companies/actions/companies.actions.ts`

```typescript
export async function getCompanyBySlugAction(slug: string): Promise<{
  success: boolean;
  company?: Company;
  error?: string;
}>
```

**Usage in Sidebar**:
- Called by workspace layouts to fetch company context
- Used to validate stored `lastCompanySlug` is still valid
- Already implemented in 012-company-context

## Client-Side Storage API

### localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `clementine-sidebar-collapsed` | `"true"` \| `"false"` | Sidebar collapse state |
| `clementine-last-company-slug` | `string` | Last accessed company slug |

These are accessed via utility functions in `lib/storage/sidebar-storage.ts` (see data-model.md).

## No New Contracts Required

This feature is purely a frontend navigation system. All data access uses existing server actions from the Companies feature module.
