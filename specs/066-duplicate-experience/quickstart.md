# Quickstart: Duplicate Experience

**Feature**: 066-duplicate-experience
**Date**: 2026-02-09

## What This Feature Does

Adds a "Duplicate" action to the experience list context menu. One click creates a copy of the experience with all configuration preserved but in an unpublished state.

## Files to Create

| File | Purpose |
| ---- | ------- |
| `domains/experience/shared/hooks/useDuplicateExperience.ts` | Mutation hook — reads source, deep-copies config, writes new document |
| `domains/experience/shared/lib/generate-duplicate-name.ts` | Pure function — appends "(Copy)" suffix with truncation logic |
| `domains/experience/shared/schemas/experience.input.schemas.ts` | Extend — add `duplicateExperienceInputSchema` |

## Files to Modify

| File | Change |
| ---- | ------ |
| `domains/experience/shared/hooks/index.ts` | Add export for `useDuplicateExperience` |
| `domains/experience/library/containers/ExperiencesPage.tsx` | Add duplicate mutation, wire "Duplicate" action into context menu, add toast handling |
| `domains/experience/library/components/ExperienceListItem.tsx` | Refactor to accept `sections` prop for `ContextDropdownMenu` instead of `renderMenuItems` render prop |

## Implementation Order

1. **`generate-duplicate-name.ts`** — Pure function, no dependencies, unit-testable
2. **`duplicateExperienceInputSchema`** — Add to existing input schemas file
3. **`useDuplicateExperience.ts`** — Mutation hook using the naming function and schema
4. **`ExperienceListItem.tsx`** — Refactor context menu to use `ContextDropdownMenu` with sections
5. **`ExperiencesPage.tsx`** — Wire up the mutation and new menu structure

## Key Patterns to Follow

- **Mutation hook**: Same pattern as `useCreateExperience` — `runTransaction`, `serverTimestamp`, cache invalidation via `experienceKeys.lists()`
- **Context menu**: Use `ContextDropdownMenu` with `sections` prop (see `OptionListItem.tsx` for reference)
- **Toast**: Use `sonner` — `toast.success()` / `toast.error()`
- **Loading state**: `mutation.isPending` → `disabled` on menu action
- **Error reporting**: `Sentry.captureException` in `onError` callback
- **Deep copy**: `structuredClone()` for draft/published configs

## Validation Command

```bash
cd apps/clementine-app && pnpm check && pnpm type-check
```
