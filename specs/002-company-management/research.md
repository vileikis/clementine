# Research Findings: Company Management Feature

**Date**: 2025-11-11
**Feature**: Company Management (Admin Dashboard)

## 1. Firestore Soft Deletion Patterns

**Decision**: Use status field with `"active" | "deleted"` enum + deletedAt timestamp. Filter queries with `.where('status', '==', 'active')`.

**Rationale**:
- **Data Safety**: Soft deletion preserves data for recovery, auditing, and compliance needs. This is critical for production systems where data loss is unacceptable.
- **Guest Link Continuity**: When a company is deleted, we need to track which events are affected without losing historical data. Guest links can be disabled without data loss.
- **Query Performance**: Firestore queries with status filters are efficient with composite indexes. Single field filter `status == 'active'` is fast and supported by default index.
- **Audit Trail**: deletedAt timestamp provides historical context for when companies were disabled, useful for debugging and compliance.

**Alternatives Considered**:
1. **Hard Deletion** (remove documents entirely)
   - Rejected: Irreversible data loss, no audit trail, complicates debugging, breaks referential integrity for events
2. **isDeleted boolean field**
   - Rejected: Less semantically clear than status enum, doesn't allow for future states (e.g., "suspended", "archived")
3. **Move to "deleted" subcollection**
   - Rejected: Requires data migration on delete, complicates queries, higher read costs, breaks FK references

**Implementation Notes**:
```typescript
// Type definition
export type CompanyStatus = "active" | "deleted";

export interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  deletedAt: number | null; // Unix timestamp ms, null if active
  createdAt: number;
  updatedAt: number;
  // Optional metadata (stored but not exposed in MVP UI)
  brandColor?: string;
  contactEmail?: string;
  termsUrl?: string;
  privacyUrl?: string;
}

// Zod schema
const companySchema = z.object({
  name: z.string().min(1).max(100),
  status: z.enum(["active", "deleted"]),
  deletedAt: z.number().nullable(),
  // ...
});

// Query pattern - list only active companies
export async function listActiveCompanies(): Promise<Company[]> {
  const snapshot = await db
    .collection("companies")
    .where("status", "==", "active")
    .orderBy("name", "asc")
    .get();
  return snapshot.docs.map(doc =>
    companySchema.parse({ id: doc.id, ...doc.data() })
  );
}

// Soft delete operation
export async function softDeleteCompany(companyId: string): Promise<void> {
  await db.collection("companies").doc(companyId).update({
    status: "deleted",
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });
}
```

**Index Requirements**:
- Composite index: `status (ASC) + name (ASC)` for filtered, sorted lists
- This index supports both uniqueness checks and list queries
- Firestore will auto-create this index on first query or can be declared in firestore.indexes.json

---

## 2. Company-Event Relationship in Firestore

**Decision**: Store `companyId` (nullable string FK) in Event documents. Do NOT denormalize companyName. Always join via repository layer for display.

**Rationale**:
- **Data Consistency**: Single source of truth for company names. When a company name is edited, no need to update all events - changes propagate automatically via joins.
- **Query Efficiency**: Filtering events by companyId is a single indexed field query, very fast even for 1000+ events.
- **Storage Cost**: Denormalizing companyName to ~100 events = ~100 extra string fields. Not worth the duplication vs consistency benefit.
- **Read Cost**: Admin UI reads are infrequent compared to guest traffic. Extra read for company name lookup is acceptable for better data integrity.

**Alternatives Considered**:
1. **Denormalize companyName in events**
   - Rejected: Requires updating all events when company name changes, risk of stale data, harder to maintain consistency
   - Only benefit: saves 1 read per event display
   - Cost: complexity of propagating name changes, storage bloat, eventual consistency issues
2. **Store full Company object in events**
   - Rejected: Massive data duplication, stale data guaranteed, high storage cost
3. **Separate join collection (companies_events)**
   - Rejected: Overkill for simple one-to-many relationship, increases query complexity and read costs

**Implementation Notes**:
```typescript
// Event type (extend existing)
export interface Event {
  id: string;
  title: string;
  companyId: string | null; // FK to companies/{companyId}
  // ... existing fields
}

// Repository pattern - join company data for display
export async function listEventsWithCompanies(): Promise<(Event & { companyName: string | null })[]> {
  const events = await listEvents();

  // Fetch companies for events that have companyId
  const companyIds = [...new Set(events.filter(e => e.companyId).map(e => e.companyId!))];
  const companies = await Promise.all(
    companyIds.map(id => getCompany(id))
  );
  const companyMap = new Map(companies.map(c => [c.id, c]));

  return events.map(event => ({
    ...event,
    companyName: event.companyId ? companyMap.get(event.companyId)?.name ?? null : null,
  }));
}

// Query pattern - filter events by company
export async function listEventsByCompany(companyId: string): Promise<Event[]> {
  const snapshot = await db
    .collection("events")
    .where("companyId", "==", companyId)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map(doc => eventSchema.parse({ id: doc.id, ...doc.data() }));
}

// Query pattern - filter events with no company
export async function listEventsWithoutCompany(): Promise<Event[]> {
  const snapshot = await db
    .collection("events")
    .where("companyId", "==", null)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map(doc => eventSchema.parse({ id: doc.id, ...doc.data() }));
}
```

**Performance Considerations**:
- **Filtering 1000+ events client-side**: AVOID. Always filter server-side with Firestore queries.
- **Client-side filtering is slow**: O(n) scan through all documents, wastes bandwidth downloading unnecessary data
- **Server-side query is fast**: Firestore indexes make `where('companyId', '==', 'xyz')` O(log n) lookup
- **Cost**: Server-side query reads only matching documents, client-side reads all documents then filters
- **Example**: 1000 events, filter for 10 events in Company A
  - Client-side: 1000 reads + 1000 docs transferred + 1000 iterations = slow, expensive
  - Server-side: 10 reads + 10 docs transferred + indexed lookup = fast, cheap

**Index Requirements**:
- Composite index: `companyId (ASC) + createdAt (DESC)` for filtered, sorted event lists
- Firestore will prompt to create this index on first filtered query

---

## 3. Next.js Tab Navigation Patterns

**Decision**: Use URL-based routing with Next.js App Router `/events` and `/companies` routes + client-side active tab state for highlighting. Do NOT use pure client-side tabs.

**Rationale**:
- **SEO**: Each tab is a distinct URL (`/events`, `/companies`), crawlable by search engines (important for future public-facing admin dashboard)
- **Deep Linking**: Admins can bookmark `/companies?filter=active` or share links to specific tabs with filters
- **Browser History**: Back/forward buttons work intuitively, users can navigate tab history naturally
- **Refresh Behavior**: Refreshing page preserves tab state (URL is source of truth), no lost work
- **Accessibility**: Screen readers announce route changes, better semantic navigation
- **Simplicity**: Next.js App Router handles routing, no custom tab state management needed

**Alternatives Considered**:
1. **Pure client-side tabs (state-based)**
   - Rejected: No deep linking, URL doesn't change, back button doesn't work, not SEO-friendly, harder to share/bookmark
   - Use case: Only for transient UI within a single page (e.g., modal tabs)
2. **Client-side tabs with URL hash (#events, #companies)**
   - Rejected: Hashes don't trigger Next.js route changes, no SSR, no server-side rendering benefits, feels hacky
3. **Single page with `?tab=events` query param**
   - Rejected: Less semantic than separate routes, complicates routing logic, doesn't match mental model of "different pages"

**Implementation Notes**:
```typescript
// App Router structure
app/
  events/
    page.tsx              // /events route
  companies/
    page.tsx              // /companies route
    [companyId]/
      page.tsx            // /companies/{companyId} detail page

// Shared layout with tab navigation
// app/events/layout.tsx or app/companies/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav role="tablist" aria-label="Admin dashboard navigation">
      <Link
        href="/events"
        role="tab"
        aria-selected={pathname.startsWith("/events")}
        className={cn(
          "px-4 py-2 min-h-[44px]", // Touch-friendly target
          pathname.startsWith("/events") ? "border-b-2 border-primary" : "text-muted-foreground"
        )}
      >
        Events
      </Link>
      <Link
        href="/companies"
        role="tab"
        aria-selected={pathname.startsWith("/companies")}
        className={cn(
          "px-4 py-2 min-h-[44px]",
          pathname.startsWith("/companies") ? "border-b-2 border-primary" : "text-muted-foreground"
        )}
      >
        Companies
      </Link>
    </nav>
  );
}
```

**Accessibility Best Practices**:
- Use `<nav>` with `role="tablist"` for semantic navigation
- Each link has `role="tab"` and `aria-selected` state
- Keyboard navigation: Tab key moves between tabs, Enter activates
- Use `aria-label` to describe navigation purpose
- Visible focus indicators with `focus:ring-2 focus:ring-primary` (already standard in project)
- Minimum touch target: 44x44px for mobile (see responsive.md)

**Mobile-Responsive Tab Navigation**:
```typescript
// Mobile: Horizontal scroll tabs (320px - 768px)
<nav className="
  flex overflow-x-auto           // Horizontal scroll on mobile
  md:overflow-visible            // No scroll on tablet+
  gap-2 px-4 -mx-4              // Edge-to-edge scrollable area
  scrollbar-hide                 // Hide scrollbar for clean look
">
  <Link href="/events" className="flex-shrink-0 min-w-[120px] min-h-[44px] ...">
    Events
  </Link>
  <Link href="/companies" className="flex-shrink-0 min-w-[120px] min-h-[44px] ...">
    Companies
  </Link>
</nav>

// Alternative for many tabs: Dropdown on mobile
<div className="md:hidden">
  <Select value={currentTab} onValueChange={navigateTo}>
    <SelectTrigger className="min-h-[44px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="/events">Events</SelectItem>
      <SelectItem value="/companies">Companies</SelectItem>
    </SelectContent>
  </Select>
</div>

<nav className="hidden md:flex gap-2">
  {/* Desktop tabs */}
</nav>
```

**Testing Considerations**:
- Test keyboard navigation: Tab, Shift+Tab, Enter
- Test screen reader: VoiceOver/NVDA should announce tab changes
- Test mobile: Horizontal scroll works, touch targets are 44x44px
- Test browser history: Back button navigates between tabs correctly

---

## 4. Company Name Uniqueness Enforcement

**Decision**: Use transaction-based uniqueness check with status-aware query. Check for duplicate name among active companies only (ignore deleted).

**Rationale**:
- **Firestore Limitation**: No native unique constraints like SQL databases. Must implement in application layer.
- **Transactions Prevent Race Conditions**: Firestore transactions provide serializable isolation - if two admins create "Nike" simultaneously, one will succeed and one will retry/fail.
- **Status-Aware Uniqueness**: Deleted companies don't block reusing their name. "Nike" deleted yesterday allows creating new "Nike" today.
- **Single Point of Enforcement**: All creates/updates go through Server Actions (Admin SDK), so validation is consistent and secure.

**Alternatives Considered**:
1. **Pre-check then write (non-transactional)**
   - Rejected: Race condition window between check and write. Two simultaneous requests can both pass check and create duplicates.
2. **Unique compound key (status + name)**
   - Rejected: Firestore doesn't support unique constraints. Would require external service (Cloud Function with SQL DB or Redis).
3. **Document ID = normalized name**
   - Rejected: Forces deletes to be hard deletes (can't have two docs with same ID), prevents metadata like updatedAt on company itself.
4. **Separate uniqueness collection (name → companyId map)**
   - Rejected: Over-engineered, requires two-collection transactions, higher read/write costs, complex cleanup on delete.

**Implementation Notes**:
```typescript
// Uniqueness check in transaction
export async function createCompany(data: { name: string }): Promise<string> {
  const companyRef = db.collection("companies").doc();

  await db.runTransaction(async (txn) => {
    // Check for existing active company with same name (case-insensitive)
    const existingSnapshot = await txn.get(
      db.collection("companies")
        .where("status", "==", "active")
        .where("name", "==", data.name.trim())
        .limit(1)
    );

    if (!existingSnapshot.empty) {
      throw new Error("A company with this name already exists");
    }

    // Write new company
    const company: Company = {
      id: companyRef.id,
      name: data.name.trim(),
      status: "active",
      deletedAt: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    txn.set(companyRef, company);
  });

  return companyRef.id;
}

// Update company name with uniqueness check (exclude self)
export async function updateCompanyName(companyId: string, name: string): Promise<void> {
  await db.runTransaction(async (txn) => {
    const companyRef = db.collection("companies").doc(companyId);
    const companyDoc = await txn.get(companyRef);

    if (!companyDoc.exists) {
      throw new Error("Company not found");
    }

    // Check for duplicate name (exclude self)
    const existingSnapshot = await txn.get(
      db.collection("companies")
        .where("status", "==", "active")
        .where("name", "==", name.trim())
        .limit(1)
    );

    // If found, ensure it's not the company we're updating
    if (!existingSnapshot.empty && existingSnapshot.docs[0].id !== companyId) {
      throw new Error("A company with this name already exists");
    }

    txn.update(companyRef, {
      name: name.trim(),
      updatedAt: Date.now(),
    });
  });
}
```

**Handling Race Conditions**:
- **Firestore Transactions**: Automatic retry on conflict. If two requests modify same data, second transaction retries with updated data.
- **Retry Limit**: Firestore retries up to 5 times, then throws error
- **User Feedback**: Server Action catches transaction error, returns user-friendly message
```typescript
// Server Action error handling
"use server";

export async function createCompanyAction(input: unknown) {
  try {
    const validated = createCompanySchema.parse(input);
    const companyId = await createCompany(validated);
    revalidatePath("/companies");
    return { success: true, companyId };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create company" };
  }
}
```

**Case Sensitivity**:
- **Decision**: Case-insensitive uniqueness ("Nike" = "nike" = "NIKE")
- **Implementation**: Normalize to lowercase before comparison (or use Firestore's native string comparison which is case-sensitive, so store normalized lowercase version)
```typescript
// Option A: Store normalized lowercase separately
export interface Company {
  name: string;          // Display name: "Nike"
  nameLower: string;     // Query field: "nike"
  // ...
}

// Query: .where('nameLower', '==', name.toLowerCase())

// Option B: Store only lowercase (simpler)
export interface Company {
  name: string;          // Lowercase: "nike"
  nameDisplay: string;   // Display: "Nike"
  // ...
}
```

**Chosen**: Option B (store lowercase `name` for queries, `nameDisplay` for UI). Simpler, no duplicate data, query field is the natural primary field.

**Index Requirements**:
- Composite index: `status (ASC) + name (ASC)` (same index as list queries)
- This supports both uniqueness checks and sorted company lists

---

## 5. Guest Link Validation on Soft Delete

**Decision**: Check company status on guest link access via event → company join. Use in-memory caching for company status (short TTL: 60s). Return custom error page when company is deleted.

**Rationale**:
- **Real-time Validation**: Soft deleted companies disable guest links immediately (SC-008: within 1 second)
- **Minimize Reads**: Cache company status in-memory to avoid repeated Firestore reads for same company
- **User Experience**: Custom error page is clearer than 404 ("This event is no longer available" vs "Not Found")
- **Referential Integrity**: Events remain in database with companyId, but guest access is blocked via status check

**Alternatives Considered**:
1. **Denormalize company.status into events**
   - Rejected: Requires updating all events when company is deleted, risk of stale data, breaks single source of truth
   - Benefit: Saves 1 read per guest link access
   - Cost: Complexity of propagating status changes, eventual consistency issues, storage bloat
2. **Background job to disable events when company deleted**
   - Rejected: Eventual consistency (SC-008 requires 1 second, background jobs may take longer), requires job infrastructure, complex state management
3. **404 error instead of custom error page**
   - Rejected: Poor UX, doesn't explain why link is disabled, generic error doesn't help user understand issue
4. **Allow guest access to deleted company events**
   - Rejected: Violates FR-021, security/compliance risk, doesn't respect company deletion intent

**Implementation Notes**:
```typescript
// Guest link validation in /join/[eventId]/page.tsx
export default async function JoinEventPage({ params }: { params: { eventId: string } }) {
  const event = await getEvent(params.eventId);

  if (!event) {
    return <NotFoundPage message="Event not found" />;
  }

  // Check company status if event has company
  if (event.companyId) {
    const company = await getCompany(event.companyId);

    if (!company || company.status === "deleted") {
      return (
        <ErrorPage
          title="Event Unavailable"
          message="This event is no longer available. Please contact the event organizer for more information."
        />
      );
    }
  }

  // Proceed with normal guest flow
  return <GuestFlowComponent event={event} />;
}

// Cached company status lookup (in-memory cache with TTL)
const companyStatusCache = new Map<string, { status: CompanyStatus; expires: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

async function getCompanyStatus(companyId: string): Promise<CompanyStatus | null> {
  const now = Date.now();
  const cached = companyStatusCache.get(companyId);

  if (cached && cached.expires > now) {
    return cached.status;
  }

  const company = await getCompany(companyId);
  if (!company) {
    return null;
  }

  companyStatusCache.set(companyId, {
    status: company.status,
    expires: now + CACHE_TTL_MS,
  });

  return company.status;
}

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [companyId, cached] of companyStatusCache.entries()) {
    if (cached.expires <= now) {
      companyStatusCache.delete(companyId);
    }
  }
}, CACHE_TTL_MS);
```

**Error UX - Custom Error Page**:
```typescript
// components/ErrorPage.tsx
export function ErrorPage({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{title}</h1>
        <p className="text-base md:text-lg text-muted-foreground mb-6">{message}</p>
        <Button asChild>
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
```

**Performance Considerations**:
- **No Caching**: Every guest link access = 2 Firestore reads (event + company)
  - Example: 1000 guests/minute = 2000 reads/minute = $0.36/day ($10.80/month)
- **With 60s Cache**: Assumes ~10 guests/minute per event (distributed across many events)
  - Cache hit rate: ~90% (same company checked multiple times within 60s)
  - Reads: 200/minute = $0.036/day ($1.08/month)
  - 90% cost reduction
- **Cache TTL Trade-off**:
  - Shorter TTL (30s): More reads, faster status propagation
  - Longer TTL (5min): Fewer reads, slower status propagation
  - Chosen 60s: Balances cost and SC-008 requirement (within 1 second with cache invalidation on delete)

**Cache Invalidation on Delete**:
```typescript
// Repository: softDeleteCompany
export async function softDeleteCompany(companyId: string): Promise<void> {
  await db.collection("companies").doc(companyId).update({
    status: "deleted",
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Invalidate cache immediately
  companyStatusCache.delete(companyId);

  // Optional: Broadcast cache invalidation to all server instances (if multi-instance deployment)
  // await pubsub.publish("company-status-changed", { companyId });
}
```

**Alternative Caching Strategies**:
- **Next.js unstable_cache**: Server-side cache with revalidation tags
- **Redis**: Centralized cache for multi-instance deployments (overkill for MVP)
- **Client-side cache**: Not applicable (guest links are server-rendered for SEO)

**Chosen**: In-memory Map with TTL + manual invalidation on delete. Simple, no external dependencies, sufficient for MVP scale.

---

## Summary

This research establishes the technical foundation for Company Management feature:

1. **Soft Deletion**: Status field + deletedAt timestamp, filtered queries for active-only
2. **Relationships**: Normalized FK references, server-side joins, no denormalization
3. **Navigation**: URL-based routing with Next.js App Router, accessible tab components
4. **Uniqueness**: Transaction-based checks, status-aware, lowercase normalization
5. **Link Validation**: Event → company join with in-memory caching, custom error UX

All decisions align with existing project patterns (Server Actions, repository layer, Zod validation, mobile-first UI) and follow standards from `standards/` directory.

**Next Steps**: Proceed to Phase 1 (Design Artifacts) - create data-model.md, contracts/, and quickstart.md based on these research findings.
