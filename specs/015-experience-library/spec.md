# Feature Specification: Experience Library

**Feature Branch**: `015-experience-library`
**Created**: 2025-12-02
**Status**: Draft
**Input**: Phase 2: Transform legacy Journeys into company-scoped Experiences with an Experience Library UI

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create New Experience (Priority: P1)

As an experience creator, I want to create a new experience so I can build custom guest flows from scratch.

**Why this priority**: Creating experiences is the first action users take - without the ability to create, there's nothing to view or edit. This enables the entire feature.

**Independent Test**: Click "New Experience" from the library, verify a new experience is created with default name "Untitled" and the editor opens automatically.

**Acceptance Scenarios**:

1. **Given** I am in the Experiences section, **When** I click the create/add button, **Then** a new experience is created with default name "Untitled"
2. **Given** I have created a new experience, **When** creation completes, **Then** I am automatically redirected to the experience editor page
3. **Given** I create a new experience, **When** it is created, **Then** it has the correct company association

---

### User Story 2 - View Company Experiences (Priority: P1)

As an experience creator, I want to see all experiences belonging to my company so I can manage and organize my reusable flow templates.

**Why this priority**: After creating experiences, users need to view and navigate their library. This establishes the core navigation pattern.

**Independent Test**: Navigate to the Experiences section from the company workspace and verify a list/grid of company experiences appears. Delivers the core organizational value of having a central library.

**Acceptance Scenarios**:

1. **Given** I am logged into a company workspace, **When** I navigate to the Experiences section, **Then** I see a list/grid of all experiences belonging to that company
2. **Given** a company has no experiences yet, **When** I navigate to the Experiences section, **Then** I see an empty state with a prompt to create the first experience
3. **Given** experiences exist with preview media, **When** I view the experience list, **Then** preview media is displayed if available

---

### User Story 3 - Edit Experience in Editor (Priority: P1)

As an experience creator, I want to open an experience and edit its steps so I can customize the guest flow for my needs.

**Why this priority**: Editing experiences is the core functionality - creators need to modify steps, reorder them, and configure each step's settings. Without editing capability, the library is read-only and unusable.

**Independent Test**: Click on any experience from the library, verify the ExperienceEditor loads with the correct steps, make a change, and confirm it persists.

**Acceptance Scenarios**:

1. **Given** I am viewing the experience list, **When** I click on an experience, **Then** I am taken to the experience detail page with the ExperienceEditor loaded
2. **Given** I am on the experience detail page, **When** I view the editor, **Then** all steps for that experience are loaded in the correct order
3. **Given** I am editing an experience, **When** I add, remove, or reorder steps, **Then** changes are saved to the correct data path (`/experiences/{id}/steps`)
4. **Given** I am in the step picker, **When** I look for deprecated step types (ExperiencePicker), **Then** they are not visible as options

---

### User Story 4 - Rename Experience (Priority: P2)

As an experience creator, I want to rename an experience so I can keep my library organized with meaningful names.

**Why this priority**: Naming is important for organization but is secondary to core CRUD operations. Users can work with default names initially.

**Independent Test**: Open an experience, click on the title to trigger rename dialog, enter a new name, and verify the name updates in the library.

**Acceptance Scenarios**:

1. **Given** I am on the experience detail page, **When** I click on the experience title, **Then** a rename dialog opens
2. **Given** the rename dialog is open, **When** I enter a new name and confirm, **Then** the experience name is updated
3. **Given** I have renamed an experience, **When** I return to the experience list, **Then** the new name is displayed

---

### Edge Cases

- What happens when a company has hundreds of experiences? List should support scrolling/pagination without performance degradation
- How does the system handle concurrent edits to the same experience? Last-write-wins is acceptable for MVP
- What happens if an experience is deleted while being edited? User should be notified and redirected to the library
- What happens if a user tries to create an experience with an empty name? Validation should prevent this

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a top-level `/experiences` collection in the database
- **FR-002**: System MUST display an "Experiences" navigation item in the company workspace sidebar
- **FR-003**: System MUST show only experiences where `experience.companyId` matches the active company
- **FR-004**: System MUST allow users to view experience details by navigating to `/experiences/{id}`
- **FR-005**: System MUST embed the ExperienceEditor (formerly JourneyEditor) on the experience detail page
- **FR-006**: System MUST load steps from `/experiences/{experienceId}/steps` in the editor
- **FR-007**: System MUST allow users to rename an experience via a dialog triggered by clicking the title
- **FR-008**: System MUST allow creation of new experiences with at minimum a name field
- **FR-009**: System MUST assign the current company's ID to newly created experiences
- **FR-010**: System MUST hide deprecated step types (ExperiencePicker) from the step picker UI
- **FR-011**: System MUST replace all "Journey" terminology with "Experience" in the UI
- **FR-012**: System MUST maintain `stepsOrder` array to preserve step ordering within an experience
- **FR-013**: System MUST NOT display public/private toggle UI (out of scope)
- **FR-014**: System MUST NOT display preview media upload UI (out of scope)
- **FR-015**: System MUST display preview media if it already exists on an experience

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Experience library list MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Experience cards/list items MUST have touch targets of at least 44x44px
- **MFR-003**: Experience name and navigation MUST be readable on mobile (≥14px for body text)
- **MFR-004**: ExperienceEditor step management MUST be usable on mobile with touch-friendly drag handles

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Experience entity MUST be validated with Zod schema on all create/update operations
- **TSR-002**: Step entities MUST be validated with Zod schema on all create/update operations
- **TSR-003**: TypeScript strict mode MUST be maintained with no `any` escapes in experience-related code
- **TSR-004**: `companyId` field MUST be required and validated as non-empty string

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All experience create/update/delete operations MUST use Admin SDK via Server Actions
- **FAR-002**: Real-time experience list updates MUST use Client SDK for subscriptions
- **FAR-003**: Experience Zod schemas MUST be located in `features/experiences/schemas/`
- **FAR-004**: Step Zod schemas MUST be located in `features/steps/schemas/`
- **FAR-005**: Experience and step data MUST follow normalized flat collection structure at root level

### Key Entities

- **Experience**: A reusable flow definition owned by a company. Contains: id, companyId, name, description (optional), isPublic (not used in MVP), previewMedia (display only), stepsOrder (array of step IDs), createdAt, updatedAt
- **Step**: An individual screen configuration within an experience. Maintains same schema as current step implementation but stored under `/experiences/{experienceId}/steps`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate to and view their company's experience library within 2 seconds of clicking the menu item
- **SC-002**: Users can open an experience and see the editor load within 3 seconds
- **SC-003**: All step operations (add, edit, delete, reorder) complete within 2 seconds
- **SC-004**: Zero instances of "Journey" terminology remain in user-facing UI after implementation
- **SC-005**: Users can successfully create, view, edit, and rename experiences on mobile devices

## Assumptions

- The company workspace navigation pattern already exists and supports adding new menu items
- The existing journeys feature module (`web/src/features/journeys/`) serves as the basis for the new experiences module - code can be adapted/refactored rather than written from scratch
- No data migration is required - starting fresh with the new `/experiences` collection
- Legacy journeys data does not need to be preserved or migrated
- The step picker UI already has a mechanism to filter/hide certain step types
