# Feature Specification: Responsive Steps

**Feature Branch**: `009-responsive-steps`
**Created**: 2025-11-27
**Status**: Draft
**Input**: Make the Steps feature (`web/src/features/steps/`) fully responsive to render appropriately on both mobile and desktop devices with distinct but cohesive user experiences optimized for each platform.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Guest Views Step on Mobile Device (Priority: P1)

A guest opens a journey link on their mobile phone and experiences an app-like interface where content flows from top-down with scrollable content and a fixed CTA button pinned to the bottom of the viewport within thumb reach.

**Why this priority**: Mobile is the primary guest experience. Most event attendees access journeys via QR codes or shared links on their phones. Without proper mobile layout, guests cannot complete journeys.

**Independent Test**: Can be fully tested by opening any step type on an iPhone SE (375px) and verifying the fixed bottom CTA, proper content scrolling, and safe area respect.

**Acceptance Scenarios**:

1. **Given** a guest on a mobile device (< 768px width), **When** they view any step, **Then** the CTA button is fixed to the bottom of the viewport with safe area padding
2. **Given** a guest on a mobile device with a notched phone, **When** they view any step, **Then** the bottom action bar respects the device's safe area insets
3. **Given** a guest on a mobile device viewing a step with long content, **When** they scroll, **Then** content scrolls naturally while the CTA remains fixed
4. **Given** a guest on a mobile device, **When** they view any step, **Then** content uses full screen width with 16px side padding

---

### User Story 2 - Guest Views Step on Desktop (Priority: P2)

A guest opens a journey link on their desktop browser and sees a focused, Typeform-style centered layout where content and CTA are grouped together in a constrained-width container centered both horizontally and vertically.

**Why this priority**: Desktop provides an important secondary experience for guests who receive links via email or access from work computers. Proper desktop layout prevents content stretching on large screens.

**Independent Test**: Can be fully tested by opening any step type on a 1920px desktop browser and verifying centered container, max-width constraint, and inline CTA positioning.

**Acceptance Scenarios**:

1. **Given** a guest on a desktop browser (>= 1024px width), **When** they view any step, **Then** content is displayed in a centered container with max-width of 640-720px
2. **Given** a guest on a desktop browser, **When** they view any step, **Then** the CTA button appears inline below the content, not fixed to the bottom
3. **Given** a guest on a large monitor (2560px+), **When** they view any step, **Then** content remains centered with generous whitespace on sides

---

### User Story 3 - Guest Interacts with Step-Specific Components (Priority: P1)

A guest interacts with step-specific components (forms, buttons, scales, grids) that adapt their layout appropriately for the current viewport size.

**Why this priority**: Component-level responsiveness is essential for usability. Forms must prevent iOS zoom, touch targets must be accessible, and grid layouts must reorganize for mobile.

**Independent Test**: Can be fully tested by completing a multiple choice step on both mobile and desktop, verifying touch target sizes and column layouts.

**Acceptance Scenarios**:

1. **Given** a guest on mobile viewing a multiple choice step, **When** options are displayed, **Then** they appear in a single column stack
2. **Given** a guest on desktop viewing a multiple choice step with > 4 options, **When** options are displayed, **Then** they may appear in 2 columns
3. **Given** a guest on mobile filling a text input, **When** they tap the input, **Then** iOS does not trigger zoom (font size >= 16px)
4. **Given** a guest on mobile viewing an opinion scale, **When** buttons are displayed, **Then** they are at least 44x44px and flex-wrap as needed
5. **Given** a guest on mobile viewing an experience picker grid, **When** experiences are displayed, **Then** they appear in 2 columns
6. **Given** a guest on desktop viewing an experience picker grid, **When** experiences are displayed, **Then** they appear in 3 columns

---

### User Story 4 - Guest Views Processing and Reward Steps (Priority: P2)

A guest views processing and reward steps that display appropriately sized spinners, progress bars, images, and share buttons based on viewport.

**Why this priority**: Processing and reward are the culmination of the guest journey. Proper sizing ensures visual appeal and usability at the moment of highest engagement.

**Independent Test**: Can be fully tested by viewing a reward step on both mobile and desktop, verifying image sizing and share button layout.

**Acceptance Scenarios**:

1. **Given** a guest on mobile viewing a processing step, **When** the spinner displays, **Then** it is 48px in size
2. **Given** a guest on desktop viewing a processing step, **When** the spinner displays, **Then** it is 64px in size
3. **Given** a guest on mobile viewing a reward step, **When** the image displays, **Then** it is ~70% width and centered
4. **Given** a guest on desktop viewing a reward step, **When** the image displays, **Then** it is ~50% width and centered, max 300px

---

### Edge Cases

- What happens when a guest rotates their device mid-step? Layout should adapt immediately without losing state.
- How does system handle viewport resize (e.g., browser dev tools)? Layout should transition smoothly.
- What happens on tablet devices (768px - 1023px)? They receive the desktop layout for centered experience.
- How does system handle very small screens (320px)? Content uses full width with minimal padding, touch targets remain 44px minimum.
- What happens when virtual keyboard opens on mobile? Scrollable content area should remain accessible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render all 11 step types (info, experience-picker, capture, short_text, long_text, multiple_choice, yes_no, opinion_scale, email, processing, reward) correctly on mobile viewports (< 768px)
- **FR-002**: System MUST render all 11 step types correctly on desktop viewports (>= 1024px)
- **FR-003**: System MUST provide a fixed bottom action bar on mobile that contains the primary CTA
- **FR-004**: System MUST provide inline CTA positioning on desktop within the content container
- **FR-005**: System MUST respect device safe area insets (notches, home indicators) on mobile
- **FR-006**: System MUST constrain desktop content to a max-width of 640-720px
- **FR-007**: System MUST center desktop content both horizontally and vertically
- **FR-008**: System MUST allow natural scrolling of content on mobile while keeping CTA fixed
- **FR-009**: System MUST prevent iOS zoom on text inputs by using minimum 16px font size
- **FR-010**: System MUST adapt component layouts per breakpoint (e.g., multiple choice columns, experience picker grid)

### Mobile-First Requirements *(Constitution Principle I)*

- **MFR-001**: Feature MUST work on mobile viewport (320px-768px) as primary experience
- **MFR-002**: Interactive elements MUST meet minimum touch target size (44x44px)
- **MFR-003**: Typography MUST be readable on mobile (>= 14px for body text, >= 16px for form inputs)
- **MFR-004**: Primary CTA MUST be within thumb reach (fixed to bottom of viewport)
- **MFR-005**: Content MUST use full viewport width with 16px side padding on mobile
- **MFR-006**: Bottom action bar MUST include gradient or blur for scroll visibility

### Type-Safety & Validation Requirements *(Constitution Principle III)*

- **TSR-001**: All external inputs (forms, API requests, uploads) MUST be validated with Zod schemas
- **TSR-002**: TypeScript strict mode MUST be maintained (no `any` escapes)
- **TSR-003**: Responsive breakpoints MUST be defined as TypeScript constants for consistency

### Firebase Architecture Requirements *(Constitution Principle VI)*

- **FAR-001**: All write operations (create/update/delete) MUST use Admin SDK via Server Actions (`web/src/lib/firebase/admin.ts`)
- **FAR-002**: Real-time subscriptions and optimistic reads MUST use Client SDK (`web/src/lib/firebase/client.ts`)
- **FAR-003**: Zod schemas MUST be feature-local in `features/[name]/schemas/`; cross-cutting schemas may use `web/src/lib/schemas/`
- **FAR-004**: Public images MUST be stored as full public URLs (not relative paths) for instant rendering
- **FAR-005**: No new Firebase collections or documents required - this is a UI-only change

### Key Entities *(no new entities)*

This feature does not introduce new data entities. It modifies the presentation layer of existing Step entities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 11 step types render correctly on iPhone SE (375px) with fixed bottom CTA
- **SC-002**: 100% of the 11 step types render correctly on desktop 1920px with centered, max-width container
- **SC-003**: No horizontal scrolling occurs on any device from 320px to 2560px width
- **SC-004**: All touch targets meet 44px minimum on mobile devices
- **SC-005**: All form inputs use >= 16px font size to prevent iOS zoom
- **SC-006**: Device safe areas (notch, home indicator) are respected on all iOS devices
- **SC-007**: Guest can complete any step type on both mobile and desktop without layout issues
- **SC-008**: Theme colors from Event apply correctly on both mobile and desktop layouts

## Assumptions

- Tablet devices (768px - 1023px) will use the desktop layout, not a tablet-specific layout (per "Out of Scope" in feature description)
- Landscape orientation is supported but not optimized (per "Out of Scope")
- The existing preview system in Journey Editor is not modified (per "Out of Scope")
- CSS `dvh` units are used with fallback to `vh` for older browsers
- Tailwind CSS v4 responsive utilities (`lg:` prefix) are used for breakpoint styling

## Scope Boundaries

**In Scope:**
- All 11 step types responsive layouts
- StepLayout primitive refactor
- ActionBar component creation
- ActionButton responsive sizing
- Component-specific responsive behavior (as detailed in feature spec)

**Out of Scope:**
- Tablet-specific optimizations
- Landscape-specific layouts
- Animation/transition between mobile and desktop
- Responsive preview in Journey Editor
- Changes to the preview frame system (375px mobile, 900px desktop)
