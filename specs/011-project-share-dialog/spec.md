# Feature Specification: Project Share Dialog

**Feature Branch**: `011-project-share-dialog`
**Created**: 2026-01-04
**Status**: Draft
**Input**: User description: "add project share dialog which user can access from top bar share button from /workspace/[slug]/projects/[projectId]. This dialog should allow user to copy link or scan QR code. There should be options to regenerate qr code and download qr code. Link and QR should be create client side. Share link should be guest/[projectId] . Also show following help instructions: "How to use Share the URL via email, SMS, or social media Display the QR code at your event for guests to scan Download the QR code to print or add to promotional materials""

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quick Link Sharing (Priority: P1)

As an event creator, I need to quickly share my project link with potential guests so they can access the photobooth experience immediately.

**Why this priority**: This is the core value proposition - enabling creators to share their project. Without this, the feature has no value. This represents the minimum viable implementation.

**Independent Test**: Can be fully tested by opening the share dialog from a project page, copying the link, and verifying that pasting it into a browser navigates to the correct guest page. Delivers immediate value by enabling basic sharing functionality.

**Acceptance Scenarios**:

1. **Given** I am viewing a project in my workspace, **When** I click the share button in the top navigation bar, **Then** a dialog opens displaying the guest link for my project
2. **Given** the share dialog is open, **When** I click the "Copy Link" button, **Then** the guest URL is copied to my clipboard and I see a confirmation message
3. **Given** I have copied the guest link, **When** I paste it in my browser or send it to someone, **Then** it navigates to the guest experience page for that specific project

---

### User Story 2 - QR Code Scanning (Priority: P2)

As an event creator hosting a physical event, I need to display a QR code that guests can scan with their phones so they can quickly access the photobooth without typing a URL.

**Why this priority**: Significantly improves the user experience at physical events by removing friction. Guests can scan instead of type. This is a key differentiator for event use cases but the feature still works without it (P1 provides a fallback).

**Independent Test**: Can be tested by opening the share dialog, verifying a QR code is displayed, scanning it with a mobile device, and confirming it navigates to the guest page. Delivers value for in-person event scenarios.

**Acceptance Scenarios**:

1. **Given** the share dialog is open, **When** the dialog loads, **Then** a QR code is automatically generated and displayed that encodes the guest URL
2. **Given** a QR code is displayed, **When** a guest scans it with their phone camera or QR scanner, **Then** they are directed to the guest experience page for that project
3. **Given** the share dialog displays a QR code, **When** the dialog is closed and reopened, **Then** the same QR code is displayed (consistent across sessions)

---

### User Story 3 - QR Code Management (Priority: P3)

As an event creator, I need to regenerate and download QR codes so I can create fresh codes if needed and use them in my promotional materials.

**Why this priority**: Provides additional flexibility and professional use cases (printed materials, email campaigns). Nice to have but not essential for core sharing functionality. Users can still accomplish their goals with P1+P2.

**Independent Test**: Can be tested by clicking the regenerate button to get a new QR code, downloading the QR code as an image file, and verifying the downloaded file is usable. Delivers value for advanced marketing scenarios.

**Acceptance Scenarios**:

1. **Given** a QR code is displayed in the share dialog, **When** I click the "Regenerate QR Code" button, **Then** a new QR code is generated and displayed that still points to the same guest URL
2. **Given** a QR code is displayed, **When** I click the "Download QR Code" button, **Then** the QR code is downloaded as an image file to my device
3. **Given** I have downloaded a QR code image, **When** I use it in printed materials or digital media, **Then** scanning the code directs guests to the correct project experience

---

### User Story 4 - Sharing Guidance (Priority: P3)

As an event creator who may be new to digital experiences, I need clear instructions on how to use the share link and QR code so I can effectively promote my photobooth.

**Why this priority**: Improves user confidence and reduces support burden. Helpful for onboarding but not required for core functionality. Power users may not need this guidance.

**Independent Test**: Can be tested by opening the share dialog and verifying the help instructions are visible and readable. Delivers value by reducing confusion and support requests.

**Acceptance Scenarios**:

1. **Given** the share dialog is open, **When** I view the dialog content, **Then** I see instructions explaining how to share the URL via email, SMS, or social media
2. **Given** the share dialog displays help instructions, **When** I read the instructions, **Then** I understand I can display the QR code at my event for guests to scan
3. **Given** the share dialog displays help instructions, **When** I review the guidance, **Then** I learn I can download the QR code to print or add to promotional materials

---

### Edge Cases

- What happens when the user tries to access the share dialog before the project is fully loaded?
- How does the system handle QR code regeneration if there are network issues?
- What happens if the user's browser doesn't support clipboard API for copy functionality?
- How does the dialog behave on mobile devices with limited screen space?
- What happens if the user tries to download the QR code but their browser blocks downloads?
- How does the system ensure the guest URL is always correctly formatted and accessible?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a share button in the top navigation bar on project pages at route `/workspace/[slug]/projects/[projectId]`
- **FR-002**: System MUST open a modal dialog when the share button is clicked
- **FR-003**: System MUST generate a guest URL in the format `guest/[projectId]` for each project
- **FR-004**: System MUST display the generated guest URL in the share dialog
- **FR-005**: System MUST provide a "Copy Link" button that copies the guest URL to the user's clipboard
- **FR-006**: System MUST show a confirmation message when the link is successfully copied
- **FR-007**: System MUST generate a QR code client-side that encodes the guest URL
- **FR-008**: System MUST display the generated QR code as an image in the share dialog
- **FR-009**: System MUST provide a "Regenerate QR Code" button that creates a new QR code with different visual encoding
- **FR-010**: System MUST provide a "Download QR Code" button that saves the QR code as an image file
- **FR-011**: System MUST display help instructions with three usage scenarios: email/SMS/social sharing, event display, and promotional materials
- **FR-012**: System MUST ensure all QR code generation and URL creation happens on the client-side (no server processing)
- **FR-013**: System MUST ensure the guest URL is a fully qualified URL with protocol and domain
- **FR-014**: System MUST ensure regenerated QR codes point to the same guest URL (only visual encoding changes)

### Key Entities

- **Project**: The photobooth experience being shared; identified by projectId; has a unique guest access URL
- **Guest URL**: A shareable link that directs visitors to the project experience; format: `guest/[projectId]`; represents the entry point for participants
- **QR Code**: A visual encoding of the guest URL; generated client-side; can be regenerated with different visual patterns; downloadable as an image file

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open the share dialog within 1 click from any project page
- **SC-002**: Users can copy the guest link to their clipboard in under 3 seconds from opening the dialog
- **SC-003**: QR codes are generated and displayed within 2 seconds of opening the dialog
- **SC-004**: Downloaded QR code images are at least 512x512 pixels for print quality
- **SC-005**: 95% of users successfully copy the link on their first attempt
- **SC-006**: QR codes successfully scan and navigate to the correct guest page on 99% of attempts
- **SC-007**: Users can regenerate a QR code in under 2 seconds
- **SC-008**: Downloaded QR codes maintain scannable quality when printed at standard event poster sizes (up to 24x36 inches)
- **SC-009**: Help instructions are visible without scrolling on desktop viewports (1920x1080 and above)
- **SC-010**: 90% of users can successfully share their project without requiring support

## Assumptions

- Users will have modern browsers with clipboard API support (fallback manual selection is acceptable for older browsers)
- QR code library will be used client-side to handle encoding (specific library TBD during planning)
- Guest URL domain and protocol will be determined from the current application URL
- Standard QR code error correction level (medium - 15% damage tolerance) is sufficient for event use cases
- Downloaded QR codes will be PNG format (widely supported and print-friendly)
- Share dialog will use the existing modal component system from the design system
- Users have appropriate permissions to access the share functionality (workspace members with project access)
