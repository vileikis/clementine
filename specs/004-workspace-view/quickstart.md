# Quickstart: Workspace View & Settings (Admin)

**Feature**: 004-workspace-view
**Branch**: `004-workspace-view`
**For**: Developers implementing or extending workspace view functionality

## Overview

This feature implements admin workspace view with slug-based routing, editable settings, friendly 404 states, workspace context display, and automatic session persistence. It follows a client-first architecture using Firebase Firestore client SDK, TanStack Router, TanStack Query, and Zustand.

**What You'll Build**:
- ✅ Workspace resolution by slug
- ✅ Workspace selector in sidebar (display-only)
- ✅ Workspace settings page (edit name and slug)
- ✅ Projects placeholder page
- ✅ Friendly 404 states
- ✅ Last visited workspace session persistence (localStorage)
- ✅ Auto-redirect from `/` and `/workspace` to last visited workspace

---

## Prerequisites

### Required Knowledge
- TypeScript 5.7+ (strict mode)
- React 19
- TanStack Router (file-based routing)
- TanStack Query (data fetching)
- Zustand (state management)
- Firebase Firestore client SDK
- Zod (validation)
- shadcn/ui components

### Required Setup
- Admin Firebase Auth custom claim (`admin: true`)
- Firestore `workspaces` collection with security rules
- TanStack Start dev server running (`pnpm dev`)

### Verify Prerequisites

```bash
# Check if dev server is running
curl http://localhost:3000

# Verify admin claim in Firebase Console
# Navigate to: Authentication > Users > [Your User] > Custom Claims
# Should see: { "admin": true }

# Verify workspace data exists in Firestore
# Navigate to: Firestore Database > workspaces collection
# Should have at least 1 active workspace
```

---

## Quick Start (5 Minutes)

### 1. Navigate to Workspace by Slug

```bash
# Start dev server (if not already running)
cd apps/clementine-app
pnpm dev

# Open browser to workspace URL
# http://localhost:3000/workspace/[your-workspace-slug]
```

**Expected Result**:
- Workspace name appears in sidebar selector
- Workspace icon (2-letter abbreviation) displays
- No errors in console

### 2. Test Workspace Settings

```bash
# Navigate to settings page
# http://localhost:3000/workspace/[your-workspace-slug]/settings
```

**Actions to Test**:
1. Change workspace name → Save → See name update in sidebar
2. Change slug → Save → URL updates to new slug
3. Try duplicate slug → See "Slug already in use" error

### 3. Test Session Persistence

```bash
# Visit a workspace
# http://localhost:3000/workspace/acme-corp

# Navigate to root
# http://localhost:3000/

# Expected: Auto-redirect to /workspace/acme-corp
```

---

## File Structure

```
apps/clementine-app/src/domains/
├── navigation/
│   ├── components/
│   │   ├── Sidebar.tsx                 # EXISTING - Already handles area switching
│   │   ├── WorkspaceSelector.tsx       # UPDATE - Fetch real workspace data by slug
│   │   └── WorkspaceNav.tsx            # UPDATE - Use real workspaceSlug from params
│   └── lib/
│       └── getWorkspaceInitials.ts     # UPDATE - Fix to match spec (1-2 letters)
└── workspace/
    ├── components/
    │   ├── WorkspaceSettingsForm.tsx   # NEW - Settings form (name + slug)
    │   └── WorkspaceSettingsForm.test.tsx  # NEW - Co-located test
    ├── hooks/
    │   ├── useWorkspace.ts             # NEW - Fetch workspace by slug
    │   ├── useWorkspace.test.ts        # NEW - Co-located test
    │   ├── useUpdateWorkspace.ts       # NEW - Update workspace mutation
    │   └── useUpdateWorkspace.test.ts  # NEW - Co-located test
    ├── store/
    │   ├── useWorkspaceStore.ts        # NEW - Zustand store (session persistence)
    │   └── useWorkspaceStore.test.ts   # NEW - Co-located test
    ├── actions/
    │   ├── updateWorkspace.ts          # NEW - Server action for updates
    │   └── updateWorkspace.test.ts     # NEW - Co-located test
    ├── schemas/
    │   └── workspace.schemas.ts        # UPDATE - Add updateWorkspaceSchema
    ├── types/
    │   └── workspace.types.ts          # UPDATE - Add UpdateWorkspaceInput
    ├── constants/
    │   └── workspace.constants.ts      # EXISTING - Already defined
    └── index.ts                        # UPDATE - Export new hooks/components

apps/clementine-app/src/app/
├── index.tsx                       # UPDATE - Add redirect logic
├── workspace.tsx                   # NEW - Workspace index redirect
└── workspace/
    ├── $workspaceSlug.tsx          # UPDATE - Workspace resolution in beforeLoad
    ├── $workspaceSlug.index.tsx    # EXISTING - Workspace landing page
    ├── $workspaceSlug.settings.tsx # NEW - Settings page
    └── $workspaceSlug.projects.tsx # EXISTING - Projects placeholder

apps/clementine-app/src/shared/
└── components/
    └── NotFound.tsx                # UPDATE - Generic 404 component with props
```

---

## Key Concepts

### 1. Client-First Architecture

**Rule**: Use Firebase client SDK for reads, server actions for writes.

```typescript
// ✅ GOOD - Client SDK for reads
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

const q = query(
  collection(firestore, 'workspaces'),
  where('slug', '==', slug),
  where('status', '==', 'active')
)
const snapshot = await getDocs(q)

// ✅ GOOD - Server action for writes
import { updateWorkspace } from '@/domains/workspace/actions/updateWorkspace'
await updateWorkspace({ id, name, slug })

// ❌ BAD - Direct Firestore write from client (blocked by rules)
await updateDoc(workspaceRef, { name: 'New Name' })
```

### 2. TanStack Router Loaders

**Rule**: Use `beforeLoad` for data fetching and redirects.

```typescript
// Route loader pattern
export const Route = createFileRoute('/workspace/$workspaceSlug')({
  beforeLoad: async ({ params }) => {
    const { workspaceSlug } = params

    // Fetch workspace data
    const workspace = await fetchWorkspaceBySlug(workspaceSlug)

    if (!workspace) {
      return { workspace: null }  // Triggers notFoundComponent
    }

    // Update session persistence
    useWorkspaceStore.getState().setLastVisitedWorkspaceSlug(workspaceSlug)

    return { workspace }
  },
})
```

### 3. Zustand Persist Middleware

**Rule**: Use Zustand for localStorage persistence (graceful degradation).

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      lastVisitedWorkspaceSlug: null,
      setLastVisitedWorkspaceSlug: (slug) =>
        set({ lastVisitedWorkspaceSlug: slug }),
    }),
    {
      name: 'workspace-storage',  // localStorage key
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate workspace state:', error)
        }
      },
    }
  )
)
```

### 4. Slug Uniqueness Validation

**Rule**: Two-tier validation (client pre-check + server authoritative).

```typescript
// Client-side pre-check (UX)
const isAvailable = await checkSlugUniqueness(slug, workspaceId)
if (!isAvailable) {
  setError('slug', { message: 'Slug already in use' })
  return
}

// Server-side authoritative check (security)
await updateWorkspace({ id, slug })  // Throws if slug conflict
```

---

## Common Tasks

### Add a New Component to Workspace Domain

```bash
# Create component file with co-located test
touch apps/clementine-app/src/domains/workspace/components/MyComponent.tsx
touch apps/clementine-app/src/domains/workspace/components/MyComponent.test.tsx

# Export from index.ts (public API)
echo "export { MyComponent } from './components/MyComponent'" >> apps/clementine-app/src/domains/workspace/index.ts
```

**Component Template**:
```typescript
// MyComponent.tsx
import { Workspace } from '../types/workspace.types'

interface MyComponentProps {
  workspace: Workspace
}

export function MyComponent({ workspace }: MyComponentProps) {
  return <div>{workspace.name}</div>
}
```

**Test Template**:
```typescript
// MyComponent.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('should render workspace name', () => {
    const workspace = { id: '1', name: 'Test Workspace', slug: 'test' }
    render(<MyComponent workspace={workspace} />)
    expect(screen.getByText('Test Workspace')).toBeInTheDocument()
  })
})
```

### Add a New Route

```bash
# Create route file (file-based routing)
touch apps/clementine-app/src/app/workspace/\$workspaceSlug.my-page.tsx
```

**Route Template**:
```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/workspace/$workspaceSlug/my-page')({
  component: MyPage,
})

function MyPage() {
  const { workspace } = Route.useLoaderData()
  return <div>My Page for {workspace.name}</div>
}
```

### Add a New Hook

```bash
# Create hook file
touch apps/clementine-app/src/domains/workspace/hooks/useMyHook.ts
```

**Hook Template**:
```typescript
import { useQuery } from '@tanstack/react-query'

export function useMyHook(workspaceId: string) {
  return useQuery({
    queryKey: ['my-data', workspaceId],
    queryFn: async () => {
      // Fetch data using Firebase client SDK
    },
  })
}
```

### Add a New Server Action

```bash
# Create action file
touch apps/clementine-app/src/domains/workspace/actions/myAction.ts
```

**Server Action Template**:
```typescript
'use server'

import { requireAdmin } from '@/utils/requireAdmin'

export async function myAction(input: MyInput): Promise<MyOutput> {
  // Validate admin
  await requireAdmin()

  // Validate input with Zod
  const validated = mySchema.parse(input)

  // Perform server-side operation
  // ...

  return result
}
```

---

## Testing Strategy

### Unit Tests

```bash
# Run tests
cd apps/clementine-app
pnpm test
```

**Test Files** (co-located with modules):
```
domains/navigation/lib/
└── getWorkspaceInitials.test.ts  # Icon generation tests

domains/workspace/
├── hooks/
│   ├── useWorkspace.test.ts          # Workspace resolution tests
│   └── useWorkspaceStore.test.ts     # localStorage persistence tests
├── store/
│   └── useWorkspaceStore.test.ts     # Zustand store tests
├── actions/
│   └── updateWorkspace.test.ts       # Update mutation tests
└── components/
    └── WorkspaceSettingsForm.test.tsx # Form component tests
```

**Example Test** (Navigation Domain):
```typescript
// domains/navigation/lib/getWorkspaceInitials.test.ts
import { describe, it, expect } from 'vitest'
import { getWorkspaceInitials } from './getWorkspaceInitials'

describe('getWorkspaceInitials', () => {
  it('should generate 2-letter icon from multi-word name', () => {
    expect(getWorkspaceInitials('Acme Corp')).toBe('AC')
  })

  it('should generate 1-letter icon from single word', () => {
    expect(getWorkspaceInitials('Acme')).toBe('A')
  })

  it('should handle empty string', () => {
    expect(getWorkspaceInitials('')).toBe('?')
  })

  it('should handle null', () => {
    expect(getWorkspaceInitials(null)).toBe('?')
  })
})
```

### Manual Testing Checklist

- [ ] Navigate to workspace by slug → Workspace loads correctly
- [ ] Navigate to non-existent slug → 404 state shows
- [ ] Update workspace name → Name updates in sidebar
- [ ] Update workspace slug → URL redirects to new slug
- [ ] Try duplicate slug → Error message displays
- [ ] Visit workspace, then navigate to `/` → Redirects to workspace
- [ ] Clear localStorage, navigate to `/` → Redirects to `/admin`
- [ ] Test on mobile (320px viewport) → UI remains accessible

---

## Debugging Tips

### Workspace Not Loading

```typescript
// Check browser console for errors
// Common issues:

// 1. Firestore permission denied
// → Verify admin claim in Firebase Console

// 2. Workspace not found
// → Check slug spelling and workspace status (must be 'active')

// 3. Network error
// → Check Firebase project configuration
```

### Slug Update Not Working

```typescript
// Check if slug is already in use
const q = query(
  collection(firestore, 'workspaces'),
  where('slug', '==', newSlug),
  where('status', '==', 'active')
)
const snapshot = await getDocs(q)
console.log('Existing workspaces with slug:', snapshot.docs.map(d => d.id))
```

### Session Persistence Not Working

```typescript
// Check localStorage
console.log(localStorage.getItem('workspace-storage'))

// Verify store state
import { useWorkspaceStore } from '@/domains/workspace/store/useWorkspaceStore'
console.log(useWorkspaceStore.getState())

// Common issues:
// - localStorage disabled (private browsing mode)
// - localStorage quota exceeded
// - Browser security policy
```

---

## Performance Optimization

### Firestore Query Optimization

```typescript
// ✅ GOOD - Uses compound index
const q = query(
  collection(firestore, 'workspaces'),
  where('slug', '==', slug),
  where('status', '==', 'active')
)

// ❌ BAD - No index, slow query
const q = query(
  collection(firestore, 'workspaces'),
  where('slug', '==', slug)
)
// Filter status client-side (inefficient)
```

**Required Firestore Index**:
```json
{
  "collectionGroup": "workspaces",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "slug", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

### TanStack Query Caching

```typescript
// Set stale time for workspace data (5 minutes)
export function useWorkspace(slug: string) {
  return useQuery({
    queryKey: ['workspace', slug],
    queryFn: () => fetchWorkspace(slug),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  })
}
```

---

## Security Considerations

### Admin-Only Access

**Firestore Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    match /workspaces/{workspaceId} {
      allow read: if isAdmin();
      allow write: if false;  // Force through server actions
    }
  }
}
```

### Server-Side Validation

```typescript
// NEVER trust client input
export async function updateWorkspace(input: UpdateWorkspaceInput) {
  // 1. Validate admin (server-side)
  await requireAdmin()

  // 2. Validate input (Zod schema)
  const validated = updateWorkspaceSchema.parse(input)

  // 3. Check business rules (slug uniqueness)
  await checkSlugUniqueness(validated.slug, validated.id)

  // 4. Perform update
  await updateDoc(workspaceRef, validated)
}
```

---

## Standards Compliance

### Must Follow

- ✅ **Frontend/Design System** (`frontend/design-system.md`) - Use theme tokens, no hard-coded colors
- ✅ **Frontend/Component Libraries** (`frontend/component-libraries.md`) - Use shadcn/ui for forms
- ✅ **Global/Project Structure** (`global/project-structure.md`) - Vertical slice architecture
- ✅ **Global/Code Quality** (`global/code-quality.md`) - Run `pnpm check` before commit
- ✅ **Global/Security** (`global/security.md`) - Input validation, XSS prevention
- ✅ **Backend/Firestore** (`backend/firestore.md`) - Client SDK patterns
- ✅ **Backend/Firestore Security** (`backend/firestore-security.md`) - Security rules

### Pre-Commit Checklist

```bash
# Format, lint, type-check
pnpm check

# Run tests
pnpm test

# Verify dev server works
pnpm dev

# Test on mobile viewport (DevTools)
# Navigate to: http://localhost:3000/workspace/[slug]
# Toggle device toolbar (Cmd+Shift+M)
# Select iPhone SE (375x667)
```

---

## Helpful Resources

### Documentation
- [Feature Spec](./spec.md) - Full feature requirements
- [Data Model](./data-model.md) - Entity schemas and relationships
- [API Contracts](./contracts/workspace-api.md) - API signatures and contracts
- [Research](./research.md) - Technical decisions and best practices

### External Resources
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [shadcn/ui Components](https://ui.shadcn.com)

### Codebase Standards
- [Standards README](../../../apps/clementine-app/standards/README.md)
- [Client-First Architecture](../../../apps/clementine-app/standards/global/client-first-architecture.md)
- [Authentication Standard](../../../apps/clementine-app/standards/global/authentication.md)

---

## Next Steps

After completing this feature:

1. **Run validation loop**:
   ```bash
   pnpm check && pnpm test
   ```

2. **Review standards compliance**:
   - [ ] Design system compliance
   - [ ] Component library usage
   - [ ] Project structure
   - [ ] Code quality
   - [ ] Security best practices

3. **Create pull request**:
   ```bash
   git add .
   git commit -m "feat: implement workspace view and settings"
   git push origin 004-workspace-view
   gh pr create
   ```

4. **Next feature**: Workspace projects CRUD (builds on this foundation)

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Workspace not found** | Verify workspace status is 'active' and slug matches exactly |
| **Permission denied** | Check Firebase Auth custom claim (`admin: true`) |
| **Slug validation error** | Ensure slug matches regex: `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/` |
| **localStorage not working** | Check browser private mode or security policy |
| **Redirect loop** | Clear localStorage: `localStorage.clear()` |
| **TypeScript errors** | Run `pnpm type-check` and fix errors |

### Get Help

- Review [Standards](../../../apps/clementine-app/standards/README.md)
- Check [CLAUDE.md](../../../apps/clementine-app/CLAUDE.md)
- Read [Feature Spec](./spec.md)
- Ask the team

---

**Ready to implement?** Follow the [Implementation Plan](./plan.md) for step-by-step guidance.
