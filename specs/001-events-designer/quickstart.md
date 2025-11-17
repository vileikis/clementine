# Quickstart Guide: Events Designer

**Feature**: Events Designer
**Date**: 2025-11-17
**Audience**: Developers implementing or extending this feature

---

## Overview

The Events Designer feature transforms the event creation workflow from a modal-based, state-driven UI to a URL-based, route-driven architecture. This guide helps developers understand and work with the new structure.

**Key Changes**:
- `/events/:eventId/content` → `/events/:eventId/design`
- Modal-based experience creation → Inline form at `/design/experiences/create`
- Hidden experiences list → Always-visible sidebar
- Section state in React → Section state in URL

---

## Architecture Overview

### Routing Structure

```
/events/[eventId]/design/
├── page.tsx                      # Redirects to /welcome
├── layout.tsx                    # Manages shared state (experiences list)
├── welcome/
│   └── page.tsx                  # Welcome screen editor
├── experiences/
│   ├── create/
│   │   └── page.tsx              # Inline experience creation form
│   └── [experienceId]/
│       ├── page.tsx              # Experience editor
│       └── not-found.tsx         # 404 for invalid experience IDs
└── ending/
    └── page.tsx                  # Ending screen editor
```

**Navigation Flow**:
1. User clicks "Design" tab → `/events/:eventId/design`
2. Page redirects → `/events/:eventId/design/welcome`
3. User clicks "Create Experience" in sidebar → `/events/:eventId/design/experiences/create`
4. User submits form → Redirects to `/events/:eventId/design/experiences/:newId`
5. User clicks existing experience in sidebar → `/events/:eventId/design/experiences/:id`

---

## Key Components

### 1. Design Layout (`design/layout.tsx`)

**Purpose**: Manages shared state and persistent sidebar across all design routes

**Responsibilities**:
- Subscribe to experiences list (Firestore real-time)
- Provide experiences via React Context
- Render persistent sidebar (desktop) or collapsible sheet (mobile)
- Wrap child routes with context

**Example**:
```tsx
"use client";

import { use, useState, useEffect, createContext } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DesignSidebar } from "@/components/organizer/builder/DesignSidebar";
import type { Experience } from "@/lib/types/firestore";

export const ExperiencesContext = createContext<{ experiences: Experience[] }>({
  experiences: [],
});

export default function DesignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Real-time subscription
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(
        collection(db, "events", eventId, "experiences"),
        orderBy("createdAt", "asc")
      ),
      (snapshot) => {
        setExperiences(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Experience[]
        );
      }
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

---

### 2. Create Experience Form (`experiences/create/page.tsx`)

**Purpose**: Inline form for creating new experiences

**Responsibilities**:
- Display form with name and type fields
- Validate input with Zod (client-side UX)
- Call `createExperienceAction` Server Action
- Redirect to experience editor on success

**Example**:
```tsx
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExperienceSchema } from "@/lib/schemas/firestore";
import { createExperienceAction } from "@/app/actions/experiences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function CreateExperiencePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(createExperienceSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      label: "",
      type: undefined,
    },
  });

  const onSubmit = async (data) => {
    const result = await createExperienceAction(eventId, data);

    if (result.success) {
      router.push(`/events/${eventId}/design/experiences/${result.data.id}`);
    } else {
      toast.error(result.error.message || "Failed to create experience");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Create Experience</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name field */}
        <div>
          <Label htmlFor="label">Experience Name</Label>
          <Input
            id="label"
            {...form.register("label")}
            placeholder="e.g., Fun Photo Booth"
            className="min-h-[44px]"
          />
          {form.formState.errors.label && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.label.message}
            </p>
          )}
        </div>

        {/* Type field */}
        <div>
          <Label>Experience Type</Label>
          <RadioGroup
            value={form.watch("type")}
            onValueChange={(value) => form.setValue("type", value)}
          >
            <div className="space-y-2">
              {["photo", "video", "gif", "wheel"].map((type) => (
                <div key={type} className="flex items-center space-x-2 min-h-[44px]">
                  <RadioGroupItem value={type} id={type} />
                  <Label htmlFor={type} className="capitalize cursor-pointer">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
          {form.formState.errors.type && (
            <p className="text-sm text-destructive mt-1">
              {form.formState.errors.type.message}
            </p>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!form.formState.isValid || form.formState.isSubmitting}
          className="min-h-[44px]"
        >
          {form.formState.isSubmitting ? "Creating..." : "Create Experience"}
        </Button>
      </form>
    </div>
  );
}
```

---

### 3. Design Sidebar (`components/organizer/builder/DesignSidebar.tsx`)

**Purpose**: Navigation sidebar with sections and experiences list

**Responsibilities**:
- Display navigation sections (Welcome, Experiences, Ending)
- Display all experiences (always visible, no menu)
- Highlight active section/experience based on URL
- Provide "Create Experience" button

**Example**:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Experience } from "@/lib/types/firestore";

interface DesignSidebarProps {
  experiences: Experience[];
  eventId: string;
}

export function DesignSidebar({ experiences, eventId }: DesignSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname.includes(path);

  return (
    <nav className="w-64 space-y-6">
      {/* Main sections */}
      <div className="space-y-2">
        <Link
          href={`/events/${eventId}/design/welcome`}
          className={isActive("/welcome") ? "active" : ""}
        >
          Welcome
        </Link>
        <Link
          href={`/events/${eventId}/design/ending`}
          className={isActive("/ending") ? "active" : ""}
        >
          Ending
        </Link>
      </div>

      {/* Experiences section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Experiences</h3>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
          >
            <Link href={`/events/${eventId}/design/experiences/create`}>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="space-y-1">
          {experiences.map((exp) => (
            <Link
              key={exp.id}
              href={`/events/${eventId}/design/experiences/${exp.id}`}
              className={isActive(`/experiences/${exp.id}`) ? "active" : ""}
            >
              {exp.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
```

---

## Common Tasks

### Adding a New Design Section

1. **Create route directory**:
   ```bash
   mkdir -p web/src/app/\(event-builder\)/events/\[eventId\]/design/newsection
   ```

2. **Create page component**:
   ```tsx
   // web/src/app/(event-builder)/events/[eventId]/design/newsection/page.tsx
   export default function NewSectionPage({ params }: { params: Promise<{ eventId: string }> }) {
     // ... implementation
   }
   ```

3. **Update sidebar** to include new section link

4. **Update layout** if section needs shared state

---

### Testing the Create Flow

1. **Navigate to create form**:
   ```
   http://localhost:3000/events/evt_123/design/experiences/create
   ```

2. **Test validation**:
   - Leave name empty → Submit should be disabled
   - Enter name only → Submit should be disabled
   - Select type only → Submit should be disabled
   - Enter both → Submit should be enabled

3. **Test creation**:
   - Submit form → Should redirect to `/experiences/:newId`
   - Check sidebar → New experience should appear
   - Check Firestore → Document should exist

---

### Handling Invalid Experience IDs

Create a `not-found.tsx` in the experience route:

```tsx
// web/src/app/(event-builder)/events/[eventId]/design/experiences/[experienceId]/not-found.tsx
import Link from "next/link";

export default function ExperienceNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-semibold">Experience Not Found</h1>
      <p className="text-muted-foreground mt-2">
        The experience you're looking for doesn't exist.
      </p>
      <Link href=".." className="mt-4 text-primary hover:underline">
        Back to Design
      </Link>
    </div>
  );
}
```

In the page component, call `notFound()`:

```tsx
import { notFound } from "next/navigation";

export default async function ExperienceEditorPage({ params }) {
  const { eventId, experienceId } = await params;
  const experience = await getExperience(eventId, experienceId);

  if (!experience) {
    notFound(); // Triggers not-found.tsx
  }

  return <ExperienceEditor experience={experience} />;
}
```

---

## Mobile Considerations

### Responsive Sidebar Pattern

```tsx
<div className="flex flex-col lg:flex-row gap-6">
  {/* Desktop - always visible */}
  <div className="hidden lg:block w-64">
    <DesignSidebar />
  </div>

  {/* Mobile - collapsible sheet */}
  <div className="lg:hidden">
    <Sheet>
      <SheetTrigger asChild>
        <Button className="min-h-[44px]">Menu</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <DesignSidebar />
      </SheetContent>
    </Sheet>
  </div>

  <main>{children}</main>
</div>
```

**Touch Targets**:
- All interactive elements ≥44px height: `className="min-h-[44px]"`
- Adequate spacing between links: `className="space-y-2"`

---

## Debugging Tips

### Route Not Rendering

1. Check file location matches route path exactly
2. Verify `page.tsx` export is `export default`
3. Check for TypeScript errors in route component
4. Inspect Network tab for 404s

### Experiences Not Loading

1. Check Firestore subscription in layout component
2. Verify `eventId` is correct
3. Check browser console for errors
4. Verify Firestore Security Rules allow read access

### Form Validation Not Working

1. Check Zod schema import path
2. Verify `zodResolver` is imported from `@hookform/resolvers/zod`
3. Check `mode: "onChange"` is set in `useForm`
4. Inspect `form.formState.errors` in React DevTools

---

## Performance Optimization

### Avoid Re-renders

**Problem**: Layout re-renders on every route change

**Solution**: Memoize context value

```tsx
const contextValue = useMemo(() => ({ experiences }), [experiences]);

return (
  <ExperiencesContext.Provider value={contextValue}>
    {children}
  </ExperiencesContext.Provider>
);
```

### Firestore Subscription Cleanup

**Always** return unsubscribe function in `useEffect`:

```tsx
useEffect(() => {
  const unsubscribe = onSnapshot(query, callback);
  return () => unsubscribe(); // ← Critical for cleanup
}, [dependencies]);
```

---

## Testing Checklist

- [ ] All routes render correctly (Welcome, Create, Experience Editor, Ending)
- [ ] URL updates when navigating between sections
- [ ] Browser back/forward buttons work
- [ ] Invalid experience IDs show 404 page
- [ ] Base `/design` route redirects to `/design/welcome`
- [ ] Create form validates name and type
- [ ] Successful creation redirects to editor
- [ ] New experience appears in sidebar immediately
- [ ] Mobile sidebar collapses into Sheet
- [ ] All touch targets ≥44px on mobile

---

## References

- [Spec](./spec.md) - Feature requirements
- [Research](./research.md) - Technical decisions
- [Data Model](./data-model.md) - Entity definitions
- [Contracts](./contracts/) - API contracts
- [Plan](./plan.md) - Implementation plan

---

## Support

For questions or issues:
1. Review [research.md](./research.md) for technical decisions
2. Check [contracts/](./contracts/) for API documentation
3. Consult Next.js docs: [App Router](https://nextjs.org/docs/app)
4. Review existing code in `(event-builder)` route group
