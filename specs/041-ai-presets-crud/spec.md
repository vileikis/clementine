# Feature Specification: AI Presets Foundation and List Page

**Feature Branch**: `041-ai-presets-crud`
**Created**: 2026-01-26
**Status**: Draft
**Input**: User description: "phases 1 and 2 from @requirements/ai-presets/prd-phases.md"

## Overview

AI Presets are reusable configurations that define how AI image generation behaves within a workspace. This feature establishes the foundational data layer and provides a workspace-level management interface where users can create, view, edit, duplicate, and delete AI Presets.

This specification covers Phase 1 (Foundation) and Phase 2 (List Page) of the AI Presets feature.

## Implementation Reference

The list page UI should follow the established pattern from the Project Events feature:
- `src/domains/project/events/components/ProjectEventsList.tsx` - List component with loading/empty states
- `src/domains/project/events/components/ProjectEventItem.tsx` - Item component with context menu actions (rename, delete dialogs)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View AI Presets List (Priority: P1)

As a workspace member, I want to see a list of all AI Presets in my workspace so that I can find and manage existing presets.

**Why this priority**: Users must be able to view existing presets before they can interact with them. This is the entry point to all preset management functionality.

**Independent Test**: Can be fully tested by navigating to the AI Presets page and verifying the list displays with preset information. Delivers value by providing visibility into all workspace presets.

**Acceptance Scenarios**:

1. **Given** I am a workspace member with at least one preset existing, **When** I navigate to the AI Presets page, **Then** I see a list of preset cards showing name, description, model, aspect ratio, variable count, media count, and last updated timestamp.
2. **Given** I am a workspace member with no presets existing, **When** I navigate to the AI Presets page, **Then** I see an empty state with a prompt to create my first preset.
3. **Given** presets are loading, **When** I navigate to the AI Presets page, **Then** I see a loading indicator until data is ready.

---

### User Story 2 - Create New AI Preset (Priority: P1)

As a workspace admin, I want to create a new AI Preset so that I can define reusable AI generation configurations for my team.

**Why this priority**: Creating presets is fundamental to the feature. Without the ability to create presets, the system has no value.

**Independent Test**: Can be fully tested by clicking "Create Preset" and verifying a new preset is created and persisted. Delivers value by enabling users to start building their preset library.

**Acceptance Scenarios**:

1. **Given** I am a workspace admin on the AI Presets page, **When** I click "Create Preset", **Then** a new preset is created with default values and I am navigated to the preset editor page.
2. **Given** I am a workspace member without admin permissions, **When** I view the AI Presets page, **Then** I do not see the "Create Preset" button.

---

### User Story 3 - Navigate to Preset Editor (Priority: P1)

As a workspace member, I want to click on a preset card to open the preset editor so that I can view or modify the preset configuration.

**Why this priority**: Navigation to the editor is essential for users to interact with preset details. This bridges the list view to the editing experience.

**Independent Test**: Can be fully tested by clicking a preset card and verifying navigation to the correct editor URL. Delivers value by enabling access to preset details.

**Acceptance Scenarios**:

1. **Given** I am viewing the AI Presets list, **When** I click on a preset card, **Then** I am navigated to the preset editor page at `/workspace/:workspaceSlug/ai-presets/:presetId`.

---

### User Story 4 - Duplicate AI Preset (Priority: P2)

As a workspace admin, I want to duplicate an existing preset so that I can create variations without starting from scratch.

**Why this priority**: Productivity enhancement that saves time when creating similar presets.

**Independent Test**: Can be fully tested by duplicating a preset and verifying the copy exists with the correct name prefix. Delivers value by enabling rapid preset iteration.

**Acceptance Scenarios**:

1. **Given** I am a workspace admin viewing a preset card, **When** I select "Duplicate" from the preset actions, **Then** a new preset is created with name "Copy of [original name]" and all the same configuration values.
2. **Given** I duplicate a preset, **When** the duplication completes, **Then** the new preset appears in the list and I can navigate to edit it.

---

### User Story 5 - Rename AI Preset (Priority: P2)

As a workspace admin, I want to rename a preset so that I can keep preset names meaningful and organized.

**Why this priority**: Quality of life improvement for preset organization.

**Independent Test**: Can be fully tested by renaming a preset and verifying the new name persists. Delivers value by enabling users to maintain organized preset libraries.

**Acceptance Scenarios**:

1. **Given** I am a workspace admin viewing a preset card, **When** I select "Rename" from the preset actions, **Then** a rename dialog opens allowing me to edit the preset name.
2. **Given** I enter a new name in the rename dialog, **When** I confirm the rename, **Then** the preset name is updated and the change persists.

---

### User Story 6 - Delete AI Preset (Priority: P2)

As a workspace admin, I want to delete a preset so that I can remove presets that are no longer needed.

**Why this priority**: Necessary for housekeeping but not critical for initial use.

**Independent Test**: Can be fully tested by deleting a preset and verifying it no longer appears in the list. Delivers value by enabling cleanup of unused presets.

**Acceptance Scenarios**:

1. **Given** I am a workspace admin viewing a preset card, **When** I select "Delete" from the preset actions, **Then** a confirmation dialog appears asking me to confirm deletion.
2. **Given** the confirmation dialog is shown, **When** I confirm deletion, **Then** the preset is permanently removed and no longer appears in the list.
3. **Given** the confirmation dialog is shown, **When** I cancel, **Then** the preset remains unchanged.

---

### Edge Cases

- What happens when a user tries to access a preset that has been deleted by another user? System should show a "Preset not found" error and redirect to the list page.
- What happens when creating a preset fails due to network issues? System should display an error message and allow retry.
- What happens when a user loses admin permissions while on the page? Action buttons (create, delete, duplicate, rename) should be hidden or disabled on the next data refresh.

## Requirements *(mandatory)*

### Functional Requirements

**Data Model & Schema**

- **FR-001**: System MUST define an AI Preset data structure with the following fields: unique identifier, name, description, model, aspect ratio, prompt template, variables collection, media registry collection, and timestamps (created, updated).
- **FR-002**: System MUST validate all AI Preset data according to defined schema rules before persistence.
- **FR-003**: System MUST generate unique identifiers for each preset automatically.

**Storage & Persistence**

- **FR-004**: System MUST store AI Presets within the workspace context, isolated from other workspaces.
- **FR-005**: System MUST enforce that only workspace admins can create, update, duplicate, rename, and delete presets.
- **FR-006**: System MUST allow all workspace members to read/view presets.

**API Operations**

- **FR-007**: System MUST provide the ability to create a new preset with default values.
- **FR-008**: System MUST provide the ability to retrieve a single preset by identifier.
- **FR-009**: System MUST provide the ability to update an existing preset.
- **FR-010**: System MUST provide the ability to delete a preset permanently.
- **FR-011**: System MUST provide the ability to list all presets within a workspace.
- **FR-012**: System MUST provide the ability to duplicate a preset, creating a copy with "Copy of" prefix in the name.

**Navigation & Routing**

- **FR-013**: System MUST provide a route at `/workspace/:workspaceSlug/ai-presets` for the preset list page.
- **FR-014**: System MUST provide a navigation link to the AI Presets page in the workspace sidebar.
- **FR-015**: Clicking a preset card MUST navigate to `/workspace/:workspaceSlug/ai-presets/:presetId`.

**List Page UI**

- **FR-016**: System MUST display a page header with title "AI Presets" and a "Create Preset" button (for admins only).
- **FR-017**: System MUST display preset cards showing: name, description, model, aspect ratio, variable count, media count, and last updated timestamp.
- **FR-018**: System MUST display an empty state when no presets exist.
- **FR-019**: System MUST display a loading state while presets are being fetched.

**Preset Actions**

- **FR-020**: System MUST provide a "Duplicate" action on preset cards (for admins only).
- **FR-021**: System MUST provide a "Rename" action on preset cards (for admins only) that opens a rename dialog.
- **FR-022**: System MUST provide a "Delete" action on preset cards (for admins only).
- **FR-023**: Delete action MUST show a confirmation dialog before proceeding.

### Key Entities

- **AI Preset**: A reusable configuration for AI image generation. Contains identification (id, name, description), model settings (model type, aspect ratio), prompt configuration (template with variable placeholders), variables (typed inputs that can be substituted into the prompt), and media registry (collection of media assets that can be referenced). Belongs to exactly one workspace.

- **Variable**: A typed input placeholder within a preset. Has a name, label, type (text or image), optional default value, and optional value mappings for text variables. Variables are referenced in prompt templates using @-mention syntax.

- **Media Registry Entry**: A reference to a media asset from the workspace media library. Has a reference name and pointer to the actual media asset. Media entries are referenced in prompt templates using @-mention syntax.

- **Workspace**: Parent entity that owns AI Presets. Members have read access, admins have full CRUD access.

## Assumptions

- Workspace infrastructure with member/admin role distinction already exists.
- Workspace media library exists and can be integrated later (Phase 3).
- The preset editor page (Phase 3) will be created as a placeholder that displays preset details but doesn't allow editing yet.
- Standard web application performance expectations apply (pages load within a few seconds).
- Optimistic UI updates will be used where appropriate for better user experience.

## Dependencies

- Existing workspace infrastructure and routing.
- Existing authentication and authorization system with workspace role support.
- Database setup and security rules configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate to the AI Presets page and view all presets in their workspace within 3 seconds of page load.
- **SC-002**: Users can create a new preset and see it appear in the list within 2 seconds.
- **SC-003**: Users can duplicate a preset and see the copy appear in the list within 2 seconds.
- **SC-004**: Users can delete a preset and see it removed from the list within 2 seconds.
- **SC-005**: All CRUD operations persist correctly across page refreshes and sessions.
- **SC-006**: Permission enforcement is consistent - non-admin users never see or can access admin-only actions.
