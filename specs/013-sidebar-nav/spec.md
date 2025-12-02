# Feature Specification: Sidebar Navigation System

**Feature Branch**: `013-sidebar-nav`
**Created**: 2025-12-02
**Status**: Draft
**Input**: PRD for Admin UI Redesign - Collapsible sidebar navigation to replace current top navigation

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate Between Main Sections (Priority: P1)

As an admin user, I can navigate between the main sections of the admin interface (Projects, Experiences, Analytics, Settings) using a persistent sidebar so that I can quickly access any area of the application without losing context.

**Why this priority**: Navigation is the fundamental interaction for any admin interface. Without working navigation, users cannot access any features.

**Independent Test**: Can be fully tested by loading the admin interface and clicking each navigation item - delivers immediate value by providing access to all sections.

**Acceptance Scenarios**:

1. **Given** I am logged in and on any page within my company, **When** I click "Projects" in the sidebar, **Then** I am navigated to `/{companySlug}/projects` and the Projects item is highlighted as active
2. **Given** I am logged in, **When** I click "Experiences" in the sidebar, **Then** I am navigated to `/{companySlug}/exps` and the Experiences item is highlighted
3. **Given** I am logged in, **When** I click "Settings" in the sidebar, **Then** I am navigated to `/{companySlug}/settings`
4. **Given** the Analytics feature is not yet implemented, **When** I view the sidebar, **Then** the Analytics item is visible but disabled/grayed out

---

### User Story 2 - Collapse and Expand Sidebar (Priority: P1)

As an admin user, I can collapse the sidebar to icons-only mode and expand it back to full width so that I can maximize screen space when needed while maintaining navigation access.

**Why this priority**: Space efficiency is critical for admin interfaces where users need maximum workspace. This directly impacts user productivity.

**Independent Test**: Can be fully tested by toggling the collapse button and verifying visual state changes - delivers immediate value by improving workspace flexibility.

**Acceptance Scenarios**:

1. **Given** the sidebar is expanded (240-280px wide), **When** I click the hamburger menu icon, **Then** the sidebar collapses to icon-only mode (72-80px wide)
2. **Given** the sidebar is collapsed, **When** I click the hamburger menu icon, **Then** the sidebar expands to full width showing icons and labels
3. **Given** the sidebar is collapsed, **When** I hover over a navigation item, **Then** a tooltip displays the full label
4. **Given** the sidebar is collapsed, **When** I view navigation items, **Then** each shows an icon with a small label underneath (YouTube-style)
5. **Given** I collapse or expand the sidebar, **When** I close and reopen the browser, **Then** my collapse preference is preserved

---

### User Story 3 - Access Root URL with Smart Redirect (Priority: P1)

As an admin user, when I visit the root URL, the system automatically redirects me to my most recently accessed company so that I can resume work without manual navigation.

**Why this priority**: Reduces friction for returning users who typically work with the same company. Critical for daily workflow efficiency.

**Independent Test**: Can be fully tested by visiting the root URL with and without previous company history - delivers immediate value by streamlining access.

**Acceptance Scenarios**:

1. **Given** I have previously accessed "acme-corp", **When** I visit `/`, **Then** I am redirected to `/acme-corp/projects`
2. **Given** I have never accessed any company, **When** I visit `/`, **Then** I am redirected to `/companies` (company list)
3. **Given** I switch to a different company "beta-inc", **When** I later visit `/`, **Then** I am redirected to `/beta-inc/projects`

---

### User Story 4 - Switch Companies via Company Switcher (Priority: P2)

As an admin user with access to multiple companies, I can use the company switcher in the sidebar to view all my companies and select a different one.

**Why this priority**: Essential for multi-company users but secondary to basic navigation. Single-company users can use the system without this.

**Independent Test**: Can be fully tested by clicking the company switcher and navigating between companies - delivers value for multi-company users.

**Acceptance Scenarios**:

1. **Given** I am in expanded sidebar mode, **When** I view the company switcher at the top, **Then** I see the company avatar and full company name
2. **Given** I am in collapsed sidebar mode, **When** I view the company switcher, **Then** I see only the company avatar
3. **Given** I click the company switcher, **When** the action completes, **Then** the company list page (`/companies`) opens in a new browser tab
4. **Given** I am on the company list page, **When** I select a different company, **Then** I am redirected to that company's projects page and the last company slug is updated

---

### User Story 5 - View Contextual Breadcrumbs (Priority: P2)

As an admin user, I can see breadcrumbs above the page content that show my location within the hierarchy (excluding company name) so that I understand where I am and can navigate back to parent sections.

**Why this priority**: Improves orientation and enables quick upward navigation. Secondary to primary sidebar navigation.

**Independent Test**: Can be fully tested by navigating to nested pages and verifying breadcrumb display - delivers value for deep navigation contexts.

**Acceptance Scenarios**:

1. **Given** I am on a project's events page, **When** I view the breadcrumbs, **Then** I see "Projects / [Project Name] / Events" (no company name)
2. **Given** I am viewing an experience, **When** I view the breadcrumbs, **Then** I see "Experiences / [Experience Name]"
3. **Given** I am on the settings billing page, **When** I view the breadcrumbs, **Then** I see "Settings / Billing"
4. **Given** breadcrumbs are displayed, **When** I click any breadcrumb segment, **Then** I navigate to that section

---

### User Story 6 - Logout from Sidebar (Priority: P2)

As an admin user, I can log out of the application using a logout button that is always visible at the bottom of the sidebar.

**Why this priority**: Security feature required for any authenticated application. Secondary to core navigation.

**Independent Test**: Can be fully tested by clicking logout and verifying session termination - delivers security value.

**Acceptance Scenarios**:

1. **Given** the sidebar is expanded, **When** I view the bottom of the sidebar, **Then** I see a logout button with icon and label
2. **Given** the sidebar is collapsed, **When** I view the bottom of the sidebar, **Then** I see a logout icon (with optional small label)
3. **Given** I click the logout button, **When** the action completes, **Then** I am logged out and redirected to the login page

---

### Edge Cases

- What happens when a user accesses a company URL they don't have permission for? → Show access denied message with option to return to company list
- What happens when the stored last company slug no longer exists? → Clear the stored value and redirect to `/companies`
- What happens on very narrow screens (below sidebar minimum width)? → Sidebar auto-collapses to maintain usability (mobile handled in future scope)
- What happens if a user directly navigates to a company-scoped URL without being logged in? → Redirect to login, then return to the original URL after authentication

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a persistent collapsible left sidebar on all admin pages
- **FR-002**: System MUST support sidebar states: expanded (240-280px) and collapsed (72-80px)
- **FR-003**: System MUST persist sidebar collapse state in browser local storage
- **FR-004**: System MUST display navigation items with icons and labels in expanded mode
- **FR-005**: System MUST display navigation items with icons and small labels underneath in collapsed mode (YouTube-style)
- **FR-006**: System MUST show tooltips on navigation items when sidebar is collapsed
- **FR-007**: System MUST highlight the currently active navigation item
- **FR-008**: System MUST include a hamburger menu icon in a fixed top-left position as the collapse toggle
- **FR-009**: System MUST display the company switcher at the top of the sidebar showing avatar and name (expanded) or avatar only (collapsed)
- **FR-010**: System MUST open the company list page in a new browser tab when the company switcher is clicked
- **FR-011**: System MUST display a logout button anchored at the bottom of the sidebar
- **FR-012**: System MUST use company slug (human-readable) in all URLs instead of company ID
- **FR-013**: System MUST redirect `/` to `/{lastCompanySlug}/projects` when a last company exists in storage
- **FR-014**: System MUST redirect `/` to `/companies` when no last company exists in storage
- **FR-015**: System MUST store the last accessed company slug in persistent local storage
- **FR-016**: System MUST display breadcrumbs above page content that reflect URL hierarchy
- **FR-017**: System MUST exclude company name from breadcrumbs (company context is shown in sidebar and URL)
- **FR-018**: System MUST make all breadcrumb segments clickable for navigation
- **FR-019**: System MUST support the following navigation items: Projects, Experiences, Analytics (disabled placeholder), Settings
- **FR-020**: System MUST support the following URL structure: `/{companySlug}/projects`, `/{companySlug}/exps`, `/{companySlug}/analytics`, `/{companySlug}/settings`
- **FR-021**: System MUST support nested URLs for projects and events: `/{companySlug}/proj123/events`, `/{companySlug}/proj123/evt456/experiences`

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Sidebar collapse toggle MUST be easily accessible with minimum 44x44px touch target
- **MFR-002**: Navigation items in collapsed mode MUST have adequate touch target size (44x44px minimum)
- **MFR-003**: Logout button MUST maintain adequate touch target in both expanded and collapsed modes
- **MFR-004**: Company switcher clickable area MUST meet minimum touch target requirements

*Note: Full mobile responsive sidebar behavior (hamburger overlay, drawer pattern) is explicitly out of scope for this phase per PRD section 10.*

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: Company slug URL parameters MUST be validated to ensure they match existing company records
- **TSR-002**: Navigation state (collapsed/expanded, last company slug) MUST be type-safe when reading from/writing to local storage
- **TSR-003**: Breadcrumb data structures MUST be strongly typed with proper segment definitions

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: Company slug lookup MUST use read operations compatible with the existing Companies feature module
- **FAR-002**: URL routing with company slug MUST resolve to valid company records from Firestore
- **FAR-003**: No new Firestore writes are required for this feature (local storage only for preferences)

### Key Entities

- **NavigationItem**: Represents a sidebar navigation entry with icon, label, URL path, and enabled/disabled state
- **SidebarState**: Represents the sidebar's UI state including collapsed/expanded status
- **BreadcrumbSegment**: Represents a single breadcrumb node with label and navigation URL
- **CompanySwitcher**: Displays the current company context with avatar and name, linked to company list

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between all main sections (Projects, Experiences, Settings) in under 2 clicks from any page
- **SC-002**: Users can switch between companies in under 3 clicks from any page
- **SC-003**: Sidebar collapse/expand toggle completes in under 300ms with smooth animation
- **SC-004**: 95% of users can successfully collapse and expand the sidebar on first attempt without instructions
- **SC-005**: Root URL redirect completes in under 1 second, returning users to their last company context
- **SC-006**: Breadcrumb navigation allows users to return to any parent section in 1 click
- **SC-007**: Sidebar state (collapsed/expanded) persists correctly across browser sessions 100% of the time
- **SC-008**: Company switcher clearly indicates current company context with visual recognition in both expanded and collapsed states

## Assumptions

- Users are authenticated before accessing any admin pages (authentication is handled by existing system)
- Company data model already supports a `slug` field for human-readable URLs (per 012-company-context feature)
- The existing top navigation will be removed as part of this implementation
- The company list page (`/companies`) already exists and supports company selection
- Local storage is available and enabled in target browsers
