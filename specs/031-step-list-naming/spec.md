# Feature Specification: Step List Naming

**Feature Branch**: `031-step-list-naming`
**Created**: 2026-01-15
**Status**: Draft
**Input**: User description: "Step list should display step title if present, otherwise fallback to default step label."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Custom Step Title Display (Priority: P1)

As an experience creator, I want to see my custom step titles in the step list so that I can easily identify and navigate between different steps in my experience.

**Why this priority**: This is the core functionality requested. Without displaying custom titles, creators cannot distinguish between steps of the same type (e.g., multiple "Information" steps) or quickly identify what each step contains.

**Independent Test**: Can be fully tested by creating a step with a custom title and verifying the title appears in the step list sidebar.

**Acceptance Scenarios**:

1. **Given** a step with a non-empty title configured, **When** viewing the step list sidebar, **Then** the step's custom title is displayed instead of the default step type label
2. **Given** a step with a title containing only whitespace (spaces, tabs), **When** viewing the step list sidebar, **Then** the default step type label is displayed (whitespace-only titles are treated as empty)

---

### User Story 2 - Fallback to Default Label (Priority: P1)

As an experience creator, I want to see the default step type label when a step has no custom title, so I still have meaningful identification for newly added or unconfigured steps.

**Why this priority**: Equal priority with P1 above - both behaviors must work together as the complete feature. Fallback ensures usability when titles are not configured.

**Independent Test**: Can be fully tested by creating a step without a title and verifying the default label (e.g., "Information", "Opinion Scale") appears.

**Acceptance Scenarios**:

1. **Given** a step with an empty title, **When** viewing the step list sidebar, **Then** the default step type label is displayed (e.g., "Information", "Opinion Scale", "Photo Capture")
2. **Given** a step type that does not have a title field in its configuration (e.g., Photo Capture, AI Transform), **When** viewing the step list sidebar, **Then** the default step type label is displayed

---

### Edge Cases

- What happens when the title is very long? The title should be truncated with ellipsis to fit within the step list item width (existing behavior via CSS truncation).
- What happens when the title contains special characters or emoji? The title should display as-is, following standard text rendering.
- What happens when a step type's config schema doesn't include a title field? The default step type label from the step registry is displayed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the step's custom title in the step list when the step's config contains a title field with a non-empty string value (after trimming whitespace)
- **FR-002**: System MUST display the default step type label from the step registry when the step's config does not have a title field
- **FR-003**: System MUST display the default step type label when the title field is an empty string or contains only whitespace
- **FR-004**: System MUST truncate long titles with ellipsis to fit within the step list item's allocated width
- **FR-005**: System MUST preserve the existing step type icon display regardless of whether custom title or default label is shown

### Key Entities

- **Step**: An individual step in the experience flow containing id, type, and config properties
- **StepConfig**: Type-specific configuration object that may or may not contain a title field depending on step type
- **StepDefinition**: Registry entry containing default label, icon, and other metadata for each step type

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of steps with custom titles display the custom title instead of the default label
- **SC-002**: 100% of steps without titles (empty, whitespace-only, or no title field) display the default step type label
- **SC-003**: Creators can distinguish between multiple steps of the same type by their custom titles
- **SC-004**: No visual regression in step list appearance (icons, selection states, drag handles, context menus remain unchanged)
