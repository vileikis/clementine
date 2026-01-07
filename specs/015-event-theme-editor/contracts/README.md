# API Contracts: Event Theme Editor

**Feature**: 015-event-theme-editor
**Date**: 2026-01-07

## Overview

The theme editor does **not require new API endpoints**. It uses existing Firestore client SDK operations through established patterns in the codebase.

---

## Existing Endpoints Used

### 1. Update Event Config Field

**Function**: `updateEventConfigField(projectId, eventId, updates)`
**Location**: `@/domains/event/actions/event.actions.ts`
**Type**: Server action (uses Admin SDK)

**Request**:
```typescript
interface UpdateEventConfigFieldRequest {
  projectId: string
  eventId: string
  updates: Record<string, unknown>  // Dot notation keys
}

// Example for theme update:
{
  projectId: "proj_123",
  eventId: "evt_456",
  updates: {
    "theme.primaryColor": "#3B82F6",
    "theme.text.color": "#FFFFFF"
  }
}
```

**Response**:
```typescript
interface UpdateEventConfigFieldResponse {
  success: boolean
}
```

**Error Cases**:
- `NOT_FOUND`: Event or project doesn't exist
- `PERMISSION_DENIED`: User doesn't have write access
- `VALIDATION_ERROR`: Invalid field values

---

### 2. Upload Media Asset

**Hook**: `useUploadMediaAsset(workspaceId, userId)`
**Location**: `@/domains/media-library/hooks/useUploadMediaAsset.ts`
**Type**: Client-side mutation (uses Client SDK + Storage)

**Request**:
```typescript
interface UploadMediaAssetRequest {
  file: File
  type: 'background' | 'logo' | 'photo' | 'video'
  onProgress?: (progress: number) => void
}
```

**Response**:
```typescript
interface UploadMediaAssetResponse {
  mediaAssetId: string
  url: string
}
```

**Error Cases**:
- `FILE_TOO_LARGE`: Exceeds size limit
- `INVALID_FILE_TYPE`: Unsupported file format
- `UPLOAD_FAILED`: Firebase Storage error

---

## Component Props Contracts

### Editor Controls (Shared)

```typescript
// EditorSection
interface EditorSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean  // Default: true
}

// EditorRow
interface EditorRowProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
  stacked?: boolean  // Default: false
}

// ColorPickerField
interface ColorPickerFieldProps {
  label: string
  value: string  // Hex color (#RRGGBB)
  onChange: (color: string) => void
  nullable?: boolean  // Default: false
}

// SelectField
interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

// ToggleGroupField
interface ToggleGroupFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{
    value: string
    label: string
    icon?: React.ReactNode
  }>
}

// SliderField
interface SliderFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number  // Default: 1
  formatValue?: (value: number) => string
}

// MediaPickerField
interface MediaPickerFieldProps {
  label: string
  value: string | null  // URL
  onChange: (url: string | null, mediaAssetId?: string) => void
  onUpload: (file: File) => Promise<{ url: string; mediaAssetId: string }>
  accept?: string  // Default: "image/*"
  removable?: boolean  // Default: true
}
```

### Theme Editor (Domain)

```typescript
// ThemePreview
interface ThemePreviewProps {
  theme: Theme
}

// ThemeControls
interface ThemeControlsProps {
  theme: Theme
  onUpdate: (updates: Partial<Theme>) => void
  onUploadBackground: (file: File) => Promise<{ url: string; mediaAssetId: string }>
  disabled?: boolean
}

// ThemeEditorPage
// No props - receives params from route context
```

### Hooks

```typescript
// useUpdateTheme
function useUpdateTheme(
  projectId: string,
  eventId: string
): UseMutationResult<void, Error, UpdateTheme>

// useUploadAndUpdateBackground
function useUploadAndUpdateBackground(
  projectId: string,
  eventId: string,
  workspaceId: string,
  userId: string
): UseMutationResult<
  { url: string; mediaAssetId: string },
  Error,
  { file: File; onProgress?: (progress: number) => void }
>
```

---

## Validation Schemas

All validation schemas are defined in `@/shared/theming/schemas/theme.schemas.ts`.

See [data-model.md](../data-model.md) for complete schema definitions.

---

## Error Handling

### Theme Update Errors

```typescript
try {
  await updateTheme.mutateAsync(updates)
  toast.success('Theme saved')
} catch (error) {
  Sentry.captureException(error, {
    tags: { domain: 'event/theme', action: 'update-theme' },
  })
  toast.error('Failed to save theme')
}
```

### Upload Errors

```typescript
try {
  const { url, mediaAssetId } = await uploadBackground.mutateAsync({ file })
  // Update theme with new image
} catch (error) {
  if (error.code === 'FILE_TOO_LARGE') {
    toast.error('Image is too large. Maximum size is 5MB.')
  } else if (error.code === 'INVALID_FILE_TYPE') {
    toast.error('Invalid file type. Please upload an image.')
  } else {
    Sentry.captureException(error)
    toast.error('Failed to upload image')
  }
}
```

---

## Query Keys

The theme editor uses existing query keys:

```typescript
// Event data query
['project-event', projectId, eventId]

// Invalidated on theme update
queryClient.invalidateQueries({
  queryKey: ['project-event', projectId, eventId],
})
```
