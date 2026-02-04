# Quickstart: Experience Layout Polish

**Feature**: Experience Layout Polish
**Date**: 2026-02-04

## Overview

This feature fixes mobile scrolling behavior across guest-facing experience pages. The TopBar and background should remain static while only the content area scrolls.

## Quick Links

- [Specification](../../requirements/exp-layout-polish/spec.md)
- [Implementation Plan](./plan.md)
- [Research](./research.md)
- [Data Model](./data-model.md)
- [Component Contracts](./contracts/components.md)

## Key Changes Summary

| Component | Change | File |
|-----------|--------|------|
| ThemedBackground | Remove `overflow-auto`, `px-4 py-8`, `my-auto` | `shared/theming/components/ThemedBackground.tsx` |
| RuntimeTopBar | Add `shrink-0` | `experience/runtime/components/RuntimeTopBar.tsx` |
| ExperienceRuntime | Add flex wrapper + scroll container | `experience/runtime/containers/ExperienceRuntime.tsx` |
| StepLayout | Add `px-4` padding | `experience/steps/renderers/StepLayout.tsx` |
| WelcomeRenderer | Remove ThemedBackground, add scroll | `project-config/welcome/components/WelcomeRenderer.tsx` |
| WelcomeScreen | Add ThemedBackground wrapper | `guest/containers/WelcomeScreen.tsx` |
| ShareLoadingRenderer | Add scroll wrapper | `project-config/share/components/ShareLoadingRenderer.tsx` |
| Guest Pages | Remove `pt-20` from content | `guest/containers/*.tsx` |
| WelcomeEditorPage | Add ThemedBackground wrapper | `project-config/welcome/containers/WelcomeEditorPage.tsx` |

## Implementation Order

### Phase 1: Core Layout Fix
1. `ThemedBackground` - remove overflow
2. `ExperienceRuntime` - add flex wrapper
3. `RuntimeTopBar` - add shrink-0

### Phase 2: Step Renderers
4. `StepLayout` - add centering/padding

### Phase 3: Guest Pages Alignment
5. `WelcomeRenderer` - remove ThemedBackground
6. `WelcomeScreen` - add ThemedBackground
7. Guest pages - remove pt-20

### Phase 4: Share Renderers
8. `ShareLoadingRenderer` - add scroll wrapper

### Phase 5: Editor Pages
9. `WelcomeEditorPage` - add ThemedBackground

## Development Commands

```bash
# Start dev server
pnpm app:dev

# Run validation
pnpm app:check

# Type check
pnpm app:type-check
```

## Testing Checklist

### Mobile (< 768px)
- [ ] TopBar stays static (doesn't scroll)
- [ ] Background doesn't scroll
- [ ] Bottom action buttons stay fixed
- [ ] Only content area scrolls

### Desktop (>= 768px)
- [ ] Content centered properly
- [ ] Buttons in document flow
- [ ] No unnecessary scrollbars

### Pages to Test
- [ ] WelcomeScreen
- [ ] ExperiencePage (all step types)
- [ ] PregatePage
- [ ] PresharePage
- [ ] SharePage

## Layout Pattern Reference

**Target Architecture**:
```
GuestPage (h-screen)
└── ThemedBackground (NO overflow)
    ├── Background layers (static)
    └── ExperienceRuntime (flex-col)
        ├── RuntimeTopBar (shrink-0) ← STATIC
        └── Content (flex-1, overflow-y-auto) ← SCROLLS
```

**Key Insight**: The scroll container wraps ONLY the content area. Flexbox handles height distribution - no calculations needed.
