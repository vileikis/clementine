# Feature Specification: Experience-Level Aspect Ratio & Overlay System

**Feature Branch**: `065-exp-aspect-ratio-overlays`
**Created**: 2026-02-06
**Status**: Draft
**Input**: PRD for Experience-Level Prompt & Aspect Ratio System

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Experience Output Aspect Ratio (Priority: P1)

An Experience Creator sets up a new AI photo experience and selects the output aspect ratio as the foundational configuration. The selected ratio becomes the single source of truth that governs all downstream systems including camera capture, AI generation, and overlay selection.

**Why this priority**: This is the core architectural change - establishing the experience output aspect ratio as the authoritative source that all other systems must conform to. Without this, the rest of the feature cannot function.

**Independent Test**: Can be fully tested by creating an experience, selecting an aspect ratio, and verifying the configuration persists. Delivers immediate value by establishing clear output expectations.

**Acceptance Scenarios**:

1. **Given** an Experience Creator is setting up a new image/GIF experience, **When** they select the output media type, **Then** they see only valid aspect ratio options (1:1, 3:2, 2:3, 9:16).
2. **Given** an Experience Creator is setting up a new video experience, **When** they select video as the media type, **Then** they see only valid aspect ratio options (9:16, 1:1).
3. **Given** an Experience Creator has selected an output aspect ratio, **When** they attempt to change it later, **Then** they receive a warning about implications for prompts, overlays, and model compatibility.
4. **Given** an experience is configured with a specific aspect ratio, **When** any downstream system attempts to use a different ratio, **Then** the operation is blocked or the system conforms to the experience ratio.

---

### User Story 2 - Manage Project-Level Overlays by Aspect Ratio (Priority: P2)

A Project Owner configures overlays at the project level, uploading separate overlay assets for each supported aspect ratio. Experiences within that project automatically receive the correct overlay based on their configured output aspect ratio.

**Why this priority**: Overlays are a key visual branding element. Supporting all aspect ratios at the project level enables experiences to have consistent branding regardless of their output format.

**Independent Test**: Can be fully tested by uploading overlays for different aspect ratios in the project editor and verifying they are correctly stored and retrievable.

**Acceptance Scenarios**:

1. **Given** a Project Owner is in the overlay editor, **When** they view the overlay configuration options, **Then** they see slots for 1:1, 3:2, 2:3, 9:16, and a default (aspect-ratio-agnostic) overlay.
2. **Given** a Project Owner uploads an overlay for the 3:2 aspect ratio, **When** the upload completes, **Then** the overlay is associated with the 3:2 slot and displayed in preview.
3. **Given** an overlay already exists for a specific aspect ratio, **When** the Project Owner uploads a new one, **Then** the previous overlay is replaced.
4. **Given** a Project Owner has configured overlays, **When** they view the overlay summary, **Then** they see which aspect ratios have overlays and which are empty.

---

### User Story 3 - Camera and Input Alignment (Priority: P3)

When a guest uses the camera capture or uploads an image, the interface automatically constrains the capture/crop to match the experience's output aspect ratio, ensuring visual consistency throughout the pipeline.

**Why this priority**: This ensures input media matches output expectations, preventing cropping issues or composition problems in the final result. It directly impacts the guest experience during capture.

**Independent Test**: Can be tested by opening a capture interface for an experience with a specific aspect ratio and verifying the camera preview/crop tool matches that ratio.

**Acceptance Scenarios**:

1. **Given** an experience is configured with 9:16 aspect ratio, **When** a guest opens the camera capture, **Then** the camera preview frame displays a 9:16 composition guide.
2. **Given** an experience is configured with 1:1 aspect ratio, **When** a guest uploads an image, **Then** the crop interface defaults to a 1:1 crop frame.
3. **Given** an uploaded image does not match the experience aspect ratio, **When** the guest adjusts the crop, **Then** the crop frame maintains the experience's aspect ratio (cannot distort).

---

### User Story 4 - Automatic Overlay Resolution at Job Execution (Priority: P4)

When a guest completes a photo/video capture, the system automatically selects and applies the correct overlay based on the experience's output aspect ratio. If no matching overlay exists, a deterministic fallback behavior applies.

**Why this priority**: This automates the overlay selection process, removing manual configuration per experience and ensuring consistent results.

**Independent Test**: Can be tested by creating a job for an experience with a specific aspect ratio and verifying the correct overlay is applied (or fallback behavior occurs).

**Acceptance Scenarios**:

1. **Given** an experience is configured with 3:2 aspect ratio and the project has a 3:2 overlay, **When** a job is executed, **Then** the 3:2 overlay is applied to the output.
2. **Given** an experience is configured with 2:3 aspect ratio but the project has no 2:3 overlay and has a default overlay, **When** a job is executed, **Then** the default overlay is applied.
3. **Given** an experience is configured with 2:3 aspect ratio and the project has neither a 2:3 overlay nor a default overlay, **When** a job is executed, **Then** no overlay is applied and the output is generated without an overlay.
4. **Given** an experience has overlays enabled and a matching overlay exists, **When** the job is created, **Then** the overlay selection is snapshotted and immutable for that job.

---

### User Story 5 - AI Generation Aspect Ratio Enforcement (Priority: P5)

The AI generation system receives the output aspect ratio as an explicit configuration parameter, ensuring generated images/videos match the experience's defined ratio without post-processing cropping or resizing.

**Why this priority**: This eliminates post-generation fixes that cause quality issues like cut-off subjects or misaligned overlays.

**Independent Test**: Can be tested by triggering AI generation for an experience with a specific aspect ratio and verifying the output dimensions match.

**Acceptance Scenarios**:

1. **Given** an experience is configured with 3:2 aspect ratio, **When** AI generation is triggered, **Then** the generation prompt includes explicit aspect ratio instructions.
2. **Given** an AI model does not support the experience's aspect ratio, **When** an Experience Creator attempts to select that model, **Then** the model is not available for selection (blocked, not just warned).
3. **Given** AI generation completes, **When** the output is analyzed, **Then** it matches the experience's configured aspect ratio without requiring post-generation cropping.

---

### Edge Cases

- What happens when an Experience Creator changes the aspect ratio on an existing experience with active sessions?
  - Warning is displayed; existing in-progress jobs continue with their snapshotted configuration.
- How does the system handle an experience with overlays enabled but no matching overlay and no default?
  - Output is generated without any overlay (explicit fallback).
- What happens if a project overlay is deleted while jobs are in progress?
  - Jobs use snapshotted overlay reference; deletion does not affect in-flight jobs.
- What if the camera capture UI cannot support a specific aspect ratio on a device?
  - The capture proceeds with the closest supported ratio and the crop interface enforces final ratio compliance.

## Requirements *(mandatory)*

### Functional Requirements

**Experience Configuration**

- **FR-001**: System MUST require an output aspect ratio selection when creating an experience.
- **FR-002**: System MUST restrict aspect ratio options based on media type (Image/GIF: 1:1, 3:2, 2:3, 9:16; Video: 9:16, 1:1).
- **FR-003**: System MUST display a warning when changing the aspect ratio of an existing experience, informing about implications for prompts, overlays, and model compatibility.
- **FR-004**: System MUST NOT allow invalid media type / aspect ratio combinations to be saved.

**Overlay System**

- **FR-005**: System MUST support overlay configuration at the project level for all supported aspect ratios: 1:1, 3:2, 2:3, 9:16, and a default (aspect-ratio-agnostic) option.
- **FR-006**: System MUST allow Project Owners to upload, replace, and remove overlays for each aspect ratio slot.
- **FR-007**: System MUST automatically select the overlay matching the experience's output aspect ratio at job execution time.
- **FR-008**: System MUST fall back to the default overlay when no aspect-ratio-specific overlay exists.
- **FR-009**: System MUST apply no overlay when neither a matching nor default overlay exists.

**Job Execution**

- **FR-010**: System MUST snapshot the experience configuration (including aspect ratio, media type, prompt, and overlay applicability) when a job is created.
- **FR-011**: System MUST use only the snapshotted configuration during job execution, ignoring any live configuration changes.
- **FR-012**: System MUST ensure the final output media matches the snapshotted aspect ratio exactly.

**Input Handling**

- **FR-013**: System MUST configure camera capture UI to match the experience's output aspect ratio.
- **FR-014**: System MUST constrain image upload cropping to the experience's output aspect ratio.
- **FR-015**: System MUST NOT stretch or distort captured/uploaded images to fit the aspect ratio.

**AI Generation**

- **FR-016**: System MUST pass the output aspect ratio explicitly to the AI generation process.
- **FR-017**: System MUST prevent selection of AI models that do not support the experience's configured aspect ratio.
- **FR-018**: System MUST NOT perform post-generation cropping or resizing to fix aspect ratio mismatches.

**Unified Aspect Ratio Definition**

- **FR-019**: System MUST maintain a single canonical definition of supported aspect ratios that all components reference.
- **FR-020**: System MUST define media-type-specific subsets of valid aspect ratios from this canonical definition.

### Key Entities

- **Experience**: The AI-powered photo/video experience configuration, now including a required output aspect ratio and media type.
- **Project**: The container for experiences and shared resources, now including aspect-ratio-keyed overlay storage.
- **Overlay**: A visual layer applied to final outputs, now organized by aspect ratio at the project level.
- **Job**: A single transform request from a guest, now including a snapshot of the experience's aspect ratio and overlay configuration.
- **Aspect Ratio**: A canonical value representing the output dimensions (1:1, 3:2, 2:3, 9:16).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new experiences have an output aspect ratio configured before being activated.
- **SC-002**: 100% of job outputs match their snapshotted experience aspect ratio (no dimension mismatches).
- **SC-003**: Overlay resolution completes within 500ms of job creation (overlay selection does not delay processing).
- **SC-004**: Experience Creators can configure overlays for all 5 aspect ratio slots (including default) within 5 minutes.
- **SC-005**: Zero visual defects (stretched images, cropped subjects, misaligned overlays) in job outputs when aspect ratios are properly configured.
- **SC-006**: Camera capture UI correctly displays the experience aspect ratio on 95% of supported devices.
- **SC-007**: Project Owners report 80% or higher satisfaction with the overlay management workflow.
- **SC-008**: Reduce aspect-ratio-related support tickets by 70% within 30 days of launch.

## Assumptions

- The existing overlay system currently supports only 1:1 and 9:16 aspect ratios; this feature extends it to support 3:2 and 2:3 as well.
- Overlay assets are provided by Project Owners in the correct dimensions for each aspect ratio (system does not auto-resize overlays).
- AI models in use have documented aspect ratio capabilities that can be queried or configured.
- The camera capture component can be configured to display different aspect ratio frames.
- The default (aspect-ratio-agnostic) overlay will be scaled/positioned appropriately by the compositing system when used as a fallback.

## Out of Scope

- Multiple output aspect ratios per experience
- Runtime aspect ratio switching
- Automatic aspect ratio detection
- Per-experience overlay selection (overlays remain project-level)
- Safe-area overlays for social platform requirements
- Experience-level override of project overlays
