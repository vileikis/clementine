# Feature Specification: Guest Experience Runtime Engine

**Feature Branch**: `011-guest-runtime`
**Created**: 2025-11-27
**Status**: Draft
**Input**: PRD #3 - Guest Experience Runtime Engine (Live Step-by-Step Runtime for Guests)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Guest Journey End-to-End (Priority: P1)

A guest opens a Clementine experience via a join link or embed and completes the entire journey from start to finish, including real camera capture and AI-generated results.

**Why this priority**: This is the core value proposition of Clementine - guests must be able to complete journeys successfully to deliver any value to event creators and brands.

**Independent Test**: Can be fully tested by opening a join link, navigating through all steps, capturing a photo, waiting for AI processing, and receiving the final result. Delivers the complete guest experience value.

**Acceptance Scenarios**:

1. **Given** a published event with an active journey, **When** a guest opens the join link, **Then** they see the first step of the journey with the event's theme applied
2. **Given** a guest is on a capture step, **When** they take a photo using the camera, **Then** the photo is captured and they can proceed to the next step
3. **Given** a guest has completed all required steps including capture, **When** the processing step executes, **Then** the AI generates a transformed result within 60 seconds
4. **Given** AI processing completes successfully, **When** the guest reaches the reward step, **Then** they see their AI-generated media with download and share options

---

### User Story 2 - Navigate Journey Steps with Input Collection (Priority: P1)

A guest navigates through various step types (info, text input, multiple choice, email, etc.), providing their input which is persisted to their session.

**Why this priority**: Data collection is essential for personalizing the experience and gathering guest information for event creators.

**Independent Test**: Can be tested by navigating through a journey with multiple input steps, providing data at each step, and verifying the data is saved to the session.

**Acceptance Scenarios**:

1. **Given** a guest is on a short text step, **When** they enter text and submit, **Then** the text is saved to their session and they advance to the next step
2. **Given** a guest is on an email step, **When** they enter an invalid email format, **Then** they see a validation error and cannot proceed
3. **Given** a guest is on a multiple choice step, **When** they select an option, **Then** the selection is saved and they can continue
4. **Given** a guest is on an opinion scale step, **When** they select a rating, **Then** the rating is saved to their session

---

### User Story 3 - Recover from Errors Gracefully (Priority: P2)

A guest encounters an error during their journey (camera permission denied, AI processing failure, network issue) and can recover without losing their progress.

**Why this priority**: Error handling ensures guests aren't frustrated by technical issues and can still complete their journey or exit gracefully.

**Independent Test**: Can be tested by simulating various failure scenarios (deny camera permission, mock AI timeout, disconnect network) and verifying recovery options are presented.

**Acceptance Scenarios**:

1. **Given** the camera permission is denied, **When** the guest reaches a capture step, **Then** they see a friendly message with an option to grant permission or use an alternative (photo upload)
2. **Given** AI processing times out, **When** 45 seconds elapse without a result, **Then** the system retries automatically and shows a fallback message if retry fails
3. **Given** a network failure occurs during step submission, **When** connectivity is restored, **Then** the guest can retry the action without data loss
4. **Given** any critical error occurs, **When** recovery isn't possible, **Then** the guest sees a friendly "experience unavailable" message with support contact options

---

### User Story 4 - Select Experience from Multiple Options (Priority: P3)

A guest views an experience picker step showing multiple AI experience options and selects one that will be used for their photo transformation.

**Why this priority**: Experience selection adds personalization and variety to events with multiple AI transformation options.

**Independent Test**: Can be tested by presenting multiple experiences, selecting one, and verifying the selected experience is used for subsequent capture and AI processing.

**Acceptance Scenarios**:

1. **Given** a journey has an experience picker step with 3 experiences, **When** the guest views this step, **Then** they see all 3 experiences with preview images and names
2. **Given** a guest selects an experience, **When** they confirm their selection, **Then** the experience ID is saved to their session and used for AI processing
3. **Given** a guest has selected an experience, **When** they reach the capture step, **Then** the capture constraints match the selected experience configuration

---

### Edge Cases

- What happens when a guest's session expires mid-journey? Session data persists for 24 hours; guests can resume from their last completed step
- How does the system handle extremely slow network connections? Progressive loading with optimistic UI updates; reduced quality options for media
- What happens when the AI provider is completely unavailable? Graceful degradation with friendly error message and retry option; session preserved for later completion
- How does the system handle browser back/forward navigation? State preserved via URL parameters; appropriate step shown with validation
- What happens when a guest tries to access a journey for an unpublished/archived event? Friendly "experience unavailable" message without technical details
- What happens when camera hardware fails after initial permission grant? Error recovery UI with option to retry camera access or upload from device

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST load event, journey definition, and theme when guest opens join link
- **FR-002**: System MUST create a unique guest session ID upon journey initialization
- **FR-003**: System MUST render steps in the order defined by the journey's `stepOrder` array
- **FR-004**: System MUST render all 11 step types: info, experience-picker, capture, short_text, long_text, multiple_choice, yes_no, opinion_scale, email, processing, reward
- **FR-005**: System MUST capture real photos/videos using device camera on capture steps
- **FR-006**: System MUST validate user inputs according to step configuration (required fields, email format, text length limits)
- **FR-007**: System MUST persist step input data to the guest session in real-time
- **FR-008**: System MUST execute AI workflow during processing step using configured provider
- **FR-009**: System MUST display AI-generated media on reward step with download and share buttons
- **FR-010**: System MUST apply event theme (colors, logo, fonts) throughout the journey
- **FR-011**: System MUST show friendly error UI with recovery options when failures occur
- **FR-012**: System MUST support retry functionality for failed AI processing (1-2 automatic retries)
- **FR-013**: System MUST support navigation to previous steps where applicable
- **FR-014**: System MUST show "experience unavailable" fallback when event/journey cannot be loaded
- **FR-015**: System MUST support GIF mode capture (rapid multi-capture) when configured

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Guest experience MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Camera viewfinder MUST fill available screen space on mobile devices
- **MFR-003**: All buttons and interactive elements MUST meet minimum touch target size (44x44px)
- **MFR-004**: Typography MUST be readable on mobile (minimum 14px for body text, 16px for inputs to prevent iOS zoom)
- **MFR-005**: Loading states and progress indicators MUST be clearly visible on mobile screens
- **MFR-006**: Share and download buttons MUST use native mobile share APIs where available

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All guest form inputs (text, email, selections) MUST be validated with Zod schemas
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes)
- **TSR-003**: Session data structure MUST be type-safe with defined SessionData interface
- **TSR-004**: Step type configurations MUST use discriminated union types for type safety
- **TSR-005**: AI workflow parameters MUST be validated before execution

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Session creation and updates MUST use Admin SDK via Server Actions
- **FAR-002**: Real-time subscriptions and optimistic reads MUST use Client SDK
- **FAR-003**: Zod schemas MUST be feature-local in `features/sessions/schemas/`
- **FAR-004**: Captured images MUST be uploaded to Firebase Storage with proper session-based paths
- **FAR-005**: AI-generated results MUST be stored as full public URLs for instant rendering
- **FAR-006**: Session data MUST be persisted to Firestore on each step completion

### Key Entities

- **Session**: Guest's journey interaction record containing sessionId, eventId, journeyId, currentStepIndex, state (created/captured/transforming/ready/error), inputImagePath, resultImagePath, and collected form data
- **Journey**: Ordered sequence of steps defining the guest experience flow (existing entity)
- **Step**: Individual screen configuration with type-specific properties (existing entity)
- **Experience**: AI transformation configuration used during processing step (existing entity)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guests can complete an end-to-end journey (from join link to viewing AI result) in under 2 minutes (excluding AI processing time)
- **SC-002**: AI processing completes within 60 seconds for 95% of requests
- **SC-003**: 90% of guests who start a journey successfully complete it without encountering unrecoverable errors
- **SC-004**: Camera capture works on 95% of mobile devices with camera support
- **SC-005**: All 11 step types render correctly and collect valid data
- **SC-006**: Session data persists reliably with zero data loss during normal operation
- **SC-007**: Error recovery options are presented within 3 seconds of error detection
- **SC-008**: Guest experience loads within 3 seconds on standard mobile connections (4G)

## Assumptions

- The existing step renderers from `web/src/features/steps/components/preview/` can be reused for guest runtime with minimal modifications
- The existing `useGuestFlow` hook provides a foundation that can be extended for journey-aware navigation
- The AI module (`web/src/lib/ai/`) is production-ready and supports the required providers (Google AI, n8n, mock)
- Firebase Storage and Firestore are configured and accessible for session persistence
- Events have a valid `activeJourneyId` set before going live
- Camera APIs (getUserMedia) are available on target mobile browsers (Chrome, Safari)

## Dependencies

- Events feature (for loading event and theme)
- Journeys feature (for loading journey definition and step order)
- Steps feature (for step renderers and configurations)
- Experiences feature (for AI configuration during processing)
- Sessions feature (for persisting guest data)
- AI module (for executing transformations)

## Out of Scope

- Editor functionality
- Preview mode (handled separately)
- Playback mode (handled separately)
- Email delivery infrastructure
- Gallery backend for viewing all submissions
- Admin view of results
- Analytics implementation (optional future enhancement)
