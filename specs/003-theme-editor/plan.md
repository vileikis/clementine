# Implementation Plan: Theme Editor

**Branch**: `003-theme-editor` | **Date**: 2025-11-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-theme-editor/spec.md`

## Summary

Enable users to configure visual theme settings for events via the **Event → Design → Theme** page. The feature provides a unified interface for configuring colors, typography, buttons, and backgrounds with real-time preview and manual save workflow.

**Key Finding**: The core components are **already fully implemented** (ThemeEditor, PreviewPanel, ImageUploadField, server actions, validation schemas). This plan covers the remaining integration tasks: route setup, navigation update, and page wiring.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Next.js 16, React 19
**Primary Dependencies**: Tailwind CSS v4, shadcn/ui, Zod 4.x, sonner (toast)
**Storage**: Firebase Firestore (events collection), Firebase Storage (logos, backgrounds buckets)
**Testing**: Jest + React Testing Library (ThemeEditor has 556 lines of existing tests)
**Target Platform**: Web (mobile-first, 320px-768px primary viewport)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Preview updates < 100ms, save operations < 3 seconds
**Constraints**: Mobile-first responsive design, touch targets ≥ 44x44px
**Scale/Scope**: Single page with 5 configuration sections + preview panel

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Verify compliance with Clementine Constitution (`.specify/memory/constitution.md`):

- [x] **Mobile-First Responsive Design**: ThemeEditor uses responsive grid (lg:grid-cols-2), touch-friendly controls, mobile preview panel
- [x] **Clean Code & Simplicity**: Leverages existing components, minimal new code required (route + page only)
- [x] **Type-Safe Development**: TypeScript strict mode, Zod validation for all inputs via `updateEventThemeSchema`
- [x] **Minimal Testing Strategy**: ThemeEditor has comprehensive tests (556 lines), page integration follows established patterns
- [x] **Validation Loop Discipline**: Plan includes lint, type-check, test tasks before completion
- [x] **Firebase Architecture Standards**: Server action (`updateEventTheme`) uses Admin SDK, images stored as full public URLs
- [x] **Technical Standards**: Follows existing patterns in `standards/frontend/` and `standards/backend/firebase.md`

**Complexity Violations**: None. This feature uses existing infrastructure with minimal new code.

## Project Structure

### Documentation (this feature)

```text
specs/003-theme-editor/
├── plan.md              # This file
├── research.md          # Existing component analysis
├── data-model.md        # EventTheme type documentation
├── quickstart.md        # Development setup guide
├── contracts/           # N/A - uses existing server action
├── checklists/
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Task breakdown (created by /speckit.tasks)
```

### Source Code (repository root)

```text
web/src/
├── app/(dashboard)/events/[eventId]/(studio)/design/
│   ├── layout.tsx                    # Existing - Design section wrapper
│   ├── journeys/page.tsx             # Existing
│   ├── experiences/page.tsx          # Existing
│   └── theme/                        # NEW - renamed from branding
│       └── page.tsx                  # NEW - Server component with ThemeEditor
│
├── features/events/
│   ├── components/
│   │   ├── designer/
│   │   │   ├── ThemeEditor.tsx       # Existing - fully implemented
│   │   │   ├── ThemeEditor.test.tsx  # Existing - comprehensive tests
│   │   │   └── PreviewPanel.tsx      # Existing - mobile device frame
│   │   └── shared/
│   │       └── DesignSubTabs.tsx     # MODIFY - update "Branding" → "Theme"
│   ├── actions/events.ts             # Existing - updateEventTheme server action
│   ├── schemas/events.schemas.ts     # Existing - validation schema
│   └── types/event.types.ts          # Existing - EventTheme interface
│
├── components/shared/
│   └── ImageUploadField.tsx          # Existing - image upload component
│
└── hooks/
    └── useKeyboardShortcuts.ts       # Existing - Cmd+S / Ctrl+S support
```

**Structure Decision**: Uses existing Next.js App Router structure. Only changes are:
1. Rename `branding/` directory to `theme/`
2. Update page.tsx to render ThemeEditor
3. Update DesignSubTabs navigation label

## Existing Components Analysis

### ThemeEditor (COMPLETE)
- Location: `features/events/components/designer/ThemeEditor.tsx`
- State: `useReducer` with 10 action types
- Sections: Identity, Primary Color, Text, Button, Background
- Features: Live preview, keyboard shortcuts, toast notifications
- Tests: 556 lines of comprehensive coverage

### PreviewPanel (COMPLETE)
- Location: `features/events/components/designer/PreviewPanel.tsx`
- Aspect ratio: 9/19.5 (mobile device frame)
- Features: Scrollable content, responsive width

### Server Action (COMPLETE)
- Location: `features/events/actions/events.ts` (lines 270-395)
- Function: `updateEventTheme(eventId, data)`
- Validation: Zod schema with hex color regex
- Response: `ActionResponse<void>` with typed errors

### ImageUploadField (COMPLETE)
- Location: `components/shared/ImageUploadField.tsx`
- Destinations: "logos", "backgrounds"
- Features: Preview, remove, loading states, error handling

### useKeyboardShortcuts (COMPLETE)
- Location: `hooks/useKeyboardShortcuts.ts`
- Pattern: Object map of shortcut → handler

## Implementation Tasks

### Task 1: Rename Route Directory
- Rename `web/src/app/(dashboard)/events/[eventId]/(studio)/design/branding/` to `theme/`
- This changes the URL from `/events/{id}/design/branding` to `/events/{id}/design/theme`

### Task 2: Update Page Component
- Replace placeholder in `theme/page.tsx` with server component that:
  1. Fetches event using `getEventAction(eventId)`
  2. Handles error states (not found, permission denied)
  3. Renders `<ThemeEditor event={event} />`

### Task 3: Update Navigation
- Modify `DesignSubTabs.tsx`:
  - Change label from "Branding" to "Theme"
  - Update href from `/design/branding` to `/design/theme`

### Task 4: Validation Loop
- Run `pnpm lint` - fix any errors
- Run `pnpm type-check` - verify TypeScript
- Run `pnpm test` - ensure all tests pass
- Manual test in dev server

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Route rename breaks existing links | Low | No external links to branding route exist yet |
| ThemeEditor component issues | Low | Comprehensive test coverage exists |
| Firebase Storage permissions | Medium | Verify logos/backgrounds buckets are configured |

## Complexity Tracking

> No violations - feature uses existing infrastructure
