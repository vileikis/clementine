# Feature Specification: AI Transform Pipeline

**Feature Branch**: `029-ai-transform-pipeline`
**Created**: 2025-12-18
**Status**: Draft
**Input**: User description: "Now let's add ai transform to image pipeline. We would not use it for the gif or video pipelines. Alrgith so we have implemented overlay pipeline option - where we currently use mocked frames, see '/Users/iggyvileikis/Projects/@attempt-n2/clementine/functions/src/http/processMedia.ts' '/Users/iggyvileikis/Projects/@attempt-n2/clementine/functions/src/tasks/processMediaJob.ts'. Now I want to add aiTransform: true option, which will also use mocked ai transform config."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Process Single Image with AI Transform (Priority: P1)

When a media processing request includes the `aiTransform` flag for a single image session, the system applies AI transformation to the input image using the configured AI provider (Gemini) before any other processing steps (overlay, encoding).

**Why this priority**: This is the core functionality - enabling AI transformation for single images. It delivers immediate value by transforming guest photos according to themed prompts (e.g., hobbit transformation).

**Independent Test**: Can be fully tested by submitting a single-image session with `aiTransform: true` via the processMedia endpoint and verifying the output contains an AI-transformed image.

**Acceptance Scenarios**:

1. **Given** a session with one input image exists, **When** processMedia is called with `aiTransform: true` and `outputFormat: "image"`, **Then** the system applies AI transformation using the mocked config and returns a transformed single image
2. **Given** a session with one input image exists, **When** processMedia is called with `aiTransform: false` or omitted, **Then** the system skips AI transformation and processes the original image
3. **Given** a session with one input image exists, **When** processMedia is called with `aiTransform: true` and `overlay: true`, **Then** the system applies AI transformation first, then overlay, and returns the final composite image

---

### User Story 2 - Skip AI Transform for GIF Pipeline (Priority: P1)

When a media processing request is for GIF output (multiple images), the system ignores the `aiTransform` flag even if provided, and processes images through the standard GIF pipeline without AI transformation.

**Why this priority**: This is a critical boundary condition - ensuring AI transform is correctly scoped to single images only, preventing unexpected behavior or errors in GIF processing.

**Independent Test**: Can be fully tested by submitting a multi-image session with `aiTransform: true` and `outputFormat: "gif"`, verifying the output is a standard GIF without AI transformation applied.

**Acceptance Scenarios**:

1. **Given** a session with 4+ input images exists, **When** processMedia is called with `aiTransform: true` and `outputFormat: "gif"`, **Then** the system ignores aiTransform and processes a standard GIF
2. **Given** a session with 12 input images exists, **When** processMedia is called with `aiTransform: true` and `outputFormat: "gif"`, **Then** the system logs a warning about aiTransform being unsupported for GIF and processes without transformation

---

### User Story 3 - AI Transform with Reference Images (Priority: P2)

When AI transformation is enabled, the system includes reference images (stored in Firebase Storage) in the AI generation request to guide the transformation style (e.g., costume reference, prop reference).

**Why this priority**: Reference images enable high-quality themed transformations by providing visual context to the AI model, but the basic transform can work with prompt alone.

**Independent Test**: Can be fully tested by verifying the mocked AI config includes reference image paths and that these paths are passed to the AI provider during transformation.

**Acceptance Scenarios**:

1. **Given** a session with one input image exists, **When** processMedia is called with `aiTransform: true`, **Then** the system includes the configured reference images (hobbit-costume.jpg, black-magic-wand.jpg) in the AI request
2. **Given** the AI transformation config specifies 2 reference images, **When** the AI provider is invoked, **Then** the request includes both reference images as Firebase Storage paths (not URLs)

---

### Edge Cases

- What happens when `aiTransform: true` is provided but the AI provider fails (network error, API error)?
  - System should log the error, mark session as failed with error code 'AI_TRANSFORM_FAILED', and stop processing
- What happens when reference image paths point to non-existent files in Firebase Storage?
  - System should fail gracefully with error code 'REFERENCE_IMAGE_NOT_FOUND' before calling AI provider
- What happens when `aiTransform: true` is provided for video output format?
  - System should ignore aiTransform flag (similar to GIF) and log warning
- What happens when aspect ratio differs between pipelineOptions and aiTransform config?
  - Use aspect ratio from pipelineOptions (single source of truth)
- What happens when the AI-transformed image is significantly larger or smaller than the input?
  - Proceed with encoding - let downstream steps handle resizing/optimization

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept an optional `aiTransform` boolean flag in processMedia requests
- **FR-002**: System MUST apply AI transformation only when `aiTransform: true` is provided AND output format is 'image'
- **FR-003**: System MUST ignore `aiTransform` flag for 'gif' and 'video' output formats
- **FR-004**: System MUST apply AI transformation before overlay and encoding steps in the image pipeline
- **FR-005**: System MUST use a mocked AI transform configuration containing provider, model, prompt, and reference images
- **FR-006**: System MUST support Google Gemini as the AI provider (specifically "gemini-2.5-flash-image" model)
- **FR-007**: System MUST include reference images as Firebase Storage paths (not HTTP URLs) in AI requests
- **FR-008**: System MUST validate reference image paths exist in Firebase Storage before calling AI provider
- **FR-009**: System MUST update session processing state to 'ai-transform' while AI transformation is in progress
- **FR-010**: System MUST handle AI provider failures gracefully and mark session as failed with specific error code
- **FR-011**: System MUST use aspect ratio from pipelineOptions (not from AI config) as single source of truth
- **FR-012**: System MUST support alternative model "gemini-3-pro-image-preview" in AI config (configurable)
- **FR-013**: System MUST log AI transformation start, completion, and duration for monitoring
- **FR-014**: System MUST pass AI-transformed image buffer to subsequent pipeline steps (overlay, encoding)

### Mobile-First Requirements *(Constitution Principle I)*

N/A - This is a backend Cloud Functions feature with no direct mobile UI component. Mobile considerations are handled by the existing processMedia API contract.

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: The `aiTransform` boolean flag MUST be added to the existing `processMediaRequestSchema` Zod schema with optional validation
- **TSR-002**: AI transform configuration interface MUST be strongly typed with provider, model, prompt, referenceImages[], and aspectRatio fields
- **TSR-003**: AI provider interface MUST define strict TypeScript contract for transform method signature
- **TSR-004**: Reference image paths MUST be validated as strings matching Firebase Storage path pattern (media/{companyId}/...)

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Reference images MUST be read from Firebase Storage using Admin SDK
- **FAR-002**: Reference images MUST be stored at path pattern: `media/{companyId}/ai-reference/{filename}`
- **FAR-003**: AI-transformed output images MUST be stored in Firebase Storage following existing pattern: `media/{companyId}/outputs/{timestamp}-{filename}`
- **FAR-004**: Session documents MUST be updated with processing state 'ai-transform' during AI transformation step
- **FAR-005**: Failed AI transformations MUST update session with error code and message via Admin SDK

### Key Entities

- **AI Transform Config**: Mocked configuration object containing provider ('google'), model ('gemini-2.5-flash-image'), prompt (hobbit transformation text), referenceImages array (paths), and aspectRatio. Used as default configuration when aiTransform flag is enabled.

- **AI Provider Interface**: Abstraction defining the contract for AI image transformation services. Currently implemented by GoogleGeminiProvider, but designed to support future providers (Stable Diffusion, Replicate, etc.).

- **Processing State**: Existing session processing state extended with new value 'ai-transform' to indicate AI transformation step is in progress. Follows existing state progression: initializing → ai-transform → overlay → encoding → completed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Single-image sessions with `aiTransform: true` complete successfully and produce AI-transformed output within 60 seconds
- **SC-002**: Multi-image sessions (GIF) correctly ignore `aiTransform` flag and complete without errors
- **SC-003**: AI transformation failures result in session marked as 'failed' with specific error code within 5 seconds of failure
- **SC-004**: Reference images are successfully retrieved from Firebase Storage and included in 100% of AI transformation requests
- **SC-005**: Processing state updates to 'ai-transform' are visible in session documents during transformation
- **SC-006**: AI transformation logs include start time, completion time, and duration for all requests

## Assumptions

- **A-001**: Mocked AI config will be hardcoded in the pipeline service (not fetched from Firestore) for initial implementation
- **A-002**: Google Gemini API credentials are available via environment variables (GOOGLE_AI_API_KEY)
- **A-003**: Reference images (hobbit-costume.jpg, black-magic-wand.jpg) are already uploaded to Firebase Storage at `media/company-test-001/ai-reference/`
- **A-004**: Aspect ratio from pipelineOptions takes precedence over any aspect ratio in AI config to maintain consistency
- **A-005**: AI transformation applies to the full-resolution input image (no pre-resizing)
- **A-006**: AI provider returns image buffer in JPEG format compatible with downstream pipeline steps
- **A-007**: Error handling follows existing pattern used for overlay failures (mark session failed, log error, re-throw)
