# Implementation Plan: Themed Component Polish

**Branch**: `087-themed-component-polish` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/087-themed-component-polish/spec.md`

## Summary

Make themed components (buttons, text, progress bar, top bar) visually correct across all guest experience surfaces — from themed welcome screens through dark camera capture to the share page. Introduces a `surface` prop on themed primitives, replaces the fragile outline variant with solid colors, decouples the top bar from runtime state for reuse on the share page, themes the exit dialog, and fixes list layout card width.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode)
**Primary Dependencies**: React 19, TanStack Start, shadcn/ui (Radix UI AlertDialog), Zustand, Lucide React
**Storage**: N/A — no data persistence changes
**Testing**: Vitest + Testing Library (existing RuntimeTopBar tests to update)
**Target Platform**: Mobile-first web (320px–768px primary, desktop secondary)
**Project Type**: Web application (monorepo — `apps/clementine-app/`)
**Performance Goals**: No performance impact — styling-only changes, no new renders or state
**Constraints**: Zero visual regression on existing auto-surface callsites (default prop = 'auto')
**Scale/Scope**: ~15 files modified, 0 new files created (rename only), frontend-only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ Pass | All changes target the mobile guest experience. Touch targets preserved (44px icon buttons). |
| II. Clean Code & Simplicity | ✅ Pass | StepRenderTraits is a simple declarative map. Surface prop is a single optional enum. No new abstractions beyond what's needed. |
| III. Type-Safe Development | ✅ Pass | All new types are explicit (`Surface`, `StepRenderTraits`, `ExperienceTopBarProps`). No `any` escapes. |
| IV. Minimal Testing Strategy | ✅ Pass | Update existing RuntimeTopBar tests for new props interface. No new test files needed. |
| V. Validation Gates | ✅ Pass | Will run `pnpm check` + `pnpm type-check` + `pnpm test`. Standards compliance review for design-system.md. |
| VI. Frontend Architecture | ✅ Pass | Client-first. No server changes. All theme data already available client-side. |
| VII. Backend & Firebase | ✅ N/A | No backend or Firestore changes. |
| VIII. Project Structure | ✅ Pass | All files stay in existing domain locations. Rename follows vertical slice naming (ExperienceTopBar in experience/runtime/). Barrel exports updated. |

**Post-Phase-1 Re-check**: All gates still pass. No new dependencies, no new abstractions, no backend work.

## Project Structure

### Documentation (this feature)

```text
specs/087-themed-component-polish/
├── plan.md              # This file
├── research.md          # Phase 0 output — technical decisions
├── data-model.md        # Phase 1 output — type definitions
├── quickstart.md        # Phase 1 output — dev setup guide
├── contracts/           # Phase 1 output — N/A (frontend-only)
│   └── README.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── shared/theming/
│   ├── components/primitives/
│   │   ├── ThemedButton.tsx          # Add surface prop, redesign outline variant
│   │   ├── ThemedIconButton.tsx      # Add surface prop, redesign outline variant
│   │   ├── ThemedText.tsx            # Add surface prop
│   │   ├── ThemedProgressBar.tsx     # Add surface prop
│   │   └── index.ts                  # Export Surface type
│   ├── types/
│   │   └── theme.types.ts            # Add Surface type
│   └── index.ts                      # Re-export Surface type
├── domains/experience/runtime/
│   ├── components/
│   │   ├── ExperienceTopBar.tsx      # Renamed from RuntimeTopBar, props-driven
│   │   ├── ExperienceTopBar.test.tsx # Updated tests
│   │   └── index.ts                  # Updated exports
│   └── containers/
│       └── ExperienceRuntime.tsx     # StepRenderTraits, pass surface to top bar
├── domains/experience/steps/renderers/CapturePhotoRenderer/
│   └── components/
│       ├── CameraActive.tsx          # Pass surface="dark" to themed children
│       ├── PhotoPreview.tsx          # Pass surface="dark" to themed children
│       └── UploadProgress.tsx        # Pass surface="dark" to ThemedText + Loader2
├── domains/guest/containers/
│   └── SharePage.tsx                 # Add ExperienceTopBar
└── domains/project-config/welcome/components/
    └── WelcomeRenderer.tsx           # Fix list layout width
```

**Structure Decision**: All modifications are to existing files within established domain boundaries. The only "new" file is the rename of `RuntimeTopBar.tsx` → `ExperienceTopBar.tsx` (with corresponding test file rename). No new domains, subdomains, or structural changes needed.

## Implementation Strategy

### Phase A: Surface-Aware Themed Primitives (Foundation)

**Goal**: Add `surface` prop to all themed primitives with backward-compatible defaults.

1. **Define Surface type** in `shared/theming/types/theme.types.ts`
2. **ThemedButton** — Add `surface` prop, implement new outline color logic for both surfaces
3. **ThemedIconButton** — Same changes as ThemedButton
4. **ThemedText** — Add `surface` prop; dark surface → white text
5. **ThemedProgressBar** — Add `surface` prop; dark surface → white track/indicator
6. **Update barrel exports** — Export `Surface` type from primitives and theming barrels

**Validation**: `pnpm type-check` passes. Existing callsites unchanged (default `surface='auto'`).

### Phase B: ExperienceTopBar Refactor (Decoupling)

**Goal**: Rename RuntimeTopBar → ExperienceTopBar, accept props instead of reading from store.

1. **Rename file** `RuntimeTopBar.tsx` → `ExperienceTopBar.tsx`
2. **Refactor to props-driven API** — Remove `useRuntime()` dependency, accept `ExperienceTopBarProps`
3. **Add surface forwarding** — Pass `surface` to all themed children
4. **Theme the exit dialog** — Use `theme.background.color`, `theme.text.color`, ThemedButton for actions, max-w-sm
5. **Update barrel exports** in `runtime/components/index.ts`
6. **Update tests** — Rename test file, update to pass props instead of mocking store

**Validation**: Tests pass. `pnpm type-check` passes.

### Phase C: StepRenderTraits + Runtime Integration (Wiring)

**Goal**: ExperienceRuntime uses traits to configure layout, surface, and navigation per step.

1. **Define StepRenderTraits** and traits map in ExperienceRuntime
2. **Replace `STEPS_WITH_CUSTOM_NAVIGATION`** with traits-based logic
3. **Pass traits.surface** to `<ExperienceTopBar surface={traits.surface} .../>`
4. **Derive all ExperienceTopBar props** from runtime state (title, progress, onBack, onClose)

**Validation**: Guest experience flow works identically. `pnpm type-check` passes.

### Phase D: Capture Step Surface Awareness (Dark Surface)

**Goal**: Camera and preview components use dark surface styling.

1. **CameraActive** — Replace hardcoded `text-white/70` labels with `<ThemedText surface="dark">`, pass `surface="dark"` to all ThemedIconButton instances
2. **PhotoPreview** — Pass `surface="dark"` to ThemedButton instances (retake + continue)
3. **UploadProgress** — Pass `surface="dark"` to ThemedText ("Saving your photo..." label)

**Validation**: Light-themed experience → capture step controls visible on dark camera background.

### Phase E: SharePage TopBar + WelcomeRenderer Fix (Finishing)

**Goal**: Share page gets navigation; list layout cards stretch full width.

1. **SharePage** — Add `<ExperienceTopBar title={...} onClose={handleStartOver} />`
2. **WelcomeRenderer** — Fix list layout cards to occupy full container width in run mode

**Validation**: Share page shows top bar with home navigation. List layout cards are full-width.

## Complexity Tracking

No constitution violations. No complexity justification needed.
