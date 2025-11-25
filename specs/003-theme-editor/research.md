# Research: Theme Editor

**Feature**: 003-theme-editor
**Date**: 2025-11-25

## Summary

Research confirms that the Theme Editor feature is **95% implemented**. All core components, server actions, validation schemas, and UI elements exist and are tested. Only route integration and navigation updates remain.

## Existing Infrastructure Analysis

### Decision: Use Existing ThemeEditor Component
**Rationale**: The `ThemeEditor.tsx` component (385+ lines) is fully implemented with:
- Complete UI for all 5 configuration sections
- `useReducer` state management with 10 action types
- Live preview panel integration
- Keyboard shortcuts (Cmd+S / Ctrl+S)
- Toast notifications for save feedback
- Loading states during save operations

**Alternatives Considered**:
- Build new component: Rejected - existing component meets all requirements
- Modify existing: Not needed - already feature-complete

### Decision: Rename Route from "Branding" to "Theme"
**Rationale**: PRD explicitly specifies the route as `/events/{id}/design/theme`. The term "Theme" better describes the comprehensive visual configuration (colors, typography, buttons, backgrounds) vs "Branding" which implies logo-only.

**Alternatives Considered**:
- Keep "Branding" route: Rejected - PRD requires "Theme"
- Add redirect from branding to theme: Rejected - unnecessary complexity

### Decision: Server-Side Event Fetching in Page Component
**Rationale**: Follow established pattern in other design pages (journeys, experiences). Server components fetch data, client components handle interaction.

**Alternatives Considered**:
- Client-side fetching: Rejected - inconsistent with existing patterns
- Route handler API: Rejected - unnecessary indirection

## Component Dependencies

### ImageUploadField
- **Location**: `components/shared/ImageUploadField.tsx`
- **Status**: Complete
- **Integration**: Used for logo and background image uploads
- **Storage Destinations**: "logos", "backgrounds" buckets

### useKeyboardShortcuts Hook
- **Location**: `hooks/useKeyboardShortcuts.ts`
- **Status**: Complete
- **Integration**: Maps Cmd+S / Ctrl+S to save handler
- **Pattern**: Object-based shortcut definition

### PreviewPanel
- **Location**: `features/events/components/designer/PreviewPanel.tsx`
- **Status**: Complete
- **Integration**: Provides mobile device frame wrapper
- **Aspect Ratio**: 9/19.5 (iPhone-like)

### Server Action: updateEventTheme
- **Location**: `features/events/actions/events.ts`
- **Status**: Complete
- **Validation**: Zod schema with hex color regex
- **Firebase Pattern**: Admin SDK for writes

## Technical Findings

### State Management
- ThemeEditor uses `useReducer` for complex nested state
- Initial state populated from `event.theme` prop
- Actions: SET_LOGO_URL, SET_FONT_FAMILY, SET_PRIMARY_COLOR, SET_TEXT_COLOR, SET_TEXT_ALIGNMENT, SET_BUTTON_BG_COLOR, SET_BUTTON_TEXT_COLOR, SET_BUTTON_RADIUS, SET_BG_COLOR, SET_BG_IMAGE, SET_BG_OVERLAY_OPACITY

### Preview Updates
- Preview panel receives theme state via props
- Updates are synchronous (no debouncing needed)
- Inline styles apply theme values directly

### Validation Schema
- `updateEventThemeSchema` in `features/events/schemas/events.schemas.ts`
- Color format: `/^#[0-9A-F]{6}$/i`
- Image URLs validated as `.url()`
- Overlay opacity: 0-1 number range

## Open Questions

None - all technical questions resolved by existing implementation.

## References

- ThemeEditor component: `web/src/features/events/components/designer/ThemeEditor.tsx`
- ThemeEditor tests: `web/src/features/events/components/designer/ThemeEditor.test.tsx`
- Server action: `web/src/features/events/actions/events.ts` (lines 270-395)
- Type definitions: `web/src/features/events/types/event.types.ts`
- Validation schema: `web/src/features/events/schemas/events.schemas.ts`
