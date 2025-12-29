# Research: Theming Module Migration

**Feature**: 006-theming-migration
**Date**: 2025-12-29
**Status**: Complete

## Overview

This document consolidates research findings for migrating the theming module from Next.js (web/) to TanStack Start (apps/clementine-app/). The module is already copied to the target location; this research validates compatibility and identifies required changes.

## Research Areas

### 1. TanStack Start Client Directive Requirements

**Research Question**: Does TanStack Start require "use client" directives for React Context and hooks like Next.js does?

**Decision**: YES - Keep "use client" directives

**Rationale**:
- TanStack Start uses SSR by default (similar to Next.js App Router)
- React Context (`createContext`, `useContext`) requires client-side rendering
- React hooks (`useState`, `useEffect`, `useMemo`) require client-side rendering
- All files using React Context or hooks MUST have "use client" directive

**Files requiring "use client"**:
- `context/ThemeContext.tsx` - Uses `createContext`
- `components/ThemeProvider.tsx` - Uses `useMemo` and Context provider
- `components/ThemedBackground.tsx` - React component
- `hooks/useEventTheme.ts` - Uses `useContext`
- `hooks/useThemedStyles.ts` - Uses `useMemo` and `useEventTheme` hook

**Files NOT requiring "use client"**:
- `types/theme.types.ts` - Pure TypeScript types
- `schemas/theme.schemas.ts` - Zod schemas (can be used server-side)
- `constants/theme-defaults.ts` - Pure constants
- Barrel exports (`index.ts` files) - Re-exports only

**Alternatives considered**:
- Remove "use client" and use server-side rendering → REJECTED: React Context cannot be used on server
- Split into server/client modules → REJECTED: Unnecessary complexity, entire module is inherently client-side

**References**:
- TanStack Start SSR documentation: https://tanstack.com/start/latest/docs/framework/react/rendering
- React Server Components: https://react.dev/reference/rsc/use-client

---

### 2. Import Path Migration (@/lib/utils → @/shared/utils)

**Research Question**: What import paths need to be updated from Next.js to TanStack Start conventions?

**Decision**: Update @/lib/utils to @/shared/utils

**Rationale**:
- Next.js app used `@/lib/utils` for the `cn()` utility (clsx + tailwind-merge)
- TanStack Start app uses `@/shared/utils` convention (verified path exists)
- The `cn()` utility is in `apps/clementine-app/src/shared/utils/style-utils.ts`
- Only one file affected: `components/ThemedBackground.tsx`

**Migration mapping**:
```typescript
// OLD (Next.js)
import { cn } from "@/lib/utils"

// NEW (TanStack Start)
import { cn } from "@/shared/utils"
```

**Verification**:
- Confirmed `cn()` utility exists in target path
- Confirmed export in `src/shared/utils/index.ts`
- Implementation is identical (clsx + tailwind-merge pattern)

**Alternatives considered**:
- Create alias `@/lib` → REJECTED: Would diverge from TanStack Start project conventions
- Inline clsx/tailwind-merge → REJECTED: Reduces code reusability

---

### 3. Zod v4 Compatibility

**Research Question**: Are the existing Zod schemas compatible with Zod v4.1.12 (no deprecated APIs)?

**Decision**: YES - Schemas are fully compatible

**Rationale**:
- TanStack Start app uses Zod v4.1.12 (verified in package.json)
- Existing schemas use only stable Zod APIs:
  - `z.object()` - Schema definition
  - `z.string()` - String validation
  - `z.number()` - Number validation
  - `.regex()` - Regex validation
  - `.nullable()` - Nullable values
  - `.optional()` - Optional fields
  - `.default()` - Default values
  - `.min()` / `.max()` - Range constraints
  - `z.enum()` - Enum validation
- No deprecated APIs detected (e.g., old refinement syntax, deprecated transforms)

**Verification**:
- Reviewed all schema definitions in `schemas/theme.schemas.ts`
- Cross-referenced with Zod v4 changelog and documentation
- No breaking changes affect this module

**Alternatives considered**:
- Rewrite schemas with newer APIs → REJECTED: Current schemas work perfectly
- Add `.brand()` for nominal typing → REJECTED: Not needed for this use case

**References**:
- Zod v4 documentation: https://zod.dev

---

### 4. React 19 Compatibility

**Research Question**: Are React Context patterns compatible with React 19.2?

**Decision**: YES - Fully compatible

**Rationale**:
- React Context API is stable and unchanged in React 19
- `createContext`, `useContext`, `useMemo` work identically
- TanStack Start app already uses React 19.2 (verified in package.json)
- No breaking changes in React 19 affect Context or hooks

**Verification**:
- Reviewed React 19 changelog
- Confirmed Context API unchanged
- Confirmed hooks API unchanged
- No deprecations affecting this module

**Alternatives considered**:
- Use Zustand for state management → REJECTED: Overkill for theme context, adds unnecessary dependency
- Use TanStack Router context → REJECTED: Theme is component-scoped, not route-scoped

**References**:
- React 19 release notes: https://react.dev/blog/2025/04/25/react-19

---

### 5. Tailwind CSS v4 Compatibility

**Research Question**: Are Tailwind utility classes used in ThemedBackground compatible with Tailwind v4?

**Decision**: YES - All classes are compatible

**Rationale**:
- TanStack Start app uses Tailwind CSS v4.0.6 (verified in package.json)
- All utility classes used are stable and unchanged in v4:
  - `relative`, `absolute` - Positioning
  - `inset-0` - Positioning shorthand
  - `flex`, `flex-1`, `flex-col` - Flexbox
  - `items-center`, `justify-center` - Flexbox alignment
  - `overflow-hidden`, `overflow-auto` - Overflow control
  - `bg-cover`, `bg-center` - Background utilities
  - `bg-black` - Background color
  - `pointer-events-none` - Pointer events
  - `z-10` - Z-index
  - `w-full`, `max-w-3xl` - Width utilities
  - `px-4`, `py-8` - Padding utilities

**Verification**:
- Cross-referenced all classes with Tailwind v4 documentation
- No deprecated classes used
- No breaking changes affect this module

**Alternatives considered**:
- Use Tailwind v4 arbitrary values → REJECTED: Current classes are sufficient and more maintainable
- Use CSS-in-JS instead of Tailwind → REJECTED: Would be inconsistent with codebase standards

**References**:
- Tailwind CSS v4 documentation: https://tailwindcss.com

---

### 6. Testing Strategy

**Research Question**: What testing approach should be used for this shared infrastructure module?

**Decision**: High-coverage unit tests with Vitest and Testing Library

**Rationale**:
- This is a **critical infrastructure module** used by all guest-facing experiences
- Constitution requires 90%+ coverage for critical paths (Principle IV)
- Vitest is already configured in TanStack Start app
- Testing Library provides React component testing utilities

**Test Coverage Plan**:

**High Priority (90%+ coverage required)**:
1. **Zod Schemas** (`theme.schemas.test.ts`):
   - Valid theme data passes validation
   - Invalid hex colors are rejected
   - Invalid alignment values are rejected
   - Invalid radius presets are rejected
   - Opacity out of range (0-1) is rejected
   - Partial theme updates work correctly
   - Default values are applied correctly

2. **useEventTheme Hook** (`useEventTheme.test.tsx`):
   - Returns theme context when inside provider
   - Throws error when outside provider
   - Error message is descriptive

3. **ThemeProvider Component** (`ThemeProvider.test.tsx`):
   - Provides theme context to children
   - Computes buttonBgColor fallback (null → primaryColor)
   - Computes buttonRadius mapping (preset → CSS value)
   - Memoizes computed values (performance)

4. **useThemedStyles Hook** (`useThemedStyles.test.tsx`):
   - Returns text styles (color, textAlign)
   - Returns button styles (backgroundColor, color, borderRadius)
   - Returns background styles (backgroundColor, backgroundImage, fontFamily)
   - Handles missing optional values (image, fontFamily)
   - Memoizes style objects (performance)

5. **ThemedBackground Component** (`ThemedBackground.test.tsx`):
   - Renders with background color
   - Renders with background image
   - Renders with overlay opacity
   - Applies fontFamily to container
   - Applies custom className
   - Applies custom style prop
   - Renders content wrapper by default
   - Disables content wrapper when contentClassName=""
   - Applies custom contentClassName

**Medium Priority (70%+ coverage)**:
- Edge cases (missing data, null values)
- TypeScript type exports (smoke tests)

**Test Infrastructure**:
- **Framework**: Vitest (already configured)
- **Utilities**: Testing Library (React component testing)
- **Coverage tool**: Vitest coverage (c8/Istanbul)
- **Test location**: Colocated with source files (e.g., `ThemeProvider.test.tsx` next to `ThemeProvider.tsx`)

**Alternatives considered**:
- E2E tests → REJECTED: Unit tests sufficient for infrastructure module, E2E would test consuming features
- Snapshot tests → REJECTED: Prone to false positives, prefer explicit assertions
- Lower coverage (70%) → REJECTED: This is critical infrastructure, 90% coverage is appropriate

**References**:
- Vitest documentation: https://vitest.dev
- Testing Library React: https://testing-library.com/react

---

## Summary of Required Changes

### Import Path Updates
- [x] `components/ThemedBackground.tsx`: Change `@/lib/utils` to `@/shared/utils`

### "use client" Directives
- [x] Verify "use client" in:
  - `context/ThemeContext.tsx`
  - `components/ThemeProvider.tsx`
  - `components/ThemedBackground.tsx`
  - `hooks/useEventTheme.ts`
  - `hooks/useThemedStyles.ts`

### Testing Infrastructure (to be created)
- [ ] Add colocated test files (5 files total):
  - `schemas/theme.schemas.test.ts` (next to `theme.schemas.ts`)
  - `hooks/useEventTheme.test.tsx` (next to `useEventTheme.ts`)
  - `hooks/useThemedStyles.test.tsx` (next to `useThemedStyles.ts`)
  - `components/ThemeProvider.test.tsx` (next to `ThemeProvider.tsx`)
  - `components/ThemedBackground.test.tsx` (next to `ThemedBackground.tsx`)

### Validation (before completion)
- [ ] Run `pnpm check` (format + lint)
- [ ] Run `pnpm type-check` (TypeScript strict mode)
- [ ] Run `pnpm test` (unit tests)
- [ ] Manual standards review (design-system.md, component-libraries.md, code-quality.md)

---

## Risks & Mitigation

### Risk: SSR/Client Boundary Issues
**Likelihood**: Low
**Impact**: High
**Mitigation**: All files with React hooks have "use client" directive. Context cannot be serialized across SSR boundary (by design).

### Risk: Import Path Errors
**Likelihood**: Low
**Impact**: Medium
**Mitigation**: Only one import path needs updating. TypeScript will catch errors at compile time.

### Risk: Performance Regression
**Likelihood**: Low
**Impact**: Medium
**Mitigation**: All computed values use `useMemo` to prevent unnecessary recalculations. Performance target: <16ms render time.

---

## Open Questions

**None** - All technical unknowns have been resolved through research.

---

## References

- TanStack Start Documentation: https://tanstack.com/start
- React 19 Documentation: https://react.dev
- Zod v4 Documentation: https://zod.dev
- Tailwind CSS v4 Documentation: https://tailwindcss.com
- Vitest Documentation: https://vitest.dev
- Constitution: `.specify/memory/constitution.md`
- Feature Specification: `specs/006-theming-migration/spec.md`
