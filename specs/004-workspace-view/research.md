# Research: Workspace View & Settings (Admin)

**Feature**: 004-workspace-view
**Date**: 2025-12-29
**Purpose**: Resolve technical unknowns and establish best practices for implementation

## Research Areas

### 1. Zustand Persist Middleware for localStorage

**Decision**: Use Zustand with persist middleware for `lastVisitedWorkspaceSlug` state management

**Rationale**:
- Zustand is already a project dependency
- Persist middleware automatically syncs state with localStorage
- Type-safe state management with minimal boilerplate
- Handles serialization/deserialization automatically
- Built-in support for localStorage unavailability (graceful degradation)
- React 19 compatible

**Best Practices**:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WorkspaceStore {
  lastVisitedWorkspaceSlug: string | null
  setLastVisitedWorkspaceSlug: (slug: string) => void
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      lastVisitedWorkspaceSlug: null,
      setLastVisitedWorkspaceSlug: (slug) => set({ lastVisitedWorkspaceSlug: slug }),
    }),
    {
      name: 'workspace-storage', // localStorage key
      // Gracefully handle localStorage unavailability
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate workspace state:', error)
        }
      },
    }
  )
)
```

**Alternatives Considered**:
- **Raw localStorage API**: More boilerplate, no automatic serialization, requires manual error handling
- **React Context + useEffect**: More complex, requires custom sync logic, not type-safe
- **TanStack Router search params**: Not persistent across sessions, pollutes URL

**References**:
- Zustand persist middleware: https://docs.pmnd.rs/zustand/integrations/persisting-store-data
- Zustand TypeScript guide: https://docs.pmnd.rs/zustand/guides/typescript

---

### 2. TanStack Router SSR Redirects

**Decision**: Use `redirect()` utility in loader functions for SSR-based redirects

**Rationale**:
- TanStack Router provides built-in `redirect()` utility for server-side redirects
- Type-safe redirect targets with full router context
- Executes before component render (optimal performance)
- Works seamlessly with loaders that run on both server and client
- Supports dynamic redirects based on data (lastVisitedWorkspaceSlug)

**Best Practices**:
```typescript
// app/index.tsx - Root route redirect
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const { lastVisitedWorkspaceSlug } = useWorkspaceStore.getState()

    if (lastVisitedWorkspaceSlug) {
      throw redirect({
        to: '/workspace/$workspaceSlug',
        params: { workspaceSlug: lastVisitedWorkspaceSlug },
      })
    }

    throw redirect({ to: '/admin' })
  },
})
```

**Alternatives Considered**:
- **Client-side `useNavigate()`**: Causes flash of content, not SEO-friendly, executes after render
- **`<Navigate>` component**: Same issues as useNavigate, less declarative
- **Middleware approach**: Overkill for simple redirects, adds unnecessary complexity

**References**:
- TanStack Router redirects: https://tanstack.com/router/latest/docs/framework/react/guide/navigation#redirects
- TanStack Router loaders: https://tanstack.com/router/latest/docs/framework/react/guide/data-loading

---

### 3. Workspace Icon Generation Algorithm

**Decision**: Update existing `getWorkspaceInitials` in `/domains/navigation/lib/` to match spec

**Rationale**:
- Simple, deterministic algorithm
- Produces readable 1-2 letter abbreviations
- Handles edge cases (single word, extra spaces, special characters)
- Fast execution (<1ms)
- Reuse existing implementation (already in navigation domain)

**Implementation** (Update existing `getWorkspaceInitials`):
```typescript
/**
 * Generate workspace initials from workspace name
 *
 * Rules:
 * - Single word: First letter only (e.g., "Acme" → "A")
 * - Two words: First letter of each word (e.g., "Acme Inc" → "AI")
 * - Three+ words: First letter of first 2 words (e.g., "Acme Corporation Inc" → "AC")
 * - Normalize: Uppercase, trim whitespace, handle special chars
 *
 * @param workspaceName - Workspace name (1-100 characters) or null/undefined
 * @returns 1-2 letter uppercase icon string
 */
export function getWorkspaceInitials(
  workspaceName: string | null | undefined
): string {
  if (!workspaceName || workspaceName.trim() === '') {
    return '?'  // Fallback for empty/invalid input
  }

  const words = workspaceName.trim().split(/\s+/).filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  if (words.length === 1) {
    // Single word: first letter only
    return words[0][0].toUpperCase()
  }

  // Two or more words: first letter of first 2 words
  return (words[0][0] + words[1][0]).toUpperCase()
}
```

**Edge Cases**:
- Empty string → "?"
- Null/undefined → "?"
- Single character → Single letter (e.g., "A" → "A")
- Leading/trailing spaces → Trim and process
- Multiple consecutive spaces → Normalize to single space
- Special characters in words → Include in processing (e.g., "@acme" → "@")

**Test Cases**:
```typescript
expect(getWorkspaceInitials('Acme Corp')).toBe('AC')
expect(getWorkspaceInitials('Acme Inc')).toBe('AI')
expect(getWorkspaceInitials('Acme Corporation Inc')).toBe('AC')
expect(getWorkspaceInitials('Acme')).toBe('A')  // Single word = 1 letter
expect(getWorkspaceInitials('  Acme   Corp  ')).toBe('AC')
expect(getWorkspaceInitials('A')).toBe('A')
expect(getWorkspaceInitials('')).toBe('?')
expect(getWorkspaceInitials(null)).toBe('?')
```

**Alternatives Considered**:
- **Always 2 letters**: Less flexible, single-word names look awkward with repeated letters
- **Random color + single letter**: Less informative, harder to distinguish
- **Gravatar-style hash**: Unnecessary complexity, not human-readable
- **User-uploaded images**: Out of scope for MVP

**Location**: `/domains/navigation/lib/getWorkspaceInitials.ts` (already exists, needs update)

---

### 4. Slug Uniqueness Validation Strategy

**Decision**: Two-tier validation - client-side pre-check + server-side authoritative check

**Rationale**:
- Client-side validation provides instant feedback (better UX)
- Server-side validation prevents race conditions (security + data integrity)
- Firestore queries are fast (<100ms for slug lookup)
- Atomic write operations ensure consistency

**Implementation Strategy**:

**Client-side pre-check** (optional, UX enhancement):
```typescript
// hooks/useCheckSlugUniqueness.ts
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

export async function checkSlugUniqueness(
  slug: string,
  currentWorkspaceId?: string
): Promise<boolean> {
  const q = query(
    collection(firestore, 'workspaces'),
    where('slug', '==', slug.toLowerCase()),
    where('status', '==', 'active')
  )

  const snapshot = await getDocs(q)

  // Unique if no matches, or only match is current workspace
  return (
    snapshot.empty ||
    (snapshot.size === 1 && snapshot.docs[0].id === currentWorkspaceId)
  )
}
```

**Server-side authoritative check** (required):
```typescript
// actions/updateWorkspace.ts
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/admin'

export async function updateWorkspace(
  workspaceId: string,
  updates: { name?: string; slug?: string }
) {
  // Validate admin auth
  const user = await requireAdmin()

  // If slug is changing, verify uniqueness atomically
  if (updates.slug) {
    const isUnique = await runTransaction(firestore, async (transaction) => {
      // Check if slug already exists
      const workspacesRef = collection(firestore, 'workspaces')
      const q = query(
        workspacesRef,
        where('slug', '==', updates.slug.toLowerCase()),
        where('status', '==', 'active')
      )
      const snapshot = await getDocs(q)

      // Reject if slug exists and it's not the current workspace
      if (!snapshot.empty && snapshot.docs[0].id !== workspaceId) {
        return false
      }

      // Update workspace
      const workspaceRef = doc(firestore, 'workspaces', workspaceId)
      transaction.update(workspaceRef, {
        ...updates,
        slug: updates.slug.toLowerCase(),
        updatedAt: Date.now(),
      })

      return true
    })

    if (!isUnique) {
      throw new Error('Slug already in use')
    }
  }
}
```

**Alternatives Considered**:
- **Client-side only**: Vulnerable to race conditions, not secure
- **Unique index in Firestore**: Firestore doesn't support unique indexes (not available)
- **Pessimistic locking**: Overkill for this use case, adds complexity

**References**:
- Firestore transactions: https://firebase.google.com/docs/firestore/manage-data/transactions
- Firestore queries: https://firebase.google.com/docs/firestore/query-data/queries

---

### 5. TanStack Router Dynamic Route Params

**Decision**: Use `$workspaceSlug` file-based route parameter with beforeLoad validation

**Rationale**:
- TanStack Router uses file-based routing with `$param` convention
- `beforeLoad` hook runs before component render (optimal for data fetching)
- Type-safe params with `useParams()` hook
- Consistent with existing route structure (`$workspaceSlug.tsx` already exists)

**Implementation**:
```typescript
// app/workspace/$workspaceSlug.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { firestore } from '@/integrations/firebase/client'

export const Route = createFileRoute('/workspace/$workspaceSlug')({
  beforeLoad: async ({ params }) => {
    const { workspaceSlug } = params

    // Resolve workspace by slug
    const q = query(
      collection(firestore, 'workspaces'),
      where('slug', '==', workspaceSlug),
      where('status', '==', 'active')
    )

    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // Workspace not found - show 404
      return { workspace: null }
    }

    const workspace = {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    }

    // Store last visited workspace
    useWorkspaceStore.getState().setLastVisitedWorkspaceSlug(workspaceSlug)

    return { workspace }
  },
  component: WorkspaceLayout,
  notFoundComponent: WorkspaceNotFound,
})
```

**Alternatives Considered**:
- **Query params (`?workspace=slug`)**: Less clean URLs, not SEO-friendly
- **Client-side resolution**: Flash of loading state, not SSR-friendly
- **Numeric IDs in URL**: Less user-friendly, harder to remember/share

**References**:
- TanStack Router file-based routing: https://tanstack.com/router/latest/docs/framework/react/guide/routing
- TanStack Router params: https://tanstack.com/router/latest/docs/framework/react/guide/route-params

---

### 6. Firestore Security Rules for Admin-Only Access

**Decision**: Use custom claims (`admin: true`) for admin authorization

**Rationale**:
- Firebase Auth custom claims provide secure, server-verified authorization
- Claims are embedded in ID tokens (no extra database lookups)
- Rules engine evaluates claims efficiently
- Already implemented in existing authentication system (assumption confirmed)

**Firestore Security Rules**:
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check admin status
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    // Workspaces collection - admin-only access
    match /workspaces/{workspaceId} {
      // Allow admins to read all workspaces
      allow read: if isAdmin();

      // Deny direct writes - force through server functions for validation
      allow write: if false;
    }
  }
}
```

**Server Function Authorization**:
```typescript
// utils/requireAdmin.ts
import { auth } from '@/integrations/firebase/admin'

export async function requireAdmin(idToken: string) {
  const decodedToken = await auth.verifyIdToken(idToken)

  if (!decodedToken.admin) {
    throw new Error('Unauthorized: Admin access required')
  }

  return decodedToken
}
```

**Alternatives Considered**:
- **Role-based database collection**: Extra database lookup, slower, more complex
- **Admin emails list in rules**: Hard to maintain, requires redeployment for changes
- **Everyone can read/write with app-level checks**: Not secure, violates security best practices

**References**:
- Firebase custom claims: https://firebase.google.com/docs/auth/admin/custom-claims
- Firestore security rules: https://firebase.google.com/docs/firestore/security/get-started

---

### 7. Form Validation with shadcn/ui and Zod

**Decision**: Use shadcn/ui Form component with React Hook Form + Zod integration

**Rationale**:
- shadcn/ui Form components already use React Hook Form under the hood
- Seamless Zod schema integration via `@hookform/resolvers`
- Accessible form components (ARIA attributes, keyboard navigation)
- Consistent styling with existing UI components
- Type-safe form values with TypeScript inference

**Implementation**:
```typescript
// components/WorkspaceSettingsForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/ui-kit/components/button'
import { Input } from '@/ui-kit/components/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/ui-kit/components/form'
import { slugSchema } from '../schemas/workspace.schemas'
import { WORKSPACE_NAME } from '../constants/workspace.constants'

const formSchema = z.object({
  name: z
    .string()
    .min(WORKSPACE_NAME.min, 'Name is required')
    .max(WORKSPACE_NAME.max, `Name must be ${WORKSPACE_NAME.max} characters or less`),
  slug: slugSchema,
})

type FormValues = z.infer<typeof formSchema>

export function WorkspaceSettingsForm({ workspace }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: workspace.name,
      slug: workspace.slug,
    },
  })

  const onSubmit = async (values: FormValues) => {
    // Handle submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workspace Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Similar for slug field */}
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
}
```

**Alternatives Considered**:
- **Formik**: More boilerplate, less type-safe, not as well integrated with shadcn/ui
- **Manual form handling**: More code, error-prone, loses accessibility features
- **Native HTML5 validation**: Limited error messaging, poor UX, no async validation

**References**:
- shadcn/ui Form: https://ui.shadcn.com/docs/components/form
- React Hook Form: https://react-hook-form.com
- Zod resolver: https://github.com/react-hook-form/resolvers#zod

---

## Summary of Decisions

| Area | Decision | Key Benefit |
|------|----------|-------------|
| **localStorage Management** | Zustand persist middleware | Automatic sync, type-safe, graceful degradation |
| **SSR Redirects** | TanStack Router `redirect()` | Server-side, no flash, type-safe |
| **Icon Generation** | Update existing `getWorkspaceInitials` (1-2 letters) | Simple, fast, deterministic, reuses existing code |
| **Slug Validation** | Client pre-check + server transaction | Best UX + data integrity |
| **Route Params** | File-based `$workspaceSlug` | Type-safe, SEO-friendly, consistent |
| **Admin Authorization** | Firebase custom claims + rules | Secure, fast, no extra lookups |
| **Form Handling** | shadcn/ui + React Hook Form + Zod | Type-safe, accessible, consistent |

## Next Steps

Proceed to **Phase 1: Design & Contracts** to generate:
1. `data-model.md` - Workspace entity model with update schema
2. `contracts/` - API contracts for workspace operations
3. `quickstart.md` - Developer onboarding guide
4. Update agent context (CLAUDE.md amendments)
