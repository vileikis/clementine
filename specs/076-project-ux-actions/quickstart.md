# Quickstart: Project UX & Actions

**Branch**: `076-project-ux-actions` | **Date**: 2026-02-22

## Overview

This feature adds three improvements to project management UX:
1. Inline rename from the project designer via a clickable name badge
2. Project duplication from the project list context menu
3. Fully clickable and hoverable cards for both project and experience list items

## File Changes Summary

### New Files

| File | Purpose |
| ---- | ------- |
| `domains/project/layout/components/ProjectIdentityBadge.tsx` | Clickable name badge with hover pencil icon |
| `domains/workspace/projects/hooks/useDuplicateProject.ts` | Mutation hook for project duplication |
| `domains/workspace/projects/schemas/project.schemas.ts` | Add `duplicateProjectInputSchema` (extend existing file) |

### Modified Files

| File | Change |
| ---- | ------ |
| `domains/project/layout/containers/ProjectLayout.tsx` | Add identity badge as breadcrumb label, wire rename dialog |
| `domains/workspace/projects/components/ProjectListItem.tsx` | Replace inline dropdown with `ContextDropdownMenu`, accept `menuSections` prop, make card fully clickable with hover |
| `domains/workspace/projects/containers/ProjectsPage.tsx` | Build `menuSections` with Rename/Duplicate/Delete, manage duplicate mutation state |
| `domains/experience/library/components/ExperienceListItem.tsx` | Make card fully clickable with hover |
| `domains/workspace/projects/hooks/index.ts` | Export `useDuplicateProject` |

### Barrel Export Updates

| File | Change |
| ---- | ------ |
| `domains/project/layout/components/index.ts` | Export `ProjectIdentityBadge` (create if not exists) |
| `domains/workspace/projects/hooks/index.ts` | Export `useDuplicateProject` |

## Implementation Order

1. **ProjectIdentityBadge** → **ProjectLayout integration** (P1 rename)
2. **useDuplicateProject hook** → **ProjectsPage + ProjectListItem migration** (P1 duplicate + context menu)
3. **ProjectListItem clickable card** → **ExperienceListItem clickable card** (P2 cards)

## Key Patterns to Follow

- **Identity badge**: See `ExperienceIdentityBadge` — `<button>` with `group` class, hover `pencil` icon with `opacity-0 group-hover:opacity-100`
- **Duplicate hook**: See `useDuplicateExperience` — Firestore transaction, `structuredClone()`, `generateDuplicateName()`
- **Context menu**: See `ExperiencesPage.getMenuSections()` — `MenuSection[]` array with action objects
- **Card hover**: Use `transition-colors hover:bg-accent/50` on the card/link wrapper

## Dev Commands

```bash
cd apps/clementine-app
pnpm dev          # Start dev server
pnpm type-check   # Verify TypeScript
pnpm check        # Format + lint
```
