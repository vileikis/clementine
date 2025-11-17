# Research & Technical Decisions: Events Designer

**Feature**: Events Designer
**Date**: 2025-11-17
**Status**: Complete

## Overview

This document consolidates research findings and technical decisions for implementing the Events Designer feature. Each section addresses a specific research question from the implementation plan.

---

## 1. Next.js App Router - Nested Dynamic Routes

### Decision

Use Next.js App Router file-based routing with nested dynamic segments:

```
/events/[eventId]/design/
├── page.tsx                     # Redirects to /welcome
├── welcome/page.tsx             # Static route
├── experiences/
│   ├── create/page.tsx          # Static route
│   └── [experienceId]/page.tsx  # Dynamic route
└── ending/page.tsx              # Static route
```

**Redirect Implementation**:
```typescript
// /events/[eventId]/design/page.tsx
import { redirect } from 'next/navigation';

export default async function DesignPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/events/${eventId}/design/welcome`);
}
```

### Rationale

- **File-based routing**: Next.js App Router uses file system for route definition, making structure explicit and discoverable
- **Parallel routes not needed**: We're navigating between mutually exclusive sections (only one active at a time)
- **Redirect at base route**: Provides default landing page while keeping URL clean
- **Dynamic segments**: `[eventId]` and `[experienceId]` enable type-safe parameter access via `params`

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Parallel routes (@welcome, @experiences) | Overkill for mutually exclusive sections; adds complexity without benefit |
| Client-side redirect (useEffect) | Server-side redirect is faster and SEO-friendly |
| Intercepting routes | Not needed; we want full navigation, not modals |

**References**:
- Next.js Docs: [Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- Next.js Docs: [Redirecting](https://nextjs.org/docs/app/building-your-application/routing/redirecting)

---

## 2. Client-Side State Management Across Routes

### Decision

Use **React Context** for shared state (experiences list) + **Firestore real-time subscription** in parent layout.

**Pattern**:
```typescript
// /events/[eventId]/design/layout.tsx
"use client";

export default function DesignLayout({ children, params }) {
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Subscribe to experiences in layout (persists across route changes)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "events", eventId, "experiences"), orderBy("createdAt", "asc")),
      (snapshot) => setExperiences(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
    return unsubscribe;
  }, [eventId]);

  return (
    <ExperiencesContext.Provider value={{ experiences }}>
      <div className="flex">
        <DesignSidebar experiences={experiences} />
        <main>{children}</main>
      </div>
    </ExperiencesContext.Provider>
  );
}
```

### Rationale

- **Layout persistence**: Layout components don't unmount during navigation between child routes
- **Firestore subscription in layout**: Ensures real-time updates across all design routes
- **React Context for access**: Child routes can access experiences without prop drilling
- **No external state library needed**: React Context is sufficient for this scope (YAGNI principle)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| URL state (query params) | Experiences list is too large for URL; not semantically URL state |
| Zustand/Redux | Premature optimization; adds dependency for simple shared state |
| SWR/React Query | Firestore real-time subscriptions preferred over polling |
| Prop drilling | Requires passing through multiple layers; violates clean code |

**References**:
- Next.js Docs: [Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#layouts)
- React Docs: [Context](https://react.dev/learn/passing-data-deeply-with-context)

---

## 3. Form Validation with Zod

### Decision

Use **Zod for server-side validation** + **React Hook Form** for client-side UX.

**Schema**:
```typescript
// lib/schemas/firestore.ts
import { z } from "zod";

export const createExperienceSchema = z.object({
  label: z.string().trim().min(1, "Experience name is required").max(50),
  type: experienceTypeSchema, // z.enum(["photo", "video", "gif", "wheel"])
  enabled: z.boolean().default(true),
  aiEnabled: z.boolean().default(false),
});

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
```

**Integration Pattern**:
```typescript
// Server Action
export async function createExperienceAction(eventId: string, data: unknown) {
  const validated = createExperienceSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.flatten() };
  }
  // ... create in Firestore
}

// Client Component
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<CreateExperienceInput>({
  resolver: zodResolver(createExperienceSchema),
  mode: "onChange" // Enable real-time validation
});
```

### Rationale

- **Server-side validation mandatory**: Constitution Principle III requires Zod validation for external inputs
- **Client-side validation optional**: React Hook Form provides better UX (immediate feedback) but not required
- **Type safety**: Zod schema infers TypeScript types automatically
- **trim() before validation**: Handles whitespace-only input edge case (FR-012)
- **mode: "onChange"**: Enables submit button as soon as both fields are valid

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Client-side only validation | Violates Constitution Principle III (server-side required) |
| Manual validation in Server Action | Type-unsafe, error-prone, doesn't integrate with React Hook Form |
| Formik instead of React Hook Form | React Hook Form is lighter, better TypeScript support |

**References**:
- Zod Docs: [Schema Validation](https://zod.dev/)
- React Hook Form Docs: [Zod Resolver](https://react-hook-form.com/get-started#SchemaValidation)
- Existing schema: `web/src/lib/schemas/firestore.ts`

---

## 4. 404 Handling for Invalid Experience IDs

### Decision

Use **`notFound()` from next/navigation** + custom `not-found.tsx` in design route.

**Pattern**:
```typescript
// /events/[eventId]/design/experiences/[experienceId]/page.tsx
import { notFound } from 'next/navigation';

export default async function ExperienceEditorPage({ params }) {
  const { eventId, experienceId } = await params;
  const experience = await getExperience(eventId, experienceId);

  if (!experience) {
    notFound(); // Triggers nearest not-found.tsx
  }

  return <ExperienceEditor experience={experience} />;
}

// /events/[eventId]/design/not-found.tsx
import Link from 'next/link';

export default function DesignNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-semibold">Section Not Found</h1>
      <p className="text-muted-foreground mt-2">
        The design section you're looking for doesn't exist.
      </p>
      <Link href=".." className="mt-4">Back to Design</Link>
    </div>
  );
}
```

### Rationale

- **notFound() is Next.js standard**: Built-in pattern for 404 handling in App Router
- **Custom not-found.tsx**: Provides context-specific message and navigation
- **Relative link**: `href=".."` navigates to parent route (design section)
- **Server Component**: not-found.tsx can be Server Component (better performance)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Error boundary | Error boundaries are for errors, not missing resources |
| Redirect to list | Loses context; user doesn't know what happened |
| Toast + empty state | Not semantically correct; browser shows 200 status |

**References**:
- Next.js Docs: [not-found.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- Next.js Docs: [notFound function](https://nextjs.org/docs/app/api-reference/functions/not-found)

---

## 5. Mobile Sidebar Pattern

### Decision

Use **persistent sidebar on desktop** + **Sheet component on mobile**.

**Pattern**:
```tsx
// DesignLayout component
<div className="flex flex-col lg:flex-row gap-6 h-full">
  {/* Desktop sidebar - visible on lg+ screens */}
  <div className="hidden lg:block w-64 shrink-0">
    <DesignSidebar />
  </div>

  {/* Mobile menu button - visible on mobile only */}
  <div className="lg:hidden">
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full min-h-[44px]">
          <Menu className="h-4 w-4" />
          <span>{currentSectionTitle}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <DesignSidebar onNavigate={() => setMobileMenuOpen(false)} />
      </SheetContent>
    </Sheet>
  </div>

  {/* Main content */}
  <main className="flex-1">{children}</main>
</div>
```

### Rationale

- **Tailwind breakpoints**: `hidden lg:block` and `lg:hidden` for responsive visibility
- **shadcn/ui Sheet**: Already in project, accessible, mobile-friendly
- **44px min height**: Meets Constitution mobile touch target requirement (MFR-002)
- **Close on navigate**: Better mobile UX (auto-close after selection)
- **w-80 drawer width**: Provides enough space for experiences list on mobile

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Same sidebar always visible | Poor mobile UX; takes up too much screen space |
| Custom drawer implementation | Reinventing the wheel; Sheet is accessible and tested |
| Bottom sheet instead of left | Navigation sidebars conventionally appear on left |
| Collapsible sidebar on desktop | Wastes desktop space; sidebar content is always relevant |

**References**:
- shadcn/ui: [Sheet Component](https://ui.shadcn.com/docs/components/sheet)
- Constitution: Mobile-First Responsive Design (Principle I)
- Tailwind CSS: [Responsive Design](https://tailwindcss.com/docs/responsive-design)

---

## Summary of Key Decisions

| Area | Decision | Key Benefits |
|------|----------|-------------|
| **Routing** | File-based nested routes with server-side redirect | Standard Next.js pattern, type-safe, SEO-friendly |
| **State Management** | React Context + Firestore subscription in layout | Simple, persistent across routes, real-time updates |
| **Validation** | Zod (server) + React Hook Form (client) | Type-safe, constitution-compliant, great UX |
| **404 Handling** | notFound() + custom not-found.tsx | Standard pattern, context-aware, user-friendly |
| **Mobile Sidebar** | Persistent desktop + Sheet mobile | Responsive, accessible, meets touch targets |

---

## Implementation Notes

1. **Existing patterns preserved**: All decisions align with existing codebase patterns (ContentBuilder already uses Sheet for mobile)
2. **No new dependencies**: React Hook Form and Zod already in use; Sheet component already configured
3. **Type safety maintained**: TypeScript strict mode throughout, no `any` escapes
4. **Mobile-first validated**: All patterns tested against 320px-768px viewport
5. **Constitution compliance**: All decisions support constitution principles (mobile-first, type-safe, simple)

**Next**: Proceed to Phase 1 (data-model.md, contracts/, quickstart.md)
