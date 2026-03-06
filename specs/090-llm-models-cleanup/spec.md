# Feature Specification: LLM Models Cleanup & UI Adjustments

**Feature Branch**: `090-llm-models-cleanup`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Clean up deprecated models and hide legacy UI components in the prompt composer to streamline the application and prevent errors."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remove Deprecated AI Image Model (Priority: P1)

As a platform maintainer, I want the deprecated `gemini-3-pro-image-preview` AI image model completely removed from the codebase so that users cannot accidentally select or trigger it, preventing errors and confusion.

**Why this priority**: A deprecated model that remains in the codebase can cause runtime errors if selected or invoked. Removing it eliminates a source of failures and simplifies the model selection surface for users and developers alike.

**Independent Test**: Can be fully tested by verifying that no references to `gemini-3-pro-image-preview` exist in the codebase and that all workflows that previously used this model either use a valid alternative or are no longer available.

**Acceptance Scenarios**:

1. **Given** the codebase contains references to `gemini-3-pro-image-preview`, **When** the cleanup is complete, **Then** no references, endpoints, configuration entries, or usage of this model remain anywhere in the codebase.
2. **Given** a user is creating or editing an experience, **When** they view available AI image models, **Then** `gemini-3-pro-image-preview` does not appear as an option.
3. **Given** an existing experience previously configured with `gemini-3-pro-image-preview`, **When** it is loaded, **Then** the system handles the missing model gracefully without crashing or displaying errors.

---

### User Story 2 - Hide Enhance Prompt Control (Priority: P2)

As a product owner, I want the "Enhance Prompt" control hidden within the PromptComposer component so that users do not see or interact with this feature until it is ready for reactivation in a future release.

**Why this priority**: The enhance prompt feature is not yet ready for the current product version but should be preserved for future Veo versions. Hiding it (rather than deleting it) reduces UI clutter while keeping the code intact for reactivation.

**Independent Test**: Can be fully tested by opening the PromptComposer component and verifying the "Enhance Prompt" control is not visible, while confirming the underlying code still exists in the source.

**Acceptance Scenarios**:

1. **Given** a user opens the PromptComposer, **When** the component renders, **Then** the "Enhance Prompt" control is not visible to the user.
2. **Given** the "Enhance Prompt" control is hidden, **When** a developer inspects the source code, **Then** the enhance prompt logic and code remain intact (not deleted).
3. **Given** the "Enhance Prompt" control is hidden, **When** the PromptComposer renders, **Then** the remaining layout, grid spacing, and controls are visually correct and unbroken.

---

### Edge Cases

- What happens when an existing experience has `gemini-3-pro-image-preview` stored as its configured model? The system must handle this gracefully (e.g., show a fallback or prompt the user to select a new model).
- What happens if the "Enhance Prompt" control is referenced by other components or logic? Hiding it must not cause errors or broken references elsewhere in the UI.
- What happens if a stored document still contains `gemini-3-pro-image-preview` as a field value? Read operations should not fail due to the model's removal from the application code.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove all references to the `gemini-3-pro-image-preview` model from the frontend application code, including any model selection lists, dropdowns, or configuration screens.
- **FR-002**: System MUST remove all backend references to the `gemini-3-pro-image-preview` model, including processing logic and integrations that are exclusively used by this model.
- **FR-003**: System MUST remove `gemini-3-pro-image-preview` from any shared schema definitions, validation rules, or type enumerations where it is listed.
- **FR-004**: System MUST hide the "Enhance Prompt" control in the PromptComposer component so it is not visible or interactive to users.
- **FR-005**: System MUST preserve the "Enhance Prompt" code (logic, markup, and styles) in the codebase for future reactivation, using a non-destructive hiding approach.
- **FR-006**: System MUST maintain correct layout and visual alignment in the PromptComposer after hiding the "Enhance Prompt" control, with no broken grid spacing or misaligned elements.
- **FR-007**: System MUST handle any existing data records that reference `gemini-3-pro-image-preview` without throwing errors or crashing during read operations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero references to `gemini-3-pro-image-preview` exist in the application source code after cleanup (verified by full-text search).
- **SC-002**: The "Enhance Prompt" control is not visible in the PromptComposer UI, confirmed by visual inspection of the component.
- **SC-003**: The PromptComposer layout renders correctly with no visual regressions after hiding the enhance control.
- **SC-004**: All existing application workflows (experience creation, editing, job processing) continue to function without errors after the model removal.
- **SC-005**: The "Enhance Prompt" source code remains intact in the codebase and can be reactivated by reversing the hiding mechanism.

## Assumptions

- The `gemini-3-pro-image-preview` model is fully deprecated and no active experiences depend on it for ongoing processing. Any historical data referencing it is treated as legacy.
- The "Enhance Prompt" feature will be reactivated in a future release, so its code should be hidden rather than deleted.
- No external integrations or third-party services depend on the `gemini-3-pro-image-preview` model endpoint.
- The hiding mechanism for the enhance control can be implemented via a conditional render flag or CSS-based hiding, per the brief's guidance.
