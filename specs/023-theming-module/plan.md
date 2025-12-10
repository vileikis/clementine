# Implementation Plan: Theming Module

**Branch**: `023-theming-module` | **Date**: 2025-12-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/023-theming-module/spec.md`

## Summary

Create a centralized theming feature module that consolidates all theme-related types, components, and utilities. This module becomes the single source of truth for brand styling across the application, replacing duplicate `ProjectTheme` and `EventTheme` types with a unified `Theme` type, and providing reusable `ThemeProvider` and `ThemedBackground` components.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 19, Next.js 16
**Storage**: N/A (client-side module, no direct storage)
**Testing**: Jest + React Testing Library
**Target Platform**: Web (mobile-first: 320px-768px)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: No performance-critical code in this module
**Constraints**: Must maintain backward compatibility during migration
**Scale/Scope**: ~10 consuming components, 2 feature modules to migrate

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: ThemedBackground uses cover/center for responsive images, no fixed dimensions
- [x] **Clean Code & Simplicity**: Single-purpose module, no premature abstraction, consolidates existing duplication
- [x] **Type-Safe Development**: TypeScript strict mode, union types for radius/alignment, no `any` escapes
- [x] **Minimal Testing Strategy**: Jest unit tests for hooks and context, tests co-located with source
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test validation before completion
- [x] **Firebase Architecture Standards**: N/A - client-side only module, no Firebase interaction
- [x] **Feature Module Architecture**: Follows vertical slice pattern in `features/theming/`

**Complexity Violations**: None. This feature reduces complexity by consolidating duplicate code.

## Project Structure

### Documentation (this feature)

```text
specs/023-theming-module/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Codebase research findings
├── data-model.md        # Type definitions
├── quickstart.md        # Developer guide
├── contracts/           # API contracts
│   └── theming-api.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
web/src/features/theming/
├── index.ts                    # Public exports (components, hooks, types only)
├── types/
│   ├── index.ts
│   └── theme.types.ts          # Theme, ThemeText, ThemeButton, ThemeBackground
├── constants/
│   ├── index.ts
│   └── theme-defaults.ts       # BUTTON_RADIUS_MAP
├── components/
│   ├── index.ts
│   ├── ThemeProvider.tsx       # Context provider
│   └── ThemedBackground.tsx    # Background with image/overlay
├── hooks/
│   ├── index.ts
│   ├── useTheme.ts             # Context hook
│   └── useThemedStyles.ts      # Computed styles hook
└── context/
    └── ThemeContext.tsx        # React context definition
```

### Files to Modify (Migration)

```text
# Type migrations
web/src/features/projects/types/project.types.ts  # Replace ProjectTheme with Theme import
web/src/features/events/types/event.types.ts      # Replace EventTheme with Theme import

# Provider migrations
web/src/components/providers/EventThemeProvider.tsx  # Deprecate/remove

# Consumer migrations (update imports)
web/src/components/step-primitives/ActionButton.tsx
web/src/components/step-primitives/OptionButton.tsx
web/src/components/step-primitives/StepLayout.tsx
web/src/features/projects/components/designer/ThemeEditor.tsx
web/src/features/events/components/designer/EventThemeEditor.tsx
web/src/features/steps/components/preview/DeviceFrame.tsx
```

**Structure Decision**: Feature module architecture following `standards/global/feature-modules.md`. The theming module is placed in `web/src/features/theming/` with vertical slice organization.

## Research Summary

See [research.md](./research.md) for detailed findings. Key discoveries:

1. **Identical types**: `ProjectTheme` and `EventTheme` have identical structure
2. **Radius inconsistency**: EventThemeProvider uses `0.5rem` for md, editors use `0.375rem`
3. **Background duplication**: 60+ lines duplicated in 3 locations (ThemeEditor, EventThemeEditor, DeviceFrame)
4. **Working context pattern**: Step primitives correctly use `useEventTheme()` hook

## Implementation Phases

### Phase 1: Create Module Structure
1. Create `features/theming/` directory structure
2. Define `Theme` and related types in `types/theme.types.ts`
3. Create `BUTTON_RADIUS_MAP` constant
4. Set up barrel exports

### Phase 2: Create Components
1. Implement `ThemeContext.tsx` (React context definition)
2. Implement `ThemeProvider.tsx` (based on EventThemeProvider)
3. Implement `useTheme.ts` hook
4. Implement `ThemedBackground.tsx` component
5. Implement `useThemedStyles.ts` utility hook

### Phase 3: Migrate Types in Features
1. Update `features/projects/types/project.types.ts`:
   - Import `Theme` from theming
   - Create type alias for backward compatibility
   - Move `logoUrl` to Project interface directly
2. Update `features/events/types/event.types.ts`:
   - Import `Theme` from theming
   - Create type alias for backward compatibility
   - Move `logoUrl` to Event interface directly

### Phase 4: Migrate Provider Usage
1. Update step primitives to import from `@/features/theming`
2. Rename `useEventTheme` → `useTheme` in consuming components
3. Update ThemeEditor and EventThemeEditor to use `BUTTON_RADIUS_MAP`

### Phase 5: Migrate ThemedBackground Usage
1. Update ThemeEditor to use ThemedBackground
2. Update EventThemeEditor to use ThemedBackground
3. Update DeviceFrame to use ThemedBackground

### Phase 6: Cleanup & Validation
1. Remove deprecated `EventThemeProvider` from `components/providers/`
2. Remove duplicate theme types from projects/events (after backward compat period)
3. Run validation loop: `pnpm lint && pnpm type-check && pnpm test`

## Complexity Tracking

> No violations - this feature reduces complexity by consolidating duplicate code.

| Metric | Before | After |
|--------|--------|-------|
| Theme type definitions | 2 (duplicate) | 1 (unified) |
| Background rendering implementations | 3 | 1 |
| Button radius maps | 3 (inconsistent) | 1 |
| Lines of duplicate code | ~180 | 0 |
