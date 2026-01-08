# 018 - UI Kit Refactor

## Overview

Consolidate the `ui-kit/components/` directory structure by merging the legacy `components/ui/` subfolder into a new `/ui` folder, creating barrel exports, and updating all imports across the codebase.

## Goals

1. Remove duplicate components (button, card, dropdown-menu exist in both locations)
2. Rename `components/` to `ui/` for cleaner imports
3. Create barrel export (`index.ts`) for all UI components
4. Update all imports to use `@/ui-kit/ui`
5. Prepare structure for future `/patterns` folder

## Current State

```
ui-kit/
├── components/
│   ├── ui/                    # Legacy shadcn location (DUPLICATES)
│   │   ├── button.tsx         # duplicate
│   │   ├── card.tsx           # duplicate
│   │   ├── dropdown-menu.tsx  # duplicate
│   │   ├── textarea.tsx
│   │   ├── progress.tsx
│   │   └── breadcrumb.tsx
│   ├── button.tsx             # main location
│   ├── card.tsx               # main location
│   ├── dropdown-menu.tsx      # main location
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── select.tsx
│   └── ... (18 more components)
├── theme/
│   └── styles.css
└── README.md
```

**Import patterns in use:**
- 38 files use `@/ui-kit/components/<component>`
- 4 files use `@/ui-kit/components/ui/<component>` (legacy)

## Target State

```
ui-kit/
├── ui/                        # All shadcn/ui primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── select.tsx
│   ├── dropdown-menu.tsx
│   ├── textarea.tsx
│   ├── progress.tsx
│   ├── breadcrumb.tsx
│   └── index.ts               # Barrel export
├── patterns/                  # Future: composed components
│   └── (empty for now)
├── theme/
│   └── styles.css
└── README.md
```

**Target import pattern:**
```tsx
// Single component
import { Button } from '@/ui-kit/ui/button'

// Multiple components via barrel
import { Button, Card, Dialog } from '@/ui-kit/ui'
```

## Implementation Steps

### 1. Identify Duplicates

Files that exist in both locations (keep `components/` version, delete `components/ui/` version):
- `button.tsx`
- `card.tsx`
- `dropdown-menu.tsx`

### 2. Merge Unique Files

Move from `components/ui/` to `components/` (no duplicates):
- `textarea.tsx`
- `progress.tsx`
- `breadcrumb.tsx`

### 3. Rename Directory

```bash
mv ui-kit/components ui-kit/ui
```

### 4. Create Barrel Export

Create `ui-kit/ui/index.ts`:

```typescript
export * from './alert-dialog'
export * from './badge'
export * from './breadcrumb'
export * from './button'
export * from './card'
export * from './collapsible'
export * from './dialog'
export * from './dropdown-menu'
export * from './form'
export * from './input'
export * from './label'
export * from './popover'
export * from './progress'
export * from './scroll-area'
export * from './select'
export * from './sheet'
export * from './skeleton'
export * from './slider'
export * from './sonner'
export * from './switch'
export * from './textarea'
export * from './toggle'
export * from './toggle-group'
```

### 5. Update Imports

Replace all imports across the codebase:

| Old Import | New Import |
|------------|------------|
| `@/ui-kit/components/button` | `@/ui-kit/ui/button` |
| `@/ui-kit/components/ui/button` | `@/ui-kit/ui/button` |
| `@/ui-kit/components/card` | `@/ui-kit/ui/card` |
| etc. | etc. |

### 6. Update shadcn Configuration

Update `components.json` to point to new location:

```json
{
  "aliases": {
    "components": "@/ui-kit/ui",
    "ui": "@/ui-kit/ui"
  }
}
```

### 7. Update README

Update `ui-kit/README.md` to reflect new structure.

## Files to Modify

### Delete (duplicates in `components/ui/`)
- `ui-kit/components/ui/button.tsx`
- `ui-kit/components/ui/card.tsx`
- `ui-kit/components/ui/dropdown-menu.tsx`

### Move (unique files from `components/ui/`)
- `ui-kit/components/ui/textarea.tsx` → `ui-kit/ui/textarea.tsx`
- `ui-kit/components/ui/progress.tsx` → `ui-kit/ui/progress.tsx`
- `ui-kit/components/ui/breadcrumb.tsx` → `ui-kit/ui/breadcrumb.tsx`

### Create
- `ui-kit/ui/index.ts` (barrel export)

### Update
- `components.json` (shadcn config)
- `ui-kit/README.md`
- ~42 files with import updates

## Success Criteria

1. No `components/` or `components/ui/` folders exist in ui-kit
2. All UI components live in `ui-kit/ui/`
3. Barrel export (`ui-kit/ui/index.ts`) exports all components
4. All imports use `@/ui-kit/ui/<component>` pattern
5. No duplicate component files
6. `pnpm type-check` passes
7. `pnpm build` succeeds
8. shadcn CLI installs new components to correct location

## Out of Scope

- Creating `/patterns` folder (future work)
- Adding new components
- Refactoring component internals
- Updating component APIs

## Dependencies

None - this is a pure refactoring task.
