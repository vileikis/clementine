# Quickstart: Experience Loading Refactor — Scalable Connect & Fetch

**Branch**: `071-exp-connect-scale` | **Date**: 2026-02-14

## Prerequisites

- Node.js 20+ and pnpm 10.18.1+
- Firebase project configured (`.env` in `apps/clementine-app/`)
- Working dev server: `pnpm app:dev`

## Development Setup

```bash
# From monorepo root
git checkout 071-exp-connect-scale
pnpm install
pnpm app:dev
```

## Files to Change

### 1. New: `usePaginatedExperiencesForSlot.ts`

**Path**: `apps/clementine-app/src/domains/project-config/experiences/hooks/usePaginatedExperiencesForSlot.ts`

Create a new hook using TanStack Query's `useInfiniteQuery` with Firestore cursor-based pagination. See `contracts/hooks.md` for full signature and behavior.

**Key imports:**
```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { collection, getDocs, limit, orderBy, query, startAfter, where } from 'firebase/firestore'
import type { DocumentSnapshot } from 'firebase/firestore'
import { SLOT_PROFILES } from '../constants'
import type { SlotType } from '../constants'
import type { Experience } from '@/domains/experience/shared/schemas'
import { experienceSchema } from '@/domains/experience/shared/schemas'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'
```

### 2. Modify: `WelcomeEditorPage.tsx`

**Path**: `apps/clementine-app/src/domains/project-config/welcome/containers/WelcomeEditorPage.tsx`

**Changes:**
- Remove `useExperiencesForSlot` import and usage (lines 13, 26–28, 60–63)
- Add `useExperiencesByIds` import from `@/domains/experience/shared`
- Add `mainExperienceIds` useMemo extracting IDs from `mainExperiences`
- Call `useExperiencesByIds(workspace?.id ?? '', mainExperienceIds)`
- Update `mainExperienceDetails` useMemo to use fetched experiences instead of `availableExperiences`

### 3. Modify: `ConnectExperienceDrawer.tsx`

**Path**: `apps/clementine-app/src/domains/project-config/experiences/components/ConnectExperienceDrawer.tsx`

**Changes:**
- Replace `useExperiencesForSlot` with `usePaginatedExperiencesForSlot`
- Add `pageSize` prop (optional, default 20)
- Add "Load More" button at bottom of experience list
- Show loading indicator during `isFetchingNextPage`
- Hide button when `!hasNextPage`

### 4. Modify: `index.ts` (barrel exports)

**Path**: `apps/clementine-app/src/domains/project-config/experiences/index.ts`

**Changes:**
- Add export for new hook: `export * from './hooks/usePaginatedExperiencesForSlot'`

### 5. Cleanup: Remove `useExperiencesForSlot` (optional)

**Path**: `apps/clementine-app/src/domains/project-config/experiences/hooks/useExperiencesForSlot.ts`

After both consumers are migrated, this hook will have zero consumers. Delete the file and remove its barrel export.

## Verification

```bash
# Type check
pnpm app:type-check

# Lint + format
pnpm app:check

# Dev server (manual verification)
pnpm app:dev
```

### Manual Test Plan

1. **Welcome Editor**: Open a project with connected experiences → verify preview shows correct experience cards
2. **Welcome Editor (empty)**: Open a project with no experiences → verify empty state renders
3. **Connect Drawer**: Open drawer → verify first page loads, "Load More" appears if applicable
4. **Load More**: Click "Load More" → verify next page appends, button hides when exhausted
5. **Search**: Type search query → verify filtering works across loaded pages
6. **Selection**: Select experience from drawer → verify it connects to the project
7. **Assigned badge**: Verify already-assigned experiences show "in use" indicator

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Reuse `useExperiencesByIds` for WelcomeEditorPage | Already exists, proven in GuestLayout, batch query by IDs |
| New `usePaginatedExperiencesForSlot` with `useInfiniteQuery` | First pagination in codebase, TanStack Query handles page accumulation |
| No real-time on paginated drawer | Transient UI, complexity not justified |
| Default page size 20 | Reasonable for browsing, configurable via code |
| Client-side search only | Matches existing behavior, server-side search out of scope |
