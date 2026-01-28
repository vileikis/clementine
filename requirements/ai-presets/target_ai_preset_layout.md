# AI Preset Editor - Target Layout Specification

## Overview

The AI Preset Editor uses a two-panel layout with tab-based navigation for the main work area. This design provides dedicated space for editing, previewing, and configuring AI presets while maintaining consistency with other Clementine editors.

## Layout Structure

### Three-Area Design

```
┌─────────────────────────────────────────────────────────────────────┐
│ Top Navigation Bar                                                  │
│ - Preset name badge                                                 │
│ - Save status indicator                                             │
│ - Changes badge                                                     │
│ - Preview & Test button                                             │
│ - Publish button                                                    │
├─────────────────────────────────────────────┬───────────────────────┤
│ Main Work Area (flexible width)             │ Config Panel (400px)  │
│                                             │ - Always visible      │
│ [Edit] [Preview] tabs                       │ - Scrollable          │
│                                             │                       │
│ Tab content occupies full height            │ Sections:             │
│                                             │ - Model Settings      │
│                                             │ - Media Registry      │
│                                             │ - Variables           │
│                                             │                       │
└─────────────────────────────────────────────┴───────────────────────┘
```

## Main Work Area - Tab Navigation

The left side contains two mutually exclusive tabs that occupy the full available space:

### Edit Tab (Default)

**Purpose:** Primary editing workspace for the prompt template.

**Content:**
- Rich text editor (Lexical-based)
- Variable insertion controls
- Media insertion controls
- Full-height editing canvas

**Use Case:**
Users spend most of their time here, crafting and refining the AI prompt template that will be used to generate images.

### Preview Tab

**Purpose:** Test and validate the preset with real input values before publishing.

**Content Sections:**

1. **Test Values**
   - Input fields for all defined variables (text fields, image uploads)
   - Pre-populated with default values if configured
   - Clear labels matching variable names

2. **Prompt Preview**
   - Rendered prompt showing actual text that will be sent to AI
   - Variables replaced with input values
   - Media references expanded
   - Scrollable if long

3. **Test Controls**
   - "Test with AI" button
   - Triggers actual AI generation with current values
   - Opens dialog showing results

**Use Case:**
Before publishing changes, users switch to Preview tab to validate that:
- Variables substitute correctly
- The final prompt makes sense
- AI generates expected results

## Config Panel (Right Side)

The right panel remains visible and consistent across both tabs, providing quick access to configuration without interrupting the main workflow.

### Fixed Width
- 400px wide
- Scrollable vertically
- Maintains position when switching tabs

### Sections

#### 1. Model Settings
- AI model selection dropdown
- Aspect ratio selector
- Other model-specific parameters

#### 2. Media Registry
- List of uploaded reference images
- Upload new media button
- Preview thumbnails
- Delete controls

#### 3. Variables
- List of all defined variables (text and image types)
- Add new variable button
- Each variable shows:
  - Variable name (e.g., @style)
  - Variable type (text or image)
  - Settings button (opens inline settings)

**Inline Variable Settings:**
- Uses accordion/collapsible pattern
- Click settings button expands inline form below variable
- Configure value mappings and defaults without losing context
- Only one variable expanded at a time
- Maintains visibility of media registry and other variables

**Why Inline Instead of Dialog:**
- Users can reference media registry while configuring variables
- No context loss from modal overlays
- Can compare with other variables
- Natural scrolling behavior

## User Workflows

### Primary Editing Flow
1. User lands on Edit tab (default)
2. Crafts prompt template in rich text editor
3. Inserts variables and media references as needed
4. Config panel on right for quick adjustments
5. Changes auto-save to draft

### Preview & Testing Flow
1. User clicks Preview tab (or "Preview & Test" button in TopNavBar)
2. Sees form with all variable inputs
3. Fills in test values
4. Reviews rendered prompt preview below
5. Clicks "Test with AI" button
6. Dialog opens showing:
   - Loading state while AI processes
   - Generated result (image/video)
   - Ability to retry with different values

### Configuration Flow
1. User adds/edits variables in config panel
2. Clicks settings button on a variable
3. Variable expands inline showing settings form
4. Configures value mappings and defaults
5. Saves settings (collapsed back to card view)
6. Variable immediately available in Edit tab for insertion

### Publishing Flow
1. User makes edits and tests
2. TopNavBar shows "Changes Badge" indicating unpublished edits
3. User reviews in Preview tab
4. User clicks Publish button
5. Changes go live to published version

## Design Rationale

### Why Tabs for Main Work Area?
- **Space efficiency:** Each mode gets full vertical height
- **Mental model:** Clear separation between editing and previewing
- **Focus:** No competing sections fighting for attention
- **Familiar pattern:** Matches common editor UX (VSCode, Figma, etc.)

### Why Config Panel on Right?
- **Consistency:** Matches other Clementine editors
- **Accessibility:** Always available in both Edit and Preview modes
- **Priority:** Prompt template is primary work, config is secondary
- **Natural flow:** Left-to-right workflow (create → configure → preview)

### Why Inline Variable Settings?
- **Context preservation:** Media registry and other variables remain visible
- **No modal fatigue:** Reduces disruptive overlays
- **Quick comparison:** Easy to reference other variables while editing
- **Reduced clicks:** Settings expand in place, no separate navigation

### Why Test Button in Preview Tab?
- **Contextual action:** Test is relevant when previewing, not when editing
- **Keeps TopNavBar clean:** Avoids cluttering global navigation
- **Natural progression:** Fill inputs → review preview → test with AI

## Responsive Considerations

### Minimum Supported Width
- 1280px recommended minimum
- Main work area: minimum 720px
- Config panel: fixed 400px
- Gaps/borders: ~160px

### Vertical Space
- Full viewport height minus TopNavBar
- Both panels independently scrollable
- No fixed height sections (except TopNavBar)

## Future Extensions

This layout can accommodate future features without major restructuring:

- **Additional tabs:** History, Analytics, Settings (add to tab list)
- **Split preview:** Side-by-side code/visual preview (within Preview tab)
- **Collaborative editing:** Presence indicators in TopNavBar
- **Version history:** Timeline view in new tab
- **AI suggestions:** Panel overlay or new tab

## Accessibility Notes

- Tab navigation via keyboard (arrow keys)
- Focus management when switching tabs
- Proper ARIA labels for all interactive elements
- Accordion pattern for variable settings follows WAI-ARIA guidelines
- Screen reader announcements for save status and test results

## Key Takeaways

1. **Two-tab main area:** Edit and Preview modes with full-height space
2. **Config panel always visible:** Quick access to settings in all modes
3. **Inline variable settings:** No modal dialogs, maintain full context
4. **Test in Preview tab:** Contextual testing after reviewing rendered prompt
5. **Consistent with other editors:** Config on right matches established patterns
