# Implementation Plan: Themed Primitives

**Branch**: `016-themed-primitives` | **Date**: 2026-01-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-themed-primitives/spec.md`

## Summary

Create reusable themed primitive components (`ThemedText`, `ThemedButton`) that consume event theme from context, define `MediaReference` schema as a shared type for media asset references, update theme background schema to use `MediaReference`, refactor existing components to use the new primitives and schema, and reorganize the `shared/theming/` directory structure.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19.2.0, TanStack Start 1.132.0, Zod 4.1.12, Tailwind CSS 4, Lucide React
**Storage**: Firebase Firestore (client SDK) - updates to `event.draftConfig.theme`
**Testing**: Vitest (unit tests for schemas and hooks)
**Target Platform**: Web (mobile-first, 320px-768px primary viewport)
**Project Type**: Web application (TanStack Start)
**Performance Goals**: Theme changes should be instant (<16ms), no layout shifts
**Constraints**: Must maintain backward compatibility with existing theme data in Firestore
**Scale/Scope**: 15-20 files modified/created, feature-complete themed primitives foundation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design ✅
- **Status**: PASS
- Themed primitives will be used primarily on guest mobile devices
- Touch targets already handled by existing button sizes (min 44x44px)
- No new responsive concerns - primitives inherit existing mobile-first patterns

### Principle II: Clean Code & Simplicity ✅
- **Status**: PASS
- YAGNI applied: Only `ThemedText` and `ThemedButton` primitives for now, not full component library
- Single Responsibility: Each primitive handles one concern (text styling, button styling)
- DRY: Extracting common theme-application logic into shared `useThemeWithOverride` hook

### Principle III: Type-Safe Development ✅
- **Status**: PASS
- All new schemas use Zod for runtime validation
- Types inferred from Zod schemas (single source of truth)
- No `any` types - full TypeScript strict mode compliance
- MediaReference schema provides validation for media asset references

### Principle IV: Minimal Testing Strategy ✅
- **Status**: PASS
- Unit tests for new schemas (MediaReference, updated theme schemas)
- Unit tests for `useThemeWithOverride` hook (error handling)
- No E2E - visual testing via manual verification in ThemePreview

### Principle V: Validation Gates ✅
- **Status**: PASS
- Format/lint/type-check will run before commit
- Standards compliance: Design system (no hardcoded colors - using theme tokens), component libraries (shadcn/ui patterns)

### Principle VI: Frontend Architecture ✅
- **Status**: PASS
- Client-first: All theming is client-side (no server rendering of themes)
- Real-time: Theme context provides instant updates
- No SSR concerns for themed primitives

### Principle VII: Backend & Firebase ✅
- **Status**: PASS
- Client SDK for reads/updates
- MediaReference stores both `mediaAssetId` (for tracking) and `url` (for fast rendering)
- No security rule changes needed

### Principle VIII: Project Structure ✅
- **Status**: PASS
- Vertical slice: Theme primitives live in `shared/theming/` (cross-domain shared)
- Barrel exports maintained
- Clear folder structure (`providers/`, `components/primitives/`, `components/inputs/`)

## Project Structure

### Documentation (this feature)

```text
specs/016-themed-primitives/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── shared/theming/                    # Shared theming module
│   ├── providers/                     # NEW - Provider components
│   │   ├── ThemeProvider.tsx          # MOVED from components/
│   │   └── index.ts
│   ├── components/
│   │   ├── primitives/                # NEW - Themed primitive components
│   │   │   ├── ThemedText.tsx         # NEW
│   │   │   ├── ThemedButton.tsx       # NEW
│   │   │   └── index.ts               # NEW
│   │   ├── inputs/                    # NEW - Placeholder for future inputs
│   │   │   └── index.ts               # NEW
│   │   ├── ThemedBackground.tsx       # MODIFIED - access image.url
│   │   └── index.ts                   # MODIFIED - update exports
│   ├── hooks/
│   │   ├── useThemeWithOverride.ts    # NEW - internal utility hook
│   │   └── index.ts                   # MODIFIED
│   ├── schemas/
│   │   ├── media-reference.schema.ts  # NEW
│   │   ├── theme.schemas.ts           # MODIFIED - use MediaReference
│   │   └── index.ts                   # MODIFIED
│   ├── types/
│   │   └── theme.types.ts             # MODIFIED - update ThemeBackground
│   └── index.ts                       # MODIFIED - update exports
├── domains/event/theme/
│   ├── components/
│   │   └── ThemePreview.tsx           # MODIFIED - use primitives
│   └── hooks/
│       └── useUploadAndUpdateBackground.ts  # MODIFIED - store MediaReference
```

**Structure Decision**: Using existing monorepo web application structure. All changes are within `apps/clementine-app/src/`. The `shared/theming/` module is being reorganized with `providers/` folder and `components/primitives/` subfolder. No new domains or packages needed.

## Complexity Tracking

> No violations of Constitution principles identified. All changes follow established patterns.

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion (2026-01-07)*

### Summary: ALL GATES PASS ✅

After completing data model design and research, all Constitution principles remain satisfied:

| Principle | Pre-Design | Post-Design | Notes |
|-----------|------------|-------------|-------|
| I. Mobile-First | ✅ PASS | ✅ PASS | Button sizes meet 44x44px touch target |
| II. Clean Code | ✅ PASS | ✅ PASS | Minimal primitives, shared hook, no over-engineering |
| III. Type-Safe | ✅ PASS | ✅ PASS | Zod schemas with inference, preprocess for migration |
| IV. Testing | ✅ PASS | ✅ PASS | Schema tests + hook tests planned |
| V. Validation Gates | ✅ PASS | ✅ PASS | Standard lint/type-check workflow |
| VI. Frontend Architecture | ✅ PASS | ✅ PASS | Client-first, no SSR for themes |
| VII. Backend & Firebase | ✅ PASS | ✅ PASS | Read-time normalization handles migration |
| VIII. Project Structure | ✅ PASS | ✅ PASS | Reorganized with clear folder hierarchy |

### Design Decisions Validated

1. **MediaReference Schema**: Follows existing `overlayReferenceSchema` pattern in codebase
2. **Read-Time Migration**: Uses Zod `preprocess` for backward compatibility - no breaking changes
3. **Component API**: Context-with-override pattern validated by research as best practice
4. **Inline Styles**: Consistent with existing `ThemedBackground` implementation

### No New Concerns Identified

The design phase did not reveal any new concerns or potential violations. The implementation can proceed as planned.
