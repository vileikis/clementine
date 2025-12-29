# Feature Specification: Preview Shell Module Migration

**Feature Branch**: `tech/migrate-preview-shell-2`
**Created**: 2025-12-29
**Status**: Draft
**Input**: User description: "Migrate the preview-shell module from the Next.js app to TanStack Start app and create dev-tools testing interface to enable device preview infrastructure for admin interfaces."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin Tests Device Preview Infrastructure (Priority: P1)

**Description**: As an admin developer, I need to test the device preview functionality (mobile/desktop viewport switching) in an isolated environment before integrating it into production features like theme editor or experience editor.

**Why this priority**: This is foundational infrastructure that other admin features depend on. Without a working preview-shell module and testing interface, developers cannot build or validate admin tools that require device preview capabilities.

**Independent Test**: Can be fully tested by navigating to `/admin/dev-tools/preview-shell`, toggling viewport modes and fullscreen, and verifying visual feedback without needing any other features to be implemented.

**Acceptance Scenarios**:

1. **Given** admin navigates to `/admin/dev-tools/preview-shell`, **When** page loads, **Then** they see two-column layout with prop controls (left) and preview area (right) displaying default viewport mode
2. **Given** admin is on dev-tools page, **When** they toggle `enableViewportSwitcher` control, **Then** viewport switcher buttons appear/disappear in the preview area immediately
3. **Given** admin is on dev-tools page, **When** they toggle `enableFullscreen` control, **Then** fullscreen trigger button appears/disappears in the preview area immediately
4. **Given** admin is viewing preview in mobile mode, **When** they click desktop icon in viewport switcher, **Then** preview transitions to desktop viewport (900x600px) with visual indication
5. **Given** admin is viewing preview in desktop mode, **When** they click mobile icon in viewport switcher, **Then** preview transitions to mobile viewport (375x667px) with visual device frame
6. **Given** admin is on dev-tools page, **When** they click "Reset & Remount" button, **Then** component state clears and remounts with default props

---

### User Story 2 - Admin Verifies Fullscreen Mode (Priority: P2)

**Description**: As an admin developer, I need to verify that fullscreen overlay mode works correctly with proper header, close functionality, and keyboard shortcuts before using it in production features.

**Why this priority**: Fullscreen mode is a secondary enhancement to the core viewport switching capability. It's important for user experience but not critical for basic device preview functionality.

**Independent Test**: Can be tested independently by enabling fullscreen in dev-tools, clicking the fullscreen trigger, and verifying overlay behavior (header, close button, Escape key) without needing viewport switching to work.

**Acceptance Scenarios**:

1. **Given** fullscreen is enabled in dev-tools, **When** admin clicks fullscreen trigger button, **Then** overlay activates covering entire viewport with header showing title and close button
2. **Given** fullscreen overlay is active, **When** admin clicks close button in header, **Then** overlay closes and returns to normal preview
3. **Given** fullscreen overlay is active, **When** admin presses Escape key, **Then** overlay closes immediately
4. **Given** fullscreen overlay is active, **When** admin scrolls, **Then** body scroll is prevented (no background content scrolling)
5. **Given** fullscreen overlay is active with viewport switcher enabled, **When** admin toggles viewport in header, **Then** device frame updates inside fullscreen without closing overlay

---

### User Story 3 - Admin Verifies State Persistence (Priority: P3)

**Description**: As an admin developer, I need to verify that viewport mode preference persists across page refreshes using localStorage so users don't lose their viewport selection when navigating between pages.

**Why this priority**: Persistence is a quality-of-life improvement that enhances developer experience but is not critical for the module to function. The preview-shell works perfectly fine without persistence.

**Independent Test**: Can be tested independently by changing viewport mode in dev-tools, refreshing the page, and verifying the selected mode is restored without needing any other functionality.

**Acceptance Scenarios**:

1. **Given** admin selects mobile viewport in dev-tools, **When** they refresh the page, **Then** mobile viewport is restored on page load
2. **Given** admin selects desktop viewport in dev-tools, **When** they refresh the page, **Then** desktop viewport is restored on page load
3. **Given** admin changes viewport multiple times, **When** they navigate away and return to dev-tools page, **Then** last selected viewport is preserved
4. **Given** admin has no stored preference (first visit), **When** they load dev-tools page, **Then** default viewport from prop controls is used

---

### Edge Cases

- What happens when admin enables both viewport switcher and fullscreen simultaneously? (Both should work together - fullscreen header can include viewport switcher)
- What happens when admin remounts component while fullscreen is active? (Fullscreen should close, component should reset to defaults)
- What happens when viewport switcher is disabled while in fullscreen? (Viewport switcher should disappear from fullscreen header)
- What happens when localStorage is full or blocked? (Module should fallback to in-memory state without persistence)
- What happens when admin rapidly toggles viewport mode? (UI should handle state transitions smoothly without visual glitches)
- What happens when viewport dimensions are too large for screen? (Desktop viewport should scale down responsively)

## Requirements *(mandatory)*

### Functional Requirements

#### Module Migration Requirements

- **FR-001**: System MUST copy all preview-shell module files from `/web/src/features/preview-shell/` to `/apps/clementine-app/src/shared/preview-shell/` preserving directory structure
- **FR-002**: System MUST install `zustand` package as a dependency in the TanStack Start app workspace
- **FR-003**: System MUST update all import paths from Next.js conventions (`@/lib/utils`, `@/components/ui/*`) to TanStack Start conventions (`@/shared/utils`, `@/ui-kit/components/*`)
- **FR-004**: System MUST maintain barrel export pattern with `index.ts` re-exporting all public API components, hooks, context, and types
- **FR-005**: System MUST export preview-shell module from `/shared/index.ts` for accessibility across domains

#### Component Requirements

- **FR-006**: `PreviewShell` component MUST orchestrate viewport switching and fullscreen state management
- **FR-007**: `PreviewShell` component MUST support controlled and uncontrolled viewport modes
- **FR-008**: `PreviewShell` component MUST accept `enableViewportSwitcher` and `enableFullscreen` boolean props
- **FR-009**: `DeviceFrame` component MUST render container with fixed dimensions: mobile (375x667px) and desktop (900x600px)
- **FR-010**: `ViewportSwitcher` component MUST render toggle buttons with icons (Smartphone for mobile, Monitor for desktop) from lucide-react
- **FR-011**: `ViewportSwitcher` component MUST support size variants ("sm", "md") and meet accessibility requirements (44x44px minimum touch target, ARIA labels)
- **FR-012**: `FullscreenOverlay` component MUST render CSS-based fullscreen overlay (not native Fullscreen API) with header containing title and optional close button
- **FR-013**: `FullscreenOverlay` component MUST handle Escape key for closing and prevent body scroll when active

#### Hook Requirements

- **FR-014**: `useViewport` hook MUST manage viewport mode state and return `mode`, `setMode`, `toggle`, and `dimensions`
- **FR-015**: `useViewport` hook MUST support both controlled (external state) and uncontrolled (internal state) patterns
- **FR-016**: `useFullscreen` hook MUST manage fullscreen overlay state and return `isFullscreen`, `enter`, `exit`, and `toggle` functions
- **FR-017**: `useFullscreen` hook MUST support optional `onEnter` and `onExit` callback functions
- **FR-018**: `useViewportStore` hook MUST use Zustand for global state management with localStorage persistence (key: `"preview-viewport"`)
- **FR-019**: `useViewportStore` hook MUST synchronize viewport mode across all PreviewShell component instances

#### Dev-Tools Requirements

- **FR-020**: System MUST create route at `/admin/dev-tools/preview-shell` for interactive testing playground
- **FR-021**: Dev-tools page MUST render two-column layout: prop controls panel (left, ~25% width) and preview area (right, ~75% width)
- **FR-022**: Prop controls panel MUST include toggles for `enableViewportSwitcher`, `enableFullscreen`, and select dropdown for `defaultViewport` ("mobile" | "desktop")
- **FR-023**: Prop controls panel MUST include "Reset & Remount" button that forces component remount by changing React key
- **FR-024**: Preview area MUST render PreviewShell component with current prop configuration from controls panel
- **FR-025**: Preview area MUST display rich sample content inside PreviewShell (text, buttons, images, cards) for visual testing
- **FR-026**: Preview area MUST allow interactive testing of viewport switching, fullscreen mode, and state persistence
- **FR-027**: All state changes (viewport mode, fullscreen status) MUST be visually apparent in preview area without requiring separate monitoring tools

#### Validation Requirements

- **FR-028**: Module MUST pass TypeScript strict mode type checking with zero errors
- **FR-029**: Module MUST pass ESLint with zero errors and Prettier formatting checks
- **FR-030**: Module MUST build successfully without errors in TanStack Start development server
- **FR-031**: Module MUST be importable from other domains using barrel exports from `/shared/index.ts`

### Key Entities *(include if feature involves data)*

- **ViewportMode**: Represents device viewport type - either "mobile" or "desktop"
- **ViewportDimensions**: Represents viewport width and height in pixels (mobile: 375x667, desktop: 900x600)
- **ViewportState**: Represents current viewport mode selection stored in Zustand global state and persisted to localStorage
- **FullscreenState**: Represents whether fullscreen overlay is currently active (boolean)
- **ComponentConfig**: Represents dev-tools configuration state including enabled features and default viewport mode

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin developers can load dev-tools page at `/admin/dev-tools/preview-shell` within 2 seconds without errors
- **SC-002**: Viewport mode toggles between mobile and desktop instantly (under 100ms) with visual confirmation
- **SC-003**: Fullscreen mode activates and deactivates instantly (under 100ms) with smooth overlay transition
- **SC-004**: All interactive controls (viewport switcher, fullscreen trigger, prop toggles) respond to user input within 100ms
- **SC-005**: Viewport preference persists across page refreshes 100% of the time when localStorage is available
- **SC-006**: Module passes TypeScript strict mode compilation with zero type errors
- **SC-007**: Module passes all automated validation gates (format, lint, type-check) without manual fixes required
- **SC-008**: Component remount via "Reset & Remount" button clears all state and returns to defaults within 100ms
- **SC-009**: All state changes are visible in preview area without requiring browser developer tools or external monitoring
- **SC-010**: Module can be successfully imported and used by other features (theme editor, experience editor) after migration
