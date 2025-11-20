# Event Survey Feature - Business Logic & UX Requirements

## Overview

The Event Survey feature allows event creators to add customizable survey questions/steps to collect feedback from guests. Surveys can be enabled/disabled, made optional or required, and consist of multiple question types presented in a specific order.

---

## Business Requirements

### Survey Configuration

1. **Survey Toggle**

   - Event creators can enable or disable surveys for their event
   - When disabled, guests complete experiences without seeing any survey steps
   - Default state: disabled

2. **Survey Requirement**
   - Event creators can make surveys required or optional
   - Required surveys: guests must complete survey before seeing ending screen
   - Optional surveys: guests can skip survey and proceed to ending screen
   - Default state: optional

---

## Survey Step Types

Event creators can add six types of survey questions:

### 1. Short Text

- **Purpose**: Collect brief text responses (e.g., name, job title)
- **Configuration**:
  - Title (question text)
  - Description (optional helper text)
  - Placeholder text
  - Required/optional flag

### 2. Long Text

- **Purpose**: Collect extended text responses (e.g., feedback, comments)
- **Configuration**:
  - Title (question text)
  - Description (optional helper text)
  - Placeholder text
  - Required/optional flag

### 3. Multiple Choice

- **Purpose**: Select one or more options from a list
- **Configuration**:
  - Title (question text)
  - Description (optional helper text)
  - List of options (minimum 1 option)
  - Allow single selection or multiple selections
  - Required/optional flag

### 4. Yes/no

- **Purpose**: Select one of two options
- **Configuration**:
  - Yes (label)
  - No (label)
  - Required/optional flag

### 5. Opinion Scale

- **Purpose**: Rate on a numeric scale (e.g., 1-5 satisfaction rating)
- **Configuration**:
  - Title (question text)
  - Description (optional helper text)
  - Scale minimum value
  - Scale maximum value
  - Required/optional flag
- **Validation**: Minimum value must be less than maximum value

### 6. Email

- **Purpose**: Collect email addresses with validation
- **Configuration**:
  - Title (question text)
  - Description (optional helper text)
  - Placeholder text
  - Required/optional flag
- **Validation**: Must validate email format on guest submission

### 7. Statement

- **Purpose**: Display informational text without collecting input (e.g., disclaimers, instructions)
- **Configuration**:
  - Title (statement text)
  - Description (optional additional text)
- **Note**: No user input required; always skippable

---

## UX Requirements

### Event Designer Experience

1. **Create survey experience**

   - When creating new experience user can now pick survey type
   - Survey type is no longer disabled and coming soon

2. **Survey editor / header**

   - Same as in other experience editors with title, enable, preview and delete controls
   - It should have one more custom control for making survey required

3. **Survey editor / main content**

   - Below header there should be 2 sections
   - Left side panel with survey steps list
   - On the right step editor (with preview and settings)

4. **Survey Steps List**

   - Lists all created survey steps in order
   - List header should say "Steps" and have plus button (simillar to the ExperiencesList)
   - Each step displays:
     - Step type icon/badge
     - Step title (or "Untitled" if no title set)
   - Steps can be reordered via drag-and-drop
   - Clicking a step opens the step editor

5. **Adding Survey Steps**

   - Click + button opens step type selector dialog
   - Dialog shows all 6 step types with:
     - Type name (e.g., "Short Text", "Multiple Choice")
     - Type icon
   - Selecting a type creates new step and opens step editor

6. **Survey Step Editor**

   - Opens in main content area when step is selected
   - Left side: Live preview of how step appears to guests
   - Right side panel: Form controls for step configuration
   - Shows all relevant fields for selected step type
   - Updates preview in real-time as creator makes changes

7. **Deleting Survey Steps**
   - Each step has delete action (on the bottom of the right side panel)
   - Shows confirmation dialog before deletion
   - Deletion removes step from list and updates step count
   - After delete it should open first available step

#### Step Ordering

1. **Drag-and-Drop Reordering**

   - Steps can be reordered by dragging
   - Visual feedback during drag operation
   - Order persists immediately after drop
   - Order changes update step numbering in preview

2. **Visual Ordering Indicators**
   - Steps show their position number (1, 2, 3...)
   - Drag handle icon visible on hover/touch

## Business Rules & Validations

### Creator-Side Validations

0. **Survey Step Navigation**

   - Each survey step should have it's own route

1. **Survey Step Limits**

   - Minimum: 0 steps (survey can be empty if disabled)
   - Maximum: 10 steps per event (recommended limit)

2. **Step Configuration Validation**

   - Title: max 200 characters
   - Description: max 500 characters
   - Placeholder: max 100 characters
   - Multiple choice options: minimum 1, each max 100 characters
   - Opinion scale: min < max, both must be integers

3. **Step Ordering**
   - Step order must be unique (no duplicate positions)
   - Step count must match number of steps in order array
   - Deleting a step updates order array to remove that step ID

---

## Success Criteria

Event creators should be able to:

- Add and configure survey steps in under 3 minutes
- Reorder survey steps with zero failed drag operations
- Enable/disable surveys with immediate effect
- Preview survey steps as they appear to guests

---

## Mobile-First Considerations

1. **Survey Step Editor**

   - Form controls and preview should stack vertically on mobile
   - All interactive elements (buttons, toggles, inputs) must meet 44x44px minimum touch target
   - Step list should be scrollable with adequate spacing for touch

2. **Drag-and-Drop on Mobile**
   - Touch-friendly drag handles
   - Visual feedback during drag (elevated card, haptic feedback if available)
   - Easy to cancel drag operation

---

## Edge Cases & Error Handling

1. **Empty Survey**

   - Survey enabled but no steps added: allow but show warning
   - Guest sees ending screen immediately after experiences

2. **Very Long Surveys**

   - Warn creator if survey exceeds 5 steps (UX recommendation)
   - Allow up to 10 steps but discourage in UI

3. **Invalid Survey Step Configuration**
   - Prevent saving steps with invalid configuration (e.g., no options for multiple choice)
   - Show clear validation errors in step editor

---

## Future Enhancements (Out of Current Scope)

- Guest experience (survey interaction, collection responses)
- Survey analytics
- Conditional logic (show step X only if step Y answered a certain way)
- Branching surveys (different paths based on answers)
- File upload step type
- Date/time picker step type
- Survey templates for common use cases
- Bulk import/export of survey questions
- Integration with third-party survey tools (Typeform, Google Forms)
- Survey response analytics dashboard with charts and graphs
- Email notifications when surveys are completed
- Custom thank-you messages after survey completion
