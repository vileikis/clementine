# Quickstart: Events Builder Redesign Implementation

**Date**: 2025-11-13
**Branch**: `001-events-builder-redesign`

## Overview

This quickstart guide provides step-by-step instructions for implementing the events builder redesign. The implementation is split into logical phases, focusing first on UI structure (without business logic) to validate the layout, then adding functionality in subsequent iterations.

## Prerequisites

- [ ] Read `plan.md` for full context
- [ ] Read `research.md` for architectural decisions
- [ ] Read `data-model-plan.md` for entity definitions
- [ ] Read `contracts/server-actions.md` for API contracts
- [ ] Ensure dev server is running (`pnpm dev` from root)

## Implementation Phases

### Phase 1: Data Model & Types (Foundation)

**Goal**: Define TypeScript interfaces and Zod schemas for all new entities.

**Files to create/modify**:
- `web/src/lib/types/firestore.ts` (extend)
- `web/src/lib/schemas/firestore.ts` (extend)

**Steps**:

1. **Add new types to `lib/types/firestore.ts`**:
   ```typescript
   // Experience types
   export type ExperienceType = "photo" | "video" | "gif" | "wheel";

   export interface Experience {
     id: string;
     eventId: string;
     label: string;
     type: ExperienceType;
     enabled: boolean;
     // ... (see data-model-plan.md for full definition)
   }

   // ExperienceItem types
   export type ExperienceItemKind = "wheel_sector" | "choice" | "reward" | "generic";

   export interface ExperienceItem {
     id: string;
     eventId: string;
     experienceId: string;
     kind: ExperienceItemKind;
     // ... (see data-model-plan.md)
   }

   // SurveyStep types
   export type SurveyStepType = "short_text" | "long_text" | "multiple_choice" | "opinion_scale" | "email" | "statement";

   export interface SurveyStep {
     id: string;
     eventId: string;
     type: SurveyStepType;
     // ... (see data-model-plan.md)
   }
   ```

2. **Extend Event interface** with new fields:
   ```typescript
   export interface Event {
     // ... existing fields ...

     // NEW: Welcome screen config
     welcomeTitle?: string;
     welcomeDescription?: string;
     welcomeCtaLabel?: string;
     welcomeBackgroundImagePath?: string;
     welcomeBackgroundColorHex?: string;

     // NEW: Ending screen config
     endHeadline?: string;
     endBody?: string;
     endCtaLabel?: string;
     endCtaUrl?: string;

     // NEW: Share config
     shareAllowDownload: boolean;
     shareAllowSystemShare: boolean;
     shareAllowEmail: boolean;
     shareSocials: Array<"instagram" | "tiktok" | "facebook" | "x" | "snapchat" | "whatsapp" | "custom">;

     // NEW: Survey config
     surveyEnabled: boolean;
     surveyRequired: boolean;
     surveyStepsCount: number;
     surveyStepsOrder: string[];
     surveyVersion: number;

     // NEW: Counters
     experiencesCount: number;
     sessionsCount: number;
     readyCount: number;
     sharesCount: number;
   }
   ```

3. **Add Zod schemas to `lib/schemas/firestore.ts`**:
   ```typescript
   export const experienceTypeSchema = z.enum(["photo", "video", "gif", "wheel"]);
   export const experienceSchema = z.object({
     id: z.string(),
     eventId: z.string(),
     label: z.string().min(1).max(50),
     type: experienceTypeSchema,
     enabled: z.boolean(),
     // ... (see data-model-plan.md for full schema)
   });

   // Add schemas for ExperienceItem, SurveyStep, etc.
   ```

4. **Validation**:
   ```bash
   pnpm type-check
   ```

---

### Phase 2: Event Layout & Tab Navigation

**Goal**: Create the new event layout with tab navigation (Content, Distribute, Results) and breadcrumb.

**Files to create/modify**:
- `web/src/app/(admin)/events/[eventId]/layout.tsx` (modify)
- `web/src/components/organizer/EventTabs.tsx` (create)
- `web/src/components/organizer/EventBreadcrumb.tsx` (create)

**Steps**:

1. **Create `EventTabs.tsx` component**:
   ```typescript
   "use client";

   import Link from "next/link";
   import { usePathname } from "next/navigation";

   export function EventTabs({ eventId }: { eventId: string }) {
     const pathname = usePathname();

     const tabs = [
       { label: "Content", href: `/events/${eventId}/content` },
       { label: "Distribute", href: `/events/${eventId}/distribute` },
       { label: "Results", href: `/events/${eventId}/results` },
     ];

     return (
       <div className="flex gap-4">
         {tabs.map((tab) => (
           <Link
             key={tab.href}
             href={tab.href}
             className={/* active/inactive styles */}
           >
             {tab.label}
           </Link>
         ))}
       </div>
     );
   }
   ```

2. **Create `EventBreadcrumb.tsx` component**:
   ```typescript
   import Link from "next/link";
   import { EditableEventName } from "./EditableEventName";

   export function EventBreadcrumb({ event }: { event: Event }) {
     return (
       <div className="flex items-center gap-2">
         <Link href="/events">Events</Link>
         <span>/</span>
         <EditableEventName event={event} />
       </div>
     );
   }
   ```

3. **Update `layout.tsx`** to include breadcrumb, tabs, and action buttons:
   ```typescript
   export default async function EventLayout({ children, params }) {
     const { eventId } = await params;
     const event = await getEventById(eventId);

     return (
       <div>
         <header className="flex items-center justify-between p-4">
           <EventBreadcrumb event={event} />
           <div className="flex items-center gap-4">
             <button>Copy link</button>
             <EventStatusSwitcher event={event} />
           </div>
         </header>
         <EventTabs eventId={eventId} />
         <main>{children}</main>
       </div>
     );
   }
   ```

4. **Validation**:
   ```bash
   pnpm dev
   # Navigate to /events/{existingEventId}/content and verify layout renders
   ```

---

### Phase 3: Content Tab (Builder UI Structure)

**Goal**: Implement the Content tab with sidebar navigation and main content area (static, no business logic).

**Files to create**:
- `web/src/app/(admin)/events/[eventId]/content/page.tsx`
- `web/src/components/organizer/builder/BuilderSidebar.tsx`
- `web/src/components/organizer/builder/BuilderContent.tsx`

**Steps**:

1. **Create `content/page.tsx`**:
   ```typescript
   import { BuilderSidebar } from "@/components/organizer/builder/BuilderSidebar";
   import { BuilderContent } from "@/components/organizer/builder/BuilderContent";

   export default async function ContentPage({ params }) {
     const { eventId } = await params;
     const event = await getEventById(eventId);

     return (
       <div className="flex h-screen">
         <BuilderSidebar event={event} />
         <BuilderContent event={event} />
       </div>
     );
   }
   ```

2. **Create `BuilderSidebar.tsx`** (static structure):
   ```typescript
   "use client";

   export function BuilderSidebar({ event }: { event: Event }) {
     return (
       <aside className="w-64 border-r p-4">
         <nav>
           <button>Welcome</button>

           <section>
             <h3>Experiences <button>+</button></h3>
             <ul>
               <li>Experience 1</li>
               <li>Experience 2</li>
             </ul>
           </section>

           <section>
             <h3>Survey <button>+</button></h3>
             <div>
               <label>Enable survey</label>
               <label>Required</label>
             </div>
             <ul>
               <li>Step 1</li>
               <li>Step 2</li>
             </ul>
           </section>

           <button>Ending</button>
         </nav>
       </aside>
     );
   }
   ```

3. **Create `BuilderContent.tsx`** (placeholder):
   ```typescript
   export function BuilderContent({ event }: { event: Event }) {
     return (
       <main className="flex-1 p-8">
         <p>Select an item from the sidebar to edit</p>
       </main>
     );
   }
   ```

4. **Validation**:
   ```bash
   pnpm dev
   # Verify sidebar renders with placeholder content
   ```

---

### Phase 4: Welcome Editor (First Editor Section)

**Goal**: Implement Welcome editor with form controls and static preview.

**Files to create**:
- `web/src/components/organizer/builder/WelcomeEditor.tsx`
- `web/src/components/organizer/builder/PreviewPanel.tsx`

**Steps**:

1. **Create `WelcomeEditor.tsx`**:
   ```typescript
   "use client";

   import { Input } from "@/components/ui/input";
   import { Label } from "@/components/ui/label";
   import { PreviewPanel } from "./PreviewPanel";

   export function WelcomeEditor({ event }: { event: Event }) {
     return (
       <div className="grid grid-cols-2 gap-8">
         <div>
           <h2>Welcome Screen</h2>
           <form>
             <Label>Title</Label>
             <Input placeholder="Welcome to the event!" />

             <Label>Description</Label>
             <Input placeholder="Take a photo and share it!" />

             <Label>CTA Label</Label>
             <Input placeholder="Get Started" />

             <Label>Background Color</Label>
             <Input type="color" />

             <Label>Background Image</Label>
             <button>Upload image</button>
           </form>
         </div>

         <PreviewPanel>
           <div style={{ backgroundColor: "#FF5733" }}>
             <h1>Welcome to the event!</h1>
             <p>Take a photo and share it!</p>
             <button>Get Started</button>
           </div>
         </PreviewPanel>
       </div>
     );
   }
   ```

2. **Create `PreviewPanel.tsx`** (reusable preview container):
   ```typescript
   export function PreviewPanel({ children }: { children: React.ReactNode }) {
     return (
       <div className="rounded-lg border p-4">
         <h3 className="mb-4 text-sm font-medium">Preview</h3>
         <div className="aspect-[9/16] overflow-hidden rounded-lg bg-gray-100">
           {children}
         </div>
       </div>
     );
   }
   ```

3. **Validation**:
   ```bash
   pnpm dev
   # Click "Welcome" in sidebar, verify form and preview render
   ```

---

### Phase 5: Results Tab (Placeholder)

**Goal**: Implement Results tab with placeholder data.

**Files to create**:
- `web/src/app/(admin)/events/[eventId]/results/page.tsx`

**Steps**:

1. **Create `results/page.tsx`**:
   ```typescript
   export default async function ResultsPage({ params }) {
     const { eventId } = await params;

     return (
       <div className="p-8">
         <h1>Results</h1>

         <div className="grid grid-cols-4 gap-4">
           <div>
             <p className="text-4xl font-bold">0</p>
             <p className="text-sm text-gray-500">Sessions</p>
           </div>
           <div>
             <p className="text-4xl font-bold">0</p>
             <p className="text-sm text-gray-500">Shares</p>
           </div>
           <div>
             <p className="text-4xl font-bold">0</p>
             <p className="text-sm text-gray-500">Downloads</p>
           </div>
           <div>
             <p className="text-4xl font-bold">0</p>
             <p className="text-sm text-gray-500">Reach</p>
           </div>
         </div>

         <div className="mt-8">
           <p className="text-gray-500">WIP - Coming soon</p>
         </div>
       </div>
     );
   }
   ```

2. **Validation**:
   ```bash
   pnpm dev
   # Click "Results" tab, verify placeholder renders
   ```

---

### Phase 6: Server Actions (Stub Implementation)

**Goal**: Create stub Server Actions for builder mutations (to be fully implemented in next phase).

**Files to create**:
- `web/src/lib/actions/events.ts` (extend)
- `web/src/lib/actions/experiences.ts` (create)
- `web/src/lib/actions/survey.ts` (create)

**Steps**:

1. **Create stub actions in `lib/actions/events.ts`**:
   ```typescript
   "use server";

   export async function updateEventWelcome(eventId: string, data: unknown) {
     // TODO: Implement validation and Firebase update
     console.log("updateEventWelcome", eventId, data);
     return { success: true, data: undefined };
   }

   export async function updateEventEnding(eventId: string, data: unknown) {
     // TODO: Implement
     return { success: true, data: undefined };
   }

   export async function updateEventSurveyConfig(eventId: string, data: unknown) {
     // TODO: Implement
     return { success: true, data: undefined };
   }
   ```

2. **Create stub actions in `lib/actions/experiences.ts`**:
   ```typescript
   "use server";

   export async function createExperience(eventId: string, data: unknown) {
     // TODO: Implement
     return { success: true, data: { id: "stub-id" } };
   }

   export async function updateExperience(eventId: string, experienceId: string, data: unknown) {
     // TODO: Implement
     return { success: true, data: undefined };
   }

   export async function deleteExperience(eventId: string, experienceId: string) {
     // TODO: Implement
     return { success: true, data: undefined };
   }
   ```

3. **Create stub actions in `lib/actions/survey.ts`**:
   ```typescript
   "use server";

   export async function createSurveyStep(eventId: string, data: unknown) {
     // TODO: Implement
     return { success: true, data: { id: "stub-id" } };
   }

   export async function updateSurveyStep(eventId: string, stepId: string, data: unknown) {
     // TODO: Implement
     return { success: true, data: undefined };
   }

   export async function deleteSurveyStep(eventId: string, stepId: string) {
     // TODO: Implement
     return { success: true, data: undefined };
   }
   ```

4. **Validation**:
   ```bash
   pnpm type-check
   ```

---

## Validation Loop (Final Step)

Before marking implementation complete, run the full validation loop:

```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Tests (if any written)
pnpm test

# Dev server verification
pnpm dev
# Manually verify:
# 1. Navigate to /events/{existingEventId}/content
# 2. Verify sidebar renders with Welcome, Experiences, Survey, Ending sections
# 3. Click "Welcome" and verify form + preview render
# 4. Navigate to Results tab and verify placeholder data
```

## Next Phase: Adding Business Logic

Once the UI structure is validated, the next implementation phase will:
1. Implement full Server Actions with Zod validation and Firebase writes
2. Connect forms to Server Actions
3. Implement experience type dialog and experience editor
4. Implement survey step dialog and survey step editor
5. Implement ending editor
6. Add real-time data fetching for experiences and survey steps

This is covered by the `/speckit.tasks` command output (tasks.md), not this quickstart.

## Common Issues & Troubleshooting

### Issue: "Event not found" when navigating to /events/{id}/content

**Solution**: Ensure you're using an existing eventId from your Firestore database. Create a test event first if needed.

### Issue: Type errors on new Event fields

**Solution**: Ensure you've extended the Event interface in `lib/types/firestore.ts` with all new fields (welcomeTitle, endHeadline, surveyEnabled, etc.).

### Issue: Sidebar not rendering

**Solution**: Check that `BuilderSidebar` is marked as `"use client"` since it uses client-side state for navigation.

## Summary

This quickstart covers the foundational UI structure for the events builder redesign. The implementation focuses on:
- Data model (types + schemas)
- Layout structure (tabs, breadcrumb, sidebar)
- Static UI components (forms, previews)
- Stub Server Actions (placeholders for future logic)

The next phase (tasks.md) will add full business logic, data fetching, and interactivity.
