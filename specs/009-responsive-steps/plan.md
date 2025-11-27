# Implementation Plan: Responsive Steps

**Branch**: `009-responsive-steps` | **Date**: 2025-11-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-responsive-steps/spec.md`

## Summary

Make all 11 step types fully responsive for mobile and desktop devices. Mobile uses native app-like layout with fixed bottom CTA and scrollable content. Desktop uses Typeform-style centered container with inline CTA. Implementation focuses on refactoring StepLayout primitive and creating a new ActionBar component, then updating all step components to use responsive patterns.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 16
**Primary Dependencies**: Tailwind CSS v4, shadcn/ui, lucide-react
**Storage**: N/A - UI-only changes, no new data storage
**Testing**: Jest with React Testing Library (unit tests for critical paths)
**Target Platform**: Web (mobile browsers 320px-428px, tablets 768px-1024px, desktop 1024px+)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Layout transitions smooth at 60fps, no layout shift on viewport changes
**Constraints**: Must work within existing theme system, no breaking changes to step data model
**Scale/Scope**: 11 step types, 6 primitives, 1 new component (ActionBar)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: Feature designed mobile-first (320px-768px), touch targets ≥44x44px (existing), readable typography (≥14px body, ≥16px inputs)
- [x] **Clean Code & Simplicity**: No premature optimization, YAGNI applied - only modifying what's needed for responsiveness, single responsibility maintained
- [x] **Type-Safe Development**: TypeScript strict mode, no `any` escapes, existing Zod validation unchanged
- [x] **Minimal Testing Strategy**: Will add Jest unit tests for ActionBar component and responsive layout logic
- [x] **Validation Loop Discipline**: Plan includes validation tasks (lint, type-check, test) before completion
- [x] **Firebase Architecture Standards**: N/A - UI-only changes, no Firebase modifications
- [x] **Feature Module Architecture**: Components remain in existing locations (step-primitives, features/steps)
- [x] **Technical Standards**: Applicable standards from `standards/frontend/responsive.md` and `standards/frontend/css.md` reviewed

**Complexity Violations**: None - this feature follows existing patterns and enhances them with responsive utilities.

## Project Structure

### Documentation (this feature)

```text
specs/009-responsive-steps/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A for this feature)
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality validation
```

### Source Code (repository root)

```text
web/src/
├── components/
│   └── step-primitives/
│       ├── ActionBar.tsx       # NEW: Fixed bottom container for mobile
│       ├── ActionButton.tsx    # MODIFY: Responsive sizing
│       ├── StepLayout.tsx      # MODIFY: Major refactor for responsive container
│       ├── OptionButton.tsx    # Review for responsive adjustments
│       ├── ScaleButton.tsx     # Review for responsive adjustments
│       ├── TextInput.tsx       # Verify 16px font for iOS
│       ├── TextArea.tsx        # Verify 16px font for iOS
│       └── index.ts            # Update exports
│
├── features/steps/
│   └── components/
│       └── preview/
│           └── steps/
│               ├── InfoStep.tsx             # MODIFY: Use ActionBar pattern
│               ├── ShortTextStep.tsx        # MODIFY: Use ActionBar pattern
│               ├── LongTextStep.tsx         # MODIFY: Use ActionBar pattern
│               ├── MultipleChoiceStep.tsx   # MODIFY: Responsive columns
│               ├── YesNoStep.tsx            # MODIFY: Use ActionBar pattern
│               ├── OpinionScaleStep.tsx     # MODIFY: Responsive button sizing
│               ├── EmailStep.tsx            # MODIFY: Use ActionBar pattern
│               ├── ExperiencePickerStep.tsx # MODIFY: Responsive grid columns
│               ├── CaptureStep.tsx          # MODIFY: Responsive image sizing
│               ├── ProcessingStep.tsx       # MODIFY: Responsive spinner/progress
│               └── RewardStep.tsx           # MODIFY: Responsive image/buttons
│
└── app/
    └── globals.css             # ADD: Safe area CSS custom properties
```

**Structure Decision**: Follows existing feature module architecture. New ActionBar component added to step-primitives. All step components modified in-place.

## Complexity Tracking

No complexity violations - using standard Tailwind responsive patterns.

## Implementation Phases

### Phase 1: Core Primitives (StepLayout + ActionBar)

1. **Update `globals.css`**: Add safe area CSS custom properties
   ```css
   :root {
     --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
   }
   ```

2. **Create `ActionBar.tsx`**: New component for mobile fixed bottom / desktop inline
   - Mobile: `fixed bottom-0 inset-x-0 p-4 pb-safe bg-gradient-to-t from-background`
   - Desktop: `lg:static lg:p-0 lg:bg-transparent`
   - Accepts `children` slot for CTA button(s)

3. **Refactor `StepLayout.tsx`**: Major responsive container refactor
   - Mobile: Full height, scrollable content, action slot at bottom
   - Desktop: Centered container with max-width, inline action
   - Uses `min-h-dvh` with `vh` fallback
   - Horizontal centering: `lg:items-center lg:justify-center`
   - Max width: `lg:max-w-xl` (640px)

4. **Update `ActionButton.tsx`**: Responsive sizing
   - Mobile: `w-full py-4 text-base` (large touch target)
   - Desktop: `lg:w-auto lg:min-w-[200px] lg:py-3` (inline sizing)

### Phase 2: Input Primitives

5. **Verify `TextInput.tsx`**: Ensure `text-base` (16px) to prevent iOS zoom
6. **Verify `TextArea.tsx`**: Ensure `text-base` (16px) to prevent iOS zoom
7. **Review `OptionButton.tsx`**: Confirm 44px minimum touch target
8. **Review `ScaleButton.tsx`**: Confirm 44px minimum, adjust gap for mobile

### Phase 3: Simple Steps (Info, ShortText, LongText, Email, YesNo)

9. **Update each step**: Use new StepLayout + ActionBar pattern
   - Wrap CTA in ActionBar component
   - Content uses flex-1 for scrollable area
   - Mobile padding: `px-4`
   - Desktop padding: `lg:px-6`

### Phase 4: Complex Steps (MultipleChoice, OpinionScale, ExperiencePicker)

10. **MultipleChoiceStep.tsx**: Responsive column layout
    - Mobile: Single column `space-y-2`
    - Desktop (>4 options): `lg:grid lg:grid-cols-2 lg:gap-2`

11. **OpinionScaleStep.tsx**: Responsive button sizing
    - Mobile: `flex flex-wrap gap-2` with 44px buttons
    - Desktop: `lg:flex-nowrap lg:gap-3` with 48px buttons

12. **ExperiencePickerStep.tsx**: Responsive grid columns
    - Grid mode: Mobile `grid-cols-2`, Desktop `lg:grid-cols-3`
    - Maintain existing list and carousel behavior

### Phase 5: Special Steps (Capture, Processing, Reward)

13. **CaptureStep.tsx**: Responsive image sizing
    - Mobile: ~70% width
    - Desktop: ~50% width, max-w constraint

14. **ProcessingStep.tsx**: Responsive spinner/progress
    - Spinner: Mobile `w-12 h-12` (48px), Desktop `lg:w-16 lg:h-16` (64px)
    - Progress bar: Mobile `w-[80%]`, Desktop `lg:w-[60%] lg:max-w-[400px]`

15. **RewardStep.tsx**: Responsive image and buttons
    - Image: Mobile ~70%, Desktop ~50% max 300px
    - Share buttons: Mobile grid, Desktop inline row

### Phase 6: Validation & Testing

16. **Run validation loop**: `pnpm lint && pnpm type-check`
17. **Add unit tests**: ActionBar, StepLayout responsive behavior
18. **Manual testing**: All 11 step types on mobile and desktop viewports

## Key Technical Decisions

### Breakpoint Strategy
- Use `lg:` prefix (1024px) as primary breakpoint
- Mobile layout is default (mobile-first)
- Tablet (768px-1023px) uses desktop layout per spec

### Safe Area Handling
- Use CSS `env(safe-area-inset-bottom)` for notch devices
- Custom `.pb-safe` utility class with fallback
- ActionBar includes gradient for scroll visibility

### CTA Positioning Pattern
- Mobile: ActionBar wraps CTA with fixed positioning
- Desktop: ActionBar renders inline, CTA flows with content
- Single component handles both layouts

### Scroll Behavior
- Mobile: Content area uses `flex-1 overflow-y-auto` with momentum scrolling
- Desktop: Natural page scroll, no fixed elements

## Constitution Check (Post-Design)

_Re-evaluated after Phase 1 design artifacts completed._

All constitution principles continue to pass:

- [x] **Mobile-First Responsive Design**: Design artifacts confirm mobile-first approach with `lg:` breakpoint for desktop enhancements
- [x] **Clean Code & Simplicity**: ActionBar is single-purpose, StepLayout refactor is minimal and necessary
- [x] **Type-Safe Development**: Component interfaces defined with TypeScript, no schema changes needed
- [x] **Minimal Testing Strategy**: Testing plan focuses on ActionBar and layout behavior only
- [x] **Validation Loop Discipline**: Phase 6 includes lint, type-check, and test validation
- [x] **Firebase Architecture Standards**: N/A - confirmed no Firebase changes in data-model.md
- [x] **Feature Module Architecture**: Components remain in existing locations per project structure
- [x] **Technical Standards**: Research.md confirms alignment with responsive and CSS standards

**Post-Design Status**: ✓ All gates pass. Ready for `/speckit.tasks` to generate implementation tasks.
