# Feature Specification: AI Transform Step Playground

**Feature Branch**: `019-ai-transform-playground`
**Created**: 2024-12-04
**Status**: Draft
**Input**: User description: "Add AI Playground test panel to AI Transform step editor"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Test AI Transformation with Sample Image (Priority: P1)

As an experience creator configuring an AI Transform step, I want to test my AI prompt and settings with a sample image so that I can verify the transformation produces the desired results before publishing.

**Why this priority**: This is the core value proposition - creators cannot iterate on AI prompts without a way to preview results. Without this, they must publish and use the live experience to test, wasting time and resources.

**Independent Test**: Can be fully tested by opening the AI Transform editor, clicking Test, uploading an image, clicking Generate, and verifying the transformed result displays. Delivers immediate value by enabling prompt iteration.

**Acceptance Scenarios**:

1. **Given** I am editing an AI Transform step with a valid prompt configured, **When** I click the "Test" button, **Then** a test dialog opens where I can upload a sample image.

2. **Given** the test dialog is open and I have uploaded an image, **When** I click "Generate", **Then** the system processes the image using my configured AI settings and displays the transformed result.

3. **Given** a transformation is in progress, **When** I observe the dialog, **Then** I see a live timer showing elapsed time and a clear loading indicator.

4. **Given** the transformation completes successfully, **When** I view the result, **Then** I see the transformed image alongside my input image for easy comparison, plus the total generation time.

---

### User Story 2 - Upload Test Image via Drag and Drop (Priority: P2)

As an experience creator, I want to upload my test image by dragging and dropping it into the dialog so that I can quickly test with images I have readily available.

**Why this priority**: Drag-and-drop is a convenience enhancement that improves workflow efficiency but is not essential - click-to-upload provides the same functionality.

**Independent Test**: Can be tested by opening the test dialog and dragging an image file onto the upload zone, verifying it is accepted and previewed.

**Acceptance Scenarios**:

1. **Given** the test dialog is open with the upload zone visible, **When** I drag an image file over the upload zone, **Then** I see visual feedback indicating the drop target is active.

2. **Given** I am dragging an image over the upload zone, **When** I drop the image, **Then** the image is accepted, validated, and displayed as the input preview.

3. **Given** the upload zone is visible, **When** I click on it, **Then** a file picker opens allowing me to select an image from my device.

---

### User Story 3 - Handle Generation Errors Gracefully (Priority: P2)

As an experience creator, I want to see clear error messages when AI generation fails so that I can understand what went wrong and take corrective action.

**Why this priority**: Error handling ensures creators are not left confused when things go wrong, maintaining trust in the platform and enabling self-service troubleshooting.

**Independent Test**: Can be tested by triggering various error conditions (network failure, invalid image, AI service error) and verifying appropriate error messages appear with recovery options.

**Acceptance Scenarios**:

1. **Given** AI generation is in progress, **When** the generation fails due to a service error, **Then** I see a clear error message explaining the issue and a "Retry" button to try again.

2. **Given** I upload an invalid file type (e.g., PDF), **When** the validation runs, **Then** I see an error message specifying the allowed file types (JPEG, PNG, WebP).

3. **Given** I upload a file larger than the size limit, **When** the validation runs, **Then** I see an error message specifying the maximum allowed size.

---

### User Story 4 - Regenerate with Same or New Image (Priority: P3)

As an experience creator viewing a generated result, I want to regenerate with the same image or try a new one so that I can iterate on my prompt without starting over.

**Why this priority**: Iteration convenience - makes the test workflow more efficient but is not essential for the core test-and-preview functionality.

**Independent Test**: Can be tested by completing a generation, then clicking Regenerate to verify a new result is produced, or clearing and uploading a new image.

**Acceptance Scenarios**:

1. **Given** I have a generated result displayed, **When** I click "Regenerate", **Then** a new transformation is performed using the same input image and I see the new result.

2. **Given** I have a generated result displayed, **When** I click the clear/reset button, **Then** the dialog resets to the initial upload state where I can upload a new image.

---

### Edge Cases

- What happens when the user has not configured a prompt yet?
  - The Test button should be disabled with a tooltip explaining a prompt is required.

- What happens when the user closes the dialog during generation?
  - The generation continues in the background; closing the dialog discards the result.

- What happens when the AI service is unavailable?
  - Display an error message indicating the service is temporarily unavailable with an option to retry.

- How does the system handle very large images?
  - Images are validated client-side before upload; files exceeding 10MB are rejected with a clear message.

- What happens on slow network connections?
  - The timer continues to show elapsed time; a timeout of 2 minutes is applied, after which an error is shown.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Test" button in the AI Transform step editor that opens a test dialog.
- **FR-002**: System MUST disable the Test button when no prompt is configured for the step.
- **FR-003**: System MUST accept test images via click-to-upload and drag-and-drop interactions.
- **FR-004**: System MUST validate uploaded images for file type (JPEG, PNG, WebP only) and size (maximum 10MB).
- **FR-005**: System MUST display a preview of the uploaded input image before generation.
- **FR-006**: System MUST use the current step's AI configuration (model, prompt, aspect ratio, reference images) for generation.
- **FR-007**: System MUST ignore the step's `variables` and `outputType` fields during test generation (static image output only).
- **FR-008**: System MUST display a live timer during AI generation showing elapsed seconds.
- **FR-009**: System MUST display the generated result image alongside the input image for comparison.
- **FR-010**: System MUST display the total generation time after successful completion.
- **FR-011**: System MUST display clear, actionable error messages when generation fails.
- **FR-012**: System MUST provide a "Retry" button when generation fails.
- **FR-013**: System MUST provide a "Regenerate" option after successful generation.
- **FR-014**: System MUST provide a way to clear the current test and start fresh.
- **FR-015**: System MUST require user authentication to perform test generations.

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: The test dialog MUST work on mobile viewport (320px-768px) as primary experience.
- **MFR-002**: On mobile viewports, the input and result images MUST stack vertically (input above, result below).
- **MFR-003**: On larger viewports, the input and result images SHOULD display side-by-side for comparison.
- **MFR-004**: All interactive elements (buttons, upload zone) MUST meet minimum touch target size (44x44px).
- **MFR-005**: The upload zone MUST be large enough for easy touch interaction on mobile.

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All test generation inputs (step ID, image data) MUST be validated with Zod schemas before processing.
- **TSR-002**: Image file validation (type, size) MUST occur client-side before upload.
- **TSR-003**: Server-side validation MUST verify the step exists and is of type `ai-transform`.
- **TSR-004**: TypeScript strict mode MUST be maintained throughout implementation.

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Test generation MUST use Admin SDK via Server Actions for AI service calls.
- **FAR-002**: Test images MUST be uploaded to temporary storage with automatic cleanup.
- **FAR-003**: Step configuration MUST be fetched from Firestore to ensure current values are used.
- **FAR-004**: Test images and results are ephemeral and MUST NOT be persisted to the step record.

### Key Entities

- **Step (ai-transform type)**: The step configuration being tested, containing model, prompt, aspectRatio, referenceImageUrls, and other AI settings.
- **Test Image**: Ephemeral uploaded image used as input for AI transformation; validated for type and size, stored temporarily.
- **Generated Result**: Ephemeral AI-generated image returned as base64; displayed but not persisted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can complete a test generation (upload image, generate, view result) in under 2 minutes (excluding AI processing time).
- **SC-002**: 95% of test generations that reach the AI service return a viewable result.
- **SC-003**: Error messages are clear enough that 90% of users can understand what went wrong without contacting support.
- **SC-004**: The test dialog loads and becomes interactive within 1 second of clicking the Test button.
- **SC-005**: Creators can iterate on prompts (modify prompt, test, view result) at least 5 times in a 10-minute session without workflow friction.

## Assumptions

- The existing AI client infrastructure is functional and will be reused.
- Authentication is already implemented and will be leveraged for authorization checks.
- The AI Transform step type is fully implemented with proper schema validation.
- Temporary storage cleanup is handled by existing infrastructure.
- Default AI model is used when no model is explicitly configured.
- Default aspect ratio is 1:1 when no aspect ratio is explicitly configured.

## Out of Scope

- Variable substitution in prompts during testing (variables are ignored).
- Video or GIF output generation (always produces static image).
- Persisting test results or test image history.
- Multiple input images for a single test.
- A/B testing multiple prompts simultaneously.
