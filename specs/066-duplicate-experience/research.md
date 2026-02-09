# Research: Duplicate Experience

**Feature**: 066-duplicate-experience
**Date**: 2026-02-09

## R1: Deep Copy Strategy for Experience Configs

**Decision**: Use `structuredClone()` for deep-copying draft and published configs.

**Rationale**: Firestore config objects are plain serializable data (steps array, outcome object, nested primitives). `structuredClone()` is natively supported in all modern browsers and Node 17+, handles nested objects cleanly, and is more explicit than `JSON.parse(JSON.stringify())`. The codebase doesn't currently use `structuredClone()` but also doesn't use any deep-clone utility — this is the cleanest option.

**Alternatives considered**:
- `JSON.parse(JSON.stringify())` — Works but loses `undefined` values (converts to `null`), which could cause subtle bugs with Zod defaults.
- Recursive manual clone — Over-engineered for plain data objects.
- lodash `cloneDeep` — Adds a dependency for a single use case.

## R2: Firestore Document Creation Pattern

**Decision**: Follow the existing `useCreateExperience` pattern — use `runTransaction()` with `transaction.set()` on a new document reference.

**Rationale**: This is the established pattern in the codebase. The transaction ensures atomicity. We first `transaction.get()` the source document to verify it still exists, then `transaction.set()` the new document. This handles the "source deleted mid-action" edge case within a single atomic operation.

**Alternatives considered**:
- `addDoc()` without transaction — No atomicity guarantee, can't verify source exists.
- Cloud Function — Over-engineered for a client-side copy operation. All data is already available client-side, and Firestore rules handle write permissions.

## R3: Context Menu Approach

**Decision**: Refactor `ExperienceListItem` to use the existing `ContextDropdownMenu` component with a `sections` prop, replacing the current raw `DropdownMenu` + `renderMenuItems` render prop.

**Rationale**: The `ContextDropdownMenu` component already exists in `shared/components/` and supports sections with separators, destructive action styling, and 44px touch targets. It's already used in `OptionListItem.tsx` with a similar duplicate/delete pattern. This aligns with the constitution's requirement to use existing shared components. The sections pattern naturally groups Rename + Duplicate in one section and Delete in a destructive section.

**Alternatives considered**:
- Keep `renderMenuItems` render prop — Works but bypasses the shared component. Adding a third action (Duplicate) with proper separator handling makes the data-driven approach cleaner.
- Pass actions array from parent — This is what we're doing, just via the `ContextDropdownMenu` API.

## R4: Naming Logic Placement

**Decision**: Implement the "(Copy)" suffix logic as a pure utility function in `experience/shared/lib/` and call it in the mutation hook.

**Rationale**: The naming rule is simple (check if name ends with " (Copy)", append if not) and should be co-located with the mutation logic, not in the UI layer. A pure function is easily unit-testable.

**Alternatives considered**:
- Inline in the hook — Works for such simple logic but less testable.
- Shared utility in `shared/utils/` — Too generic; this is experience-domain-specific naming.

## R5: Cache Invalidation Strategy

**Decision**: Invalidate `experienceKeys.lists()` filtered by workspaceId (same pattern as `useCreateExperience`).

**Rationale**: The real-time `onSnapshot` listener in `useWorkspaceExperiences` will pick up the new document automatically. The cache invalidation is a belt-and-suspenders approach matching the existing pattern. No need to invalidate detail queries since the new experience hasn't been fetched yet.

**Alternatives considered**:
- Optimistic update — Adds complexity. The real-time listener makes the new experience appear almost instantly anyway.
- No invalidation (rely on listener) — Would work but deviates from established pattern.

## R6: Concurrency Protection

**Decision**: Use the mutation's `isPending` state to disable the Duplicate menu action while in progress.

**Rationale**: TanStack Query mutations expose `isPending` which is already the standard pattern in the codebase (used in `RenameExperienceDialog`, `DeleteExperienceDialog`). Since duplicate is a fire-and-forget action (no modal), we pass `isPending` as a `disabled` prop on the menu action.

**Alternatives considered**:
- Debounce the click handler — Less visible to user, doesn't prevent rapid clicks as cleanly.
- Track per-experience pending state — Over-engineered. A single `isPending` flag covers the case since the action is fast.
