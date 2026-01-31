# Feature Specification: Experience Runtime Topbar with Progress Tracking

**Feature Branch**: `049-runtime-topbar`
**Created**: 2026-01-30
**Status**: Draft
**Input**: User description: "Add themed topbar to ExperienceRuntime with progress tracking and home navigation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Navigates Through Experience with Progress Awareness (Priority: P1)

Guests completing an experience (pregate, main, or preshare) can see their current position within the experience and understand how many steps remain. This helps reduce drop-off rates by setting clear expectations.

**Why this priority**: Core UX improvement that directly impacts completion rates and user satisfaction. Without progress indication, users may abandon experiences due to uncertainty about length.

**Independent Test**: Can be fully tested by starting any guest experience (pregate/main/preshare), navigating through steps, and verifying that the topbar displays experience name and progress bar that updates with each step transition.

**Acceptance Scenarios**:

1. **Given** a guest has started a pregate experience with 5 steps, **When** they view step 1, **Then** the topbar displays the experience name and a progress bar showing 1/5 completion (20%)
2. **Given** a guest is on step 3 of a 5-step experience, **When** they navigate to step 4, **Then** the progress bar updates to show 4/5 completion (80%)
3. **Given** a guest completes the final step of an experience, **When** they view the last step, **Then** the progress bar shows 100% completion
4. **Given** a guest navigates backward in an experience, **When** they go from step 3 to step 2, **Then** the progress bar updates to reflect the current step (2/5)

---

### User Story 2 - Guest Exits Experience with Confirmation (Priority: P2)

Guests can exit an in-progress experience by clicking the home button in the topbar. The system confirms their intent before navigating away to prevent accidental data loss.

**Why this priority**: Important safety feature but less critical than progress tracking. Prevents user frustration from accidental exits while providing a clear escape path.

**Independent Test**: Can be fully tested by starting any guest experience, clicking the home icon in the topbar, confirming the exit in the dialog, and verifying navigation to the welcome page.

**Acceptance Scenarios**:

1. **Given** a guest is on step 2 of an experience, **When** they click the home icon button in the topbar, **Then** a confirmation dialog appears asking "Are you sure you want to exit? Your progress will be lost."
2. **Given** a confirmation dialog is displayed, **When** the guest clicks "Yes, Exit" or equivalent, **Then** they are redirected to the project welcome page
3. **Given** a confirmation dialog is displayed, **When** the guest clicks "Cancel" or equivalent, **Then** the dialog closes and they remain on the current step
4. **Given** a guest is on the final step of an experience, **When** they click the home button, **Then** the confirmation dialog still appears (no exception for last step)

---

### User Story 3 - Admin Previews Experience with Visual Context (Priority: P3)

Experience creators testing an experience in preview mode can see the experience name and progress tracking, providing the same visual context guests will see. The home button is visible but non-functional in preview mode.

**Why this priority**: Nice-to-have for creator preview experience. Provides WYSIWYG preview but doesn't affect actual user experience. Lower priority than guest-facing functionality.

**Independent Test**: Can be fully tested by opening an experience in preview mode (ExperiencePreviewModal), navigating through steps, and verifying that the topbar displays with progress tracking but the home button does not trigger navigation.

**Acceptance Scenarios**:

1. **Given** a creator opens an experience in preview mode, **When** they view any step, **Then** the topbar displays the experience name and progress bar
2. **Given** a creator is in preview mode, **When** they click the home icon button, **Then** no action occurs (button is visible but inactive)
3. **Given** a creator navigates through steps in preview mode, **When** they move from step 1 to step 2, **Then** the progress bar updates accordingly

---

### Edge Cases

- What happens when an experience has only 1 step? (Progress bar should show 100% on that single step)
- What happens when an experience has no steps? (Topbar should still render with experience name but no progress bar)
- What happens if the experience name is very long? (Text should truncate with ellipsis to prevent layout breaking)
- What happens when a guest clicks home button rapidly multiple times? (Confirmation dialog should only show once, prevent duplicate actions)
- What happens when theme colors have poor contrast? (Themed components should ensure minimum contrast ratios for accessibility)
- What happens on very small mobile screens (<320px width)? (Topbar should remain functional with responsive sizing)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a topbar component above all experience step content in ExperienceRuntime
- **FR-002**: Topbar MUST display the experience name in the center position
- **FR-003**: Topbar MUST display a visual progress indicator showing current step number and total steps
- **FR-004**: Progress indicator MUST update automatically when the user navigates to a different step
- **FR-005**: Topbar MUST include a home icon button in the right position
- **FR-006**: Home icon button MUST trigger a confirmation dialog when clicked in guest-facing experiences (pregate/main/preshare)
- **FR-007**: Confirmation dialog MUST ask the user to confirm exit with a message indicating progress will be lost
- **FR-008**: Home icon button MUST NOT trigger any action when clicked in admin preview mode
- **FR-009**: Topbar MUST use theme-aware components that apply the same visual styling as other experience screens (welcome, info steps, etc.)
- **FR-010**: System MUST provide a themed progress indicator component for displaying step completion
- **FR-011**: Topbar background MUST be transparent to allow underlying themed background to show through
- **FR-012**: Step content MUST render below the topbar without overlapping
- **FR-013**: Topbar MUST remain fixed at the top of the viewport during scrolling
- **FR-014**: When user confirms exit, system MUST navigate to the project welcome page
- **FR-015**: Topbar MUST be responsive and functional on mobile devices (minimum 320px width)

### Key Entities

- **ExperienceRuntime**: Container component that orchestrates experience execution across preview, pregate, main, and preshare contexts. Manages step navigation and owns the topbar display logic.
- **ExperienceStep**: Individual step within an experience flow. Provides step configuration including type, content, and validation rules.
- **Theme**: Configuration object containing colors, fonts, and styling rules applied to all themed components including the new topbar.
- **Session**: Guest progress tracking record that maintains current step index and completion status. Used for navigation state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Guests can identify their progress at any point in an experience by viewing the topbar progress indicator
- **SC-002**: Experience completion rates improve as guests have clear visibility into remaining steps
- **SC-003**: Accidental exits are prevented through the confirmation dialog requiring explicit user action
- **SC-004**: 100% of guest experiences (pregate, main, preshare) display consistent topbar UI across all contexts
- **SC-005**: Admin preview mode accurately reflects the guest experience visual appearance (WYSIWYG preview)
- **SC-006**: Topbar renders and functions correctly on screen sizes from 320px to 2560px width
- **SC-007**: Topbar text and interactive elements are clearly visible and readable against all theme background colors

## Assumptions

- Experience name is available to the runtime system during step execution
- Current step position and total step count are tracked during experience execution
- All experiences use the theme system for consistent visual styling
- Home navigation always returns users to the project welcome page
- Project context is available for constructing navigation paths
- A confirmation dialog UI pattern is available for user prompts
- Existing themed text and button components can be reused for topbar elements

## Dependencies

- Theme system for consistent visual styling across all experience screens
- Runtime state management for tracking current step position
- Navigation system for redirecting users between pages
- Project context for determining correct navigation targets
- Modal dialog system for user confirmations

## Scope Boundaries

**In Scope:**
- Creating themed progress indicator component for step tracking
- Adding topbar to experience runtime flow
- Implementing visual progress tracking throughout experience steps
- Adding home navigation with exit confirmation for guest flows
- Ensuring topbar works consistently across preview and guest contexts (preview, pregate, main, preshare)
- Responsive design for mobile and desktop viewports
- Accessibility compliance for visual elements and interactive controls

**Out of Scope:**
- Adding topbar to other parts of the application (welcome screen, share screen, etc.)
- Customizing topbar appearance beyond theme system (no per-experience topbar config)
- Persisting "don't ask again" preference for exit confirmation
- Adding additional navigation controls to topbar (back button, menu, settings)
- Analytics tracking for topbar interactions (can be added later)
- Animated transitions for progress bar updates (basic update is sufficient)
- Custom progress bar styles or shapes (standard horizontal bar only)

## Open Questions

None - All requirements are clear based on the feature description and existing codebase patterns.
