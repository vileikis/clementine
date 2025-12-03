# Quickstart: Journeys Module Cleanup

**Feature**: 018-journeys-cleanup
**Date**: 2025-12-03

## Overview

This guide provides step-by-step instructions for cleaning up the deprecated journeys module after Phase 3 Steps Consolidation.

## Prerequisites

- Phase 3 (Steps Consolidation) merged to main
- Branch `018-journeys-cleanup` checked out
- All tests passing before starting

## Implementation Steps

### Step 1: Update Sessions Actions

**File**: `web/src/features/sessions/actions/sessions.actions.ts`

1. Remove journey imports:
   ```diff
   - import { getJourney, listStepsLegacy } from "@/features/journeys/repositories";
   - import type { Journey } from "@/features/journeys";
   ```

2. Remove the `getJourneyForGuestAction` function entirely (lines 373-387)

3. Keep `startJourneySessionAction` - it uses local repository function, not journey imports

### Step 2: Verify Sessions Repository

**File**: `web/src/features/sessions/repositories/sessions.repository.ts`

- Verify `startJourneySession` does NOT import from journeys (it's self-contained)
- No changes needed - function uses local types only

### Step 3: Delete Journeys Module

```bash
rm -rf web/src/features/journeys/
```

This removes ~30 files including:
- `actions/` - journey and step actions
- `components/` - JourneyList, JourneyCard, editor components
- `hooks/` - useStepMutations, useSelectedStep, etc.
- `repositories/` - journeys and steps-legacy repositories
- `schemas/` - journey schemas
- `types/` - journey types
- `constants.ts`
- `index.ts`

### Step 4: Delete Legacy Specs

```bash
rm -rf specs/005-journey-init/
rm -rf specs/008-preview-runtime/
```

### Step 5: Verification

Run the verification commands:

```bash
# Check no journey imports remain (except in guest module)
grep -r "features/journeys" web/src/ --include="*.ts" --include="*.tsx" | grep -v "features/guest"
# Expected: No results

# Type check
pnpm type-check
# Expected: Pass (guest module may have errors - expected)

# Lint
pnpm lint
# Expected: Pass

# Build
pnpm build
# Expected: Pass (or guest module errors - expected)
```

### Step 6: Handle Expected Errors

The guest module (`features/guest/`) will have broken imports. This is intentional per Phase 3 PRD Section 7.

If build fails only due to guest module:
- Verify errors are only in `features/guest/`
- These will be fixed in Phase 7 Experience Engine
- Consider adding `// @ts-expect-error` comments if needed for build to pass

## Files Changed Summary

| Action | Path | Description |
|--------|------|-------------|
| MODIFY | `sessions/actions/sessions.actions.ts` | Remove journey imports and `getJourneyForGuestAction` |
| DELETE | `features/journeys/` | Entire module (~30 files) |
| DELETE | `specs/005-journey-init/` | Legacy spec |
| DELETE | `specs/008-preview-runtime/` | Legacy spec |

## Success Criteria

1. ✅ `features/journeys/` directory does not exist
2. ✅ `specs/005-journey-init/` directory does not exist
3. ✅ `specs/008-preview-runtime/` directory does not exist
4. ✅ `grep -r "features/journeys" web/src/ | grep -v "features/guest"` returns empty
5. ✅ `pnpm type-check` passes (or only guest module errors)
6. ✅ `pnpm lint` passes
7. ✅ `pnpm build` passes (or only guest module errors)
