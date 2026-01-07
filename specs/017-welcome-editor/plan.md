# Implementation Plan: Welcome Editor

**Branch**: `017-welcome-editor` | **Date**: 2026-01-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/017-welcome-editor/spec.md`

## Summary

Implement a Welcome Editor for the event designer that allows admins to customize the welcome screen of their event's guest-facing experience. The editor follows a 2-column layout with a live preview on the left and compact Figma-style controls on the right. Uses auto-save with tracked mutations and leverages themed primitives for consistent preview styling.

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19.2.0, TanStack Query 5.66.5, React Hook Form, Zod 4.1.12
**Storage**: Firebase Firestore (client SDK) - updates to `event.draftConfig.welcome`
**Testing**: Vitest
**Target Platform**: Web (mobile-first responsive)
**Project Type**: TanStack Start monorepo application
**Performance Goals**: Page load < 2s on 4G, auto-save debounce 300ms
**Constraints**: Mobile-first (320px-768px primary), real-time preview updates
**Scale/Scope**: Single event editor, single welcome configuration per event

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | 2-column layout with responsive controls |
| II. Clean Code & Simplicity | ✅ PASS | Follows existing Theme Editor pattern exactly |
| III. Type-Safe Development | ✅ PASS | Zod schemas for all config, TypeScript strict mode |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on hooks and schema validation |
| V. Validation Gates | ✅ PASS | Will run pnpm app:check before commit |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase client SDK |
| VII. Backend & Firebase | ✅ PASS | Uses existing updateEventConfigField pattern |
| VIII. Project Structure | ✅ PASS | Vertical slice in domains/event/welcome/ |

**Standards Compliance:**
- `frontend/design-system.md` - Uses themed primitives (ThemedText, ThemedBackground)
- `frontend/component-libraries.md` - Uses shadcn/ui (Input, Textarea), editor-controls
- `global/project-structure.md` - Follows vertical slice architecture
- `global/zod-validation.md` - All config validated with Zod schemas

## Project Structure

### Documentation (this feature)

```text
specs/017-welcome-editor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - client-only feature)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── domains/event/
│   ├── shared/schemas/
│   │   └── project-event-config.schema.ts  # MODIFY: Add welcomeConfigSchema
│   └── welcome/                             # NEW: Welcome editor domain module
│       ├── components/
│       │   ├── WelcomePreview.tsx           # Display-only preview component
│       │   ├── WelcomeControls.tsx          # Right panel with all controls
│       │   └── index.ts
│       ├── containers/
│       │   ├── WelcomeEditorPage.tsx        # 2-column layout container
│       │   └── index.ts
│       ├── hooks/
│       │   ├── useUpdateWelcome.ts          # Mutation hook for welcome updates
│       │   ├── useUploadAndUpdateHeroMedia.ts  # Composite upload + update
│       │   └── index.ts
│       ├── schemas/
│       │   ├── welcome.schemas.ts           # Zod schemas for welcome config
│       │   └── index.ts
│       ├── constants/
│       │   ├── defaults.ts                  # DEFAULT_WELCOME constant
│       │   └── index.ts
│       └── index.ts                         # Public API exports
└── app/routes/                              # Route already exists, just needs import update
```

**Structure Decision**: Follows established vertical slice architecture matching `domains/event/theme/` pattern exactly. All welcome-related code encapsulated in `domains/event/welcome/` with proper barrel exports.

## Complexity Tracking

No complexity violations. This feature follows existing patterns exactly:
- Same 2-column editor pattern as Theme Editor
- Same auto-save approach with useAutoSave hook
- Same mutation tracking with useTrackedMutation
- Same theming primitives (ThemedText, ThemedBackground)
- Same editor controls (EditorSection, EditorRow, MediaPickerField, ToggleGroupField)

## Dependencies Analysis

### Prerequisite: 016-themed-primitives
**Status**: ✅ Complete (verified in codebase)
- `ThemedText` component: `@/shared/theming/components/primitives/ThemedText.tsx`
- `ThemedButton` component: `@/shared/theming/components/primitives/ThemedButton.tsx`
- `ThemedBackground` component: `@/shared/theming/components/ThemedBackground.tsx`
- `MediaReference` schema: `@/shared/theming/schemas/media-reference.schema.ts`

### Existing Infrastructure (ready to use)
- **Editor Controls**: EditorSection, EditorRow, MediaPickerField, ToggleGroupField @ `@/shared/editor-controls/`
- **Preview Shell**: PreviewShell @ `@/shared/preview-shell/`
- **Auto-save**: useAutoSave @ `@/shared/forms/`
- **Tracked Mutations**: useTrackedMutation @ `@/domains/event/designer/`
- **Event Data**: useProjectEvent @ `@/domains/event/shared/`
- **Config Updates**: updateEventConfigField @ `@/domains/event/shared/`
- **Media Upload**: useUploadMediaAsset @ `@/domains/media-library/`

## Implementation Approach

### Pattern Reference: Theme Editor
The Welcome Editor follows the exact same pattern as the Theme Editor:

1. **Container (WelcomeEditorPage)**:
   - Uses `useProjectEvent` to get event data
   - Uses `useForm` with `values` prop for server sync
   - Uses `useWatch` for live preview updates
   - Uses `useAutoSave` for debounced persistence
   - Uses `useTrackedMutation` wrapper for save indicator

2. **Preview (WelcomePreview)**:
   - Display-only component with theme prop
   - Uses ThemedBackground for container
   - Uses ThemedText for title/description
   - Shows hero media when present

3. **Controls (WelcomeControls)**:
   - Uses EditorSection for grouped controls
   - Uses EditorRow for individual fields
   - Uses shadcn/ui Input and Textarea
   - Uses MediaPickerField for hero image
   - Uses ToggleGroupField for layout selection

4. **Hooks**:
   - `useUpdateWelcome`: Same as useUpdateTheme but for welcome field
   - `useUploadAndUpdateHeroMedia`: Composite hook for media + config update

## Key Implementation Details

### Schema Integration
Add `welcomeConfigSchema` to `project-event-config.schema.ts`:
- Import `mediaReferenceSchema` from `@/shared/theming`
- Define welcomeConfigSchema with title, description, media, layout
- Add to projectEventConfigSchema as `welcome: welcomeConfigSchema.nullable().default(null)`

### Default Values
```typescript
export const DEFAULT_WELCOME: WelcomeConfig = {
  title: 'Choose your experience',
  description: null,
  media: null,
  layout: 'list',
}
```

### Update Pattern
Uses dot notation updates via `updateEventConfigField`:
```typescript
await updateEventConfigField(projectId, eventId, { welcome: validated })
```

### Auto-save Fields
```typescript
const WELCOME_FIELDS_TO_COMPARE: (keyof WelcomeConfig)[] = [
  'title',
  'description',
  'media',
  'layout',
]
```

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Theme Editor pattern divergence | Follow ThemeEditorPage.tsx line-by-line |
| MediaReference type mismatch | Use same schema from @/shared/theming |
| Auto-save race conditions | Existing useAutoSave handles this |
| Preview not updating | Use useWatch same as ThemeEditorPage |

## Out of Scope (per spec)

- Actual experience cards (placeholder only)
- Video hero media (images only)
- Multiple hero media / carousel
- Welcome animation/transitions
- A/B testing for welcome content

---

## Post-Design Constitution Re-evaluation

*Re-checked after Phase 1 design completion.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Mobile-First Design | ✅ PASS | Preview uses ThemedBackground with responsive content container |
| II. Clean Code & Simplicity | ✅ PASS | ~8 new files following exact Theme Editor pattern |
| III. Type-Safe Development | ✅ PASS | WelcomeConfig and UpdateWelcome schemas defined |
| IV. Minimal Testing Strategy | ✅ PASS | Schema validation tests, hook tests for critical paths |
| V. Validation Gates | ✅ PASS | pnpm app:check required before commit |
| VI. Frontend Architecture | ✅ PASS | Client SDK only, no server functions |
| VII. Backend & Firebase | ✅ PASS | updateEventConfigField with atomic updates |
| VIII. Project Structure | ✅ PASS | Vertical slice at domains/event/welcome/ |

**All gates passed. Ready for Phase 2 task generation.**
