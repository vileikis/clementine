# AI Presets - PRD Phases

## Status: Active Implementation (Phase 4)

**Created**: 2025-01-26
**Last Updated**: 2025-01-28
**Current Phase**: Phase 4 - AI Preset Editor Preview
**Completed Phases**: 1 (Foundation), 2 (List Page), 3 (Editor Configuration)

---

## Overview

This document outlines the phased implementation plan for AI Presets. The feature is broken into incremental phases that deliver value progressively while managing complexity.

### Implementation Progress

- ✅ **Phase 1-2**: Foundation and List Page (Complete)
  - AI Preset data model and CRUD operations
  - Workspace-level preset list with search and management
- ✅ **Phase 3**: Editor Configuration (Complete - 2025-01-28)
  - Lexical-based prompt template editor with `@{type:name}` references
  - Media registry management (upload-based)
  - Variable definitions with value mappings
  - Model and aspect ratio settings
  - Auto-save with save status tracking
- 🔄 **Phase 4**: Editor Preview (In Progress)
  - Test inputs form
  - Live prompt resolution
  - Media preview grid
  - Validation display
  - Test generation button (UI placeholder)
- ⏳ **Phase 5**: Test Generation (Pending)
- ⏳ **Phase 6**: Pipeline Integration (Pending)

---

## Phase 1: AI Presets Foundation

### Objective

Establish the data model and basic CRUD operations for AI Presets.

### Scope

#### 1.1 Data Model & Schema

- [x] Create AI Preset Zod schema in `packages/shared`
- [x] Define Firestore document structure
- [x] Add TypeScript types

#### 1.2 Firestore Setup

- [x] Create collection path: `/workspaces/{workspaceId}/aiPresets/{presetId}`
- [x] Add security rules (workspace member read, admin write)

#### 1.3 Basic API Layer

- [x] Create preset service with CRUD operations:
  - `createPreset(workspaceId, data)`
  - `getPreset(workspaceId, presetId)`
  - `updatePreset(workspaceId, presetId, data)`
  - `deletePreset(workspaceId, presetId)`
  - `listPresets(workspaceId)`
  - `duplicatePreset(workspaceId, presetId, newName)`
- [x] Add React Query hooks for data fetching

### Deliverables

- Schema defined and documented
- Firestore collection created with rules
- Service layer with hooks ready for UI

### Dependencies

- Existing workspace infrastructure
- Firestore setup

---

## Phase 2: AI Presets List Page

### Objective

Create the workspace-level page to view and manage AI Presets.

### Scope

#### 2.1 Routing

- [x] Add route: `/workspace/:workspaceSlug/ai-presets`
- [x] Add navigation link in workspace sidebar

#### 2.2 List Page UI

- [x] Page header with title and "Create Preset" button
- [ ] Search/filter input
- [x] Preset cards showing:
  - Name
  - Description
  - Model
  - Aspect Ratio
  - Variable count
  - Media count
  - Last updated timestamp
- [x] Empty state for no presets
- [x] Loading state

#### 2.3 Preset Actions

- [x] Create new preset (opens editor with blank preset)
- [x] Duplicate preset (creates copy with "Copy of" prefix)
- [x] Rename preset (inline edit or modal)
- [x] Delete preset (with confirmation dialog)

#### 2.4 Navigation

- [x] Click preset card → navigate to preset editor page

### Deliverables

- Fully functional list page
- All CRUD actions working
- Proper loading/empty states

### Dependencies

- Phase 1 complete

---

## Phase 3: AI Preset Editor - Configuration ✅

**Status**: Complete (2025-01-28)
**Implementation**: `specs/043-ai-preset-editor/`

### Objective

Build the left side of the AI Preset editor for configuring media, variables, and prompt.

### Scope

#### 3.1 Editor Page Setup

- [x] Add route: `/workspace/:workspaceSlug/ai-presets/:presetId`
- [x] Two-column layout (left: config, right: test area placeholder)
- [x] Header with preset name, back button, save button
- [x] Auto-save with dirty state tracking (using shared editor-status module)

#### 3.2 Media Registry Section

- [x] Compact thumbnail grid of media
- [x] "Add Media" dialog with upload functionality
- [x] Hover to show name and delete button
- [x] Display media reference name below thumbnail
- [x] Edit media name dialog

**Note**: Full "browse from library" picker deferred (simplified upload-only approach using `MediaPickerField`).

#### 3.3 Variables Section

- [x] List of variable cards (collapsible/expandable)
- [x] "Add Variable" button
- [x] Variable card shows:
  - Name (without @ prefix in card)
  - Type badge (text/image)
  - Value mappings indicator
- [x] Variable editor:
  - Name input (validated regex)
  - Type selector (text/image)
  - Default value input (for text)
  - Value mappings editor (for text with options)

**Implementation Note**: No "label" field or "source step indicator" in current implementation. Focus is on name, type, default value, and value mappings.

#### 3.4 Value Mappings Editor

- [x] List of value → text mappings
- [x] Add mapping button
- [x] Each mapping row:
  - Value input
  - Arrow indicator
  - Text output (Lexical-based editor with @mention support)
- [x] Delete mapping

**Note**: Reordering not implemented (future enhancement).

#### 3.5 Prompt Template Editor

- [x] Rich text editor using **Lexical framework** (not simple contentEditable)
- [x] Position-aware autocomplete:
  - `{` trigger for variables
  - `@` trigger for media references
- [x] Autocomplete shows:
  - Text variables (blue indicator)
  - Image variables (green indicator)
  - Media (purple indicator)
- [x] Visual pills for mentions:
  - Blue for text variables (`@{text:name}`)
  - Green for image variables (`@{input:name}`)
  - Purple for media (`@{ref:name}`)
- [x] Smart paste detection (converts `{var}` and `@media` patterns)
- [x] Character count display

**Implementation Differences from PRD**:
- Uses Lexical rich text framework (vs contentEditable)
- Reference format: `@{type:name}` (text/input/ref) instead of simple `@name`
- Three mention types instead of two (text vars, image vars, media)
- Position-aware triggers: `{` for variables, `@` for media
- Serializes to plain text with mention patterns (not JSON)

#### 3.6 Model Settings

- [x] Model dropdown (gemini-2.5-flash, gemini-2.5-pro, gemini-3.0)
- [x] Aspect ratio dropdown (1:1, 3:2, 2:3, 16:9, 9:16)

### Deliverables

- [x] Fully functional configuration editor
- [x] All sections working
- [x] @mention autocomplete in prompt editor (Lexical-based)
- [x] Data persists to Firestore (auto-save with debounce)
- [x] Save status indicator (using shared editor-status module)
- [x] Editable preset name in breadcrumb

### Implementation Details

**Key Files**:
- Route: `app/workspace/$workspaceSlug.ai-presets/$presetId.tsx`
- Domain: `domains/ai-presets/editor/`
- Lexical Infrastructure: `domains/ai-presets/lexical/`

**Architecture**:
- Client-first with Firebase Firestore (real-time listeners)
- Zustand store for editor state (`useAIPresetEditorStore`)
- TanStack Query for data fetching/caching
- Shared editor-status module for save tracking
- Draft/published pattern (edits go to `draft` field)

**Reference System**:
- `@{text:variableName}` - Text variable reference
- `@{input:variableName}` - Image variable reference (user upload)
- `@{ref:mediaName}` - Media registry reference

### Dependencies

- [x] Phase 2 complete
- [x] Workspace media library integration (simplified upload-only)

---

## Phase 4: AI Preset Editor - Preview

### Objective

Build the right side of the AI Preset editor for live preview and test inputs.

### Scope

#### 4.1 Test Inputs Section

- [ ] Dynamic form based on preset variables
- [ ] For image variables (`@{input:name}`): Upload zone or drag-and-drop
- [ ] For text variables with valueMap: Dropdown selector
- [ ] For text variables without valueMap: Free text input
- [ ] Pre-fill with default values
- [ ] Clear "Reset to Defaults" action

#### 4.2 Prompt Preview

- [ ] Live-updating resolved prompt display
- [ ] Updates as user changes test inputs or edits prompt template
- [ ] Shows fully substituted text with references resolved:
  - `@{text:name}` → replaced with text input value or valueMap result
  - `@{input:name}` → indicator showing image will be included
  - `@{ref:name}` → indicator showing media from registry will be included
- [ ] Visual distinction for resolved vs unresolved references
- [ ] Character count for resolved prompt

**Implementation Note**: Resolution logic must handle:
- Text variable substitution (including valueMap lookups)
- Image variable placeholder text (e.g., "[Image: userPhoto]")
- Media reference placeholder text (e.g., "[Media: styleReference]")

#### 4.3 Media Preview

- [ ] Thumbnail grid showing all images that will be sent to AI:
  - Images from `@{ref:name}` references (media registry)
  - Images from `@{input:name}` references (test input uploads)
- [ ] Shows "X of Y images" indicator (e.g., "3 of 5 media items used")
- [ ] Visual indication of unused media in registry (grayed out)
- [ ] Hover to show reference name and source (registry vs input)

#### 4.4 Validation Display

- [ ] Show validation status indicator (valid/invalid/incomplete)
- [ ] Highlight missing required variable inputs
- [ ] Show warnings for:
  - Undefined variables referenced in prompt
  - Undefined media referenced in prompt
  - Text variables with unmapped values (using default)
- [ ] Disable test generation button if validation fails

#### 4.5 Test Generation UI (Placeholder)

- [ ] "Run Test Generation" button (UI only, non-functional)
- [ ] Button disabled state when validation fails
- [ ] Tooltip explaining why button is disabled (if applicable)
- [ ] Placeholder for loading state (spinner/progress)
- [ ] Placeholder for result display area

**Note**: Button is UI-only placeholder. Actual generation functionality implemented in Phase 5.

### Deliverables

- Live preview panel working
- Test inputs form with proper field types
- Real-time prompt resolution with reference substitution
- Media preview grid showing what will be sent
- Validation display with clear error/warning messaging
- UI-ready test generation button (non-functional placeholder)
- Clear indication of what will be sent to AI

### Technical Requirements

**Resolution Logic**:
- Parse prompt template to identify all references: `@{text:name}`, `@{input:name}`, `@{ref:name}`
- Resolve text variables using test input values or valueMap lookups
- Collect image references (inputs + media) for preview
- Validate all references exist and required inputs are provided

**State Management**:
- Test input values stored in local state (not persisted)
- Resolved prompt computed on-the-fly (debounced for performance)
- Media list computed from prompt references + test inputs

**Performance**:
- Debounce resolution logic (300ms after input change)
- Lazy load media thumbnails
- Optimize re-renders (memo components, selective updates)

### Dependencies

- [x] Phase 3 complete

---

## Phase 5: AI Preset Editor - Test Generation

### Objective

Add ability to run actual AI generation from the preset editor.

### Scope

#### 5.1 Test Generation Button

- [ ] "Run Test Generation" button
- [ ] Disabled if validation fails
- [ ] Loading state during generation

#### 5.2 Backend Test Endpoint

- [ ] Create HTTP function: `testAIPreset`
- [ ] Accepts: presetId, test inputs
- [ ] Resolves prompt using preset logic
- [ ] Calls AI model
- [ ] Returns generated image

#### 5.3 Result Display

- [ ] Show generated image in result area
- [ ] Expandable to full size
- [ ] Show generation metadata (time taken, tokens used)
- [ ] Clear result / try again button

#### 5.4 Error Handling

- [ ] Display AI errors gracefully
- [ ] Show rate limit messages
- [ ] Retry option

### Deliverables

- End-to-end test generation working
- Can iterate on prompt and see real results
- Error handling complete

### Dependencies

- Phase 4 complete
- AI model integration (Gemini)
- Cloud Functions setup

---

## Phase 6: Transform Pipeline Integration

### Objective

Update Transform Pipeline to use AI Presets.

### Scope

#### 6.1 AI Image Node Schema Update

- [ ] Add `presetId` field
- [ ] Add `variableBindings` field
- [ ] Deprecate inline prompt configuration

#### 6.2 AI Image Node UI

- [ ] Preset selector dropdown
- [ ] Variable bindings editor:
  - List preset variables
  - For each: dropdown to select source (step or node)
- [ ] Validation that all required variables are bound

#### 6.3 Pipeline Execution Update

- [ ] Fetch AI Preset at execution time
- [ ] Resolve variable bindings from session data
- [ ] Use preset's resolution logic
- [ ] Execute AI generation

#### 6.4 Migration

- [ ] Handle existing pipelines with inline configs
- [ ] Migration path: convert inline config to preset

### Deliverables

- Transform Pipeline uses AI Presets
- Clean separation of concerns
- Backward compatibility handled

### Dependencies

- Phase 5 complete
- Transform Pipeline infrastructure

---

## Phase Summary

| Phase | Focus                | Key Deliverable               | Status      |
| ----- | -------------------- | ----------------------------- | ----------- |
| 1     | Foundation           | Schema, Firestore, API        | ✅ Complete |
| 2     | List Page            | View/manage presets           | ✅ Complete |
| 3     | Editor - Config      | Build preset configuration    | ✅ Complete |
| 4     | Editor - Preview     | Live preview                  | 🔄 In Progress |
| 5     | Editor - Test        | Real AI generation testing    | ⏳ Pending  |
| 6     | Pipeline Integration | Connect to Transform Pipeline | ⏳ Pending  |

---

## MVP Definition

**Minimum Viable Product includes Phases 1-4:**

- ✅ Create and manage AI Presets (Phases 1-2)
- ✅ Full configuration editor with Lexical-based prompt editor (Phase 3)
- 🔄 Live preview with test inputs and validation (Phase 4 - In Progress)

**Full Feature includes Phase 5:**

- ⏳ Actual test generation capability (Phase 5 - Pending)

**Integration (Phase 6)** can happen in parallel with or after Phase 5.

---

## Technical Considerations

### State Management

- ✅ **Implemented**: TanStack Query for server state (data fetching/caching)
- ✅ **Implemented**: Zustand for editor state (`useAIPresetEditorStore`)
- ✅ **Implemented**: Shared editor-status module for save status tracking
- ✅ **Implemented**: Draft/published pattern (edits saved to `draft` field)
- 🔄 **Phase 4**: Local state for test inputs (not persisted)

### Performance

- ✅ **Implemented**: Debounce auto-save updates (2000ms)
- ✅ **Implemented**: Lazy load media thumbnails
- ✅ **Implemented**: Paginated preset list (Phase 2)
- 🔄 **Phase 4**: Debounce prompt resolution (300ms)
- 🔄 **Phase 4**: Memo components for preview panel

### Validation

- ✅ **Implemented**: Client-side Zod validation for immediate feedback
- ✅ **Implemented**: Variable name regex validation (`^[a-zA-Z_][a-zA-Z0-9_]*$`)
- ✅ **Implemented**: Lexical-based MentionValidationPlugin for reference validation
- 🔄 **Phase 4**: Real-time validation of required inputs
- 🔄 **Phase 4**: Warning display for undefined references

### Rich Text Editor (Lexical)

- ✅ **Implemented**: Lexical framework for prompt template editor
- ✅ **Implemented**: Custom nodes: `VariableMentionNode`, `MediaMentionNode`
- ✅ **Implemented**: Plugins: MentionsPlugin, SmartPastePlugin, MentionValidationPlugin
- ✅ **Implemented**: Plain text serialization with `@{type:name}` patterns
- ✅ **Implemented**: Position-aware autocomplete (`{` for variables, `@` for media)

### Reference Format

**Storage format** (plain text):
- `@{text:variableName}` - Text variable
- `@{input:variableName}` - Image variable (user upload)
- `@{ref:mediaName}` - Media registry reference

**Display format** (Lexical):
- Blue pill for text variables
- Green pill for image variables
- Purple pill for media references

### Testing

**Phase 1-3 (Complete)**:
- ✅ Unit tests for Zod schemas (validation)
- ✅ Integration tests for CRUD operations (React Query hooks)
- ⏳ E2E tests for editor flow (deferred)

**Phase 4-5 (Upcoming)**:
- 🔄 Unit tests for prompt resolution logic
- 🔄 Unit tests for reference parsing and validation
- 🔄 Component tests for preview panel
- ⏳ E2E tests for test generation flow

---

## Open Questions

1. **Preset versioning**: Should we version presets? If a preset changes, what happens to pipelines using it?

2. **Preset sharing**: Can presets be shared across workspaces? (Future consideration)

3. **Preset templates**: Should we provide starter templates? (Future consideration)

4. **Cost tracking**: Track AI generation costs per preset test? (Future consideration)
