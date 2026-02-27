# Implementation Plan: Create Tab Aspect Ratio Clarity

**Branch**: `082-create-tab-ar-clarity` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/082-create-tab-ar-clarity/spec.md`

## Summary

Reorganize the Create tab's per-type config forms (AI Image, AI Video, Photo) into two clearly labeled sections — **Subject Photo** (capture step + its AR) and **Output** (output AR + model/prompt) — so creators can instantly distinguish input AR from output AR. This is a frontend-only change: no schema, backend, or data model modifications.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict mode)
**Primary Dependencies**: React 19, TanStack Start 1.132, shadcn/ui, Radix UI, Tailwind CSS v4
**Storage**: N/A (UI-only — reads existing Firestore data via existing hooks)
**Testing**: Vitest (visual verification via dev server)
**Target Platform**: Web (mobile-first, 320px–768px primary viewport)
**Project Type**: Web application (monorepo — `apps/clementine-app/`)
**Performance Goals**: N/A (no new data fetching or computation)
**Constraints**: Mobile-first layout, design system token compliance, shadcn/ui patterns
**Scale/Scope**: 3 config forms modified, 1 optional shared component added

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | PASS | Two-section layout is simpler and clearer on mobile. Card-based sections stack vertically. |
| II. Clean Code & Simplicity | PASS | Reduces ambiguity by adding section labels. No new abstractions beyond optional shared section component. |
| III. Type-Safe Development | PASS | No schema changes. TypeScript discriminated union narrowing used for capture step type access. |
| IV. Minimal Testing Strategy | PASS | UI layout change — manual testing via dev server. No new critical paths. |
| V. Validation Gates | PASS | Will run `pnpm app:check` + `pnpm app:type-check` before commit. Standards compliance review for design system tokens. |
| VI. Frontend Architecture | PASS | Client-first. No new server code. Existing hooks/mutations unchanged. |
| VII. Backend & Firebase | N/A | No backend changes. |
| VIII. Project Structure | PASS | Changes stay within `domains/experience/create/` vertical slice. Barrel exports maintained. |

**Post-Phase 1 re-check**: PASS — no violations introduced during design.

## Project Structure

### Documentation (this feature)

```text
specs/082-create-tab-ar-clarity/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Data model (no changes — reference only)
├── quickstart.md        # Developer quickstart
├── contracts/           # No new API contracts (UI-only)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/clementine-app/src/domains/experience/create/
├── components/
│   ├── shared-controls/
│   │   ├── SubjectPhotoSection.tsx    # NEW — shared section for capture step + AR display
│   │   ├── AspectRatioSelector.tsx    # UNCHANGED
│   │   ├── SourceImageSelector.tsx    # UNCHANGED
│   │   └── index.ts                  # UPDATE — add SubjectPhotoSection export
│   ├── ai-image-config/
│   │   └── AIImageConfigForm.tsx      # MODIFY — reorganize into 2 sections
│   ├── ai-video-config/
│   │   └── AIVideoConfigForm.tsx      # MODIFY — reorganize into 2 sections
│   └── photo-config/
│       └── PhotoConfigForm.tsx        # MODIFY — reorganize into 2 sections
└── (all other files unchanged)
```

**Structure Decision**: All changes stay within the existing `domains/experience/create/` vertical slice. One new shared component (`SubjectPhotoSection`) is added to `shared-controls/` to avoid duplicating the section layout logic across three forms.

## Implementation Design

### New Component: SubjectPhotoSection

A shared section component that displays the capture step info with its AR:

**Props**:
- `captureStepId: string | null` — selected capture step ID
- `steps: ExperienceStep[]` — all experience steps
- `onCaptureStepChange: (id: string | null) => void` — callback for step change
- `showNoneOption?: boolean` — whether to show "None (prompt only)" (for text-to-image)
- `error?: string` — validation error

**Behavior**:
- Renders a labeled card/section with heading "Subject Photo"
- Filters steps to `capture.photo` type
- **1 capture step**: Shows step name + AR as static text
- **Multiple capture steps**: Shows SourceImageSelector dropdown
- **0 capture steps**: Shows helper text
- Shows capture step's AR (read from `step.config.aspectRatio`) as read-only info
- When `captureStepId` is null and `showNoneOption` is true: Shows "None (prompt only)"

### Modified Components

#### AIImageConfigForm

**Before**:
```
[TaskSelector]
[grid: SourceImageSelector | AspectRatioSelector]  (or [empty div | AspectRatioSelector] for text-to-image)
[PromptComposer with AR control]
```

**After**:
```
[TaskSelector]
[SubjectPhotoSection]  (hidden for text-to-image when captureStepId is null)
[Card: "Output"]
  [AspectRatioSelector]
  [PromptComposer WITHOUT AR control]
```

Key change: Stop passing `controls.aspectRatio` and `controls.onAspectRatioChange` to PromptComposer. The ControlRow already guards with `controls?.aspectRatio !== undefined`, so omitting it auto-hides the AR control.

#### AIVideoConfigForm

**Before**:
```
[AIVideoTaskSelector]
[grid: SourceImageSelector | AspectRatioSelector]
[PromptComposer]
[FrameGenerationSection(s)]
```

**After**:
```
[AIVideoTaskSelector]
[SubjectPhotoSection]
[Card: "Output"]
  [AspectRatioSelector (video options)]
  [PromptComposer]
  [FrameGenerationSection(s)]
```

#### PhotoConfigForm

**Before**:
```
[grid: SourceImageSelector | AspectRatioSelector]
```

**After**:
```
[SubjectPhotoSection]
[Card: "Output"]
  [AspectRatioSelector]
```

### Section Styling

Use simple `div` wrappers with design system tokens:

```tsx
{/* Subject Photo section */}
<div className="space-y-3">
  <h3 className="text-sm font-semibold text-muted-foreground">Subject Photo</h3>
  {/* content */}
</div>

{/* Output section */}
<div className="space-y-3">
  <h3 className="text-sm font-semibold text-muted-foreground">Output</h3>
  {/* content */}
</div>
```

No Card component needed — simple headings with spacing maintain visual separation while keeping the UI lightweight on mobile.

## Complexity Tracking

No constitution violations. No complexity justification needed.
