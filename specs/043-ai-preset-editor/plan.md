# Implementation Plan: AI Preset Editor - Configuration

**Branch**: `043-ai-preset-editor` | **Date**: 2025-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/043-ai-preset-editor/spec.md`

## Summary

Build the AI Preset Editor configuration page (Phase 3 of AI Presets PRD). This implements a two-column layout editor with: editable preset name in breadcrumb, save status indicator, model/aspect ratio settings, media registry management, variable definitions with value mappings, and prompt template editor with @mention autocomplete. The editor follows the ExperienceDesignerLayout pattern with Save button (no Publish), auto-save with debouncing, and real-time persistence to Firestore.

**Scope Note**: Media registry uses a simplified upload-only approach via existing `MediaPickerField`. Full "browse from library" functionality is deferred to a separate feature (see `requirements/ai-presets/media-library-picker-prd.md`).

## Technical Context

**Language/Version**: TypeScript 5.7.2 (strict mode, ES2022 target)
**Primary Dependencies**: TanStack Start 1.132.0, React 19.2.0, TanStack Query 5.66.5, Zustand 5.x, React Hook Form 7.66.0, Zod 4.1.12
**Storage**: Firebase Firestore (client SDK) - collection `/workspaces/{workspaceId}/aiPresets/{presetId}`
**Testing**: Vitest (unit tests, coverage goal 70%+)
**Target Platform**: Web (desktop/tablet primary for editors, mobile-first guest experience)
**Project Type**: Web application (TanStack Start monorepo - apps/clementine-app)
**Performance Goals**: Page load < 2 seconds, @mention autocomplete < 200ms, save confirmation < 3 seconds
**Constraints**: Client-first architecture, real-time updates via Firestore listeners, SSR only for SEO/entry points
**Scale/Scope**: Single workspace editor, expected ~10-50 presets per workspace, ~10-20 variables per preset

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Design | ✅ PASS | Editor is desktop/tablet focused (admin tool), follows existing Experience Designer pattern |
| II. Clean Code & Simplicity | ✅ PASS | Reusing existing patterns (editor-status, auto-save, form fields), simplified media upload |
| III. Type-Safe Development | ✅ PASS | TypeScript strict mode, Zod validation for all inputs, existing AI Preset schemas |
| IV. Minimal Testing Strategy | ✅ PASS | Focus on critical paths (auto-save, @mention autocomplete), unit tests for resolution logic |
| V. Validation Gates | ✅ PASS | Will run format, lint, type-check before commits; standards compliance review |
| VI. Frontend Architecture | ✅ PASS | Client-first with Firebase SDK, TanStack Query for caching, Zustand for editor state |
| VII. Backend & Firebase | ✅ PASS | Client SDK for reads/real-time, transactions for writes, existing security rules |
| VIII. Project Structure | ✅ PASS | Vertical slice in domains/ai-presets/editor/, barrel exports, DDD pattern |

**Standards to Review Before Implementation**:
- `frontend/design-system.md` - Theme tokens, no hard-coded colors
- `frontend/component-libraries.md` - shadcn/ui patterns, accessibility
- `global/project-structure.md` - Feature module architecture
- `global/code-quality.md` - Validation workflows

## Project Structure

### Documentation (this feature)

```text
specs/043-ai-preset-editor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no API contracts, Firestore direct)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/clementine-app/src/
├── app/workspace/$workspaceSlug.ai-presets/
│   └── $presetId.tsx                    # Route (thin - imports container)
│
├── domains/ai-presets/
│   ├── editor/                          # NEW: Editor subdomain
│   │   ├── components/
│   │   │   ├── AIPresetNameBadge.tsx         # Editable name in breadcrumb
│   │   │   ├── ModelSettingsSection.tsx      # Model + aspect ratio dropdowns
│   │   │   ├── MediaRegistrySection.tsx      # Media grid + add/remove
│   │   │   ├── MediaRegistryItem.tsx         # Single media thumbnail
│   │   │   ├── AddMediaDialog.tsx            # Simple dialog with MediaPickerField
│   │   │   ├── VariablesSection.tsx          # Variable list + add/edit
│   │   │   ├── VariableCard.tsx              # Collapsible variable card
│   │   │   ├── VariableEditor.tsx            # Variable form (name, type, etc.)
│   │   │   ├── ValueMappingsEditor.tsx       # Value mappings table
│   │   │   ├── PromptTemplateEditor.tsx      # Rich text with @mentions
│   │   │   ├── MentionAutocomplete.tsx       # Autocomplete dropdown
│   │   │   └── index.ts                      # Barrel export
│   │   ├── containers/
│   │   │   ├── AIPresetEditorPage.tsx        # Main page container
│   │   │   ├── AIPresetEditorLayout.tsx      # Layout with TopNavBar (container, not component)
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── useAIPreset.ts                # Single preset fetch with real-time
│   │   │   ├── useUpdateAIPreset.ts          # Granular update mutation
│   │   │   └── index.ts
│   │   ├── stores/
│   │   │   ├── useAIPresetEditorStore.ts     # Save state tracking
│   │   │   └── index.ts
│   │   ├── schemas/
│   │   │   ├── ai-preset-editor.schemas.ts   # Editor-specific input schemas
│   │   │   └── index.ts
│   │   └── index.ts                          # Public API barrel
│   │
│   ├── hooks/                           # EXISTING: List hooks
│   │   └── ... (existing CRUD hooks)
│   └── components/                      # EXISTING: List components
│       └── ... (existing list components)
│
├── domains/media-library/               # EXISTING: No changes in this feature
│   ├── hooks/
│   │   └── useUploadMediaAsset.ts       # EXISTING - reuse for upload
│   └── ...
│
├── shared/
│   ├── editor-status/                   # EXISTING: Reuse
│   │   └── ... (createEditorStore, EditorSaveStatus, useTrackedMutation)
│   └── editor-controls/                 # EXISTING: Reuse
│       └── ... (TextField, SelectField, MediaPickerField)
│
└── ui-kit/ui/                           # EXISTING: shadcn/ui components
    └── ... (collapsible, select, dialog, etc.)
```

**Structure Decisions**:

1. **AIPresetEditorLayout in containers/**: Layout orchestrates state and composes multiple components - that's container behavior, following ExperienceDesignerLayout pattern.

2. **Simplified media upload**: Instead of a full Media Library Picker, use `MediaPickerField` in a simple `AddMediaDialog`. Same pattern as other editors. Full library browse/select deferred to separate feature.

3. **No changes to media-library domain**: Only reuse existing `useUploadMediaAsset` hook. Full picker is a separate feature.

## Complexity Tracking

No complexity violations detected. Implementation follows existing patterns:
- Editor layout pattern from ExperienceDesignerLayout
- Save state tracking from createEditorStore factory
- Auto-save from useAutoSave hook
- Form management from React Hook Form + Zod
- Real-time data from Firestore onSnapshot pattern
- Media upload from existing MediaPickerField + useUploadMediaAsset

## Phase 0: Research Summary

### Research Tasks Completed

1. **Existing Editor Patterns** - Reviewed ExperienceDesignerLayout for layout structure
2. **Save State Management** - Reviewed editor-status module (createEditorStore, useTrackedMutation)
3. **Auto-Save Pattern** - Reviewed useAutoSave hook implementation
4. **Form Field Components** - Reviewed editor-controls (TextField, SelectField, etc.)
5. **Media Upload Pattern** - Reviewed MediaPickerField and upload hooks
6. **AI Preset Schemas** - Reviewed existing schemas in packages/shared
7. **Rich Text/@Mention Requirements** - No existing implementation found

### Key Decisions

| Decision | Rationale | Alternatives Rejected |
|----------|-----------|----------------------|
| Rich text editor: Custom contentEditable with mentions | Lightweight, no additional dependencies, matches existing minimal approach | Slate.js/TipTap (heavy dependencies, overkill for simple @mentions) |
| **Simplified media upload (upload-only)** | Keep scope focused, ship faster, same pattern as other editors | Full library picker (scope creep, separate domain concern) |
| **Defer library picker to separate feature** | DDD: media-library domain owns that capability, separate PRD | Build inline (bloats scope, couples domains) |
| AIPresetEditorLayout in containers/ | Orchestrates state and composition - container behavior | components/ (inconsistent with ExperienceDesignerLayout pattern) |
| Collapsible variable cards | Keeps UI compact, shows summary by default, expands for editing | Always-expanded form (takes too much space with many variables) |
| Auto-save with debounce | Consistent with Experience Designer, immediate feedback, no explicit save needed | Explicit save only (worse UX, risk of data loss) |
| Single update mutation | Granular field updates for performance, partial update pattern | Full preset replacement on every change (wasteful, conflict-prone) |

### Dependencies Confirmed

| Component | Location | Notes |
|-----------|----------|-------|
| createEditorStore | @/shared/editor-status | Factory for save state Zustand store |
| useTrackedMutation | @/shared/editor-status | Wraps mutations for save tracking |
| EditorSaveStatus | @/shared/editor-status | Save status UI (spinner/checkmark) |
| useAutoSave | @/shared/forms | Debounced auto-save with field comparison |
| TextField, SelectField | @/shared/editor-controls | Form field components |
| MediaPickerField | @/shared/editor-controls | Single image upload (reuse in AddMediaDialog) |
| TopNavBar | @/domains/navigation | Top navigation with breadcrumbs |
| Dialog, Collapsible, Select | @/ui-kit/ui | shadcn/ui components |
| aiPresetSchema | @clementine/shared | AI Preset Zod schema |
| useUploadMediaAsset | @/domains/media-library | Existing upload hook |

### New Components Required

| Component | Location | Purpose | Complexity |
|-----------|----------|---------|------------|
| AIPresetEditorLayout | ai-presets/editor/containers | Main layout with TopNavBar, save status | Medium |
| AIPresetEditorPage | ai-presets/editor/containers | Page container with data fetching | Low |
| AIPresetNameBadge | ai-presets/editor/components | Inline editable preset name in breadcrumb | Medium |
| ModelSettingsSection | ai-presets/editor/components | Model + aspect ratio dropdowns | Low |
| MediaRegistrySection | ai-presets/editor/components | Grid of registered media with add/remove | Low |
| MediaRegistryItem | ai-presets/editor/components | Single media thumbnail with delete | Low |
| AddMediaDialog | ai-presets/editor/components | Dialog with MediaPickerField + name input | Low |
| VariablesSection | ai-presets/editor/components | List of variable cards with add | Low |
| VariableCard | ai-presets/editor/components | Collapsible card showing variable summary | Medium |
| VariableEditor | ai-presets/editor/components | Form for editing variable properties | Medium |
| ValueMappingsEditor | ai-presets/editor/components | Table of value→text mappings | Medium |
| PromptTemplateEditor | ai-presets/editor/components | Rich text area with @mention support | High |
| MentionAutocomplete | ai-presets/editor/components | Dropdown with filtered suggestions | Medium |

**Total**: 13 new components (all in ai-presets/editor/)

## Phase 1: Data Model & Contracts

### Data Model

See [data-model.md](./data-model.md) for complete entity definitions.

**Key Entities**:
- `AIPreset` - Main document (existing schema)
- `PresetVariable` - Discriminated union (text | image)
- `PresetMediaEntry` - Media registry entry with reference name
- `ValueMappingEntry` - Value→text mapping for text variables

### API Contracts

**N/A** - This feature uses Firebase Firestore directly via client SDK. No REST/GraphQL API contracts needed.

**Firestore Operations**:

| Operation | Method | Path | Notes |
|-----------|--------|------|-------|
| Read preset | onSnapshot | `/workspaces/{wid}/aiPresets/{pid}` | Real-time single doc |
| Update preset | updateDoc (transaction) | `/workspaces/{wid}/aiPresets/{pid}` | Partial updates |
| Upload media | existing service | `/workspaces/{wid}/mediaAssets` | Via useUploadMediaAsset |

### Quickstart

See [quickstart.md](./quickstart.md) for development setup and file creation guide.

---

## Deferred Features

The following are explicitly OUT OF SCOPE for this feature and documented in separate PRDs:

| Feature | PRD Location | Notes |
|---------|--------------|-------|
| Media Library Picker (browse/search/select) | `requirements/ai-presets/media-library-picker-prd.md` | Full library browse, pagination, search |

---

## Appendix: Design Decisions Log

Decisions made during planning discussions:

| Date | Topic | Decision | Context |
|------|-------|----------|---------|
| 2025-01-26 | Branch prefix | Use 043 instead of 001 | Align with existing numbering sequence |
| 2025-01-26 | Layout location | containers/ not components/ | Matches ExperienceDesignerLayout pattern |
| 2025-01-27 | Media registry | Upload-only via AddMediaDialog + MediaPickerField | Keep scope focused, ship faster |
| 2025-01-27 | Media Library Picker | Deferred to separate feature | DDD: media-library domain owns it, separate PRD created |
| 2025-01-26 | MediaPickerField | Reuse for simplified upload | Same pattern as other editors |
