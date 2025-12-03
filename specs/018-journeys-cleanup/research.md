# Research: Journeys Module Cleanup

**Feature**: 018-journeys-cleanup
**Date**: 2025-12-03

## Overview

This research documents the analysis performed to understand the scope and impact of deleting the `features/journeys/` module.

## Research Questions

### Q1: What files depend on the journeys module?

**Finding**: Two categories of imports exist:

1. **Sessions module** (must be updated):
   - `web/src/features/sessions/actions/sessions.actions.ts`
     - Imports: `getJourney`, `listStepsLegacy` from journeys repositories
     - Imports: `Journey` type
     - Uses in: `getJourneyForGuestAction` (deprecated)

2. **Guest module** (intentionally left broken):
   - `web/src/features/guest/hooks/useJourneyRuntime.ts`
     - Imports: `Journey` type
   - `web/src/features/guest/components/JourneyGuestContainer.tsx`
     - Uses journey-related components

**Decision**: Update sessions module to remove journey imports. Leave guest module broken (per Phase 3 PRD Section 7).

---

### Q2: Which session actions depend on journeys?

**Finding**: Analysis of `sessions.actions.ts`:

| Action | Uses Journey Imports | Recommendation |
|--------|---------------------|----------------|
| `startJourneySessionAction` | Yes (calls `startJourneySession` from local repo) | Keep - guest module uses it |
| `getJourneyForGuestAction` | Yes (calls `getJourney`, `listStepsLegacy`) | Remove - deprecated, uses journey imports |

**Decision**:
- Remove `getJourneyForGuestAction` entirely (it imports from journeys module)
- Keep `startJourneySessionAction` (uses local `startJourneySession` from sessions repository)

---

### Q3: What about the sessions repository?

**Finding**: `sessions.repository.ts` has:
- `startJourneySession` - marked deprecated, but still functional
- Does NOT import from journeys module (self-contained)

**Decision**: Keep `startJourneySession` in sessions repository for backwards compatibility.

---

### Q4: What test files need updates?

**Finding**:
- `sessions.repository.test.ts` has tests for `startJourneySession`
- Tests don't import from journeys module

**Decision**: Keep existing tests - they test the local repository function.

---

### Q5: What legacy specs should be deleted?

**Finding**: Per Phase 3 PRD Section 7:
- `specs/005-journey-init/` - journey initialization spec
- `specs/008-preview-runtime/` - preview runtime (journey-based)

Both are obsolete and reference deprecated journey patterns.

**Decision**: Delete both spec directories.

---

## Summary of Decisions

| Item | Decision | Rationale |
|------|----------|-----------|
| `features/journeys/` directory | Delete entirely | Deprecated, replaced by experiences |
| `specs/005-journey-init/` | Delete | Obsolete journey spec |
| `specs/008-preview-runtime/` | Delete | Obsolete preview spec |
| `getJourneyForGuestAction` | Remove | Imports from journeys module |
| `startJourneySessionAction` | Keep | Uses local repo, guest module depends on it |
| `startJourneySession` (repo) | Keep | Self-contained, no journey imports |
| `Journey` type in sessions | Remove import | No longer needed after removing `getJourneyForGuestAction` |
| Guest module journey imports | Leave broken | Phase 7 will rewrite entirely |

## Alternatives Considered

### Alternative 1: Keep getJourneyForGuestAction with inline types
**Rejected**: The function calls `getJourney` and `listStepsLegacy` which would need to be duplicated. Not worth the effort since guest module will be rewritten in Phase 7.

### Alternative 2: Move journeys to legacy-features/
**Rejected**: Creates technical debt and confusion. Better to delete entirely and have clear broken state for Phase 7.

### Alternative 3: Fix guest module now
**Rejected**: Per Phase 3 PRD, guest module will be completely rewritten in Phase 7 Experience Engine. Fixing it now would be wasted effort.
