# Implementation Plan: Event Theme Editor

**Branch**: `015-event-theme-editor` | **Date**: 2026-01-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-event-theme-editor/spec.md`

## Summary

Create a theme editor for the event designer that allows users to customize the visual appearance of their event's guest-facing experience. The editor implements a 2-column layout with a live preview on the left and compact Figma-style controls on the right. The implementation includes:

1. A new **shared editor-controls module** (`@/shared/editor-controls/`) providing reusable Figma-style control components
2. A **theme domain module** (`@/domains/event/theme/`) containing the theme editor components, hooks, and containers
3. Integration with existing patterns: auto-save, tracked mutations, and the PreviewShell component

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19.2.0, TanStack Query 5.66.5, TanStack Router 1.132.0, React Hook Form, Zod 4.1.12
**Storage**: Firebase Firestore (client SDK) - updates to `event.draftConfig.theme`
**Testing**: Vitest (unit tests for editor controls and hooks)
**Target Platform**: Web (mobile-first responsive design)
**Project Type**: Web application - TanStack Start
**Performance Goals**: Real-time preview updates (<16ms), auto-save debounce (300ms)
**Constraints**: No new dependencies required (native color picker + existing shadcn components)
**Scale/Scope**: Single event theme editing, 4 editor control sections, ~15 new files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Editor controls will be responsive, preview uses PreviewShell with viewport switching |
| II. Clean Code & Simplicity | ✅ PASS | Reusable editor controls, follows existing patterns (auto-save, tracked mutations) |
| III. Type-Safe Development | ✅ PASS | Uses existing `themeSchema` from `@/shared/theming/schemas/theme.schemas.ts`, Zod validation |
| IV. Minimal Testing Strategy | ✅ PASS | Unit tests for editor controls and hooks, no E2E |
| V. Validation Gates | ✅ PASS | Will run `pnpm app:check` before commit, reviewed applicable standards |
| VI. Frontend Architecture | ✅ PASS | Client-first architecture, uses Firebase client SDK via existing mutation hooks |
| VII. Backend & Firebase | ✅ PASS | Uses existing `updateEventConfigField` action, no new backend code |
| VIII. Project Structure | ✅ PASS | Vertical slice architecture: `@/shared/editor-controls/` + `@/domains/event/theme/` |

**Applicable Standards Reviewed:**
- `standards/frontend/design-system.md` - All UI uses theme tokens
- `standards/frontend/component-libraries.md` - Uses shadcn/ui (Popover, Select, ToggleGroup, Slider), Radix UI, Lucide icons
- `standards/global/project-structure.md` - Follows domain structure with subdomains

## Project Structure

### Documentation (this feature)

```text
specs/015-event-theme-editor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── shared/
│   └── editor-controls/             # NEW: Reusable editor control components
│       ├── components/
│       │   ├── EditorSection.tsx    # Collapsible section with title
│       │   ├── EditorRow.tsx        # Inline label + control layout
│       │   ├── ColorPickerField.tsx # Color picker with hex input
│       │   ├── SelectField.tsx      # Select dropdown with label
│       │   ├── ToggleGroupField.tsx # Toggle group for enums
│       │   ├── SliderField.tsx      # Slider with value display
│       │   ├── MediaPickerField.tsx # Media upload with preview
│       │   └── index.ts
│       ├── types/
│       │   └── index.ts
│       └── index.ts
│
└── domains/event/
    └── theme/                       # NEW: Theme editor domain
        ├── components/
        │   ├── ThemePreview.tsx     # Display-only preview
        │   ├── ThemeControls.tsx    # Right panel controls
        │   └── index.ts
        ├── containers/
        │   ├── ThemeEditorPage.tsx  # 2-column layout container
        │   └── index.ts
        ├── hooks/
        │   ├── useUpdateTheme.ts    # Tracked mutation for theme
        │   ├── useUploadAndUpdateBackground.ts  # Upload + update
        │   └── index.ts
        ├── constants/
        │   ├── fonts.ts             # Available font options
        │   └── index.ts
        └── index.ts

# Route file
apps/clementine-app/src/app/routes/
└── workspace.$workspaceSlug.projects.$projectId.events.$eventId.theme.tsx
```

**Structure Decision**: Web application with domain-driven design. The theme editor is a subdomain of the event domain (`@/domains/event/theme/`), and the reusable editor controls are placed in shared (`@/shared/editor-controls/`) as they will be used across other editors (welcome section, settings, future editors).

## Complexity Tracking

> No violations identified. Implementation follows existing patterns and constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Implementation Phases

### Phase 0: Research (COMPLETE)

All research completed via codebase exploration:

1. **Theme Schema**: Located at `@/shared/theming/schemas/theme.schemas.ts`
   - Full schema with nested objects for text, button, background
   - Hex color validation via regex
   - `updateThemeSchema` for partial updates

2. **Preview Shell**: Located at `@/shared/preview-shell/`
   - Supports viewport switching (mobile/desktop)
   - Uses Zustand for viewport persistence
   - Provides `ViewportContext` to children

3. **Auto-Save Pattern**: Located at `@/shared/forms/hooks/useAutoSave.ts`
   - React Hook Form integration
   - Debounced save (300ms default)
   - Uses `getChangedFields()` for intelligent diffing

4. **Tracked Mutations**: Located at `@/domains/event/designer/hooks/useTrackedMutation.ts`
   - Wraps TanStack Query mutations
   - Tracks pending/completed state for UI indicators
   - Integrates with `useEventDesignerStore`

5. **Media Upload**: Located at `@/domains/media-library/hooks/useUploadMediaAsset.ts`
   - Handles Firebase Storage upload
   - Returns `{ mediaAssetId, url }`
   - Supports progress callback

6. **Event Designer Layout**: Located at `@/domains/event/designer/containers/EventDesignerPage.tsx`
   - 2-column layout with sidebar + outlet
   - Theme tab already configured in sidebar items

### Phase 1: Design & Contracts

**Prerequisites:** Phase 0 research complete ✅

#### Data Model

See [data-model.md](./data-model.md) for complete entity definitions.

**Primary Entity: Theme**
```typescript
interface Theme {
  fontFamily: string | null
  primaryColor: string // hex
  text: {
    color: string // hex
    alignment: 'left' | 'center' | 'right'
  }
  button: {
    backgroundColor: string | null // hex
    textColor: string // hex
    radius: 'none' | 'sm' | 'md' | 'full'
  }
  background: {
    color: string // hex
    image: string | null // URL
    overlayOpacity: number // 0-1
  }
}
```

**Storage Location**: `events/{eventId}/draftConfig.theme`

#### API Contracts

See [contracts/](./contracts/) for OpenAPI schemas.

**No new API endpoints required.** Uses existing:
- `updateEventConfigField(projectId, eventId, updates)` - Firestore client update

#### Component Contracts

**Editor Controls (Shared)**

| Component | Props | Description |
|-----------|-------|-------------|
| `EditorSection` | `title, children, defaultOpen?` | Collapsible section |
| `EditorRow` | `label, htmlFor?, children, stacked?` | Label + control layout |
| `ColorPickerField` | `label, value, onChange, nullable?` | Color picker with hex |
| `SelectField` | `label, value, onChange, options, placeholder?` | Select dropdown |
| `ToggleGroupField` | `label, value, onChange, options` | Toggle group for enums |
| `SliderField` | `label, value, onChange, min, max, step?, formatValue?` | Slider with display |
| `MediaPickerField` | `label, value, onChange, onUpload, accept?, removable?` | Media upload |

**Theme Editor (Domain)**

| Component | Props | Description |
|-----------|-------|-------------|
| `ThemePreview` | `theme` | Display-only preview |
| `ThemeControls` | `theme, onUpdate, onUploadBackground, disabled?` | All controls in sections |
| `ThemeEditorPage` | (route params) | 2-column container |

#### Hooks

| Hook | Arguments | Returns | Description |
|------|-----------|---------|-------------|
| `useUpdateTheme` | `projectId, eventId` | `TrackedMutation` | Theme field updates |
| `useUploadAndUpdateBackground` | `projectId, eventId, workspaceId, userId` | `TrackedMutation` | Upload + update combo |

### Phase 2: Implementation Tasks

See [tasks.md](./tasks.md) for detailed implementation tasks (generated via `/speckit.tasks` command).

**High-level task breakdown:**

1. **Shared Editor Controls Module** (~6 files)
   - EditorSection component
   - EditorRow component
   - ColorPickerField component
   - SelectField component
   - ToggleGroupField component
   - SliderField component
   - MediaPickerField component
   - Types and barrel exports

2. **Theme Domain Module** (~8 files)
   - useUpdateTheme hook
   - useUploadAndUpdateBackground hook
   - ThemePreview component
   - ThemeControls component
   - ThemeEditorPage container
   - fonts.ts constants
   - Types and barrel exports

3. **Route Integration** (~1 file)
   - Theme route file

4. **Testing** (~4 files)
   - Editor controls unit tests
   - Theme hooks unit tests

## Dependencies

### Existing Dependencies (No Installation Required)
- React Hook Form (form state)
- Zod (validation via existing schema)
- shadcn/ui components: Popover, Select, ToggleGroup, Slider, Button, Input
- Radix UI primitives (via shadcn)
- Lucide React (icons: AlignLeft, AlignCenter, AlignRight)
- Native browser `<input type="color" />` (no library needed)

### Internal Dependencies
- `@/shared/theming/schemas/theme.schemas.ts` - Theme schema
- `@/shared/preview-shell/` - PreviewShell component
- `@/shared/forms/hooks/useAutoSave.ts` - Auto-save pattern
- `@/domains/event/designer/hooks/useTrackedMutation.ts` - Mutation tracking
- `@/domains/media-library/hooks/useUploadMediaAsset.ts` - Media upload

## Design Decisions

### 1. Native Color Picker vs. Library

**Decision**: Use native `<input type="color" />` with custom hex input

**Rationale**:
- No additional dependency required
- Native picker is sufficient for hex color selection
- Custom hex input provides precise control
- Two-way sync is straightforward (native returns hex)

### 2. Editor Controls in Shared vs. Domain

**Decision**: Place editor controls in `@/shared/editor-controls/`

**Rationale**:
- Reusable across multiple editors (welcome, settings, future)
- Generic components with no business logic
- Follows project structure standard for shared code

### 3. Auto-Save vs. Manual Save

**Decision**: Use auto-save pattern from existing codebase

**Rationale**:
- Consistent with SharingSection implementation
- Real-time preview requires automatic saving
- 300ms debounce prevents excessive API calls
- Tracked mutations provide save indicator feedback

### 4. Form State Management

**Decision**: React Hook Form + useAutoSave

**Rationale**:
- Consistent with existing patterns
- Integrates well with Zod validation
- useWatch for real-time preview updates
- Clean separation of form state and persistence

## Out of Scope

Per spec.md:
- Reset to defaults functionality
- Project theme inheritance
- Secondary button styling
- Google Fonts integration
- Theme presets/templates

## Success Criteria

1. ✅ Users can modify all theme properties through the editor
2. ✅ Changes are reflected in real-time in the preview
3. ✅ Auto-save works reliably with 300ms debouncing
4. ✅ Save indicator shows correct pending/saved state
5. ✅ Editor controls are reusable for other editors
6. ✅ Background image upload integrates with media library
7. ✅ All code follows design system tokens (no hard-coded colors)
8. ✅ All code passes validation gates (`pnpm app:check`)
