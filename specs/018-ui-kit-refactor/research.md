# Research: UI Kit Refactor

**Date**: 2026-01-08 | **Branch**: 018-ui-kit-refactor

## Overview

This is a pure refactoring task with no technical unknowns. Research confirms the current state and validates the approach.

## Findings

### 1. Current File Structure Analysis

**Components in `components/` (20 files):**
- alert-dialog.tsx
- badge.tsx
- button.tsx (DUPLICATE)
- card.tsx (DUPLICATE)
- collapsible.tsx
- dialog.tsx
- dropdown-menu.tsx (DUPLICATE)
- form.tsx
- input.tsx
- label.tsx
- popover.tsx
- scroll-area.tsx
- select.tsx
- sheet.tsx
- skeleton.tsx
- slider.tsx
- sonner.tsx
- switch.tsx
- toggle-group.tsx
- toggle.tsx

**Components in `components/ui/` (6 files):**
- breadcrumb.tsx (UNIQUE)
- button.tsx (DUPLICATE)
- card.tsx (DUPLICATE)
- dropdown-menu.tsx (DUPLICATE)
- progress.tsx (UNIQUE)
- textarea.tsx (UNIQUE)

**Decision**: Keep `components/` versions of duplicates, move unique files from `components/ui/`
**Rationale**: `components/` versions are actively used (38 imports vs 4)
**Alternatives considered**: Keep `components/ui/` versions - rejected (minority usage)

### 2. Import Pattern Analysis

**Current imports by pattern:**
- `@/ui-kit/components/<name>`: 38 files
- `@/ui-kit/components/ui/<name>`: 4 files

**Files using legacy `components/ui/` imports:**
1. `src/shared/editor-controls/components/TextareaField.tsx`
2. `src/domains/event/settings/components/OverlayFrame.tsx`
3. `src/domains/navigation/components/TopNavBreadcrumb.tsx`
4. `src/domains/project/events/components/ProjectEventItem.tsx`

**Decision**: Update all imports to `@/ui-kit/ui/<name>`
**Rationale**: Consistent, shorter import paths
**Alternatives considered**: Keep both patterns with re-exports - rejected (adds complexity)

### 3. shadcn/ui Configuration

**Current `components.json`:**
```json
{
  "aliases": {
    "components": "@/ui-kit/components",
    "utils": "@/shared/utils",
    "hooks": "@/shared/hooks"
  }
}
```

**Decision**: Update to `"components": "@/ui-kit/ui"` and add `"ui": "@/ui-kit/ui"`
**Rationale**: Ensures future shadcn CLI commands install to correct location
**Alternatives considered**: None

### 4. Barrel Export Strategy

**Decision**: Create single `index.ts` with `export * from './<component>'` for all components
**Rationale**: Follows constitution Principle VIII (barrel exports), enables tree-shaking
**Alternatives considered**: Named exports only - rejected (more maintenance overhead)

## No Unknowns

This refactoring task has no NEEDS CLARIFICATION items. All decisions are straightforward file operations and import updates.

## Validation Approach

1. `pnpm type-check` - Verify all imports resolve correctly
2. `pnpm build` - Verify production build succeeds
3. `pnpm lint` - Verify no linting errors
4. Manual verification - Confirm shadcn CLI works with new config
