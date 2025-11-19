# UI Components Contract: Experience Builder

**Feature**: 003-experience-schema
**Date**: 2025-11-19
**Version**: 1.0

## Overview

This document defines the component interface contracts for the experience builder UI. All components read from and write to the new discriminated union schema (`config`, `aiConfig`).

---

## Create Experience Dialog

### Component Signature

```typescript
type CreateExperienceDialogProps = {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (experienceId: string) => void;
};

function CreateExperienceDialog(props: CreateExperienceDialogProps): JSX.Element;
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Parent event ID for the new experience |
| `open` | `boolean` | Yes | Dialog open/closed state |
| `onOpenChange` | `(open: boolean) => void` | Yes | Callback when dialog state changes |
| `onSuccess` | `(experienceId: string) => void` | No | Callback with newly created experience ID |

### UI Structure

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Experience</DialogTitle>
      <DialogDescription>
        Choose an experience type and give it a name.
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit}>
      {/* Experience Type Selection */}
      <Label htmlFor="type">Experience Type</Label>
      <Select name="type" defaultValue="photo">
        <SelectItem value="photo">Photo Experience</SelectItem>

        {/* Disabled types with "coming soon" badges */}
        <SelectItem value="video" disabled>
          <div className="flex items-center justify-between w-full">
            <span>Video Experience</span>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </SelectItem>

        <SelectItem value="gif" disabled>
          <div className="flex items-center justify-between w-full">
            <span>GIF Experience</span>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </SelectItem>

        <SelectItem value="wheel" disabled>
          <div className="flex items-center justify-between w-full">
            <span>Prize Wheel</span>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </SelectItem>

        <SelectItem value="survey" disabled>
          <div className="flex items-center justify-between w-full">
            <span>Survey</span>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </SelectItem>
      </Select>

      {/* Experience Name Input */}
      <Label htmlFor="label">Experience Name</Label>
      <Input
        id="label"
        name="label"
        placeholder="e.g., Summer Photo Booth"
        maxLength={50}
        required
      />

      {/* Actions */}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Experience"}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Behavior

1. **Type Selection**:
   - Only "photo" is selectable (FR-004)
   - Video, GIF, Wheel, Survey show "Coming Soon" badge and are disabled
   - Attempting to submit with disabled type shows validation error

2. **Form Submission**:
   - Client-side validation: label required, 1-50 characters
   - Call `createPhotoExperienceAction(eventId, { label, type: "photo" })`
   - On success: call `onSuccess(experienceId)` and close dialog
   - On error: display error toast

3. **Mobile Responsiveness** (MFR-002):
   - Touch-friendly Select with ≥44px hit area
   - Input field ≥44px height
   - Full-width buttons on mobile (<768px)

### Acceptance Criteria

- **FR-004**: Non-photo types disabled and marked "coming soon"
- **FR-005**: Cannot submit without label
- **MFR-002**: Touch targets ≥44x44px
- **US1-AC1**: Creates document with `type: "photo"`, `config: {countdown: 0}`, `aiConfig: {enabled: false, aspectRatio: "1:1"}`
- **US1-AC2**: Only photo type is enabled

---

## Experience Builder Form

### Component Signature

```typescript
type ExperienceBuilderFormProps = {
  eventId: string;
  experienceId: string;
  initialData: PhotoExperience;  // From Firestore subscription
  onSave?: () => void;
};

function ExperienceBuilderForm(props: ExperienceBuilderFormProps): JSX.Element;
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Parent event ID |
| `experienceId` | `string` | Yes | Experience document ID |
| `initialData` | `PhotoExperience` | Yes | Current experience data (from real-time subscription) |
| `onSave` | `() => void` | No | Callback after successful save |

### UI Structure

```tsx
<form onSubmit={handleSubmit}>
  {/* Basic Configuration Section */}
  <section>
    <h3>Basic Settings</h3>

    <Label htmlFor="label">Experience Name</Label>
    <Input
      id="label"
      name="label"
      defaultValue={initialData.label}
      maxLength={50}
      required
    />

    <div className="flex items-center gap-2">
      <Switch
        id="enabled"
        name="enabled"
        defaultChecked={initialData.enabled}
      />
      <Label htmlFor="enabled">Active</Label>
    </div>

    <div className="flex items-center gap-2">
      <Switch
        id="hidden"
        name="hidden"
        defaultChecked={initialData.hidden}
      />
      <Label htmlFor="hidden">Hidden (draft mode)</Label>
    </div>
  </section>

  {/* Photo Configuration Section */}
  <section>
    <h3>Photo Settings</h3>

    <Label htmlFor="countdown">Countdown Duration (seconds)</Label>
    <Slider
      id="countdown"
      name="config.countdown"
      min={0}
      max={10}
      step={1}
      defaultValue={[initialData.config.countdown ?? 0]}
    />
    <p className="text-sm text-muted-foreground">
      {initialData.config.countdown ?? 0}s {(initialData.config.countdown ?? 0) === 0 && "(no countdown)"}
    </p>

    <Label htmlFor="overlayFrame">Overlay Frame</Label>
    <div className="flex items-center gap-2">
      {initialData.config.overlayFramePath && (
        <img
          src={initialData.config.overlayFramePath}
          alt="Overlay preview"
          className="w-16 h-16 object-contain border rounded"
        />
      )}
      <Button type="button" onClick={handleUploadOverlay}>
        {initialData.config.overlayFramePath ? "Change Frame" : "Upload Frame"}
      </Button>
      {initialData.config.overlayFramePath && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleRemoveOverlay}
        >
          Remove
        </Button>
      )}
    </div>
  </section>

  {/* AI Configuration Section */}
  <section>
    <h3>AI Transformation</h3>

    <div className="flex items-center gap-2">
      <Switch
        id="aiEnabled"
        name="aiConfig.enabled"
        defaultChecked={initialData.aiConfig.enabled}
      />
      <Label htmlFor="aiEnabled">Enable AI Transformation</Label>
    </div>

    {initialData.aiConfig.enabled && (
      <>
        <Label htmlFor="aiModel">AI Model</Label>
        <Select
          name="aiConfig.model"
          defaultValue={initialData.aiConfig.model ?? "flux-schnell"}
        >
          <SelectItem value="flux-schnell">Flux Schnell</SelectItem>
          <SelectItem value="flux-dev">Flux Dev</SelectItem>
          <SelectItem value="stable-diffusion-xl">Stable Diffusion XL</SelectItem>
        </Select>

        <Label htmlFor="aiPrompt">Transformation Prompt</Label>
        <Textarea
          id="aiPrompt"
          name="aiConfig.prompt"
          defaultValue={initialData.aiConfig.prompt}
          placeholder="e.g., Transform into vintage polaroid style"
          maxLength={600}
        />

        <Label htmlFor="aspectRatio">Aspect Ratio</Label>
        <Select
          name="aiConfig.aspectRatio"
          defaultValue={initialData.aiConfig.aspectRatio}
        >
          <SelectItem value="1:1">1:1 (Square)</SelectItem>
          <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
          <SelectItem value="4:5">4:5 (Instagram)</SelectItem>
          <SelectItem value="9:16">9:16 (Stories)</SelectItem>
          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
        </Select>

        <Label>Reference Images</Label>
        <div className="grid grid-cols-3 gap-2">
          {initialData.aiConfig.referenceImagePaths?.map((path, index) => (
            <div key={index} className="relative">
              <img src={path} alt={`Reference ${index + 1}`} className="w-full aspect-square object-cover rounded" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1"
                onClick={() => handleRemoveReference(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(!initialData.aiConfig.referenceImagePaths || initialData.aiConfig.referenceImagePaths.length < 5) && (
            <Button
              type="button"
              variant="outline"
              className="aspect-square"
              onClick={handleUploadReference}
            >
              + Add Reference
            </Button>
          )}
        </div>
      </>
    )}
  </section>

  {/* Actions */}
  <div className="flex justify-end gap-2">
    <Button type="button" variant="outline" onClick={() => router.back()}>
      Cancel
    </Button>
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : "Save Changes"}
    </Button>
  </div>
</form>
```

### Behavior

1. **Form Initialization**:
   - Reads from `initialData.config.countdown` (NOT flat `countdownSeconds`)
   - Reads from `initialData.aiConfig.enabled` (NOT flat `aiEnabled`)
   - Displays all fields with current values

2. **Form Submission**:
   - Client-side validation with Zod
   - Call `updatePhotoExperienceAction(eventId, experienceId, formData)`
   - On success: show success toast, call `onSave()`
   - On error: display error toast, preserve form state

3. **Partial Updates**:
   - Only modified fields are sent to server
   - Nested updates (e.g., `config.countdown`) merge with existing `config` object
   - Server handles merging logic

4. **Migration Handling** (FR-006, FR-007, FR-008):
   - Component reads from new schema fields (`config`, `aiConfig`)
   - If `initialData` has legacy flat fields, they are ignored (server migrates on save)
   - All writes go to new schema structure

5. **Mobile Responsiveness** (MFR-001, MFR-003):
   - Form inputs ≥14px text
   - Touch-friendly controls (Switch ≥44px, Slider thumb ≥44px)
   - Stacked layout on mobile (<768px), two-column on desktop

### Acceptance Criteria

- **FR-006**: Reads settings from `config.*` and `aiConfig.*`
- **FR-007**: Writes all settings to `config` and `aiConfig` objects
- **US2-AC1**: Changing countdown updates only `config.countdown`
- **US2-AC2**: Updating AI prompt updates `aiConfig.prompt` and preserves other properties
- **US2-AC3**: Saving a legacy experience migrates to new schema
- **MFR-001**: Form works on mobile (320px-768px)
- **MFR-003**: Form inputs ≥14px text, appropriately sized

---

## Preview Image Upload Component

### Component Signature

```typescript
type PreviewImageUploadProps = {
  eventId: string;
  experienceId: string;
  currentPreviewPath?: string;
  onUploadSuccess: (publicUrl: string) => void;
};

function PreviewImageUpload(props: PreviewImageUploadProps): JSX.Element;
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | Parent event ID |
| `experienceId` | `string` | Yes | Experience document ID |
| `currentPreviewPath` | `string` | No | Current preview image URL (if exists) |
| `onUploadSuccess` | `(publicUrl: string) => void` | Yes | Callback with uploaded image URL |

### UI Structure

```tsx
<div className="space-y-2">
  <Label>Preview Image</Label>

  {currentPreviewPath ? (
    <div className="relative">
      <img
        src={currentPreviewPath}
        alt="Experience preview"
        className="w-full max-w-sm aspect-video object-cover rounded border"
      />
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2"
        onClick={handleRemovePreview}
      >
        Remove
      </Button>
    </div>
  ) : (
    <div
      className="border-2 border-dashed rounded p-8 text-center cursor-pointer hover:bg-muted/50"
      onClick={() => fileInputRef.current?.click()}
    >
      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">
        Click to upload preview image
      </p>
      <p className="text-xs text-muted-foreground">
        PNG, JPG, GIF up to 10MB
      </p>
    </div>
  )}

  <input
    ref={fileInputRef}
    type="file"
    accept="image/jpeg,image/png,image/gif"
    className="hidden"
    onChange={handleFileChange}
  />
</div>
```

### Behavior

1. **File Selection**:
   - Click upload area or "Change" button to open file picker
   - Validate file type (image/jpeg, image/png, image/gif) and size (<10MB)
   - Show validation error if invalid

2. **Upload Process**:
   - Call `uploadPreviewMediaAction(eventId, experienceId, file)`
   - Show loading spinner during upload
   - On success: call `onUploadSuccess(publicUrl)` to update parent form
   - On error: show error toast

3. **Remove Preview**:
   - Call `onUploadSuccess(undefined)` to clear preview
   - Update experience document with `previewPath: undefined`

### Acceptance Criteria

- Upload validates file type and size
- Public URL returned from server is stored in Firestore
- Preview image displays immediately after upload (no page refresh)

---

## Common UI Patterns

### Error Display

All forms use consistent error handling:

```tsx
{error && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error.message}</AlertDescription>
  </Alert>
)}
```

### Loading States

All forms show loading indicators during async operations:

```tsx
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isSubmitting ? "Saving..." : "Save Changes"}
</Button>
```

### Success Feedback

All successful mutations show toast notifications:

```tsx
import { toast } from "sonner";

toast.success("Experience created successfully");
toast.error("Failed to update experience");
```

---

## Responsive Design Requirements

### Mobile (320px - 768px)

- **Layout**: Single column, stacked form fields
- **Touch Targets**: All interactive elements ≥44x44px
- **Typography**: Body text ≥14px, labels ≥12px
- **Spacing**: Generous padding (16px-24px) between sections
- **Buttons**: Full-width on mobile

### Tablet (768px - 1024px)

- **Layout**: Two-column grid for related fields
- **Touch Targets**: Same as mobile (≥44x44px)
- **Typography**: Same as mobile
- **Buttons**: Fixed width (not full-width)

### Desktop (1024px+)

- **Layout**: Two or three columns where appropriate
- **Touch Targets**: Can be smaller (≥32px acceptable)
- **Typography**: Body text 16px, labels 14px
- **Buttons**: Fixed width with min-width constraint

---

## Accessibility Requirements

All components must meet WCAG AA standards:

- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus Indicators**: Visible focus rings on all focusable elements
- **Labels**: All inputs have associated `<Label>` elements
- **Error Messages**: Use `aria-invalid` and `aria-describedby` for validation errors
- **Color Contrast**: Minimum 4.5:1 ratio for text, 3:1 for UI elements
- **Screen Reader**: Semantic HTML (`<form>`, `<fieldset>`, `<legend>`)

---

## Testing Contract

Each component must have tests covering:

1. **Rendering**: Component renders with default props
2. **Form Submission**: Valid input triggers correct Server Action
3. **Validation**: Invalid input shows validation errors
4. **Loading States**: Loading indicators appear during async operations
5. **Error Handling**: Server errors display error messages
6. **Accessibility**: Keyboard navigation, focus management, ARIA attributes

### Example Test (React Testing Library)

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateExperienceDialog } from "./create-experience-dialog";

describe("CreateExperienceDialog", () => {
  it("should disable non-photo experience types", () => {
    render(
      <CreateExperienceDialog
        eventId="evt_123"
        open={true}
        onOpenChange={jest.fn()}
      />
    );

    const videoOption = screen.getByRole("option", { name: /video experience/i });
    expect(videoOption).toBeDisabled();
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it("should create photo experience with default config", async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    render(
      <CreateExperienceDialog
        eventId="evt_123"
        open={true}
        onOpenChange={jest.fn()}
        onSuccess={onSuccess}
      />
    );

    await user.type(screen.getByLabelText(/experience name/i), "Test Booth");
    await user.click(screen.getByRole("button", { name: /create experience/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(expect.stringMatching(/^exp_/));
    });
  });
});
```

---

## References

- **Data Model**: [data-model.md](../data-model.md)
- **Server Actions**: [server-actions.md](./server-actions.md)
- **Feature Spec**: [spec.md](../spec.md)
- **Component Standards**: `/standards/frontend/components.md`
- **Accessibility Standards**: `/standards/frontend/accessibility.md`
