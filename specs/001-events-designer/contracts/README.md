# API Contracts: Events Designer

**Feature**: Events Designer
**Date**: 2025-11-17

## Overview

This directory contains API contract definitions for the Events Designer feature. All contracts follow the **Server Actions** pattern used throughout the Clementine codebase.

**Pattern**: TypeScript Server Actions with Zod validation

**Location**: `web/src/app/actions/experiences.ts`

---

## Contract Pattern

All Server Actions follow this pattern:

```typescript
export async function actionName(
  param1: string,
  data: unknown
): Promise<ActionResult<ReturnType>> {
  // 1. Validate input with Zod
  const validated = schema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: validated.error.flatten() };
  }

  // 2. Perform operation
  try {
    // ... business logic
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
}
```

**ActionResult Type**:
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string } | ZodFormattedError };
```

---

## Contracts

### 1. Create Experience
[create-experience.md](./create-experience.md)

### 2. Get Experiences
[get-experiences.md](./get-experiences.md)

### 3. Update Experience
[update-experience.md](./update-experience.md) (existing, for reference)

### 4. Delete Experience
[delete-experience.md](./delete-experience.md) (existing, for reference)

---

## Usage

Contracts are called from Client Components using Next.js Server Actions:

```tsx
"use client";

import { createExperienceAction } from "@/app/actions/experiences";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExperienceSchema } from "@/lib/validation/experience";

export function CreateExperienceForm({ eventId }: { eventId: string }) {
  const form = useForm({
    resolver: zodResolver(createExperienceSchema),
  });

  const onSubmit = async (data) => {
    const result = await createExperienceAction(eventId, data);

    if (result.success) {
      router.push(`/events/${eventId}/design/experiences/${result.data.id}`);
    } else {
      // Handle error
    }
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

---

## Notes

- All contracts enforce type safety with Zod validation
- Server-side validation is **mandatory** (Constitution Principle III)
- Client-side validation is optional (for UX)
- All Server Actions return `ActionResult<T>` for consistent error handling
