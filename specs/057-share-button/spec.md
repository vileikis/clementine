# Feature Specification: Share Button in Project Config Designer

**Feature Branch**: `057-share-button`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "Add to ProjectConfigDesignerLayout an icon share button to the right actions which should display ShareDialog. Note that generateGuestUrl should work with /guest/projectId not /guest/projectId\"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Share Project via Icon Button (Priority: P1)

As an experience creator working in the project config designer, I want to quickly share my project with guests by clicking a share icon button, so that I can easily distribute the guest URL and QR code without leaving my current workflow.

**Why this priority**: This is the core feature request - providing quick access to sharing functionality directly from the project config designer layout. It enables the primary use case of sharing projects with event guests.

**Independent Test**: Can be fully tested by clicking the share icon button in the project config designer and verifying the ShareDialog opens with the correct guest URL for the current project.

**Acceptance Scenarios**:

1. **Given** I am viewing a project in the project config designer, **When** I click the share icon button in the right actions area, **Then** the ShareDialog opens displaying the guest URL and QR code for this project
2. **Given** the ShareDialog is open, **When** I view the guest URL, **Then** it displays the correct format: `{origin}/guest/{projectId}` (e.g., `https://app.clementine.com/guest/abc123`)
3. **Given** the ShareDialog is open, **When** I close the dialog, **Then** I return to the project config designer with my work state preserved

---

### User Story 2 - Copy Guest Link from Share Dialog (Priority: P2)

As an experience creator, I want to copy the guest link to share via email, SMS, or social media, so that I can distribute the link to event guests through my preferred communication channels.

**Why this priority**: Copying the link is the most common sharing action and is already implemented in the existing ShareDialog component.

**Independent Test**: Can be tested by opening the ShareDialog and copying the guest URL, then pasting it to verify the correct URL was copied.

**Acceptance Scenarios**:

1. **Given** the ShareDialog is open, **When** I click the copy button, **Then** the guest URL is copied to my clipboard
2. **Given** I have copied the guest URL, **When** I navigate to the copied URL, **Then** I am taken to the guest experience for that project

---

### User Story 3 - View and Download QR Code (Priority: P3)

As an experience creator, I want to view and download a QR code for my project, so that I can print it or add it to promotional materials for my event.

**Why this priority**: QR code functionality is already implemented in ShareDialog; this story confirms it works correctly when accessed from the new share button.

**Independent Test**: Can be tested by opening the ShareDialog, viewing the QR code, and downloading it.

**Acceptance Scenarios**:

1. **Given** the ShareDialog is open, **When** I view the QR code, **Then** it correctly encodes the guest URL for this project
2. **Given** the ShareDialog is open, **When** I click download QR code, **Then** a QR code image file is downloaded to my device

---

### Edge Cases

- What happens when the project ID contains special characters? The URL encoding should handle them correctly.
- What happens when the share button is clicked while other actions are pending (e.g., during publish)? The share dialog should still open independently.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a share icon button in the right actions area of the ProjectConfigDesignerLayout
- **FR-002**: System MUST open the ShareDialog when the share icon button is clicked
- **FR-003**: System MUST pass the current project ID to the ShareDialog component
- **FR-004**: The generateGuestUrl function MUST generate URLs in the format `{origin}/guest/{projectId}` (note: without trailing slash or backslash)
- **FR-005**: The share icon button MUST use a recognizable share icon (e.g., Share2 from lucide-react)
- **FR-006**: The share button MUST be positioned in the right actions area alongside other action buttons (EditorSaveStatus, EditorChangesBadge, Preview, Publish)
- **FR-007**: The share button MUST maintain consistent styling with other buttons in the action area

### Key Entities

- **Project**: The current project being edited in the designer, identified by `projectId`
- **Guest URL**: The shareable URL that allows guests to access the project experience, formatted as `{origin}/guest/{projectId}`
- **ShareDialog State**: Controls the open/closed state of the dialog

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can access the share dialog within 1 click from the project config designer
- **SC-002**: 100% of generated guest URLs follow the correct format `{origin}/guest/{projectId}`
- **SC-003**: The share button is visually consistent with existing action buttons and identifiable by users
- **SC-004**: All existing ShareDialog functionality (copy link, QR code, download) works correctly when accessed from the new share button

## Assumptions

- The ShareDialog component already exists and is fully functional
- The lucide-react icon library is already available in the project
- The project ID is available from the `project` prop passed to ProjectConfigDesignerLayout
- The existing generateGuestUrl function uses the correct URL format (if not, it needs to be verified/corrected)
