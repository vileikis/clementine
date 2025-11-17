# Contract: Get Experiences

**Pattern**: Firestore Real-time Subscription (Client SDK)
**Location**: Design layout component (`/events/[eventId]/design/layout.tsx`)
**Type**: Client-side Firestore query

---

## Request

### Pattern

```typescript
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const unsubscribe = onSnapshot(
  query(
    collection(db, "events", eventId, "experiences"),
    orderBy("createdAt", "asc")
  ),
  (snapshot) => {
    const experiences = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Experience[];

    setExperiences(experiences);
  },
  (error) => {
    console.error("Error fetching experiences:", error);
    toast.error("Failed to load experiences. Please refresh the page.");
  }
);

// Cleanup on unmount
return () => unsubscribe();
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `eventId` | string | Event ID (Firestore document ID) |

### Query Details

- **Collection**: `/events/{eventId}/experiences`
- **Order**: `createdAt` ascending (oldest first)
- **Real-time**: Yes (uses `onSnapshot` for live updates)
- **Limit**: None (all experiences loaded)

---

## Response

### Success Response

**Type**: `Experience[]`

```typescript
[
  {
    id: "exp_abc123",
    eventId: "evt_xyz789",
    label: "Fun Photo Booth",
    type: "photo",
    enabled: true,
    allowCamera: true,
    allowLibrary: true,
    aiEnabled: false,
    // ... other fields
    createdAt: 1700000000000,
    updatedAt: 1700000000000
  },
  // ... more experiences
]
```

### Error Handling

**Error Callback**:
```typescript
(error) => {
  console.error("Error fetching experiences:", error);
  toast.error("Failed to load experiences. Please refresh the page.");
}
```

**Error Types**:
- **Permission Denied**: User doesn't have read access (Firestore Security Rules)
- **Network Error**: Offline or connection issues
- **Invalid eventId**: Event doesn't exist

---

## Implementation

### Layout Component

```tsx
"use client";

import { useState, useEffect, createContext } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toast } from "sonner";
import type { Experience } from "@/lib/types/firestore";

interface ExperiencesContextValue {
  experiences: Experience[];
  loading: boolean;
}

export const ExperiencesContext = createContext<ExperiencesContextValue>({
  experiences: [],
  loading: true,
});

export default function DesignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const resolvedParams = use(params);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const experiencesQuery = query(
      collection(db, "events", resolvedParams.eventId, "experiences"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      experiencesQuery,
      (snapshot) => {
        const experiencesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Experience[];

        setExperiences(experiencesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching experiences:", error);
        toast.error("Failed to load experiences. Please refresh the page.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [resolvedParams.eventId]);

  return (
    <ExperiencesContext.Provider value={{ experiences, loading }}>
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <DesignSidebar experiences={experiences} loading={loading} />
        <main className="flex-1">{children}</main>
      </div>
    </ExperiencesContext.Provider>
  );
}
```

---

## Data Flow

```
┌─────────────────────┐
│ Firestore           │
│ /events/{id}/       │
│ experiences         │
└──────────┬──────────┘
           │
           │ onSnapshot (real-time)
           │
           ▼
┌─────────────────────┐
│ Layout Component    │
│ (useEffect)         │
└──────────┬──────────┘
           │
           │ setState(experiences)
           │
           ▼
┌─────────────────────┐
│ Context Provider    │
│ ExperiencesContext  │
└──────────┬──────────┘
           │
           │ Provider value
           │
     ┌─────┴─────┐
     │           │
     ▼           ▼
┌─────────┐ ┌──────────┐
│ Sidebar │ │ Child    │
│         │ │ Routes   │
└─────────┘ └──────────┘
```

---

## Side Effects

1. **Persists across routes**: Layout doesn't unmount, so subscription stays active
2. **Automatic updates**: Any Firestore changes (create/update/delete) trigger snapshot callback
3. **Memory cleanup**: Unsubscribe function called on component unmount

---

## Performance

- **Initial load**: <500ms (depends on number of experiences)
- **Real-time updates**: <100ms (Firestore push notification)
- **Memory**: Snapshot listener maintains WebSocket connection
- **Optimization**: Consider pagination if >50 experiences (not expected)

---

## Security

- **Authentication**: User must be authenticated (Firebase Auth)
- **Authorization**: Firestore Security Rules enforce read access:
  ```javascript
  match /events/{eventId}/experiences/{experienceId} {
    allow read: if request.auth != null;
  }
  ```

---

## Error Scenarios

| Scenario | Behavior | User Impact |
|----------|----------|-------------|
| Permission denied | Error callback fires | Toast error, empty sidebar |
| Network offline | Firestore uses cache | Shows cached data, updates when online |
| Invalid eventId | No documents returned | Empty sidebar (valid state) |
| Firestore error | Error callback fires | Toast error, empty sidebar |

---

## Testing

### Unit Tests

```typescript
describe("Experiences Real-time Query", () => {
  it("loads experiences on mount", async () => {
    render(<DesignLayout eventId="evt_123">{children}</DesignLayout>);

    await waitFor(() => {
      expect(screen.getByText("Photo Booth 1")).toBeInTheDocument();
    });
  });

  it("updates when new experience created", async () => {
    const { rerender } = render(<DesignLayout eventId="evt_123">{children}</DesignLayout>);

    // Simulate Firestore update
    firestore.simulateDocumentAdd("events/evt_123/experiences/exp_new", {
      label: "New Booth",
      type: "photo",
    });

    await waitFor(() => {
      expect(screen.getByText("New Booth")).toBeInTheDocument();
    });
  });

  it("shows error toast on Firestore error", async () => {
    firestore.simulateError(new Error("Permission denied"));

    render(<DesignLayout eventId="evt_123">{children}</DesignLayout>);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load experiences/)).toBeInTheDocument();
    });
  });

  it("unsubscribes on unmount", () => {
    const { unmount } = render(<DesignLayout eventId="evt_123">{children}</DesignLayout>);

    unmount();

    expect(firestore.unsubscribeCalled).toBe(true);
  });
});
```

---

## Related Contracts

- [create-experience.md](./create-experience.md) - Creates new experiences (triggers real-time update)
- [update-experience.md](./update-experience.md) - Updates existing experiences (triggers real-time update)
- [delete-experience.md](./delete-experience.md) - Deletes experiences (triggers real-time update)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-11-17 | Initial contract definition | Events Designer Feature |
