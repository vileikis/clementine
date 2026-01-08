# Quickstart: UI Kit Refactor

**Branch**: 018-ui-kit-refactor | **Date**: 2026-01-08

## Overview

This document provides a quick reference for the UI Kit refactoring implementation.

## Before/After Structure

### Before
```
ui-kit/
├── components/
│   ├── ui/           # Legacy shadcn location
│   │   ├── button.tsx, card.tsx, dropdown-menu.tsx (duplicates)
│   │   └── breadcrumb.tsx, progress.tsx, textarea.tsx (unique)
│   └── *.tsx         # 20 component files
├── theme/
└── README.md
```

### After
```
ui-kit/
├── ui/               # Unified location
│   ├── *.tsx         # 23 component files (merged)
│   └── index.ts      # Barrel export
├── theme/
└── README.md
```

## Import Changes

### Old Patterns
```tsx
import { Button } from '@/ui-kit/components/button'
import { Textarea } from '@/ui-kit/components/ui/textarea'
```

### New Pattern
```tsx
// Direct import (preferred for single component)
import { Button } from '@/ui-kit/ui/button'

// Barrel import (for multiple components)
import { Button, Card, Dialog } from '@/ui-kit/ui'
```

## Implementation Steps

1. **Move unique files** from `components/ui/` → `components/`
   - breadcrumb.tsx
   - progress.tsx
   - textarea.tsx

2. **Delete duplicates** from `components/ui/`
   - button.tsx
   - card.tsx
   - dropdown-menu.tsx

3. **Delete empty folder** `components/ui/`

4. **Rename directory** `components/` → `ui/`

5. **Create barrel export** `ui/index.ts`

6. **Update imports** across ~42 files
   - `@/ui-kit/components/*` → `@/ui-kit/ui/*`
   - `@/ui-kit/components/ui/*` → `@/ui-kit/ui/*`

7. **Update shadcn config** `components.json`

8. **Update README** `ui-kit/README.md`

## Validation

```bash
cd apps/clementine-app
pnpm type-check   # Verify imports resolve
pnpm build        # Verify production build
pnpm lint         # Verify no linting errors
```

## Files Changed

| Type | Count | Description |
|------|-------|-------------|
| Moved | 3 | breadcrumb, progress, textarea |
| Deleted | 3 | Duplicate button, card, dropdown-menu |
| Renamed | 1 | components/ → ui/ |
| Created | 1 | ui/index.ts barrel |
| Updated | ~42 | Import statements |
| Updated | 2 | components.json, README.md |

## Component List (Final)

All 23 components in `ui-kit/ui/`:

1. alert-dialog
2. badge
3. breadcrumb
4. button
5. card
6. collapsible
7. dialog
8. dropdown-menu
9. form
10. input
11. label
12. popover
13. progress
14. scroll-area
15. select
16. sheet
17. skeleton
18. slider
19. sonner
20. switch
21. textarea
22. toggle
23. toggle-group
