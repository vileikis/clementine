# Research: Remove Scenes Dependency

**Feature**: 001-remove-scenes
**Date**: 2025-11-19
**Status**: Complete

## Overview

This research document captures findings and decisions for safely removing the legacy Scenes architecture from the Events domain. Since this is a code removal/refactoring feature rather than new functionality, research focuses on understanding scene usage patterns, identifying dependencies, and planning a safe removal strategy.

## Research Areas

### 1. Scene Architecture Analysis

**Question**: What role do scenes play in the current architecture, and what depends on them?

**Findings**:

Based on codebase analysis, scenes were an early POC structure with the following characteristics:

- **Location**: Stored in Firestore at `/events/{eventId}/scenes/{sceneId}`
- **Fields**: `prompt` (string, max 600 chars), `referenceImagePath` (string), `createdAt`, `updatedAt`
- **Purpose**: Originally designed to hold AI prompt configuration and reference images
- **Current Status**: Deprecated - AI configuration has been moved to the Experience schema

**Files containing scene references** (24 total):
1. `web/src/features/events/repositories/scenes.ts` - CRUD operations
2. `web/src/features/events/repositories/scenes.test.ts` - Repository tests
3. `web/src/features/events/actions/scenes.ts` - Server actions (4 functions)
4. `web/src/features/events/lib/schemas.ts` - sceneSchema definition
5. `web/src/features/events/types/event.types.ts` - Scene type, currentSceneId in Event type
6. `web/src/features/events/lib/validation.ts` - Scene validation logic
7. `web/src/features/events/actions/events.ts` - May reference currentSceneId
8. `web/src/features/events/actions/events.test.ts` - Tests with scene setup
9. `web/src/features/events/repositories/events.ts` - May query scenes
10. `web/src/features/events/repositories/events.test.ts` - Tests with scenes
11. `web/src/features/events/index.ts` - Exports scene types/schemas
12. `web/src/app/(studio)/events/[eventId]/scene/page.tsx` - Admin UI for scene editing
13. `web/src/features/guest/components/GuestFlowContainer.tsx` - May reference currentSceneId
14. `web/src/features/sessions/lib/repository.ts` - May reference scenes
15. `web/src/features/sessions/lib/repository.test.ts` - Tests with scenes
16. `web/src/features/sessions/lib/actions.ts` - May reference scenes
17. `web/src/features/sessions/lib/validation.ts` - May validate scene data
18. `web/src/features/sessions/types/session.types.ts` - May have scene references
19. `web/src/lib/storage/upload.ts` - May have scene-specific upload logic (uploadReferenceImage)
20. `web/src/lib/types/firestore.ts` - Scene type exports
21. `web/src/features/experiences/components/photo/PromptEditor.tsx` - May reference scenes (comments/docs)
22. `web/src/features/experiences/components/photo/RefImageUploader.tsx` - May reference scenes (comments/docs)
23. `web/src/features/experiences/components/photo/ModeSelector.tsx` - May reference scenes
24. `web/src/lib/ai/providers/google-ai.ts` - May reference scenes (likely comments only)

**Experience Schema Status**: The Experience schema (`web/src/features/experiences/lib/schemas.ts`) **already contains** all AI fields:
- `aiEnabled: z.boolean()`
- `aiModel: z.string().optional()`
- `aiPrompt: z.string().max(600).optional()`
- `aiReferenceImagePaths: z.array(z.string()).optional()`
- `aiAspectRatio: aspectRatioSchema.default("1:1")`

**Decision**: Scenes are fully redundant. The Experience collection is the source of truth for AI configuration.

---

### 2. Safe Removal Strategy

**Question**: What is the safest order for removing scene-related code to avoid breaking changes?

**Findings**:

Removal must follow a dependency hierarchy to avoid TypeScript compilation errors:

**Phase 1: Remove UI/Actions (highest level)**
- Delete `web/src/app/(studio)/events/[eventId]/scene/page.tsx` (admin page)
- Delete `web/src/features/events/actions/scenes.ts` (server actions)
- Update `web/src/features/guest/components/GuestFlowContainer.tsx` (remove scene navigation)

**Phase 2: Remove Data Layer (middle level)**
- Delete `web/src/features/events/repositories/scenes.ts` and tests
- Update `web/src/features/events/repositories/events.ts` (remove scene imports)
- Update `web/src/features/events/actions/events.ts` (remove currentSceneId handling)

**Phase 3: Remove Types/Schemas (lowest level)**
- Update `web/src/features/events/lib/schemas.ts` (remove sceneSchema, currentSceneId from eventSchema)
- Update `web/src/features/events/types/event.types.ts` (remove Scene type, currentSceneId from Event)
- Update `web/src/features/events/index.ts` (remove scene exports)
- Update `web/src/lib/types/firestore.ts` (remove scene type references)

**Phase 4: Update Firestore Rules**
- Add deny rules for `/events/{eventId}/scenes` paths in `firestore.rules`

**Phase 5: Clean up references**
- Update remaining files (sessions, experiences, storage, AI providers) to remove scene references

**Decision**: Follow the top-down removal order (UI → Actions → Data → Types → Rules) to minimize intermediate broken states.

---

### 3. Backward Compatibility

**Question**: How do we handle existing events that may still have `currentSceneId` in Firestore?

**Findings**:

The spec states "no data migration required" and the constraint is "must maintain backward compatibility with existing events."

**Strategy**:
1. **Event Schema**: Remove `currentSceneId` from the Zod schema's required fields
2. **Application Logic**: Ignore `currentSceneId` if present in legacy data (don't reference it)
3. **Firestore Rules**: Deny new writes to scenes paths, but don't block existing data

**Decision**: Make schema changes that treat `currentSceneId` as an optional legacy field that is never read or written. The field can remain in old documents but will never be used.

---

### 4. Testing Strategy

**Question**: What testing is needed to verify safe removal?

**Findings**:

Per Constitution Principle IV (Minimal Testing Strategy), focus on critical paths:

**Critical Test Areas**:
1. **Build Verification**: `pnpm type-check` and `pnpm build` must pass with zero errors
2. **Lint Verification**: `pnpm lint` must pass (check for unused imports)
3. **Unit Tests**: Update/remove scene-related tests, ensure remaining tests pass
4. **Manual Testing** (if time permits):
   - Create new event → verify no scene references in UI or console
   - Load existing event → verify no scene-related errors
   - Complete guest flow → verify navigation works without scenes

**Decision**: Automated validation loop (lint, type-check, build) is the primary acceptance criteria. Manual testing is optional but recommended for critical flows.

---

### 5. Reference Image Storage

**Question**: How do reference images currently work, and do they need migration?

**Findings**:

From `web/src/features/events/actions/scenes.ts`:
- Function `uploadReferenceImageAction` uploads to storage path via `uploadReferenceImage(eventId, file)`
- Result stored in `referenceImagePath` field on scene document
- Retrieved via `getImageUrlAction(path)` which calls `getPublicUrl(path)`

From Experience schema:
- `aiReferenceImagePaths: z.array(z.string()).optional()` - already exists
- Stores array of paths/URLs (scene only stored single path)

**Migration Status**: The spec states "reference images previously associated with scenes have already been migrated to experience-level storage paths, or the migration is not required."

**Decision**: No reference image migration needed. The `uploadReferenceImage` function in storage utilities is experience-agnostic (takes eventId, not sceneId). Experience components already handle reference image uploads. Scene-specific upload actions can be removed.

---

### 6. Firestore Security Rules

**Question**: How do we prevent future writes to the scenes subcollection?

**Findings**:

Current Firestore rules structure (assumed from Firebase best practices):
```
match /events/{eventId} {
  // Event rules
  match /scenes/{sceneId} {
    // Scene rules (TO BE REMOVED/DENIED)
  }
  match /experiences/{experienceId} {
    // Experience rules (KEEP)
  }
}
```

**Strategy**:
```
match /events/{eventId} {
  // Event rules

  // Explicitly deny all access to legacy scenes subcollection
  match /scenes/{sceneId} {
    allow read, write: if false;
  }

  match /experiences/{experienceId} {
    // Experience rules (KEEP)
  }
}
```

**Decision**: Add explicit deny rules for `/events/{eventId}/scenes/{sceneId}` to prevent any future reads or writes. This enforces the deprecation at the security layer.

---

## Decisions Summary

### 1. Removal Order
**Decision**: Top-down removal (UI → Actions → Data → Types → Rules)
**Rationale**: Minimizes intermediate broken states, allows TypeScript compiler to guide the process

### 2. Backward Compatibility
**Decision**: Ignore legacy `currentSceneId` field, don't migrate or validate it
**Rationale**: No data migration required per spec, field becomes harmless dead data

### 3. Testing Approach
**Decision**: Automated validation loop (lint, type-check, build) as primary acceptance criteria
**Rationale**: Aligns with Constitution Principle IV (Minimal Testing Strategy), sufficient for code removal feature

### 4. Reference Images
**Decision**: No migration needed, remove scene-specific upload actions
**Rationale**: Experience schema already supports reference images, storage utilities are experience-agnostic

### 5. Firestore Rules
**Decision**: Explicit deny for `/events/{eventId}/scenes/{sceneId}` paths
**Rationale**: Prevents accidental future writes, enforces deprecation at security layer

### 6. Guest Flow Navigation
**Decision**: Remove all `currentSceneId` checks from GuestFlowContainer
**Rationale**: Guest navigation should be based entirely on experiences collection, not scenes

---

## Alternatives Considered

### Alternative 1: Keep Scene Schema as Deprecated
**Rejected Because**: Keeping deprecated code increases maintenance burden and confusion. Clean removal is simpler and clearer.

### Alternative 2: Gradual Deprecation with Warnings
**Rejected Because**: Scenes are already unused (POC status), no active users depend on them. Immediate removal is safe.

### Alternative 3: Migrate Existing Scene Data to Experiences
**Rejected Because**: Spec explicitly states "no data migration required." Legacy data can be safely ignored.

---

## Technical Standards Referenced

- `standards/global/coding-style.md` - Remove dead code immediately, no commented-out code
- `standards/global/conventions.md` - Git workflow for feature branches
- `standards/backend/firebase.md` - Security rules (deny writes, allow reads pattern)
- `standards/testing/test-writing.md` - Minimal testing philosophy, focus on critical paths

---

## Open Questions

**None** - All research areas resolved with clear decisions.

---

## Next Steps

Proceed to Phase 1: Generate data-model.md documenting the simplified Event and Experience entities after scene removal.
