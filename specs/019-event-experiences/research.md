# Research: Event Experiences & Extras (General Tab)

**Feature Branch**: `019-event-experiences`
**Date**: 2024-12-04
**Status**: Complete

## Overview

This document captures research findings and architectural decisions for the Event Experiences & Extras feature. All technical unknowns have been resolved by analyzing the existing codebase patterns.

---

## Decision 1: Drawer Component Selection

**Question**: Which shadcn/ui component to use for drawer-based interactions?

**Decision**: Use `Sheet` component from `@/components/ui/sheet`

**Rationale**:
- Sheet component already exists in the codebase (`web/src/components/ui/sheet.tsx`)
- Supports right-side sliding panels (default `side="right"`)
- Mobile-responsive with `w-3/4` width on mobile, `sm:max-w-sm` on larger screens
- Includes built-in close button, overlay, and animations
- Consistent with Radix UI patterns used elsewhere in the codebase

**Alternatives Considered**:
- Dialog: Rejected - center-positioned modals less suitable for multi-step content editing
- Custom drawer implementation: Rejected - unnecessary when shadcn Sheet provides needed functionality

---

## Decision 2: Firestore Array Operations

**Question**: How to perform array operations (add/update/remove) on the `experiences` array?

**Decision**: Use Firestore `arrayUnion`, `arrayRemove`, and full array replacement via `updateDoc`

**Rationale**:
- Firestore provides atomic array operations for add (`arrayUnion`) and remove (`arrayRemove`)
- For updates (modifying an existing item), read-modify-write pattern is required since Firestore doesn't support array element updates
- Existing repository pattern uses `updateDoc` for partial updates, which we'll extend

**Implementation Pattern**:
```typescript
// Add experience (atomic)
await updateDoc(eventRef, {
  experiences: arrayUnion(newExperienceLink)
});

// Remove experience (atomic)
await updateDoc(eventRef, {
  experiences: arrayRemove(existingExperienceLink)
});

// Update experience (read-modify-write)
const event = await getEvent(projectId, eventId);
const updatedExperiences = event.experiences.map(exp =>
  exp.experienceId === targetId ? { ...exp, ...updates } : exp
);
await updateDoc(eventRef, { experiences: updatedExperiences });
```

**Alternatives Considered**:
- Subcollection for event-experiences: Rejected - adds complexity, harder to query, not aligned with existing flat structure
- Batch writes for all operations: Rejected - overkill for single-document updates

---

## Decision 3: Experience Data Resolution

**Question**: How to fetch and display experience details (name, description) for attached experiences?

**Decision**: Create two new hooks - `useCompanyExperiences` for the picker and `useExperienceDetails` for resolving linked experiences

**Rationale**:
- Experience picker needs all active experiences from the company library
- Event display needs to resolve experience IDs to names/descriptions
- Real-time updates desired for consistency with existing hook patterns
- Existing `useExperiences` hook in experiences feature can serve as reference

**Implementation Pattern**:
```typescript
// For experience picker - fetch all active company experiences
function useCompanyExperiences(companyId: string) {
  // Real-time subscription to /experiences where companyId matches and status = "active"
}

// For event display - resolve attached experience IDs to details
function useExperienceDetails(experienceIds: string[]) {
  // Batch fetch by IDs, return Map<id, Experience>
}
```

**Alternatives Considered**:
- Server-side resolution in page component: Rejected - would lose real-time updates
- Denormalize experience names into EventExperienceLink: Rejected - data staleness issues, harder to keep in sync

---

## Decision 4: Server Action Structure

**Question**: How to structure server actions for experience and extras management?

**Decision**: Create 6 dedicated server actions following existing patterns

**Rationale**:
- Existing codebase uses single-purpose actions with Zod validation
- Clear separation between experience array operations and extras slot operations
- All actions use `verifyAdminSecret()` for auth and return `ActionResponse<T>` type

**Actions**:
1. `addEventExperienceAction` - Add experience to event's experiences array
2. `updateEventExperienceAction` - Update label/enabled for existing experience
3. `removeEventExperienceAction` - Remove experience from array
4. `setEventExtraAction` - Set or replace an extra slot
5. `updateEventExtraAction` - Update label/enabled/frequency for existing extra
6. `removeEventExtraAction` - Clear an extra slot to null

**Alternatives Considered**:
- Single `updateEventExperiencesAction` with operation type: Rejected - less type-safe, harder to validate
- Repository-level functions only (no server actions): Rejected - violates Firebase architecture standards (Admin SDK for writes)

---

## Decision 5: Component Organization

**Question**: How to organize the new components within the events feature module?

**Decision**: Create `components/general/` directory with `experiences/` and `extras/` subdirectories

**Rationale**:
- Follows existing patterns (e.g., `components/designer/` for theme editor)
- Clear separation between the two sections of the General tab
- Barrel exports at each level for clean imports
- Tab-based organization matches route structure

**File Structure**:
```
components/
├── index.ts
├── general/
│   ├── index.ts
│   ├── EventGeneralTab.tsx      # Main container
│   ├── experiences/             # Guest-selectable experiences
│   │   ├── index.ts
│   │   ├── ExperiencesSection.tsx
│   │   ├── AddExperienceCard.tsx
│   │   ├── EventExperienceCard.tsx
│   │   ├── ExperiencePickerDrawer.tsx
│   │   └── EventExperienceDrawer.tsx
│   └── extras/                  # Slot-based extras
│       ├── index.ts
│       ├── ExtrasSection.tsx
│       ├── ExtraSlotCard.tsx
│       └── ExtraSlotDrawer.tsx
```

**Alternatives Considered**:
- Flat structure in `components/`: Rejected - too many files, harder to navigate
- Separate `events-experiences` feature module: Rejected - over-engineering, tightly coupled to events

---

## Decision 6: Unified EventExperienceLink Type

**Question**: Should experiences and extras use different types?

**Decision**: Use unified `EventExperienceLink` type with optional `frequency` field

**Rationale**:
- Consistency in data structure enables code reuse
- Same enable/disable behavior applies to both
- Same label override feature applies to both
- `frequency` field is nullable/optional, only used for extras
- Simpler schema validation with single type

**Type Structure**:
```typescript
interface EventExperienceLink {
  experienceId: string;           // Required - FK to /experiences/{id}
  label?: string | null;          // Optional - display name override
  enabled: boolean;               // Required - toggle without removing
  frequency?: ExtraSlotFrequency | null; // Optional - only for extras
}

type ExtraSlotFrequency = "always" | "once_per_session";
```

**Alternatives Considered**:
- Separate `EventExtraSlot` type: Rejected - unnecessary duplication when fields are nearly identical
- Discriminated union: Rejected - adds complexity without clear benefit

---

## Decision 7: Duplicate Experience Prevention

**Question**: How to prevent adding the same experience twice to the experiences array?

**Decision**: Validate at server action level before adding

**Rationale**:
- Simple check: if `experiences.some(e => e.experienceId === newId)`, return error
- Client-side UX can filter already-attached experiences from picker
- Server-side validation provides security regardless of client behavior

**Implementation**:
```typescript
// In addEventExperienceAction
const existingIds = event.experiences.map(e => e.experienceId);
if (existingIds.includes(input.experienceId)) {
  return { success: false, error: { code: "DUPLICATE_EXPERIENCE", message: "..." } };
}
```

**Alternatives Considered**:
- Firestore unique constraint: Not available for array elements
- Set instead of array: Rejected - loses ordering, more complex to work with

---

## Decision 8: Route Naming Convention

**Question**: Should the route be `/general` or keep `/experiences`?

**Decision**: Change route from `/experiences` to `/general` to match tab rename

**Rationale**:
- Tab is being renamed from "Experiences" to "General"
- URL should match tab name for intuitive navigation
- Clean break from placeholder implementation
- Redirect old route to new for any bookmarks (optional enhancement)

**Route Structure**:
```
/[companySlug]/[projectId]/[eventId]/general    # New General tab
/[companySlug]/[projectId]/[eventId]/theme      # Existing Theme tab
```

**Alternatives Considered**:
- Keep `/experiences` route with "General" tab label: Rejected - confusing URL vs UI mismatch
- Use index route `/[eventId]` for General: Rejected - currently redirects to experiences, breaking change

---

## Technical Patterns Reference

### Existing Patterns to Follow

1. **Server Action Pattern** (from `events.actions.ts`):
   - Use `verifyAdminSecret()` for auth
   - Validate input with Zod schema
   - Return `ActionResponse<T>` type
   - Call `revalidatePath()` after mutations
   - Handle `ZodError` for validation errors

2. **Repository Pattern** (from `events.repository.ts`):
   - No auth checks (handled by actions)
   - Return entity or null
   - Use Admin SDK for all Firestore operations
   - Validate existence before updates

3. **Hook Pattern** (from `useEvent.ts`):
   - Use `onSnapshot` for real-time subscriptions
   - Return `{ data, loading, error }` state
   - Use `useReducer` for complex state
   - Clean up subscription on unmount

4. **Dialog/Drawer Pattern** (from `CreateEventDialog.tsx`):
   - Controlled via `open`/`onOpenChange` props
   - Form-based for keyboard support
   - State: `isSubmitting`, `error`
   - Toast feedback via `sonner`
   - Disable save when no changes or submitting

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Experience deleted while attached to event | Medium | Low | Display "Experience not found" with remove option |
| Large number of experiences in picker | Low | Medium | Paginate or virtualize list if >50 experiences |
| Race condition on array updates | Low | Low | Optimistic updates with rollback on error |
| Mobile drawer too narrow for content | Medium | Medium | Test on 320px viewport, adjust padding/layout |

---

## Conclusion

All technical unknowns have been resolved. The implementation will follow established patterns in the codebase:
- Sheet component for drawers
- Server actions with Zod validation for mutations
- Real-time hooks for data fetching
- Unified `EventExperienceLink` type for consistency
- Feature module organization with barrel exports

No new architectural patterns or dependencies are required.
