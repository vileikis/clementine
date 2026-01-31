# Implementation Plan: Experience Runtime TopBar with Progress Tracking

**Branch**: `049-runtime-topbar` | **Date**: 2026-01-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/049-runtime-topbar/spec.md`

## Summary

Add a themed topbar component to the ExperienceRuntime container that displays the experience name, visual progress tracking, and a home navigation button with exit confirmation. The topbar will work across all runtime contexts (admin preview, guest pregate/main/preshare) while respecting context-specific behavior (home button inactive in preview mode, active with confirmation in guest modes). All UI components will use the existing theming system for visual consistency with other experience screens.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: React 19.2.0, TanStack Start 1.132.0, TanStack Router 1.132.0, Zustand 5.x (runtime store), Radix UI (AlertDialog for confirmation), Lucide React (icons)
**Storage**: N/A (reads from existing Zustand runtime store)
**Testing**: Vitest 3.0.5 with Testing Library
**Target Platform**: Web (mobile-first responsive, 320px-2560px)
**Project Type**: Web application (TanStack Start monorepo)
**Performance Goals**: TopBar renders instantly (<16ms), updates without flickering on step navigation, minimal layout shift
**Constraints**: Must work within existing theme system constraints, maintain 44px touch targets for mobile, support all theme color combinations
**Scale/Scope**: Single feature affecting 4 runtime contexts (preview + 3 guest pages), ~3 new components, ~200 LOC

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Mobile-First Design

✅ **PASS** - Feature explicitly designed for mobile-first
- TopBar uses 44px minimum touch target for home button (mobile requirement)
- Responsive layout specified for 320px-2560px range
- Progress bar scales appropriately on small screens
- All interactive elements meet mobile touch target requirements

### Principle II: Clean Code & Simplicity

✅ **PASS** - Simple component composition
- Reuses existing themed components (ThemedText, ThemedIconButton)
- Single new primitive (ThemedProgressBar) for progress display
- Simple container pattern for topbar layout
- No premature abstractions or complex state management
- Clear separation: topbar component + confirmation logic

### Principle III: Type-Safe Development

✅ **PASS** - Fully typed implementation
- TypeScript strict mode (already enabled in project)
- All props typed with interfaces
- Runtime validation via Zod schemas (existing session/step schemas)
- No `any` types required

### Principle IV: Minimal Testing Strategy

✅ **PASS** - Pragmatic test coverage
- Unit tests for ThemedProgressBar component (progress calculation)
- Integration tests for topbar rendering in different contexts
- Manual testing in dev for visual verification
- No E2E tests needed (UI-only feature)

### Principle V: Validation Gates

✅ **PASS** - Standard validation workflow
- Run `pnpm app:check` before commit (format + lint)
- TypeScript type-check via `pnpm type-check`
- Vitest tests via `pnpm test`
- Standards compliance review (design system, component libraries)

**Applicable Standards for Review**:
- `frontend/design-system.md` - Theme token usage, no hard-coded colors
- `frontend/component-libraries.md` - shadcn/ui and Radix UI patterns
- `frontend/accessibility.md` - WCAG AA compliance for contrast/interactions
- `global/project-structure.md` - Component organization in shared/theming
- `global/code-quality.md` - Clean code principles

### Principle VI: Frontend Architecture

✅ **PASS** - Client-first pattern
- Reads from Zustand store (client-side state)
- No server-side rendering needed (component is client-only)
- No Firestore queries (uses existing runtime store data)
- Pure UI component with local state only

### Principle VII: Backend & Firebase

✅ **N/A** - No backend interaction
- Feature is pure client-side UI
- No Firestore operations
- No Firebase Admin SDK usage
- No security rule changes needed

### Principle VIII: Project Structure

✅ **PASS** - Follows vertical slice architecture
- New ThemedProgressBar in `shared/theming/components/primitives/` (shared primitive)
- TopBar component in `domains/experience/runtime/components/` (runtime UI)
- Confirmation dialog uses existing Radix UI AlertDialog pattern
- Barrel exports maintained for all modules

**Post-Design Re-evaluation**: ✅ **ALL PRINCIPLES PASS**

After completing Phase 1 design (data-model.md, contracts/, quickstart.md):

- ✅ **Mobile-First**: Progress bar 1.5px height, 44px touch targets, responsive layout
- ✅ **Simplicity**: 2 components (ThemedProgressBar, RuntimeTopBar), minimal abstraction
- ✅ **Type-Safe**: Full TypeScript interfaces defined, no `any` types
- ✅ **Testing**: Unit tests defined for both components, integration test patterns documented
- ✅ **Validation**: Standard validation workflow (check + type-check + test)
- ✅ **Client-First**: Pure UI components, read-only store access, no backend calls
- ✅ **Firebase**: N/A (no backend interaction)
- ✅ **Structure**: Follows vertical slice (shared/theming + runtime domain)

**No constitution violations detected. Implementation can proceed.**

## Project Structure

### Documentation (this feature)

```text
specs/049-runtime-topbar/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (theming system patterns, Radix Progress, navigation best practices)
├── data-model.md        # Phase 1 output (component props interfaces, state management)
├── quickstart.md        # Phase 1 output (how to use topbar in runtime contexts)
├── contracts/           # Phase 1 output (component API contracts)
│   ├── themed-progress-bar-api.md
│   └── runtime-topbar-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── shared/theming/
│   └── components/
│       └── primitives/
│           ├── ThemedProgressBar.tsx        # NEW: Themed progress indicator
│           └── ThemedProgressBar.test.tsx   # NEW: Unit tests (collocated)
│
├── domains/experience/runtime/
│   ├── components/
│   │   ├── RuntimeTopBar.tsx                # NEW: Main topbar container
│   │   ├── RuntimeTopBar.test.tsx           # NEW: Integration tests (collocated)
│   │   └── index.ts                         # UPDATE: Export RuntimeTopBar
│   │
│   └── containers/
│       └── ExperienceRuntime.tsx            # UPDATE: Add topbar rendering
│
└── domains/guest/
    ├── containers/
    │   ├── PregatePage.tsx                  # UPDATE: Pass onHomeClick handler
    │   ├── ExperiencePage.tsx               # UPDATE: Pass onHomeClick handler
    │   └── PresharePage.tsx                 # UPDATE: Pass onHomeClick handler
    │
    └── hooks/
        └── useNavigateHome.ts               # NEW: Shared home navigation hook
```

**Structure Decision**: Using existing TanStack Start monorepo structure with domain-driven organization. ThemedProgressBar goes in `shared/theming` as a reusable primitive (follows pattern of ThemedText, ThemedButton). RuntimeTopBar goes in `domains/experience/runtime/components` as it's specific to the runtime context. Guest page updates are minimal (just passing callback props).

## Complexity Tracking

> **No Constitution violations detected** - all principles pass cleanly. This feature follows established patterns and introduces minimal complexity.



## Planning Phase Complete

**Status**: ✅ All phases complete, ready for implementation

### Phase 0: Research ✅
- **research.md**: Theming system patterns, Radix UI Progress, navigation/confirmation patterns
- **Decisions**: Use Radix Progress with themed styling, TanStack Router navigation, AlertDialog confirmation
- **All unknowns resolved**: No NEEDS CLARIFICATION markers remain

### Phase 1: Design & Contracts ✅
- **data-model.md**: Component interfaces, prop types, store integration patterns
- **contracts/themed-progress-bar-api.md**: Complete API contract with examples and edge cases
- **contracts/runtime-topbar-api.md**: Complete API contract with usage patterns
- **quickstart.md**: Integration guide for preview and guest modes
- **Agent context updated**: CLAUDE.md updated with feature technologies

### Constitution Re-Validation ✅
- All 8 principles pass cleanly
- No complexity violations
- Standards compliance verified
- Implementation can proceed without concerns

### Next Steps

Run `/speckit.tasks` to generate the implementation task breakdown, or proceed directly to implementation using the design artifacts:

1. **Create ThemedProgressBar** (shared/theming/components/primitives/)
   - Follow contract: `themed-progress-bar-api.md`
   - Test coverage: Progress calculation, theme application, edge cases

2. **Create RuntimeTopBar** (domains/experience/runtime/components/)
   - Follow contract: `runtime-topbar-api.md` (kebab-case filename, PascalCase component)  
   - Test coverage: Rendering, home button states, progress updates

3. **Integrate into ExperienceRuntime** (domains/experience/runtime/containers/)
   - Add topbar above step content
   - Pass context-specific props

4. **Update Guest Pages** (domains/guest/containers/)
   - Add home navigation handlers
   - Add confirmation dialogs
   - Test in all 3 contexts (pregate, main, preshare)

5. **Validation & Testing**
   - Run `pnpm app:check` (format + lint)
   - Run `pnpm type-check` (TypeScript)
   - Run `pnpm test` (unit + integration tests)
   - Manual test on mobile (320px-768px)
   - Screen reader test (VoiceOver/NVDA)
   - Theme compatibility test (light/dark, high contrast)

**Estimated Effort**: ~200 LOC, 2-3 hours implementation + 1 hour testing

---

**Plan Version**: 1.0.0
**Last Updated**: 2026-01-30
**Ready for**: Implementation (`/speckit.tasks` or direct coding)
