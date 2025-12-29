# Implementation Plan: Theming Module Migration

**Branch**: `006-theming-migration` | **Date**: 2025-12-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-theming-migration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate the theming module from Next.js app to TanStack Start app to provide centralized theming infrastructure for guest-facing experiences. The module provides React Context-based theme management with components (ThemeProvider, ThemedBackground), hooks (useEventTheme, useThemedStyles), and Zod schemas for runtime validation. Files are already copied to `apps/clementine-app/src/shared/theming/` and need import path updates and "use client" directive evaluation.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: React 19.2, Zod v4.1.12, Tailwind CSS v4, TanStack Start 1.132
**Storage**: N/A (theming module is client-only, data comes from Firestore but is handled by domain features)
**Testing**: Vitest 3.0.5 (unit tests for hooks, components, validation schemas)
**Target Platform**: Web (TanStack Start SSR with client-side React Context)
**Project Type**: Single web application (TanStack Start)
**Performance Goals**: <16ms render time for ThemedBackground (60fps), memoized theme computations to prevent unnecessary recalculations
**Constraints**: Must use "use client" for React Context (createContext, useContext) and hooks in TanStack Start, validation must catch all invalid color formats/values before reaching components
**Scale/Scope**: Shared module used across all guest-facing experiences, ~15 files (types, schemas, components, hooks, context, constants), supports unlimited themed events/projects

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Mobile-First Design ✅ PASS
- **Status**: COMPLIANT
- **Justification**: Theming module provides infrastructure for guest-facing experiences which ARE mobile-first. The module itself is agnostic to viewport (provides theme values, not layout), so mobile-first is enforced by consuming components, not by this module.

### II. Clean Code & Simplicity ✅ PASS
- **Status**: COMPLIANT
- **Justification**: Module is straightforward - Context provider, hooks for accessing theme, validation schemas. No premature abstractions. Files are small (<100 lines each), single responsibility (types, schemas, components separated).

### III. Type-Safe Development ✅ PASS
- **Status**: COMPLIANT
- **Justification**: TypeScript strict mode enabled. All types exported (Theme, ThemeText, ThemeButton, ThemeBackground). Runtime validation using Zod schemas for all external theme data. No `any` types used.

### IV. Minimal Testing Strategy ✅ PASS
- **Status**: COMPLIANT
- **Justification**: Tests should focus on:
  - Theme validation schemas (valid/invalid inputs)
  - useEventTheme hook (with/without provider)
  - useThemedStyles hook (style object generation)
  - ThemeProvider (computed values and memoization)
  - ThemedBackground component (rendering with various theme configs)
- Coverage target: 90%+ (critical infrastructure module)

### V. Validation Gates ✅ PASS
- **Status**: COMPLIANT
- **Required checks before completion**:
  - `pnpm check` (format + lint)
  - `pnpm type-check` (TypeScript)
  - `pnpm test` (validation schemas, hooks, components)
  - Manual standards review: `frontend/component-libraries.md`, `frontend/design-system.md`, `global/code-quality.md`, `global/project-structure.md`

### VI. Frontend Architecture ✅ PASS
- **Status**: COMPLIANT
- **Justification**: Module is client-only (React Context, hooks, components). Follows client-first pattern. No server-side code needed. Theme data originates from Firestore via domain features, this module only provides infrastructure.

### VII. Backend & Firebase ✅ PASS
- **Status**: COMPLIANT (N/A)
- **Justification**: This module has NO Firebase integration. Theme data is passed as props from domain features that handle Firestore operations.

### VIII. Project Structure ✅ PASS
- **Status**: COMPLIANT
- **Justification**: Module follows vertical slice architecture within shared infrastructure:
  - `src/shared/theming/` (shared across all domains)
  - Files organized by technical concern: `types/`, `schemas/`, `components/`, `hooks/`, `context/`, `constants/`
  - Barrel exports in each folder
  - Root `index.ts` exports public API (components, hooks, types, schemas, constants)

### Overall Gate Status: ✅ ALL PASS

**No complexity justifications needed.** This is a straightforward shared infrastructure module following all constitution principles.

## Project Structure

### Documentation (this feature)

```text
specs/006-theming-migration/
├── spec.md              # Feature specification (already exists)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (TanStack Start app)

```text
apps/clementine-app/src/shared/theming/
├── index.ts                          # Public API barrel export
├── types/
│   ├── index.ts                      # Barrel export
│   └── theme.types.ts                # Theme, ThemeText, ThemeButton, ThemeBackground, ButtonRadius
├── schemas/
│   ├── index.ts                      # Barrel export
│   ├── theme.schemas.ts              # themeSchema, updateThemeSchema, COLOR_REGEX
│   └── theme.schemas.test.ts         # Colocated Zod schema validation tests
├── components/
│   ├── index.ts                      # Barrel export
│   ├── ThemeProvider.tsx             # React Context provider
│   ├── ThemeProvider.test.tsx        # Colocated component tests
│   ├── ThemedBackground.tsx          # Full-height themed background component
│   └── ThemedBackground.test.tsx     # Colocated component tests
├── hooks/
│   ├── index.ts                      # Barrel export
│   ├── useEventTheme.ts              # Hook to access theme context
│   ├── useEventTheme.test.tsx        # Colocated hook tests
│   ├── useThemedStyles.ts            # Hook to convert theme to CSS styles
│   └── useThemedStyles.test.tsx      # Colocated hook tests
├── context/
│   ├── index.ts                      # Barrel export
│   └── ThemeContext.tsx              # React Context definition
└── constants/
    ├── index.ts                      # Barrel export
    └── theme-defaults.ts             # BUTTON_RADIUS_MAP constant
```

**Structure Decision**: Single web application using TanStack Start. This is a **shared infrastructure module** under `src/shared/theming/` since it's used across all domains (events, experiences, projects). Files are organized by technical concern (types, schemas, components, hooks, context, constants) per DDD standards. **Tests are colocated** with the files they test (e.g., `ThemeProvider.test.tsx` next to `ThemeProvider.tsx`) for better discoverability and maintenance. All files already exist from initial migration; implementation involves updating import paths, validating TanStack Start compatibility, and adding colocated tests.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**N/A** - All constitution gates pass. No complexity violations to justify.

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design completed.*

### I. Mobile-First Design ✅ PASS (RECONFIRMED)
- **Status**: COMPLIANT
- **Design Validation**: Module provides theming infrastructure that is viewport-agnostic. All theme values (colors, fonts, alignment) apply equally to mobile and desktop. ThemedBackground component uses responsive Tailwind classes (flex-1, overflow-auto) that work on all viewports.

### II. Clean Code & Simplicity ✅ PASS (RECONFIRMED)
- **Status**: COMPLIANT
- **Design Validation**: Data model is simple and focused. Only 5 core entities (Theme, ThemeText, ThemeButton, ThemeBackground, ThemeContextValue). No unnecessary abstractions. Each entity has clear single responsibility. Design artifacts confirm straightforward implementation.

### III. Type-Safe Development ✅ PASS (RECONFIRMED)
- **Status**: COMPLIANT
- **Design Validation**: All entities have TypeScript types (theme.types.ts) and Zod schemas (theme.schemas.ts). Runtime validation required before using theme data. No escape hatches or `any` types in design.

### IV. Minimal Testing Strategy ✅ PASS (RECONFIRMED)
- **Status**: COMPLIANT
- **Design Validation**: Testing strategy defined in research.md. 5 test files covering schemas, hooks, and components. 90%+ coverage target appropriate for critical infrastructure. Tests focus on behavior (validation, context, computed values, rendering), not implementation details.

### V. Validation Gates ✅ PASS (RECONFIRMED)
- **Status**: COMPLIANT
- **Design Validation**: Standards review checklist included in research.md. Validation workflow documented (format, lint, type-check, test). Standards compliance review identifies applicable standards (design-system.md, component-libraries.md, code-quality.md, project-structure.md).

### VI. Frontend Architecture ✅ PASS (RECONFIRMED)
- **Status**: COMPLIANT
- **Design Validation**: Module is 100% client-side (React Context, hooks, components). No server-side code. No Firebase integration (theme data passed as props from domain features). Follows client-first pattern by being exclusively client-side.

### VII. Backend & Firebase ✅ PASS (RECONFIRMED)
- **Status**: COMPLIANT (N/A)
- **Design Validation**: No Firebase integration in module. Theme data fetching/persistence handled by domain features. Module boundary clearly defined in data-model.md and public-api.md.

### VIII. Project Structure ✅ PASS (RECONFIRMED)
- **Status**: COMPLIANT
- **Design Validation**: Module structure documented in plan.md and data-model.md. Follows vertical slice architecture within shared infrastructure (src/shared/theming/). Files organized by technical concern (types/, schemas/, components/, hooks/, context/, constants/). Barrel exports in all folders. Public API restricted to components, hooks, types, schemas, constants (no internal implementation details leaked).

### Overall Post-Design Gate Status: ✅ ALL PASS

**Design Confirmation**: All constitution principles remain satisfied after completing Phase 1 design. No new complexity introduced. Implementation can proceed.
