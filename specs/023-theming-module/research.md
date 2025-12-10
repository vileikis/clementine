# Research: Theming Module

**Feature Branch**: `023-theming-module`
**Created**: 2025-12-10
**Status**: Complete

## Executive Summary

Research into the existing theming implementations reveals significant code duplication and inconsistencies across the codebase. The migration to a centralized theming module is well-justified and can be implemented with minimal risk.

## Research Findings

### 1. Existing Theme Type Definitions

**Decision**: Unify `ProjectTheme` and `EventTheme` into a single `Theme` type

**Rationale**: Both types are structurally identical. Maintaining separate definitions creates maintenance burden and risks drift.

**Alternatives Considered**:
- Keep separate types and share via type alias → Rejected: Still requires two files, doesn't consolidate ownership
- Create base type with feature-specific extensions → Rejected: No feature-specific needs identified, adds unnecessary complexity

**Current Locations**:
| Type | File |
|------|------|
| `ProjectTheme` | `web/src/features/projects/types/project.types.ts` |
| `EventTheme` | `web/src/features/events/types/event.types.ts` |

### 2. Button Radius Inconsistency

**Decision**: Standardize on EventThemeProvider values (`md: 0.5rem`)

**Rationale**: The provider is the canonical source of truth for runtime theme application. Editor preview values should match runtime behavior.

**Alternatives Considered**:
- Use editor values (0.375rem) → Rejected: Would require changing runtime behavior
- Make radius configurable per-use → Rejected: Overcomplicates, no use case identified

**Inconsistency Found**:
| Location | `md` radius value |
|----------|------------------|
| EventThemeProvider | `0.5rem` (canonical) |
| ThemeEditor | `0.375rem` (incorrect) |
| EventThemeEditor | `0.375rem` (incorrect) |

### 3. Background Rendering Duplication

**Decision**: Create `ThemedBackground` component to consolidate duplicate code

**Rationale**: Three locations implement nearly identical background + overlay + content layering. Consolidation reduces bugs and ensures consistency.

**Alternatives Considered**:
- CSS utility classes → Rejected: Background image URL is dynamic, overlay opacity is configurable
- Higher-order component → Rejected: Composition is simpler and more flexible

**Duplication Locations**:
| Component | File | Lines |
|-----------|------|-------|
| ThemeEditor preview | `web/src/features/projects/components/designer/ThemeEditor.tsx` | 471-526 |
| EventThemeEditor preview | `web/src/features/events/components/designer/EventThemeEditor.tsx` | 474-531 |
| DeviceFrame | `web/src/features/steps/components/preview/DeviceFrame.tsx` | 37-89 |

### 4. Context Provider Pattern

**Decision**: Keep context-based theming pattern, rename to `ThemeProvider` and `useTheme`

**Rationale**: Pattern is well-established, works correctly, and is used consistently by step primitives.

**Alternatives Considered**:
- CSS variables approach (like BrandThemeProvider) → Rejected: Inline styles are more explicit, CSS vars better for future enhancement
- Props-only (no context) → Rejected: Would require prop drilling through component tree

**Current Consumers**:
- `ActionButton` - uses computed values (`buttonBgColor`, `buttonTextColor`, `buttonRadius`)
- `OptionButton` - uses full theme object
- `StepLayout` - uses text styling from theme

### 5. Logo Handling Separation

**Decision**: Exclude `logoUrl` from `Theme` type

**Rationale**: Logo is an identity/branding concern, not a styling concern. The PRD explicitly excludes it, and keeping it separate allows logo handling to evolve independently.

**Current State**: `logoUrl` is present in both `ProjectTheme` and `EventTheme` as optional field

**Migration Plan**: `logoUrl` stays on `Project` and `Event` interfaces directly, not in their `theme` property

## Technical Context Resolution

| Item | Resolution |
|------|------------|
| Language/Version | TypeScript 5.x (strict mode) |
| Primary Dependencies | React 19, Next.js 16 |
| Storage | N/A (client-side module, no direct storage) |
| Testing | Jest + React Testing Library |
| Target Platform | Web (mobile-first: 320px-768px) |
| Project Type | Web application (Next.js monorepo) |
| Performance Goals | No performance-critical code in this module |
| Constraints | Must maintain backward compatibility during migration |
| Scale/Scope | ~10 consuming components, 2 feature modules to migrate |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing imports | Medium | High | Phased migration with type aliases |
| Visual regressions from radius fix | Low | Medium | Fix inconsistency as part of migration |
| Missing edge cases in ThemedBackground | Low | Low | Component is simple, test thoroughly |

## Migration Strategy

1. **Create theming module** with types, provider, and components
2. **Add re-exports** in projects/events to maintain backward compatibility
3. **Update consumers** one at a time (start with step primitives)
4. **Remove old code** after all consumers migrated
5. **Fix radius inconsistency** during migration (editors will use shared constant)
