# Firestore Update Contracts: AI Image Node Settings

**Feature**: 053-ai-image-node-settings
**Date**: 2026-01-31

## Overview

This feature updates existing Experience documents via the established `useUpdateTransformConfig` mutation hook. No new Firestore operations are introduced.

## Mutation Contract

### Update Transform Config

**Hook**: `useUpdateTransformConfig(workspaceId, experienceId)`

**Document Path**: `workspaces/{workspaceId}/experiences/{experienceId}`

**Update Pattern**:
```typescript
// Input
interface UpdateTransformInput {
  transform: TransformConfig
}

// Firestore Update
{
  'draft.transform': TransformConfig,
  'draftVersion': FieldValue.increment(1),
  'updatedAt': FieldValue.serverTimestamp()
}
```

## Operation Contracts

### 1. Update Prompt

**Trigger**: User edits prompt text (debounced)

**Input**:
```typescript
{
  nodeId: string
  prompt: string
}
```

**Transform Operation**:
```typescript
function updateNodePrompt(
  transform: TransformConfig,
  nodeId: string,
  prompt: string
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map(node =>
      node.id === nodeId && node.type === 'ai.imageGeneration'
        ? { ...node, config: { ...node.config, prompt } }
        : node
    )
  }
}
```

### 2. Update Model

**Trigger**: User selects different model from dropdown

**Input**:
```typescript
{
  nodeId: string
  model: AIImageModel
}
```

**Transform Operation**:
```typescript
function updateNodeModel(
  transform: TransformConfig,
  nodeId: string,
  model: AIImageModel
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map(node =>
      node.id === nodeId && node.type === 'ai.imageGeneration'
        ? { ...node, config: { ...node.config, model } }
        : node
    )
  }
}
```

### 3. Update Aspect Ratio

**Trigger**: User selects different aspect ratio from dropdown

**Input**:
```typescript
{
  nodeId: string
  aspectRatio: AIImageAspectRatio
}
```

**Transform Operation**:
```typescript
function updateNodeAspectRatio(
  transform: TransformConfig,
  nodeId: string,
  aspectRatio: AIImageAspectRatio
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map(node =>
      node.id === nodeId && node.type === 'ai.imageGeneration'
        ? { ...node, config: { ...node.config, aspectRatio } }
        : node
    )
  }
}
```

### 4. Upload and Add Reference Media (Multi-File)

**Trigger**: User selects files from file picker (multi-select) OR drops image files (multi-file)

**Two-Phase Operation**:

**Phase 1: Upload Files to Storage**

Uses existing `useUploadMediaAsset` from media-library domain:

```typescript
// Hook signature
useUploadMediaAsset(workspaceId: string, userId: string)

// Mutation call (per file)
const mediaRef = await uploadAsset.mutateAsync({
  file: File,
  type: 'refMedia',
  onProgress?: (progress: number) => void
})

// Returns MediaReference
{
  mediaAssetId: string,
  url: string,
  filePath: string | null,
  displayName: string
}
```

**Phase 2: Update Transform Config**

```typescript
// Input (after all uploads complete)
{
  nodeId: string
  newRefs: MediaReference[]  // Results from Phase 1
}
```

**Transform Operation**:
```typescript
function addNodeRefMedia(
  transform: TransformConfig,
  nodeId: string,
  newRefs: MediaReference[]
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map(node => {
      if (node.id !== nodeId || node.type !== 'ai.imageGeneration') {
        return node
      }

      const existingIds = new Set(node.config.refMedia.map(r => r.mediaAssetId))
      const uniqueNewRefs = newRefs.filter(r => !existingIds.has(r.mediaAssetId))
      const combined = [...node.config.refMedia, ...uniqueNewRefs]

      return {
        ...node,
        config: {
          ...node.config,
          refMedia: combined.slice(0, 10) // Enforce max limit
        }
      }
    })
  }
}
```

**Upload Strategy Options**:

1. **Sequential uploads** (simpler, shows progress per file):
   ```typescript
   for (const file of files) {
     const ref = await uploadAsset.mutateAsync({ file, type: 'refMedia' })
     mediaRefs.push(ref)
   }
   ```

2. **Parallel uploads** (faster, batch progress):
   ```typescript
   const mediaRefs = await Promise.all(
     files.map(file => uploadAsset.mutateAsync({ file, type: 'refMedia' }))
   )
   ```

**Constraints**:
- Pre-check: `(currentRefs.length + newFiles.length) <= 10` before starting uploads
- Deduplicate by `mediaAssetId` before adding to config
- Enforce maximum of 10 references (slice if exceeded)
- Preserve existing references (append behavior)
- Filter to image MIME types before upload

### 5. Remove Reference Media

**Trigger**: User clicks remove (✕) on a reference thumbnail

**Input**:
```typescript
{
  nodeId: string
  mediaAssetId: string
}
```

**Transform Operation**:
```typescript
function removeNodeRefMedia(
  transform: TransformConfig,
  nodeId: string,
  mediaAssetId: string
): TransformConfig {
  return {
    ...transform,
    nodes: transform.nodes.map(node =>
      node.id === nodeId && node.type === 'ai.imageGeneration'
        ? {
            ...node,
            config: {
              ...node.config,
              refMedia: node.config.refMedia.filter(
                r => r.mediaAssetId !== mediaAssetId
              )
            }
          }
        : node
    )
  }
}
```

## Debouncing Strategy

**Prompt Input**: 300ms debounce to reduce mutation frequency during typing.

**All Other Fields**: Immediate mutation on change (model, aspect ratio, add/remove refs).

## Error Handling

Errors are captured by the existing `useUpdateTransformConfig` hook:
- Sentry error capture with domain tags
- Toast notification to user (via existing error boundary)
- No retry logic needed (user can manually retry)

## Optimistic Updates

The mutation hook uses TanStack Query's optimistic update pattern:
- UI updates immediately on mutation
- Rolls back on error
- Invalidates query cache on success
