# Implementation Plan: Preview Shell

**Branch**: `024-preview-shell` | **Date**: 2025-12-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-preview-shell/spec.md`

## Summary

Create a reusable `preview-shell` feature module that extracts and generalizes the device preview infrastructure (DeviceFrame, ViewportSwitcher, viewport modes, fullscreen overlay) currently embedded in the `steps` feature. This enables any feature in the application to add preview capabilities with minimal code. The module will be applied to both Event Theme Editor and Project Theme Editor, replacing the current `PreviewPanel` component.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 19, Next.js 16, Tailwind CSS v4, shadcn/ui, lucide-react
**Storage**: N/A (client-side only, no persistence)
**Testing**: Jest + React Testing Library (co-located tests)
**Target Platform**: Web (mobile-first: 320px-768px primary, desktop 1024px+)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Instant viewport switching (<100ms), smooth fullscreen transitions
**Constraints**: Touch targets ≥44x44px, keyboard accessible (Escape to exit fullscreen)
**Scale/Scope**: Reusable across 4+ feature modules (steps, events, projects, future welcome screen)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px, readable typography (≥14px)
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied, single responsibility maintained
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, Zod validation for external inputs
- [x] **Minimal Testing Strategy**: Jest unit tests for critical paths (70%+ coverage goal), tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: N/A - feature is client-side only, no Firebase operations
- [x] **Feature Module Architecture**: Follows vertical slice architecture with barrel exports and restricted public API
- [x] **Technical Standards**: Applicable standards from `standards/` reviewed and referenced

**Complexity Violations**: None. This feature follows existing patterns (extraction + consolidation) without introducing new architectural complexity.

## Project Structure

### Documentation (this feature)

```text
specs/024-preview-shell/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (types/interfaces)
├── quickstart.md        # Phase 1 output (integration guide)
└── checklists/
    └── requirements.md  # Spec validation checklist
```

### Source Code (repository root)

```text
web/src/features/preview-shell/
├── index.ts                    # Public API exports
├── types/
│   ├── index.ts
│   └── preview-shell.types.ts  # ViewportMode, ViewportDimensions, context types
├── constants/
│   ├── index.ts
│   └── viewport.constants.ts   # VIEWPORT_DIMENSIONS
├── components/
│   ├── index.ts
│   ├── PreviewShell.tsx        # Main wrapper component
│   ├── DeviceFrame.tsx         # Device frame container (extracted)
│   ├── ViewportSwitcher.tsx    # Mobile/Desktop toggle (extracted)
│   ├── FullscreenOverlay.tsx   # Fullscreen mode overlay (new)
│   └── FullscreenTrigger.tsx   # Button to enter fullscreen (new)
├── context/
│   ├── index.ts
│   └── ViewportContext.tsx     # Viewport state context
└── hooks/
    ├── index.ts
    ├── useViewport.ts          # Viewport state management
    └── useFullscreen.ts        # Fullscreen state + keyboard handling

# Migration targets (existing files to update)
web/src/features/events/components/designer/EventThemeEditor.tsx
web/src/features/projects/components/designer/ThemeEditor.tsx
web/src/features/projects/components/designer/PreviewPanel.tsx  # Deprecate/remove
```

**Structure Decision**: Feature module follows vertical slice architecture per Constitution Principle VII. Components are organized by technical concern with explicit file naming (`preview-shell.types.ts`). Public API exports only components, hooks, and types - not internal utilities.

## Extraction Strategy

### Components to Extract from `steps` feature

| Component | Source | Target | Changes |
|-----------|--------|--------|---------|
| DeviceFrame | `steps/components/preview/DeviceFrame.tsx` | `preview-shell/components/DeviceFrame.tsx` | Remove theme dependency (use children), pure container |
| ViewSwitcher | `steps/components/preview/ViewSwitcher.tsx` | `preview-shell/components/ViewportSwitcher.tsx` | Add size prop, rename to ViewportSwitcher |
| ViewportModeContext | `steps/components/preview/ViewportModeContext.tsx` | `preview-shell/context/ViewportContext.tsx` | Extend with dimensions and isFullscreen |
| VIEWPORT_DIMENSIONS | `steps/types/preview.types.ts` | `preview-shell/constants/viewport.constants.ts` | Direct copy |
| ViewportMode type | `steps/types/preview.types.ts` | `preview-shell/types/preview-shell.types.ts` | Direct copy |

### Components to Create New

| Component | Purpose |
|-----------|---------|
| PreviewShell | Main wrapper orchestrating DeviceFrame, ViewportSwitcher, optional fullscreen |
| FullscreenOverlay | Fixed overlay with header, close button, keyboard handling |
| FullscreenTrigger | Button component to enter fullscreen mode |
| useViewport | Hook for viewport state management (controlled/uncontrolled) |
| useFullscreen | Hook for fullscreen state + Escape key handling |

### Integration with Theming Module

The `preview-shell` module does NOT handle theming directly. Consumers wrap their content with `ThemedBackground` from the `theming` module as needed:

```tsx
// Example usage
<PreviewShell enableViewportSwitcher>
  <ThemedBackground background={theme.background}>
    <MyContent />
  </ThemedBackground>
</PreviewShell>
```

This separation of concerns keeps `preview-shell` focused on viewport/device framing and `theming` focused on visual styling.

## Migration Plan

### Phase 1: Create Module (extract + new components)
1. Create feature module structure
2. Extract DeviceFrame, ViewportSwitcher from steps
3. Create FullscreenOverlay, FullscreenTrigger
4. Create PreviewShell wrapper
5. Create hooks (useViewport, useFullscreen)
6. Set up barrel exports

### Phase 2: Migrate Steps Feature
1. Update steps feature to import from preview-shell
2. Deprecate old components in steps (re-export from preview-shell)
3. Verify Experience Editor still works

### Phase 3: Migrate Theme Editors
1. Update EventThemeEditor to use PreviewShell
2. Update ThemeEditor (projects) to use PreviewShell
3. Remove PreviewPanel component
4. Add viewport switching + fullscreen to both editors

### Phase 4: Cleanup
1. Remove deprecated exports from steps feature
2. Run validation loop (lint, type-check, test)
3. Update documentation

## Dependencies

**Required before implementation**:
- `theming` module must be complete (confirmed available per CLAUDE.md)

**No external dependencies to add** - all required packages already in project.

---

## Post-Design Constitution Re-Check

_Verified after Phase 1 design completion._

| Principle | Status | Notes |
|-----------|--------|-------|
| Mobile-First Responsive Design | ✅ Pass | Touch targets ≥44x44px specified, mobile primary viewport |
| Clean Code & Simplicity | ✅ Pass | Extraction pattern, no new abstractions, YAGNI applied |
| Type-Safe Development | ✅ Pass | All types defined in data-model.md, TypeScript strict |
| Minimal Testing Strategy | ✅ Pass | Jest tests for hooks and components planned |
| Validation Loop Discipline | ✅ Pass | Phase 4 includes lint, type-check, test |
| Firebase Architecture Standards | ✅ N/A | Client-side only feature |
| Feature Module Architecture | ✅ Pass | Vertical slice with barrel exports per Constitution VII |
| Technical Standards | ✅ Pass | Standards reviewed, patterns from existing code |

**Complexity Violations**: None identified.

**Ready for**: `/speckit.tasks` to generate implementation tasks.
