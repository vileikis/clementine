# AI Presets - PRD Phases

## Status: Draft
**Created**: 2025-01-26
**Last Updated**: 2025-01-26

---

## Overview

This document outlines the phased implementation plan for AI Presets. The feature is broken into incremental phases that deliver value progressively while managing complexity.

---

## Phase 1: AI Presets Foundation

### Objective
Establish the data model and basic CRUD operations for AI Presets.

### Scope

#### 1.1 Data Model & Schema
- [ ] Create AI Preset Zod schema in `packages/shared`
- [ ] Define Firestore document structure
- [ ] Add TypeScript types

#### 1.2 Firestore Setup
- [ ] Create collection path: `/workspaces/{workspaceId}/aiPresets/{presetId}`
- [ ] Add security rules (workspace member read, admin write)

#### 1.3 Basic API Layer
- [ ] Create preset service with CRUD operations:
  - `createPreset(workspaceId, data)`
  - `getPreset(workspaceId, presetId)`
  - `updatePreset(workspaceId, presetId, data)`
  - `deletePreset(workspaceId, presetId)`
  - `listPresets(workspaceId)`
  - `duplicatePreset(workspaceId, presetId, newName)`
- [ ] Add React Query hooks for data fetching

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
- [ ] Add route: `/workspace/:workspaceSlug/ai-presets`
- [ ] Add navigation link in workspace sidebar

#### 2.2 List Page UI
- [ ] Page header with title and "Create Preset" button
- [ ] Search/filter input
- [ ] Preset cards showing:
  - Name
  - Description
  - Variable count
  - Media count
  - Last updated timestamp
- [ ] Empty state for no presets
- [ ] Loading state

#### 2.3 Preset Actions
- [ ] Create new preset (opens editor with blank preset)
- [ ] Duplicate preset (creates copy with "Copy of" prefix)
- [ ] Rename preset (inline edit or modal)
- [ ] Delete preset (with confirmation dialog)

#### 2.4 Navigation
- [ ] Click preset card → navigate to preset editor page

### Deliverables
- Fully functional list page
- All CRUD actions working
- Proper loading/empty states

### Dependencies
- Phase 1 complete

---

## Phase 3: AI Preset Editor - Configuration

### Objective
Build the left side of the AI Preset editor for configuring media, variables, and prompt.

### Scope

#### 3.1 Editor Page Setup
- [ ] Add route: `/workspace/:workspaceSlug/ai-presets/:presetId`
- [ ] Two-column layout (left: config, right: test area placeholder)
- [ ] Header with preset name, back button, save button
- [ ] Auto-save or explicit save with dirty state tracking

#### 3.2 Media Registry Section
- [ ] Compact thumbnail grid of media
- [ ] "Add from Library" button → opens media library picker
- [ ] Hover to show name and delete button
- [ ] Display media reference name below thumbnail
- [ ] Drag to reorder (optional for MVP)

#### 3.3 Variables Section
- [ ] List of variable cards (collapsible)
- [ ] "Add Variable" button
- [ ] Variable card shows:
  - Name (`@variable`)
  - Type badge (text/image)
  - Label
  - Source step indicator (when used in pipeline)
- [ ] Variable editor:
  - Name input (with @prefix display)
  - Label input
  - Type selector (text/image)
  - Required toggle
  - Default value input (for text)
  - Value mappings editor (for text with options)

#### 3.4 Value Mappings Editor
- [ ] List of value → text mappings
- [ ] Add mapping button
- [ ] Each mapping row:
  - Value input
  - Arrow indicator
  - Text output (with @mention support)
- [ ] Reorder mappings (drag or arrows)
- [ ] Delete mapping

#### 3.5 Prompt Template Editor
- [ ] Rich text area for prompt
- [ ] `@` trigger for autocomplete dropdown
- [ ] Autocomplete shows:
  - Variables (blue indicator)
  - Media (green indicator)
- [ ] Visual pills for @mentions (blue for variables, green for media)
- [ ] Syntax help text below editor

#### 3.6 Model Settings
- [ ] Model dropdown (gemini-2.5-flash, gemini-2.5-pro, gemini-3.0)
- [ ] Aspect ratio dropdown (1:1, 3:2, 2:3, 16:9, 9:16)

### Deliverables
- Fully functional configuration editor
- All sections working
- @mention autocomplete in prompt editor
- Data persists to Firestore

### Dependencies
- Phase 2 complete
- Workspace media library integration

---

## Phase 4: AI Preset Editor - Preview

### Objective
Build the right side of the AI Preset editor for live preview.

### Scope

#### 4.1 Test Inputs Section
- [ ] Dynamic form based on preset variables
- [ ] For image variables: Upload zone or drag-and-drop
- [ ] For text variables with valueMap: Dropdown selector
- [ ] For text variables without valueMap: Free text input
- [ ] Pre-fill with default values

#### 4.2 Prompt Preview
- [ ] Live-updating resolved prompt
- [ ] Updates as user changes inputs
- [ ] Shows fully substituted text
- [ ] Highlights @media references that will include images

#### 4.3 Media Preview
- [ ] Thumbnail grid of images that will be sent
- [ ] Based on @media references in resolved prompt
- [ ] Shows "X of Y images" indicator
- [ ] Grayed out media not being used

#### 4.4 Validation Display
- [ ] Show validation status
- [ ] Highlight missing required inputs
- [ ] Show warnings for unmapped values (using default)

### Deliverables
- Live preview panel working
- Immediate feedback as user configures
- Clear indication of what will be sent to AI

### Dependencies
- Phase 3 complete

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

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| 1 | Foundation | Schema, Firestore, API |
| 2 | List Page | View/manage presets |
| 3 | Editor - Config | Build preset configuration |
| 4 | Editor - Preview | Live preview |
| 5 | Editor - Test | Real AI generation testing |
| 6 | Pipeline Integration | Connect to Transform Pipeline |

---

## MVP Definition

**Minimum Viable Product includes Phases 1-4:**
- Create and manage AI Presets
- Full configuration editor
- Live preview (without actual generation)

**Full Feature includes Phase 5:**
- Actual test generation capability

**Integration (Phase 6)** can happen in parallel with or after Phase 5.

---

## Technical Considerations

### State Management
- Use React Query for server state
- Local form state with react-hook-form or similar
- Optimistic updates for better UX

### Performance
- Debounce prompt preview updates
- Lazy load media thumbnails
- Paginate preset list if needed

### Validation
- Client-side validation for immediate feedback
- Server-side validation on save
- @reference validation in prompt

### Testing
- Unit tests for resolution logic
- Integration tests for CRUD operations
- E2E tests for editor flow

---

## Open Questions

1. **Preset versioning**: Should we version presets? If a preset changes, what happens to pipelines using it?

2. **Preset sharing**: Can presets be shared across workspaces? (Future consideration)

3. **Preset templates**: Should we provide starter templates? (Future consideration)

4. **Cost tracking**: Track AI generation costs per preset test? (Future consideration)
