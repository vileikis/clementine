# Feature Specification: Google Fonts Integration

**Feature Branch**: `066-google-fonts`
**Created**: 2026-02-09
**Status**: Draft
**Input**: Theme Editor lets you choose Google Fonts (not just system fonts). Theme fonts apply cleanly to guest experience via ThemedBackground.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select a Google Font in Theme Editor (Priority: P1)

An experience creator opens the Theme Editor for their project. In the font section, instead of only seeing 10 system fonts in a dropdown, they see a font picker with a search field. They type "Playfair" and see matching Google Fonts appear. Each font is previewed with the sentence "Clementine makes sharing magical." rendered in that font's own typeface. The creator selects "Playfair Display" and the live preview on the right updates immediately to show the selected font applied to all text — headings, body, buttons, and labels.

**Why this priority**: This is the core feature — without a way to browse, search, and select Google Fonts, nothing else matters. The font picker is the gateway to the entire feature.

**Independent Test**: Can be fully tested by opening the Theme Editor, searching for a Google Font, selecting it, and verifying the preview updates with the chosen font. Delivers value as a standalone font browsing and selection experience.

**Acceptance Scenarios**:

1. **Given** a creator is on the Theme Editor page, **When** they open the font picker, **Then** they see a search input and a scrollable list of available Google Fonts, each rendered in its own typeface with the preview sentence.
2. **Given** a creator types "Inter" in the font search field, **When** results appear, **Then** only fonts matching "Inter" are shown (e.g., "Inter", "Inter Tight").
3. **Given** a creator selects "Playfair Display" from the font list, **When** the selection is confirmed, **Then** the live preview immediately renders all text using Playfair Display.
4. **Given** a creator selects a Google Font, **When** the auto-save debounce period passes, **Then** the font selection is persisted to the project theme.

---

### User Story 2 - Guest Sees the Selected Font (Priority: P1)

A guest visits a project link. The project creator has selected "Montserrat" as the theme font. When the guest experience loads, the system loads the Montserrat font from Google Fonts and applies it to all visible text — welcome screen headings, body text, buttons, form labels, and share screens.

**Why this priority**: Equal to P1 because the font selection is meaningless if guests don't see the chosen font. This is the other half of the core loop.

**Independent Test**: Can be tested by configuring a project with a Google Font, then visiting the guest URL and verifying all text uses the selected font. Delivers value as the visible output of the font theming feature.

**Acceptance Scenarios**:

1. **Given** a project theme has "Montserrat" selected as the font, **When** a guest loads the project URL, **Then** the Montserrat font is loaded from Google Fonts and applied to all text in the guest experience.
2. **Given** a project theme uses a Google Font, **When** the guest navigates through welcome, experience, and share screens, **Then** the selected font is consistently applied across all screens.
3. **Given** a project theme has a Google Font, **When** the guest views the experience, **Then** regular text uses weight 400 and bold text uses weight 700 (or browser-synthesized bold if 700 is unavailable for that font).

---

### User Story 3 - Graceful Fallback When Font Fails to Load (Priority: P2)

A guest visits a project where the creator selected "Nunito Sans" as the theme font. The guest's network blocks Google Fonts (corporate firewall, CSP policy, or network failure). Instead of broken or missing text, the guest sees readable text in the fallback font stack without layout shifts beyond the normal font swap.

**Why this priority**: Reliability is critical for guest experience — broken text is unacceptable. However, using `display=swap` and a proper fallback stack provides this behavior largely by default.

**Independent Test**: Can be tested by blocking Google Fonts requests in the browser, loading a guest experience with a Google Font configured, and verifying text renders using the fallback stack without layout breakage.

**Acceptance Scenarios**:

1. **Given** a project uses "Nunito Sans" from Google Fonts, **When** a guest loads the experience but Google Fonts is unreachable, **Then** text renders using the fallback font stack and the page is fully readable.
2. **Given** the Google Font stylesheet is loading, **When** the page first renders, **Then** text is visible immediately using the fallback stack (no invisible text), and swaps to the Google Font once loaded.

---

### User Story 4 - Clear Font Selection (Priority: P3)

A creator who previously selected a Google Font wants to revert to the platform default. They open the font picker and select "System Default" at the top of the list. This clears the Google Font selection, and the guest experience renders text using a cross-platform fallback stack (system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif) — which looks native on every device.

**Why this priority**: Important for completeness but straightforward. No individual system fonts are offered (e.g., "Helvetica", "Georgia") because they render inconsistently across macOS, iOS, Windows, and Linux. Only "System Default" (cross-platform fallback stack) and Google Fonts are available.

**Independent Test**: Can be tested by selecting a Google Font, then switching to "System Default", and verifying the preview and guest experience revert to the native system font on each platform.

**Acceptance Scenarios**:

1. **Given** a project currently uses "Lato" from Google Fonts, **When** the creator selects "System Default" in the font picker, **Then** the preview reverts to the platform's native font and no Google Font is loaded for guests.
2. **Given** a project uses "System Default", **When** a guest on Windows and a guest on macOS both visit the experience, **Then** both see readable native text appropriate to their platform.

---

### Edge Cases

- What happens when a creator selects a font that has very few weights (e.g., only 400)? The system automatically loads only available weights. Bold text uses browser-synthesized bold if weight 700 is unavailable.
- What happens when the same Google Font is used across multiple experiences in a project? The font is loaded once and shared consistently across all experiences.
- What happens when a creator searches for a font that doesn't exist? The search results show an empty state with a helpful message.
- What happens with fonts that have special characters in their name (e.g., "Noto Sans JP")? The font family string is properly encoded in the Google Fonts URL and CSS font-family declaration.
- What happens if the Google Fonts catalog is unavailable when the creator is browsing fonts? The picker shows an error state and "System Default" remains available.
- What happens when switching between Google Fonts and System Default rapidly? Each change debounces properly, only the final selection is saved, and no stale font stylesheets accumulate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a font picker in the Theme Editor that displays Google Fonts with a search field for filtering by name.
- **FR-002**: System MUST preview each font in the picker list using the font's own typeface, rendered with the sentence "Clementine makes sharing magical."
- **FR-003**: System MUST automatically load weights 400 (regular) and 700 (bold) for any selected Google Font. If the font lacks weight 700, the system loads only available weights and relies on browser-synthesized bold.
- **FR-004**: System MUST store the selected font configuration on the project theme, including: font family name, font source ("google" or "system"), loaded font variants/weights, and a fallback font stack.
- **FR-005**: System MUST load the selected Google Font at runtime in the guest experience using a stylesheet injection approach with `display=swap` to prevent invisible text during loading.
- **FR-006**: System MUST apply the selected font to all text in the guest experience — headings, body text, buttons, form labels, and any other visible text elements.
- **FR-007**: System MUST use the fallback font stack automatically when the Google Font fails to load, without broken layouts or invisible text.
- **FR-008**: System MUST update the live preview in the Theme Editor immediately when a font is selected, before the auto-save completes.
- **FR-009**: System MUST offer a "System Default" option in the font picker that uses a cross-platform fallback font stack. Individual system fonts (e.g., Helvetica, Georgia) MUST NOT be offered, as they render inconsistently across platforms.
- **FR-010**: System MUST cache the constructed Google Fonts stylesheet URL per theme to avoid re-injecting stylesheets on each route change within the guest experience.
- **FR-011**: System MUST preconnect to Google Fonts domains when entering the guest flow for faster font loading.

### Key Entities

- **Theme Font Configuration**: Represents the font selection for a project theme. Contains the font family name, source type (google or system), auto-determined weight variants (defaults to [400, 700] clamped to available weights), and a CSS fallback font stack string (e.g., "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"). Stored as part of the project theme configuration. A null or empty configuration means "use system default."
- **Google Font Metadata**: Represents a single Google Font available for selection. Contains the font family name, list of available weights/variants, and font category (serif, sans-serif, display, handwriting, monospace). Sourced from the Google Fonts catalog for populating the font picker.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can search, preview, and select a Google Font in under 30 seconds from opening the font picker.
- **SC-002**: The live preview in the Theme Editor updates within 500ms of selecting a new font.
- **SC-003**: Google Fonts load for guests within 2 seconds on a standard broadband connection, with text visible immediately via fallback fonts.
- **SC-004**: 100% of text elements in the guest experience (headings, body, buttons, labels) use the selected theme font.
- **SC-005**: When Google Fonts fails to load, the guest experience remains fully readable with the fallback font stack — no broken layouts or invisible text.
- **SC-006**: Font selection persists correctly across page reloads and is consistent across all experiences within the same project.
