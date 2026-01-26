# Quickstart: AI Presets CRUD

**Feature**: 041-ai-presets-crud
**Date**: 2026-01-26

## Overview

This guide provides quick reference for implementing AI Presets CRUD functionality.

---

## 1. Schema Setup

### packages/shared/src/schemas/ai-preset/index.ts
```typescript
// Barrel export for AI Preset schemas
export * from './ai-preset.schema'
export * from './preset-variable.schema'
export * from './preset-media.schema'
```

### packages/shared/src/schemas/index.ts
```typescript
// Add to existing barrel export
export * from './ai-preset'
```

---

## 2. Domain Structure

Create the following directory structure:

```bash
mkdir -p apps/clementine-app/src/domains/ai-presets/{components,containers,hooks,schemas}
```

### Domain Barrel Export
```typescript
// apps/clementine-app/src/domains/ai-presets/index.ts

// Components
export { AIPresetsList } from './components/AIPresetsList'
export { AIPresetItem } from './components/AIPresetItem'
export { CreateAIPresetButton } from './components/CreateAIPresetButton'
export { RenameAIPresetDialog } from './components/RenameAIPresetDialog'
export { DeleteAIPresetDialog } from './components/DeleteAIPresetDialog'

// Containers
export { AIPresetsPage } from './containers/AIPresetsPage'

// Hooks
export { useWorkspaceAIPresets } from './hooks/useWorkspaceAIPresets'
export { useCreateAIPreset } from './hooks/useCreateAIPreset'
export { useRenameAIPreset } from './hooks/useRenameAIPreset'
export { useDeleteAIPreset } from './hooks/useDeleteAIPreset'
export { useDuplicateAIPreset } from './hooks/useDuplicateAIPreset'

// Types (re-export from shared)
export type { AIPreset, AIPresetStatus } from '@clementine/shared'
```

---

## 3. Key Hook Patterns

### useWorkspaceAIPresets (Real-time List)
```typescript
import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { aiPresetSchema } from '@clementine/shared'
import { firestore } from '@/integrations/firebase/client'
import { convertFirestoreDoc } from '@/shared/utils/firestore-utils'

export function useWorkspaceAIPresets(workspaceId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const presetsQuery = query(
      collection(firestore, `workspaces/${workspaceId}/aiPresets`),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
    )

    const unsubscribe = onSnapshot(presetsQuery, (snapshot) => {
      const presets = snapshot.docs.map((doc) =>
        convertFirestoreDoc(doc, aiPresetSchema),
      )
      queryClient.setQueryData(['aiPresets', workspaceId], presets)
    })

    return () => unsubscribe()
  }, [workspaceId, queryClient])

  return useQuery({
    queryKey: ['aiPresets', workspaceId],
    queryFn: async () => {
      // Initial fetch handled by onSnapshot
      return []
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}
```

### useCreateAIPreset (Mutation)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import * as Sentry from '@sentry/tanstackstart-react'
import { firestore } from '@/integrations/firebase/client'
import { createAIPresetInputSchema } from '../schemas/ai-preset.input.schemas'

export function useCreateAIPreset(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input = {}) => {
      const validated = createAIPresetInputSchema.parse(input)

      const presetsRef = collection(firestore, `workspaces/${workspaceId}/aiPresets`)

      return await runTransaction(firestore, (transaction) => {
        const newPresetRef = doc(presetsRef)

        transaction.set(newPresetRef, {
          id: newPresetRef.id,
          name: validated.name ?? 'Untitled preset',
          description: null,
          status: 'active',
          mediaRegistry: [],
          variables: [],
          promptTemplate: '',
          model: 'gemini-2.5-flash',
          aspectRatio: '1:1',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deletedAt: null,
          createdBy: 'TODO_USER_ID', // Get from auth context
        })

        return Promise.resolve({ presetId: newPresetRef.id })
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiPresets', workspaceId] })
    },
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { domain: 'ai-presets', action: 'create' },
      })
    },
  })
}
```

---

## 4. Component Patterns

### AIPresetItem (Card with Context Menu)
```typescript
// Follow ProjectEventItem.tsx pattern
// Key elements:
// - Clickable card for navigation
// - Context menu with Rename, Duplicate, Delete
// - Dialog states for rename/delete
// - Toast notifications for feedback
```

### AIPresetsList (List with States)
```typescript
// Follow ProjectEventsList.tsx pattern
// Key elements:
// - Loading state (skeleton or spinner)
// - Empty state (prompt to create first preset)
// - List rendering with AIPresetItem
```

---

## 5. Route Setup

### apps/clementine-app/src/app/routes/workspace/$workspaceSlug.ai-presets/index.tsx
```typescript
import { createFileRoute } from '@tanstack/react-router'
import { AIPresetsPage } from '@/domains/ai-presets'

export const Route = createFileRoute('/workspace/$workspaceSlug/ai-presets/')({
  component: AIPresetsListRoute,
})

function AIPresetsListRoute() {
  const { workspaceSlug } = Route.useParams()
  // TODO: Resolve workspaceSlug to workspaceId
  return <AIPresetsPage workspaceId={workspaceSlug} />
}
```

### apps/clementine-app/src/app/routes/workspace/$workspaceSlug.ai-presets/$presetId.tsx
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceSlug/ai-presets/$presetId')({
  component: AIPresetEditorPlaceholder,
})

function AIPresetEditorPlaceholder() {
  const { presetId } = Route.useParams()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">AI Preset Editor</h1>
      <p className="text-muted-foreground mt-2">
        Editor for preset {presetId} coming in Phase 3
      </p>
    </div>
  )
}
```

---

## 6. Navigation Setup

### Add to workspaceNavItems.ts
```typescript
import { FolderOpen, Settings, Sparkles, Wand2 } from 'lucide-react'

export const workspaceNavItems: NavItem[] = [
  { label: 'Projects', to: '/workspace/$workspaceSlug/projects', icon: FolderOpen },
  { label: 'Experiences', to: '/workspace/$workspaceSlug/experiences', icon: Sparkles },
  { label: 'AI Presets', to: '/workspace/$workspaceSlug/ai-presets', icon: Wand2 },
  { label: 'Settings', to: '/workspace/$workspaceSlug/settings', icon: Settings },
]
```

---

## 7. Security Rules

### Add to firebase/firestore.rules
```javascript
match /workspaces/{workspaceId}/aiPresets/{presetId} {
  allow read: if isWorkspaceMember(workspaceId);
  allow write: if isWorkspaceAdmin(workspaceId);
}
```

---

## 8. Validation Commands

Before committing:
```bash
pnpm app:check          # Format + lint
pnpm app:type-check     # TypeScript
pnpm --filter @clementine/shared build  # Build shared package
```

---

## 9. Testing Checklist

- [ ] Navigate to AI Presets page from sidebar
- [ ] See loading state briefly
- [ ] See empty state when no presets
- [ ] Create new preset (admin only)
- [ ] See preset appear in list
- [ ] Click preset to navigate to editor placeholder
- [ ] Rename preset via context menu
- [ ] Duplicate preset via context menu
- [ ] Delete preset with confirmation
- [ ] Verify non-admin cannot see create/actions
