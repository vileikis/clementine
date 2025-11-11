# Feature Specification: Company Management (Admin Dashboard)

**Feature Branch**: `002-company-management`
**Created**: 2025-11-11
**Status**: Draft
**Input**: User description: "🏢 Feature: Company Management (Admin Dashboard) - Introduce basic company management so each event can be tied to a brand or organization. This enables clearer separation of client projects and sets up a foundation for multi-tenant support."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Link Company to New Event (Priority: P1)

An admin needs to create a new AI photobooth event for a client brand. They first create (or select) a company record representing the client, then create the event under that company. This ensures all future events for this client are properly organized.

**Why this priority**: Core functionality that enables the primary use case of organizing events by brand/client. Without this, the feature provides no value.

**Independent Test**: Can be fully tested by creating a company, then creating an event and verifying the event shows the company association in the events list. Delivers immediate organizational value.

**Acceptance Scenarios**:

1. **Given** admin is on the Companies tab, **When** they click "Create New Company" and enter a company name, **Then** the company is created and appears in the companies list
2. **Given** admin is creating a new event, **When** they select a company from the dropdown, **Then** the event is created with that company association
3. **Given** admin is creating a new event, **When** they choose "Create new company" option and enter a name, **Then** a new company is created and immediately associated with the event
4. **Given** admin is viewing the events list, **When** they look at an event with a company, **Then** the company name is displayed alongside the event details

---

### User Story 2 - View and Manage Companies (Priority: P2)

An admin needs to view all companies they manage and understand how many events each company has. They can edit company names, view company details, and navigate to see all events for a specific company.

**Why this priority**: Provides visibility and management capabilities for the company entity. Depends on P1 (company creation) being in place first.

**Independent Test**: Can be tested independently by viewing the Companies tab with pre-existing companies, editing names, and clicking through to filtered event views.

**Acceptance Scenarios**:

1. **Given** admin is on the Companies tab, **When** they view the companies list, **Then** they see company name, event count, and action buttons (Edit, View Events) for each company
2. **Given** admin clicks "Edit" on a company, **When** they change the name and save, **Then** the company name is updated across all events
3. **Given** admin is viewing a company detail page, **When** they look at the page, **Then** they see the company name (editable), total event count, and a link to view all events for this company
4. **Given** admin clicks "View Events" for a company, **When** they are redirected to the Events tab, **Then** the events list is filtered to show only events for that company

---

### User Story 3 - Filter Events by Company (Priority: P2)

An admin managing multiple clients needs to quickly find all events for a specific company or see which events have no company assigned yet.

**Why this priority**: Enhances navigation and organization. Requires P1 to have value, but provides significant quality-of-life improvement for multi-client management.

**Independent Test**: Can be tested with existing events by using the company filter dropdown and verifying correct filtering behavior.

**Acceptance Scenarios**:

1. **Given** admin is on the Events tab, **When** they use the company filter dropdown, **Then** they see options: "All", "No company", and each company name
2. **Given** admin selects a specific company from the filter, **When** the page updates, **Then** only events for that company are displayed
3. **Given** admin selects "No company" from the filter, **When** the page updates, **Then** only events without a company association are displayed (flagged as "No company")
4. **Given** admin selects "All" from the filter, **When** the page updates, **Then** all events are displayed regardless of company

---

### User Story 4 - Reassign Event Company (Priority: P3)

An admin realizes an event was assigned to the wrong company (or needs to add a company to a legacy event). They can edit the event and change its company association.

**Why this priority**: Important for data correction and legacy event migration, but not required for initial value delivery. Extends P1 functionality.

**Independent Test**: Can be tested by editing an existing event, changing the company dropdown, and verifying the change persists.

**Acceptance Scenarios**:

1. **Given** admin is editing an existing event, **When** they change the company selection in the dropdown, **Then** the event's company association is updated
2. **Given** admin is editing an event that has no company, **When** they select a company, **Then** the event is now associated with that company
3. **Given** admin is editing an event with a company, **When** they select "No company", **Then** the event's company association is removed

---

### User Story 5 - Delete Company (Priority: P3)

An admin needs to remove a company that is no longer relevant (test company, defunct client, etc.). They must understand the implications for associated events.

**Why this priority**: Administrative cleanup functionality. Less critical than creation and viewing. Requires careful handling of associated events.

**Independent Test**: Can be tested by attempting to delete companies with and without events, verifying appropriate warnings and outcomes.

**Acceptance Scenarios**:

1. **Given** admin clicks delete on a company (with or without events), **When** they confirm the action, **Then** the company is marked as deleted (soft delete with status="deleted" and deletedAt timestamp)
2. **Given** a company has been deleted, **When** admin views the companies list, **Then** the deleted company does not appear
3. **Given** a company has been deleted, **When** admin tries to create a new event, **Then** the deleted company does not appear in the company dropdown
4. **Given** a company has been deleted, **When** a guest tries to access a share/join link for an event under that company, **Then** the link does not work and guest sees an appropriate error message

---

### Edge Cases

- What happens when an admin tries to create a company with an empty name?
- What happens when an admin tries to create a company with a name that already exists?
- What happens when filtering events by a company that was just deleted (filtered view should update to show events as "No company")?
- How does pagination interact with company filtering in the events list?
- What happens if an admin starts creating an event, creates a new company inline, but then cancels the event creation (should the new company persist or be cleaned up)?
- What happens when a guest with an existing session tries to access an event after its company has been deleted?
- How should event list display deleted company's events (show as "No company" or show original company name with "(Deleted)" indicator)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a Companies management tab in the admin dashboard alongside the Events tab
- **FR-002**: System MUST allow admins to create companies with at minimum a name field
- **FR-003**: System MUST allow admins to edit company names after creation
- **FR-004**: System MUST allow admins to delete companies
- **FR-005**: System MUST display a list of all companies with event count for each
- **FR-006**: System MUST allow events to be associated with zero or one company (optional relationship)
- **FR-007**: System MUST allow admins to assign a company when creating a new event
- **FR-008**: System MUST provide an inline "create new company" option during event creation
- **FR-009**: System MUST allow admins to change an event's company association at any time
- **FR-010**: System MUST allow admins to filter the events list by company (specific company, no company, or all)
- **FR-011**: System MUST display company name alongside event details in the events list
- **FR-012**: System MUST flag events without a company as "No company" in the UI
- **FR-013**: System MUST support assigning companies to legacy events that were created before this feature
- **FR-014**: System MUST provide a company detail view showing company name, event count, and link to filtered events
- **FR-015**: System MUST restrict all company and event management to authenticated admins (ADMIN_SECRET protected)
- **FR-016**: System MUST store optional company metadata (brandColor, contactEmail, termsUrl, privacyUrl) but only expose name editing in MVP UI
- **FR-017**: System MUST validate company names are not empty and prevent duplicate company names (enforce unique constraint)
- **FR-018**: System MUST implement soft deletion for companies (mark as deleted with status and timestamp, rather than hard delete)
- **FR-019**: System MUST hide deleted companies from all UI lists and dropdowns
- **FR-020**: System MUST prevent creating new events under deleted companies
- **FR-021**: System MUST disable share/join links for events under deleted companies (return appropriate error to guests)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Company management UI MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Company list table MUST be responsive (stack columns or use cards on mobile)
- **MFR-003**: Interactive elements (Edit, Delete, View Events buttons) MUST meet minimum touch target size (44x44px)
- **MFR-004**: Company filter dropdown MUST be easily tappable and readable on mobile
- **MFR-005**: Modal dialogs for creating/editing companies MUST fit mobile viewport without horizontal scroll

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Company creation and edit forms MUST validate inputs with Zod schemas (name required and unique, optional fields validated if present)
- **TSR-002**: Event-company association MUST be type-safe (company reference or null)
- **TSR-003**: All API endpoints for company CRUD operations MUST validate inputs with Zod
- **TSR-004**: Company filter selections MUST be type-safe enums or validated strings
- **TSR-005**: TypeScript strict mode MUST be maintained (no `any` escapes in company/event relationship code)
- **TSR-006**: Company status field MUST be type-safe enum ("active" | "deleted")
- **TSR-007**: deletedAt timestamp MUST be validated as a number (Unix timestamp in milliseconds)

### Key Entities

- **Company**: Represents a brand or organization that owns events
  - Required: name (string, non-empty, unique across all non-deleted companies)
  - Status: status (enum: "active" or "deleted"), deletedAt (timestamp, null if active)
  - Optional: brandColor (string, hex color), contactEmail (string, email format), termsUrl (string, URL), privacyUrl (string, URL)
  - Relationships: One company can have many events
  - Unique identifier for database storage
  - Soft deletion: Companies are never permanently removed, only marked as deleted

- **Event**: Existing entity extended with company relationship
  - New field: companyId (optional reference to Company)
  - Events can exist without a company (legacy support and flexibility)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins can create a company and associate it with a new event in under 1 minute
- **SC-002**: Admins can view all events for a specific company with a single filter selection
- **SC-003**: Company list displays event counts accurately for each company
- **SC-004**: 100% of legacy events can be successfully assigned to companies through the UI
- **SC-005**: Event list filtering (by company or "No company") returns results in under 2 seconds for up to 1000 events
- **SC-006**: Company name edits propagate to all associated event displays immediately (or within 1 second)
- **SC-007**: Admin can navigate between Companies tab and filtered Events view seamlessly without confusion
- **SC-008**: When a company is deleted, all guest share/join links for that company's events become inaccessible within 1 second
- **SC-009**: Duplicate company name validation prevents creation and provides clear feedback within form submission

## Assumptions

- Admin authentication via ADMIN_SECRET is already implemented
- Event management UI exists and can be extended with company filtering
- Database/storage layer supports relational data (company-to-events relationship)
- Company metadata fields (brandColor, contactEmail, termsUrl, privacyUrl) are stored but not exposed in MVP UI (future enhancement)
- Admins will manage a reasonable number of companies (< 100) for MVP scope
- Guest-facing routes (/join/:eventId) do not require company visibility (company is admin-only context)

## Dependencies

- Existing admin authentication system (ADMIN_SECRET)
- Existing event creation and management UI
- Database migration capability to add company entity and event-company relationship

## Out of Scope (for MVP)

- Company user management (assigning users to companies)
- Company-level permissions or access control
- Public company profiles or branding visible to guests
- Multi-tenant isolation (data segregation by company)
- Company analytics dashboard
- Bulk company operations (import/export)
- Company logo upload
- Editing company metadata beyond name (brandColor, contactEmail, termsUrl, privacyUrl stored but not editable in UI)
