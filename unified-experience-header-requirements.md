# Unified Experience Editor Header - Requirements Document

## Goal

Create a unified, reusable `ExperienceEditorHeader` component that standardizes the header area across all experience editor types (Photo, GIF, Survey, and future types) while maintaining flexibility for type-specific controls.

## Current State Analysis

### Photo & GIF Editors
- Have dedicated header sections with:
  - Title display (non-editable)
  - Delete button (via `DeleteExperienceButton` component)
  - Base fields (label, enabled toggle) via `BaseExperienceFields`
  - Preview media upload (via `PreviewMediaUpload` component with help text and explicit buttons)

### Survey Editor
- Different structure:
  - No preview media
  - Non-editable experience label
  - Enabled and Required toggles in a separate control box
  - No delete button in header area

### Current Issues
- Inconsistent UI/UX across experience types
- Duplicated header logic
- Different patterns for common functionality
- Preview media component is verbose (help text, explicit buttons)

## Requirements

### 1. Component Structure

Create `@web/src/features/experiences/components/shared/ExperienceEditorHeader.tsx` with three distinct rows:

#### Row 1: Preview Media
- Compact, square-sized image preview (no help text or explicit labels)
- When **no media**: Show small button with `[image icon] + "Add Preview"`
  - Clicking opens file upload dialog immediately
- When **media exists**:
  - Display image/video in square container
  - On hover: Show trash/cross icon in top-right corner
  - Clicking trash icon removes the preview
- Reuse business logic from existing `PreviewMediaUpload.tsx`

#### Row 2: Title & Delete
- **Left**: Editable experience title (clickable header)
  - Similar behavior to `EditableEventName.tsx`
  - Opens dialog for editing
  - Updates experience label
- **Right**: Delete button
  - Reuse existing `DeleteExperienceButton` component

#### Row 3: Toggle Controls
- **Required**: Enabled toggle (always present)
- **Optional**: Additional toggle controls passed via props
  - Example: "Required" toggle for Survey editor
  - Extensible for future editor-specific controls

### 2. Design Requirements

- **Compact Layout**: Minimize vertical space usage
- **Consistent Spacing**: Use design system spacing tokens
- **Responsive**: Mobile-first, adapts to desktop
- **Accessibility**:
  - Proper ARIA labels
  - Keyboard navigation support
  - Touch target sizes (min 44x44px for interactive elements)

### 3. Technical Requirements

#### Props Interface
```typescript
interface ExperienceEditorHeaderProps {
  // Experience data
  eventId: string;
  experience: Experience; // Type-agnostic - works with any experience type

  // Preview media
  previewPath?: string;
  previewType?: PreviewType;
  onPreviewUpload: (publicUrl: string, fileType: PreviewType) => void;
  onPreviewRemove: () => void;

  // Title editing
  onTitleSave: (newTitle: string) => Promise<void>;

  // Enabled toggle
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => Promise<void>;

  // Delete
  onDelete: () => Promise<void>;

  // Optional: Additional controls for Row 3
  additionalControls?: React.ReactNode;

  // Loading/disabled states
  disabled?: boolean;
}
```

#### Type Agnostic Design
- Component should accept `Experience` base type (not specific types like `PhotoExperience`)
- Should work with Photo, GIF, Survey, and future experience types without modification
- Type-specific functionality handled via callbacks and optional props

#### State Management
- Use React `useTransition` for async operations (title save, toggle changes)
- Local loading states for each operation (upload, delete, toggle)
- Error handling with user feedback (toasts or inline errors)

### 4. Component Reuse & Integration

#### Reuse Existing Components
- `DeleteExperienceButton` - Delete functionality with confirmation
- Business logic from `PreviewMediaUpload` - File upload/delete actions
- Dialog pattern from `EditableEventName` - Title editing UI

#### Replace Current Implementations
- **PhotoExperienceEditor**: Remove header section, `BaseExperienceFields`, and `PreviewMediaUpload`
- **GifExperienceEditor**: Remove header section, `BaseExperienceFields`, and `PreviewMediaUpload`
- **SurveyExperienceEditor**: Remove control box section, add header with `additionalControls` for Required toggle

### 5. Functional Requirements

#### Preview Media (Row 1)
- File validation: Images (JPG, PNG, GIF), Videos (MP4, WebM)
- Max file size: 10MB
- Upload to Firebase Storage: `/events/{eventId}/experiences/{experienceId}/preview/`
- Optimistic UI updates during upload
- Error handling with user-friendly messages

#### Editable Title (Row 2)
- Click-to-edit interaction
- Dialog modal with input field
- Character limit: 100 characters
- Validation: Required, non-empty
- Save via server action
- Error handling

#### Enabled Toggle (Row 3)
- Immediate save on toggle
- Visual feedback during save
- Disabled state when parent operations are pending

#### Additional Controls (Row 3)
- Flexible slot for type-specific toggles/controls
- Example: Survey Required toggle (only enabled when experience is enabled)
- Consistent styling with base Enabled toggle

### 6. Visual Design

#### Row 1: Preview Media
- Square container: ~120px × 120px (mobile), ~160px × 160px (desktop)
- Border: Subtle neutral border
- Background: Light gray/muted when empty
- Add button: Ghost variant, centered, icon + text
- Hover state: Semi-transparent overlay with trash icon

#### Row 2: Title & Delete
- Title: `text-2xl font-semibold`, hover underline to indicate editability
- Delete button: Right-aligned, destructive variant

#### Row 3: Controls
- Horizontal layout with gap spacing
- Each control: Label + Switch component
- Tooltip icons for help text (using `Tooltip` from shadcn/ui)
- Disabled visual state (reduced opacity)

#### Overall Header
- Background: Card background (`bg-card`)
- Border: Subtle border (`border-border`)
- Padding: Consistent padding (`p-4` or `p-6`)
- Spacing between rows: `space-y-4`

### 7. Implementation Notes

#### File Organization
- Location: `@web/src/features/experiences/components/shared/ExperienceEditorHeader.tsx`
- Create sub-component if needed: `PreviewMediaCompact.tsx` (simplified preview without verbose UI)

#### Server Actions
- Reuse existing actions:
  - `uploadPreviewMedia` from `photo-media.ts`
  - `deletePreviewMedia` from `photo-media.ts`
  - Experience update actions (photo-update, gif-update, survey-update)

#### Keyboard Shortcuts
- Maintain existing Cmd+S/Ctrl+S for save (if applicable in parent editor)
- Add Enter key support in title edit dialog

### 8. Testing Considerations

- Test with all experience types (Photo, GIF, Survey)
- Test preview media upload/remove flow
- Test title editing flow
- Test enabled toggle state changes
- Test additional controls integration (Survey Required toggle)
- Test error states (upload failure, save failure)
- Test loading/disabled states
- Test mobile responsiveness
- Test keyboard navigation
- Test with/without preview media

### 9. Migration Path

1. Create `ExperienceEditorHeader` component
2. Create simplified `PreviewMediaCompact` sub-component (or integrate into header)
3. Update `PhotoExperienceEditor`:
   - Replace header, `BaseExperienceFields`, and `PreviewMediaUpload` with new header
   - Pass appropriate props and callbacks
4. Update `GifExperienceEditor`:
   - Same as Photo editor
5. Update `SurveyExperienceEditor`:
   - Replace control box with new header
   - Pass Required toggle as `additionalControls` prop
6. Test all editors thoroughly
7. Remove deprecated components if no longer used elsewhere

### 10. Future Extensibility

- Component design supports adding new experience types without modification
- `additionalControls` prop allows type-specific UI in Row 3
- Callback-based architecture allows parent components to control behavior
- Preview media is optional (can be omitted for types that don't need it)

## Success Criteria

- ✅ Single reusable header component used across all experience editors
- ✅ Consistent UI/UX for common functionality (title, enabled, delete, preview)
- ✅ Compact, space-efficient design
- ✅ Support for type-specific controls via `additionalControls` prop
- ✅ Type-agnostic design (works with any `Experience` type)
- ✅ No breaking changes to existing functionality
- ✅ Improved code maintainability and reduced duplication
