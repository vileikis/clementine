# Clementine POC — Technical Implementation Plan

**Spec Version**: 0.2
**Plan Date**: 2025-11-07
**Target**: Production-ready POC on Vercel + Firebase

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel (Next.js 16)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  App Router                                           │  │
│  │  ├── /events (Organizer UI)                          │  │
│  │  ├── /join/:eventId (Guest Flow)                     │  │
│  │  └── /s/:sessionId (Share Redirect)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Server Actions                                       │  │
│  │  ├── Event Management                                │  │
│  │  ├── Scene Configuration                             │  │
│  │  ├── Session Handling                                │  │
│  │  └── AI Transform Orchestration                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Platform                         │
│  ┌────────────────────┐      ┌────────────────────────────┐ │
│  │   Firestore        │      │   Firebase Storage         │ │
│  │  ├── events/       │      │  events/{id}/              │ │
│  │  │   └── scenes/   │      │  ├── refs/                 │ │
│  │  │   └── sessions/ │      │  ├── sessions/             │ │
│  │  │   └── media/    │      │  └── qr/                   │ │
│  │  └── stats/        │      │                            │ │
│  └────────────────────┘      └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Nano Banana API                           │
│  ├── Background Swap Endpoint                              │
│  └── Deep Fake Endpoint                                    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend**
- Next.js 16 (App Router, React 19)
- TypeScript (strict mode)
- Tailwind CSS 4 with CSS variables
- shadcn/ui components
- MediaDevices API (camera access)

**Backend**
- Next.js Server Actions (no separate API routes needed)
- Firebase Admin SDK (Node.js)
- Nano Banana API client

**Data & Storage**
- Firestore (NoSQL document database)
- Firebase Storage (object storage)

**Infrastructure**
- Vercel (hosting, edge functions, CDN)
- Firebase (managed services)

---

## 2. Data Layer

### 2.1 Firestore Schema

**TypeScript Types** (canonical)

```typescript
// src/lib/types/firestore.ts

export type EventStatus = "draft" | "live" | "archived";
export type SceneStatus = "active" | "deprecated";
export type SessionState = "created" | "captured" | "transforming" | "ready" | "error";
export type CaptureMode = "photo" | "video" | "gif" | "boomerang"; // POC: only "photo"
export type EffectType = "background_swap" | "deep_fake";

export interface Event {
  id: string;
  title: string;
  brandColor: string; // hex color
  showTitleOverlay: boolean;

  status: EventStatus;
  currentSceneId: string; // FK to scenes subcollection

  joinPath: string; // e.g., "/join/abc123"
  joinUrl: string; // full URL
  qrPngPath: string; // Storage path

  createdAt: number; // Unix timestamp ms
  updatedAt: number;
}

export interface Scene {
  id: string;
  label: string;
  mode: CaptureMode;
  effect: EffectType;

  prompt: string;
  defaultPrompt: string;

  referenceImagePath?: string; // Storage path

  flags: {
    customTextTool: boolean;
    stickersTool: boolean;
  };

  status: SceneStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  id: string;
  eventId: string; // denormalized for convenience
  sceneId: string; // snapshot pointer

  state: SessionState;

  inputImagePath?: string; // Storage path
  resultImagePath?: string; // Storage path

  error?: string;

  createdAt: number;
  updatedAt: number;
}

export interface Media {
  id: string;
  sessionId: string;
  sceneId: string;
  resultImagePath: string;

  createdAt: number;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface StatsOverview {
  sessions: number;
  captures: number;
  transforms: number;
  shares: number;
  downloads: number;
  uniqueGuests: number;

  captureRate: number;
  transformSuccessRate: number;
  shareRate: number;

  topMedia: Array<{
    mediaId: string;
    sessionId: string;
    resultImagePath: string;
    score: number;
    shares: number;
    downloads: number;
    views: number;
  }>;

  updatedAt: number;
}
```

**Zod Schemas** (runtime validation)

```typescript
// src/lib/schemas/firestore.ts

import { z } from "zod";

export const eventSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(100),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  showTitleOverlay: z.boolean(),
  status: z.enum(["draft", "live", "archived"]),
  currentSceneId: z.string(),
  joinPath: z.string(),
  joinUrl: z.string().url(),
  qrPngPath: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const sceneSchema = z.object({
  id: z.string(),
  label: z.string(),
  mode: z.enum(["photo", "video", "gif", "boomerang"]),
  effect: z.enum(["background_swap", "deep_fake"]),
  prompt: z.string().min(1),
  defaultPrompt: z.string(),
  referenceImagePath: z.string().optional(),
  flags: z.object({
    customTextTool: z.boolean(),
    stickersTool: z.boolean(),
  }),
  status: z.enum(["active", "deprecated"]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const sessionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  sceneId: z.string(),
  state: z.enum(["created", "captured", "transforming", "ready", "error"]),
  inputImagePath: z.string().optional(),
  resultImagePath: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// ... similar for Media, StatsOverview
```

### 2.2 Storage Layout

```
events/{eventId}/
  refs/
    {filename}.jpg          # Reference images for scenes
  sessions/{sessionId}/
    input.jpg               # Original guest photo
    result.jpg              # AI-transformed result
  qr/
    join.png                # Join QR code
```

### 2.3 Data Access Layer

**Repository Pattern** (thin abstraction over Firebase SDK)

```typescript
// src/lib/repositories/events.ts

import { db } from "@/lib/firebase/admin";
import type { Event, Scene } from "@/lib/types/firestore";
import { eventSchema } from "@/lib/schemas/firestore";

export async function createEvent(data: {
  title: string;
  brandColor: string;
  showTitleOverlay: boolean;
}): Promise<string> {
  const eventRef = db.collection("events").doc();
  const sceneRef = eventRef.collection("scenes").doc();

  const now = Date.now();
  const eventId = eventRef.id;
  const joinPath = `/join/${eventId}`;

  const event: Event = {
    id: eventId,
    ...data,
    status: "draft",
    currentSceneId: sceneRef.id,
    joinPath,
    joinUrl: `${process.env.NEXT_PUBLIC_BASE_URL}${joinPath}`,
    qrPngPath: `events/${eventId}/qr/join.png`,
    createdAt: now,
    updatedAt: now,
  };

  const scene: Scene = {
    id: sceneRef.id,
    label: "Default Scene v1",
    mode: "photo",
    effect: "background_swap",
    prompt: "Apply clean studio background with brand color accents.",
    defaultPrompt: "Apply clean studio background with brand color accents.",
    flags: {
      customTextTool: false,
      stickersTool: false,
    },
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  await db.runTransaction(async (txn) => {
    txn.set(eventRef, event);
    txn.set(sceneRef, scene);
  });

  return eventId;
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const doc = await db.collection("events").doc(eventId).get();
  if (!doc.exists) return null;
  return eventSchema.parse({ id: doc.id, ...doc.data() });
}

export async function listEvents(): Promise<Event[]> {
  const snapshot = await db
    .collection("events")
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) =>
    eventSchema.parse({ id: doc.id, ...doc.data() })
  );
}

export async function updateEventBranding(
  eventId: string,
  branding: { brandColor?: string; showTitleOverlay?: boolean }
): Promise<void> {
  await db.collection("events").doc(eventId).update({
    ...branding,
    updatedAt: Date.now(),
  });
}

// Similar functions: getCurrentScene, updateScene, etc.
```

**Similar repositories**:
- `src/lib/repositories/scenes.ts`
- `src/lib/repositories/sessions.ts`
- `src/lib/repositories/media.ts`

---

## 3. Server Actions

### 3.1 Event Management

```typescript
// src/app/actions/events.ts

"use server";

import { createEvent, getEvent, listEvents, updateEventBranding } from "@/lib/repositories/events";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createEventInput = z.object({
  title: z.string().min(1).max(100),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i),
  showTitleOverlay: z.boolean(),
});

export async function createEventAction(input: z.infer<typeof createEventInput>) {
  const validated = createEventInput.parse(input);
  const eventId = await createEvent(validated);
  revalidatePath("/events");
  return { success: true, eventId };
}

export async function getEventAction(eventId: string) {
  const event = await getEvent(eventId);
  if (!event) throw new Error("Event not found");
  return event;
}

export async function listEventsAction() {
  return await listEvents();
}

export async function updateEventBrandingAction(
  eventId: string,
  branding: { brandColor?: string; showTitleOverlay?: boolean }
) {
  await updateEventBranding(eventId, branding);
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}
```

### 3.2 Scene Configuration

```typescript
// src/app/actions/scenes.ts

"use server";

import { updateScene, getCurrentScene } from "@/lib/repositories/scenes";
import { uploadReferenceImage } from "@/lib/storage/upload";
import { revalidatePath } from "next/cache";

export async function updateSceneAction(
  eventId: string,
  sceneId: string,
  updates: {
    effect?: "background_swap" | "deep_fake";
    prompt?: string;
  }
) {
  await updateScene(eventId, sceneId, updates);
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function uploadReferenceImageAction(
  eventId: string,
  sceneId: string,
  formData: FormData
) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const storagePath = await uploadReferenceImage(eventId, file);
  await updateScene(eventId, sceneId, { referenceImagePath: storagePath });

  revalidatePath(`/events/${eventId}`);
  return { success: true, path: storagePath };
}

export async function getCurrentSceneAction(eventId: string) {
  return await getCurrentScene(eventId);
}
```

### 3.3 Session & Transform

```typescript
// src/app/actions/sessions.ts

"use server";

import { startSession, saveCapture, getSession, updateSessionState } from "@/lib/repositories/sessions";
import { getCurrentScene } from "@/lib/repositories/scenes";
import { uploadInputImage, uploadResultImage } from "@/lib/storage/upload";
import { transformWithNanoBanana } from "@/lib/ai/nano-banana";
import { revalidatePath } from "next/cache";

export async function startSessionAction(eventId: string) {
  const sessionId = await startSession(eventId);
  return { sessionId };
}

export async function saveCaptureAction(
  eventId: string,
  sessionId: string,
  formData: FormData
) {
  const file = formData.get("photo") as File;
  if (!file) throw new Error("No photo provided");

  const inputImagePath = await uploadInputImage(eventId, sessionId, file);
  await saveCapture(eventId, sessionId, inputImagePath);

  return { success: true, inputImagePath };
}

export async function triggerTransformAction(eventId: string, sessionId: string) {
  try {
    // Mark as transforming
    await updateSessionState(eventId, sessionId, "transforming");

    // Get session + scene config
    const session = await getSession(eventId, sessionId);
    const scene = await getCurrentScene(eventId);

    if (!session.inputImagePath) {
      throw new Error("No input image");
    }

    // Generate signed URLs
    const inputUrl = await getSignedUrl(session.inputImagePath);
    const referenceUrl = scene.referenceImagePath
      ? await getSignedUrl(scene.referenceImagePath)
      : undefined;

    // Call AI service
    const resultBuffer = await transformWithNanoBanana({
      effect: scene.effect,
      prompt: scene.prompt,
      inputImageUrl: inputUrl,
      referenceImageUrl: referenceUrl,
      brandColor: (await getEvent(eventId))?.brandColor,
    });

    // Upload result
    const resultImagePath = await uploadResultImage(eventId, sessionId, resultBuffer);

    // Mark as ready
    await updateSessionState(eventId, sessionId, "ready", { resultImagePath });

    revalidatePath(`/join/${eventId}`);
    return { success: true, resultImagePath };

  } catch (error) {
    await updateSessionState(eventId, sessionId, "error", {
      error: error instanceof Error ? error.message : "Transform failed",
    });
    throw error;
  }
}

export async function getSessionAction(eventId: string, sessionId: string) {
  return await getSession(eventId, sessionId);
}
```

---

## 4. AI Integration

### 4.1 Nano Banana Adapter

```typescript
// src/lib/ai/nano-banana.ts

export type TransformParams = {
  effect: "background_swap" | "deep_fake";
  prompt: string;
  inputImageUrl: string;
  referenceImageUrl?: string;
  brandColor?: string;
};

export async function transformWithNanoBanana(
  params: TransformParams
): Promise<Buffer> {
  const endpoint = params.effect === "background_swap"
    ? process.env.NANO_BANANA_BG_SWAP_ENDPOINT
    : process.env.NANO_BANANA_DEEPFAKE_ENDPOINT;

  if (!endpoint) {
    // Dev mode: mock transform
    return mockTransform(params);
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NANO_BANANA_API_KEY}`,
    },
    body: JSON.stringify({
      input_image: params.inputImageUrl,
      reference_image: params.referenceImageUrl,
      prompt: params.prompt,
      brand_color: params.brandColor,
    }),
  });

  if (!response.ok) {
    throw new Error(`Nano Banana API error: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function mockTransform(params: TransformParams): Promise<Buffer> {
  // Fetch input image, apply simple overlay/tint
  const response = await fetch(params.inputImageUrl);
  const buffer = await response.arrayBuffer();

  // In real POC, use canvas/sharp to add colored overlay + text
  // For now, just return original
  return Buffer.from(buffer);
}
```

### 4.2 Error Handling

- **Transient failures**: Retry logic (exponential backoff) in transform action
- **Permanent failures**: Update session state to `"error"` with message
- **Timeout**: Set max wait time (e.g., 60s), mark as error if exceeded

---

## 5. Frontend Architecture

### 5.1 Route Structure

```
src/app/
├── layout.tsx                  # Root layout (Providers, fonts)
├── page.tsx                    # Landing page (redirect to /events or marketing)
├── events/
│   ├── layout.tsx              # Organizer layout (header, nav)
│   ├── page.tsx                # Event list
│   ├── new/
│   │   └── page.tsx            # Create event form
│   └── [eventId]/
│       ├── layout.tsx          # Event detail layout (tabs)
│       ├── page.tsx            # Redirect to /scene tab
│       ├── scene/
│       │   └── page.tsx        # Scene configuration
│       ├── branding/
│       │   └── page.tsx        # Branding settings
│       └── distribution/
│           └── page.tsx        # Join link + QR
├── join/
│   └── [eventId]/
│       └── page.tsx            # Guest flow (state machine)
└── s/
    └── [sessionId]/
        └── route.ts            # 302 redirect to Storage result URL
```

### 5.2 Component Hierarchy

**Organizer Components**

```
src/components/
├── organizer/
│   ├── EventCard.tsx           # Event list item
│   ├── EventForm.tsx           # Create/edit event form
│   ├── SceneForm.tsx           # Scene configuration
│   │   ├── ModeSelector.tsx
│   │   ├── EffectPicker.tsx
│   │   ├── PromptEditor.tsx
│   │   └── RefImageUploader.tsx
│   ├── BrandingForm.tsx        # Branding settings
│   │   ├── BrandColorPicker.tsx
│   │   └── TitleOverlayToggle.tsx
│   └── QRPanel.tsx             # Join link + QR display
```

**Guest Components**

```
src/components/
├── guest/
│   ├── BrandThemeProvider.tsx  # Injects --brand CSS var
│   ├── GreetingScreen.tsx      # Welcome + event branding
│   ├── CameraView.tsx          # Live camera feed (MediaDevices API)
│   ├── Countdown.tsx           # 3-2-1 countdown
│   ├── CaptureButton.tsx       # Start capture
│   ├── RetakeButton.tsx        # Go back to capture
│   ├── NextButton.tsx          # Proceed to share
│   ├── ResultViewer.tsx        # Display transformed image + skeleton
│   ├── SharePanel.tsx          # Copy link, show QR, Web Share API
│   └── ErrorBanner.tsx         # Permission denied / transform error
```

**shadcn/ui Usage**

- `Button`, `Input`, `Label`, `Select`, `Tabs`, `Card`, `Skeleton`, `Dialog`, `Toast`
- Custom `ColorPicker` (wrapping `input[type=color]` or third-party like `react-colorful`)

### 5.3 State Management

**Organizer**: React Server Components + Server Actions (no client state library needed)

**Guest Flow**: Client-side state machine

```typescript
// src/hooks/useGuestFlow.ts

import { useReducer, useEffect } from "react";
import type { Session } from "@/lib/types/firestore";

type GuestState =
  | { step: "greeting" }
  | { step: "camera_permission_error" }
  | { step: "ready_to_capture"; stream: MediaStream }
  | { step: "countdown"; count: 3 | 2 | 1; stream: MediaStream }
  | { step: "captured"; blob: Blob }
  | { step: "transforming"; sessionId: string }
  | { step: "review_ready"; session: Session }
  | { step: "error"; message: string }
  | { step: "share"; session: Session };

type GuestAction =
  | { type: "PERMISSION_GRANTED"; stream: MediaStream }
  | { type: "PERMISSION_DENIED" }
  | { type: "START_CAPTURE" }
  | { type: "COUNTDOWN_TICK"; count: 3 | 2 | 1 }
  | { type: "SNAP"; blob: Blob }
  | { type: "RETAKE" }
  | { type: "UPLOAD_COMPLETE"; sessionId: string }
  | { type: "TRANSFORM_COMPLETE"; session: Session }
  | { type: "TRANSFORM_ERROR"; message: string }
  | { type: "NEXT" }
  | { type: "CLOSE" };

function reducer(state: GuestState, action: GuestAction): GuestState {
  // Implement state transitions per spec section 10
  // ...
}

export function useGuestFlow(eventId: string) {
  const [state, dispatch] = useReducer(reducer, { step: "greeting" });

  // Side effects: request camera, upload, poll session, etc.

  return { state, dispatch };
}
```

**Alternative**: Use `XState` for formal state machine (if team prefers)

### 5.4 Theming

**CSS Variables**

```css
/* src/app/globals.css */

:root {
  --brand: #0EA5E9; /* default, overridden by event */
  /* shadcn/ui variables */
}
```

**BrandThemeProvider**

```tsx
// src/components/guest/BrandThemeProvider.tsx

"use client";

import { useEffect } from "react";

export function BrandThemeProvider({
  brandColor,
  children,
}: {
  brandColor: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.style.setProperty("--brand", brandColor);
  }, [brandColor]);

  return <>{children}</>;
}
```

Usage in `/join/[eventId]/page.tsx`:

```tsx
import { BrandThemeProvider } from "@/components/guest/BrandThemeProvider";
import { getEventAction } from "@/app/actions/events";

export default async function JoinPage({ params }: { params: { eventId: string } }) {
  const event = await getEventAction(params.eventId);

  return (
    <BrandThemeProvider brandColor={event.brandColor}>
      <GuestFlowContainer eventId={event.id} />
    </BrandThemeProvider>
  );
}
```

---

## 6. Camera & Capture

### 6.1 Camera Access

```typescript
// src/hooks/useCamera.ts

import { useState, useEffect, useRef } from "react";

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function requestCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }, // front camera
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Camera access denied");
      }
    }
    requestCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { stream, error, videoRef };
}
```

### 6.2 Capture Photo

```typescript
// src/lib/camera/capture.ts

export function capturePhoto(video: HTMLVideoElement): Blob {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error("Capture failed");
      resolve(blob);
    }, "image/jpeg", 0.9);
  });
}
```

---

## 7. QR Code Generation

```typescript
// src/lib/qr/generate.ts

import QRCode from "qrcode";
import { uploadQrCode } from "@/lib/storage/upload";

export async function generateJoinQr(eventId: string, joinUrl: string): Promise<string> {
  const qrBuffer = await QRCode.toBuffer(joinUrl, {
    errorCorrectionLevel: "M",
    type: "png",
    width: 512,
  });

  const storagePath = `events/${eventId}/qr/join.png`;
  await uploadQrCode(storagePath, qrBuffer);

  return storagePath;
}
```

Call this in `createEvent` or lazily on first access to Distribution tab.

---

## 8. Firebase Setup

### 8.1 Admin SDK Initialization

```typescript
// src/lib/firebase/admin.ts

import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const db = admin.firestore();
export const storage = admin.storage().bucket();
```

### 8.2 Storage Operations

```typescript
// src/lib/storage/upload.ts

import { storage } from "@/lib/firebase/admin";
import { v4 as uuidv4 } from "uuid";

export async function uploadInputImage(
  eventId: string,
  sessionId: string,
  file: File
): Promise<string> {
  const path = `events/${eventId}/sessions/${sessionId}/input.jpg`;
  const blob = storage.file(path);

  await blob.save(Buffer.from(await file.arrayBuffer()), {
    contentType: "image/jpeg",
    metadata: { firebaseStorageDownloadTokens: uuidv4() },
  });

  return path;
}

export async function uploadResultImage(
  eventId: string,
  sessionId: string,
  buffer: Buffer
): Promise<string> {
  const path = `events/${eventId}/sessions/${sessionId}/result.jpg`;
  const blob = storage.file(path);

  await blob.save(buffer, {
    contentType: "image/jpeg",
    metadata: { firebaseStorageDownloadTokens: uuidv4() },
  });

  return path;
}

export async function uploadReferenceImage(eventId: string, file: File): Promise<string> {
  const filename = `${Date.now()}-${file.name}`;
  const path = `events/${eventId}/refs/${filename}`;
  const blob = storage.file(path);

  await blob.save(Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    metadata: { firebaseStorageDownloadTokens: uuidv4() },
  });

  return path;
}

export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const [url] = await storage.file(path).getSignedUrl({
    action: "read",
    expires: Date.now() + expiresIn * 1000,
  });
  return url;
}

export async function getPublicUrl(path: string): Promise<string> {
  // Use download token for public access (Firebase Storage URL pattern)
  const file = storage.file(path);
  const [metadata] = await file.getMetadata();
  const token = metadata.metadata?.firebaseStorageDownloadTokens;
  return `https://firebasestorage.googleapis.com/v0/b/${storage.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}
```

### 8.3 Security Rules (POC - Wide Open)

**Firestore** (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // POC ONLY
    }
  }
}
```

**Storage** (`storage.rules`)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // POC ONLY
    }
  }
}
```

**Optional POC_ADMIN_KEY** (in Server Actions)

```typescript
if (process.env.POC_ADMIN_KEY) {
  const providedKey = request.headers.get("x-admin-key");
  if (providedKey !== process.env.POC_ADMIN_KEY) {
    throw new Error("Unauthorized");
  }
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Days 1-2)

**Goal**: Core data layer + Firebase setup

- [x] Set up Firebase project (Firestore + Storage)
- [x] Initialize Firebase Admin SDK in Next.js
- [x] Define TypeScript types + Zod schemas
- [x] Implement event repository (CRUD)
- [x] Implement scene repository (CRUD)
- [x] Implement session repository (CRUD)
- [x] Write storage upload/download utilities
- [x] Deploy POC security rules (wide open)

**Deliverable**: Can create events & scenes in Firestore via Node.js script

### Phase 2: Organizer UI (Days 3-4)

**Goal**: Event creation + configuration

- [x] Build `/events` list page (EventCard)
- [x] Build `/events/new` form (EventForm + Server Action)
- [x] Build `/events/[eventId]` layout with tabs
- [x] Build Scene tab (ModeSelector, EffectPicker, PromptEditor, RefImageUploader)
- [x] Build Branding tab (ColorPicker, TitleOverlayToggle)
- [x] Build Distribution tab (JoinURL, QR generation, "Open Guest View" button)
- [x] Implement QR code generation + storage

**Deliverable**: Organizer can create & configure events with working UI

### Phase 3: Guest Flow - Capture (Days 5-6)

**Goal**: Camera access + photo capture

- [x] Build `/join/[eventId]` page structure
- [x] Implement BrandThemeProvider
- [x] Build GreetingScreen
- [x] Implement useCamera hook (MediaDevices API)
- [x] Build CameraView component
- [x] Build Countdown component (3-2-1 animation)
- [x] Build CaptureButton + capture logic
- [x] Implement photo upload to Storage
- [x] Create session record on capture

**Deliverable**: Guest can capture photo and upload to Storage

### Phase 4: AI Transform Pipeline (Days 7-8)

**Goal**: AI integration + result display

- [x] Implement Nano Banana adapter (or mock)
- [x] Build transform Server Action (orchestration)
- [x] Implement session state transitions
- [x] Build ResultViewer component (loading skeleton → image)
- [x] Build RetakeButton (reset to capture)
- [x] Error handling (transform failures)

**Deliverable**: Guest sees AI-transformed photo after capture

### Phase 5: Share & Result Flow (Day 9)

**Goal**: Share link + QR

- [x] Build NextButton (proceed to share)
- [x] Build SharePanel (copy link, show QR, Web Share API)
- [x] Implement `/s/[sessionId]` redirect route (302 to Storage URL)
- [x] Generate result QR code
- [x] "Close" button → back to Greeting

**Deliverable**: Guest can share result via link/QR

### Phase 6: Polish & Testing (Day 10)

**Goal**: Responsive design + error states + testing

- [x] Mobile-first responsive layout (all screens)
- [x] Error banners (camera denied, transform failed)
- [x] Loading states (skeletons, spinners)
- [x] Cross-browser testing (Safari, Chrome mobile)
- [x] Vercel deployment + env vars
- [x] End-to-end test (Organizer creates → Guest joins → Share)

**Deliverable**: Production-ready POC deployed on Vercel

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Priority**: Server Actions, repositories, AI adapter

- Jest + `@testing-library/react` for components
- Mock Firebase Admin SDK (use emulators or `firebase-admin` mocks)
- Mock Nano Banana API responses

**Examples**:
- `createEventAction` → verify Firestore write + scene creation
- `transformWithNanoBanana` → verify API call + error handling
- `useCamera` hook → mock `navigator.mediaDevices.getUserMedia`

### 10.2 Integration Tests

**Priority**: Guest flow state machine

- Playwright for E2E tests
- Test happy path: Greeting → Capture → Transform → Share
- Test error paths: Camera denied, Transform failed, Retake

### 10.3 Manual Testing

**Devices**: iPhone (Safari), Android (Chrome)

- Camera permissions prompt
- Photo capture quality
- Transform latency
- QR code scanning
- Share link opens correctly

---

## 11. Deployment

### 11.1 Vercel Configuration

**Environment Variables** (`.env.local` → Vercel dashboard)

```bash
NEXT_PUBLIC_BASE_URL=https://clementine.app

FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_STORAGE_BUCKET=...

NANO_BANANA_API_KEY=...
NANO_BANANA_BG_SWAP_ENDPOINT=...
NANO_BANANA_DEEPFAKE_ENDPOINT=...

POC_ADMIN_KEY=... # optional, for demo gating
```

**Build Command**: `pnpm build` (from root, will run `pnpm --filter web build`)

**Output Directory**: `web/.next`

### 11.2 Firebase Project Setup

1. Create Firebase project (console.firebase.google.com)
2. Enable Firestore + Storage
3. Download service account JSON → convert to env vars
4. Deploy Firestore/Storage rules (POC: wide open)
5. (Optional) Enable BigQuery export for future analytics

### 11.3 Domain & SSL

- Custom domain via Vercel (e.g., `clementine.app`)
- Automatic HTTPS
- Update `NEXT_PUBLIC_BASE_URL` to production domain

---

## 12. Risks & Mitigations

### 12.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Nano Banana API latency** | Transform takes >60s | Implement timeout (60s), fallback to error state. Add retry logic. |
| **Camera permissions denied** | Guest can't proceed | Clear error message + instructions. Link to browser settings help. |
| **Storage upload failures** | Session stuck in "captured" | Retry upload with exponential backoff. Show error banner. |
| **Mobile browser quirks** | Camera not working on iOS Safari | Test early on target devices. Use polyfills for MediaDevices API if needed. |
| **Firebase quotas** | POC usage exceeds free tier | Monitor usage. Upgrade to Blaze plan if needed (expect ~$0). |
| **QR code not scanning** | Guests can't join | Use high error correction (M or H level). Test with multiple scanner apps. |

### 12.2 Dependencies

- **Nano Banana API**: Critical path for transforms. Need API key + endpoints before Phase 4.
- **Firebase project**: Must be created before Phase 1.
- **Vercel account**: Needed for deployment (Phase 6).

### 12.3 Security (POC)

**Known Issues**:
- No authentication → anyone can create events
- No rate limiting → open to abuse
- Firestore/Storage rules wide open

**Mitigations**:
- Use `POC_ADMIN_KEY` for event creation (optional)
- Monitor Firebase usage
- **Do NOT share POC publicly** without restrictions
- Plan for tightening rules in MVP phase

---

## 13. Future Enhancements (Out of Scope for POC)

- **Authentication**: Clerk or Firebase Auth for organizers
- **Multi-scene switching**: Allow organizers to create multiple scenes per event
- **Video/GIF/Boomerang**: Extend capture modes
- **Analytics dashboard**: Real-time stats + gallery
- **Bulk export**: ZIP download of all results
- **Moderation**: Content filters + manual review
- **Custom branding**: Logo upload, font selection
- **Webhooks**: Notify organizer on new submissions
- **Rate limiting**: Prevent abuse
- **Production security rules**: Firestore RLS, Storage per-event ACLs

---

## 14. Definition of Done

**POC is complete when**:

1. Organizer can create event with title, brand color, title overlay toggle
2. Organizer can configure scene (effect, prompt, reference image)
3. Organizer sees join URL + QR code
4. Guest can open join URL on mobile
5. Guest can allow camera permission and see live preview
6. Guest can capture photo (3-2-1 countdown)
7. Photo uploads to Storage, session created
8. AI transform triggered, result displayed within 60s
9. Guest can retake (new session) or proceed to share
10. Guest can copy share link + see result QR
11. Share link (`/s/:sessionId`) redirects to Storage result URL
12. All flows work on iOS Safari + Android Chrome
13. Deployed on Vercel with production domain
14. No console errors, no broken states

**Acceptance test**: Run through full Organizer → Guest flow 3 times with different effects/prompts, all succeed.

---

## Next Steps

1. **Kick off Phase 1**: Set up Firebase project, initialize Admin SDK
2. **Generate tasks.md**: Break down each phase into specific tasks
3. **Begin implementation**: Use `/build` command for systematic task execution
