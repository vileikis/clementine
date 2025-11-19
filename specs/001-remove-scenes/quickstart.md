# Quickstart: Remove Scenes Dependency

**Feature**: 001-remove-scenes
**Date**: 2025-11-19
**For**: Developers implementing the scene removal

## Overview

This quickstart guide provides a step-by-step implementation roadmap for removing the legacy Scenes architecture. Follow the phases in order to minimize TypeScript compilation errors and ensure a smooth transition.

## Prerequisites

- ✓ Read [spec.md](./spec.md) - Feature requirements and acceptance criteria
- ✓ Read [research.md](./research.md) - Removal strategy and decisions
- ✓ Read [data-model.md](./data-model.md) - Schema changes
- ✓ Feature branch `001-remove-scenes` checked out
- ✓ Clean working directory (commit or stash changes)

## Implementation Phases

### Phase 1: Remove UI and Admin Pages

**Goal**: Delete scene-related admin UI that users interact with

**Files to Remove**:
1. `web/src/app/(studio)/events/[eventId]/scene/page.tsx` - Entire directory

**Files to Update**:
1. Check App Router for any routes referencing `/scene`
2. Update navigation/sidebar if scene page was linked

**Validation**:
```bash
pnpm type-check  # May show errors (expected) - proceed to next phase
pnpm dev         # Start dev server, navigate to event builder, verify no /scene routes
```

**Expected State**: Admin UI no longer shows scene pages, but TypeScript errors exist from missing scene actions/types.

---

### Phase 2: Remove Scene Actions (Server Actions)

**Goal**: Delete server-side scene mutation logic

**Files to Remove**:
1. `web/src/features/events/actions/scenes.ts` - Entire file with 4 server actions:
   - `updateSceneAction`
   - `uploadReferenceImageAction`
   - `getImageUrlAction`
   - `removeReferenceImageAction`

**Note**: `getImageUrlAction` and reference image upload logic may be used by experiences. If so:
- Move `getImageUrlAction` to a shared utility (e.g., `web/src/lib/storage/actions.ts`)
- Reference image upload already works for experiences via existing storage utilities

**Validation**:
```bash
pnpm type-check  # Still errors (expected) - scene types/schemas still exist
```

---

### Phase 3: Remove Scene Repositories and Data Layer

**Goal**: Delete scene data access logic

**Files to Remove**:
1. `web/src/features/events/repositories/scenes.ts` - Scene repository (getScene, updateScene)
2. `web/src/features/events/repositories/scenes.test.ts` - Repository tests

**Files to Update**:
1. `web/src/features/events/repositories/events.ts` - Remove scene imports if present
2. `web/src/features/events/repositories/events.test.ts` - Remove scene-related test cases

**Validation**:
```bash
pnpm type-check  # Still errors - scene types still referenced
pnpm test -- events/repositories  # Run repository tests
```

---

### Phase 4: Remove Scene Types and Schemas

**Goal**: Delete scene type definitions and Zod schemas (this will fix most TypeScript errors)

**Files to Update**:

1. **`web/src/features/events/lib/schemas.ts`**:
   - Remove `sceneSchema` export
   - Remove `currentSceneId: z.string()` from `eventSchema`

2. **`web/src/features/events/types/event.types.ts`**:
   - Remove `Scene` type definition
   - Remove `currentSceneId: string` from `Event` type

3. **`web/src/features/events/index.ts`**:
   - Remove scene type/schema exports

4. **`web/src/lib/types/firestore.ts`**:
   - Remove scene type references if present

**Example Schema Update**:
```typescript
// BEFORE
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  currentSceneId: z.string(), // REMOVE THIS LINE
  // ... other fields
});

// AFTER
export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  // currentSceneId removed
  // ... other fields
});
```

**Validation**:
```bash
pnpm type-check  # Should have significantly fewer errors
pnpm lint        # Check for unused imports
```

---

### Phase 5: Update Event Actions and Remove currentSceneId Usage

**Goal**: Remove `currentSceneId` from event creation/update logic

**Files to Update**:

1. **`web/src/features/events/actions/events.ts`**:
   - Remove `currentSceneId` from event creation data
   - Remove `currentSceneId` from event update logic
   - Search for any scene references

2. **`web/src/features/events/actions/events.test.ts`**:
   - Remove test cases that verify `currentSceneId` behavior
   - Update test fixtures to not include `currentSceneId`

**Example Update**:
```typescript
// BEFORE
export async function createEventAction(data: CreateEventInput) {
  const event = await createEvent({
    ...data,
    currentSceneId: defaultSceneId, // REMOVE THIS
  });
  return { success: true, event };
}

// AFTER
export async function createEventAction(data: CreateEventInput) {
  const event = await createEvent({
    ...data,
    // currentSceneId removed
  });
  return { success: true, event };
}
```

**Validation**:
```bash
pnpm test -- events/actions  # Run event action tests
```

---

### Phase 6: Remove Scene References from Guest Flow

**Goal**: Remove scene-based navigation logic from guest experience

**Files to Update**:

1. **`web/src/features/guest/components/GuestFlowContainer.tsx`**:
   - Remove any state/props related to `currentSceneId`
   - Remove scene-based navigation logic
   - Ensure navigation relies solely on experiences collection

**What to Look For**:
- Props like `sceneId` or `currentSceneId`
- State like `const [sceneId, setSceneId] = useState(...)`
- Conditional rendering based on scene state
- Navigation logic that checks scene existence

**Validation**:
```bash
pnpm type-check  # Should have minimal to no errors
pnpm dev         # Test guest flow: /e/{eventId} → verify no scene errors in console
```

---

### Phase 7: Clean Up Remaining References

**Goal**: Remove scene mentions in sessions, experiences, storage, and AI utilities

**Files to Review and Update**:

1. **Sessions**:
   - `web/src/features/sessions/lib/repository.ts`
   - `web/src/features/sessions/lib/repository.test.ts`
   - `web/src/features/sessions/lib/actions.ts`
   - `web/src/features/sessions/lib/validation.ts`
   - `web/src/features/sessions/types/session.types.ts`
   - Search for `scene` (case-insensitive), remove references

2. **Experiences** (likely just comments/docs):
   - `web/src/features/experiences/components/photo/PromptEditor.tsx`
   - `web/src/features/experiences/components/photo/RefImageUploader.tsx`
   - `web/src/features/experiences/components/photo/ModeSelector.tsx`

3. **Storage**:
   - `web/src/lib/storage/upload.ts`
   - Check if `uploadReferenceImage` function is scene-specific or experience-agnostic
   - If experience-agnostic, keep it; if scene-specific, refactor for experiences

4. **AI Providers** (likely just comments):
   - `web/src/lib/ai/providers/google-ai.ts`

**Validation**:
```bash
# Search for remaining scene references
grep -ri "scene" web/src --include="*.ts" --include="*.tsx"

pnpm lint        # Check for unused imports
pnpm type-check  # Should pass with zero errors
pnpm test        # All tests should pass
```

---

### Phase 8: Update Firestore Security Rules

**Goal**: Deny all access to legacy scenes subcollection

**File to Update**:
- `firestore.rules` (at repository root)

**Add Explicit Deny Rule**:
```javascript
match /events/{eventId} {
  allow read: if true;
  allow write: if isAdmin();

  // Explicitly deny all access to legacy scenes subcollection
  match /scenes/{sceneId} {
    allow read, write: if false;
  }

  match /experiences/{experienceId} {
    allow read: if true;
    allow write: if isAdmin();
  }

  // ... other subcollections
}
```

**Validation**:
```bash
# Deploy rules to test environment (if available)
firebase deploy --only firestore:rules --project test

# Or validate locally
firebase emulators:start --only firestore
```

---

### Phase 9: Final Validation Loop

**Goal**: Ensure codebase is clean, builds successfully, and passes all checks

**Run Complete Validation**:
```bash
# 1. Lint check
pnpm lint
# Expected: No errors, no unused imports

# 2. Type check
pnpm type-check
# Expected: Zero TypeScript errors

# 3. Test suite
pnpm test
# Expected: All tests pass

# 4. Production build
pnpm build
# Expected: Build succeeds with no errors

# 5. Search for remaining scene references (excluding docs/comments)
grep -ri "scene" web/src --include="*.ts" --include="*.tsx" | grep -v "//"
# Expected: Zero matches (or only matches in comments/historical docs)
```

**Manual Testing** (optional but recommended):
1. Start dev server: `pnpm dev`
2. Navigate to event builder: `/events/{eventId}`
3. Create new event → verify no scene fields in UI or console errors
4. Load existing event → verify no scene-related errors
5. Test guest flow: `/e/{eventId}` → complete full experience flow
6. Check browser console → verify no scene-related errors or warnings

---

## Troubleshooting

### TypeScript Error: "Property 'currentSceneId' does not exist on type 'Event'"

**Cause**: Code still references `event.currentSceneId` but the type was removed.

**Fix**: Search for `currentSceneId` in the file and remove the reference:
```bash
grep -n "currentSceneId" web/src/features/events/**/*.ts
```

---

### Test Failure: "Expected scene to be defined"

**Cause**: Test still expects scene data but scene fixtures were removed.

**Fix**: Update test to use experience data instead:
```typescript
// BEFORE
const scene = await getScene(eventId, sceneId);
expect(scene).toBeDefined();

// AFTER (if testing AI config)
const experience = await getExperience(eventId, experienceId);
expect(experience.aiPrompt).toBeDefined();
```

---

### Lint Error: "Import 'sceneSchema' is declared but never used"

**Cause**: Import statement for scene schema/types still exists.

**Fix**: Remove the import:
```typescript
// REMOVE THIS
import { sceneSchema, Scene } from "../lib/schemas";
```

---

### Build Error: "Module not found: '@/features/events/actions/scenes'"

**Cause**: Another file still imports the deleted `scenes.ts` actions file.

**Fix**: Find and remove the import:
```bash
grep -rn "actions/scenes" web/src
```

---

## Checklist

Use this checklist to track implementation progress:

- [ ] Phase 1: Removed scene admin UI page
- [ ] Phase 2: Removed scene server actions
- [ ] Phase 3: Removed scene repositories and tests
- [ ] Phase 4: Removed scene types and schemas from Event
- [ ] Phase 5: Updated event actions (removed currentSceneId)
- [ ] Phase 6: Updated guest flow (removed scene navigation)
- [ ] Phase 7: Cleaned up remaining references
- [ ] Phase 8: Updated Firestore rules (deny scenes access)
- [ ] Phase 9: Final validation passed (lint, type-check, test, build)

---

## Success Criteria Verification

After completing all phases, verify against spec success criteria:

- [ ] **SC-001**: Event creators can create/configure events without scene-related errors or UI elements
- [ ] **SC-002**: Guests can complete full event flows with zero scene-related code execution
- [ ] **SC-003**: Codebase search for "scene" returns zero matches (excluding comments/docs)
- [ ] **SC-004**: Application builds with zero TypeScript errors
- [ ] **SC-005**: Firestore rules validation passes with deny rules for scenes paths
- [ ] **SC-006**: All experience documents contain complete AI configuration

---

## Next Steps

After completing this implementation:

1. **Test on staging environment** (if available)
2. **Create pull request** with summary:
   - "Removes legacy Scenes architecture from Events domain"
   - List files removed/updated
   - Link to spec: `specs/001-remove-scenes/spec.md`
3. **Request code review** focusing on:
   - Complete removal (no missed references)
   - Firestore rules correctness
   - Guest flow navigation still works
4. **Merge to main** after approval
5. **Monitor production** for any scene-related errors (should be none)

---

## Additional Resources

- [Feature Spec](./spec.md) - Requirements and acceptance criteria
- [Research Doc](./research.md) - Removal strategy and decisions
- [Data Model](./data-model.md) - Schema changes reference
- [Experience Schema](../../web/src/features/experiences/lib/schemas.ts) - AI config reference
- [Firebase Standards](../../standards/backend/firebase.md) - Security rules patterns
- [Coding Style Standards](../../standards/global/coding-style.md) - Remove dead code guidance
