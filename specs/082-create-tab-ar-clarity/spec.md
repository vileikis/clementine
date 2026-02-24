# Feature Specification: Create Tab Aspect Ratio Clarity

**Feature Branch**: `082-create-tab-ar-clarity`
**Created**: 2026-02-24
**Status**: Draft
**Input**: PRD P5 — Create Tab UX: Aspect Ratio Clarity

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distinguish Input AR from Output AR (Priority: P1)

An experience creator opens the Create tab to configure an AI photo or video outcome. They see two clearly labeled sections: **Subject Photo** (with the capture step and its aspect ratio) and **Output** (with the output aspect ratio, model, and prompt). At a glance, they understand that "Subject Photo AR" controls the camera crop shape guests will use, and "Output AR" controls the shape of the AI-generated result.

**Why this priority**: This is the core UX problem — users cannot tell what the aspect ratio picker controls. Solving this eliminates the primary source of confusion.

**Independent Test**: Can be fully tested by opening the Create tab and verifying that both aspect ratios are visible in separate, clearly labeled sections. Delivers immediate clarity on what each AR controls.

**Acceptance Scenarios**:

1. **Given** a creator is on the Create tab for an AI image outcome, **When** they view the page, **Then** they see a "Subject Photo" section displaying the capture step name and its aspect ratio, and a separate "Output" section displaying the output aspect ratio.
2. **Given** a creator is on the Create tab for an AI video outcome, **When** they view the page, **Then** they see the same two-section layout with clearly labeled input and output aspect ratios.
3. **Given** a creator changes the output AR in the "Output" section, **When** they save, **Then** only the output AR is updated — the capture step AR remains unchanged.
4. **Given** a creator changes the capture step AR from the "Subject Photo" section, **When** they save, **Then** only the capture AR is updated — the output AR remains unchanged.

---

### User Story 2 - Single Capture Step Displays Without Dropdown (Priority: P2)

An experience creator has an outcome with only one capture step. When they open the Create tab, the "Subject Photo" section shows the single capture step and its AR without a dropdown selector. The section is always visible — it does not hide or collapse, avoiding the "hidden but space-occupying" layout problem.

**Why this priority**: Resolves the layout issue where hidden elements still occupy space, creating confusion around adjacent controls.

**Independent Test**: Can be tested by creating an outcome with exactly one capture step and verifying the Subject Photo section renders visibly without a dropdown, with no blank/hidden space.

**Acceptance Scenarios**:

1. **Given** an outcome has exactly one capture step, **When** the creator opens the Create tab, **Then** the "Subject Photo" section shows the step name and its AR as static content (no dropdown).
2. **Given** an outcome has multiple capture steps, **When** the creator opens the Create tab, **Then** the "Subject Photo" section shows a dropdown to select which capture step to view.
3. **Given** an outcome has one capture step, **When** the creator views the Create tab, **Then** no hidden or empty UI elements occupy layout space in the Subject Photo section.

---

### Edge Cases

- What happens when the outcome has no output AR set? The outcome config always has a default AR value (assumed 1:1 based on common photobooth defaults), so this state should not occur in practice.
- What happens when a creator navigates to "change" the capture step AR from the Subject Photo section? The "change" action navigates to the capture step's own AR setting or displays an inline picker — it does not modify the output AR.
- What happens if a generation has a per-generation AR override set? The existing backend fallback chain (`generation.aspectRatio ?? outcome.aspectRatio`) continues to work. The generation-level field is retained in the schema for future use but is not exposed in the Create tab UI.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display two clearly labeled sections in the Create tab: "Subject Photo" (input AR) and "Output" (output AR, model, prompt).
- **FR-002**: The "Subject Photo" section MUST show the selected capture step name and its current aspect ratio.
- **FR-003**: The "Subject Photo" section MUST provide a way to change the capture step's aspect ratio (via navigation or inline picker).
- **FR-004**: The "Output" section MUST display the output aspect ratio prominently at the top, followed by model and prompt configuration.
- **FR-005**: The output aspect ratio MUST be stored at the outcome config level (e.g., on the per-type outcome config). The Create tab MUST edit this outcome-level field.
- **FR-006**: The generation-level aspect ratio field MUST be retained in the schema (for future use) but MUST NOT be exposed in the Create tab UI.
- **FR-007**: The existing backend fallback chain (generation AR falling back to outcome AR) MUST continue to work unchanged.
- **FR-008**: When an outcome has only one capture step, the "Subject Photo" section MUST display it as static content (no dropdown), without hiding or collapsing.
- **FR-009**: When an outcome has multiple capture steps, the "Subject Photo" section MUST display a selector to choose which capture step to view.

### Key Entities

- **Outcome Config**: The per-type configuration for an outcome (image or video). Owns the canonical output aspect ratio field that all generations inherit.
- **Generation Config**: The per-generation configuration (image or video). Contains an optional aspect ratio field (retained for future use, not exposed in UI).
- **Capture Step**: A step in the guest experience that captures a subject photo. Owns its own aspect ratio for camera crop shape during the guest experience.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can identify which section controls input AR vs. output AR within 5 seconds of viewing the Create tab.
- **SC-002**: Zero instances of orphaned or ambiguous AR pickers in the Create tab layout.
- **SC-003**: The Create tab only exposes outcome-level AR — no generation-level AR controls are visible to creators.
- **SC-004**: No hidden-but-space-occupying elements appear in the Create tab when only one capture step exists.

## Assumptions

- The default output AR for new outcomes is 1:1 (square), consistent with common photobooth defaults.
- The capture step AR picker UI itself is not redesigned — only its placement/display within the Create tab changes.
- No new aspect ratio options are introduced as part of this feature.
- The "Output" section order is: Output AR, then Model, then Prompt — matching the PRD layout specification.
- No schema migration is needed — generation-level AR fields are retained as-is. This is a UI-only change.
