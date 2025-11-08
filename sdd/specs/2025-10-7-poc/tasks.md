# Tasks for Clementine POC

**Project**: POC v0.2 - End-to-end AI photobooth experience
**Plan**: `plan.md`
**Spec**: `poc-spec.md`

---

## Phase 1: Foundation (Days 1-2)

### Task 1.1: Firebase Project Setup ✅
- **Complexity**: S
- **Dependencies**: None
- **Description**: Create Firebase project, enable Firestore and Storage, configure service account
- **Acceptance Criteria**:
  - [x] Firebase project created in console
  - [x] Firestore database enabled (default mode)
  - [x] Firebase Storage enabled
  - [x] Service account JSON downloaded
  - [x] Environment variables documented
- **Files**:
  - `.env.local.example` (create) ✅
  - `README.md` (update with Firebase setup instructions) ✅

### Task 1.2: Firebase Client SDK Integration ✅
- **Complexity**: S
- **Dependencies**: Task 1.1
- **Description**: Initialize Firebase Client SDK in Next.js app for frontend real-time subscriptions
- **Acceptance Criteria**:
  - [x] Firebase Client SDK installed (`firebase` v12.5.0)
  - [x] Client SDK initialized in `web/src/lib/firebase/client.ts`
  - [x] Firestore and Storage instances exported
  - [x] Public environment variables configured (`NEXT_PUBLIC_*`)
  - [x] Can connect to Firestore from browser
- **Files**:
  - `web/src/lib/firebase/client.ts` (create) ✅
  - `web/.env.local` (already exists) ✅
  - Update: `.env.local.example` (add public vars) ✅
  - `web/package.json` (update dependencies) ✅

### Task 1.2b: Firebase Admin SDK Integration ✅
- **Complexity**: S
- **Dependencies**: Task 1.1
- **Description**: Initialize Firebase Admin SDK in Next.js app for backend privileged operations
- **Acceptance Criteria**:
  - [x] Firebase Admin SDK installed (`firebase-admin` v13.6.0)
  - [x] Admin SDK initialized in `web/src/lib/firebase/admin.ts`
  - [x] Firestore and Storage instances exported
  - [x] Service account environment variables loaded correctly
  - [x] Can connect to Firestore from Server Actions
- **Files**:
  - `web/src/lib/firebase/admin.ts` (create) ✅
  - Update: `web/.env.local` (user already configured) ✅
  - Update: `.env.local.example` (add admin vars) ✅
  - Update: `web/package.json` (update dependencies) ✅

### Task 1.3: TypeScript Types & Zod Schemas ✅
- **Complexity**: M
- **Dependencies**: None
- **Description**: Define canonical TypeScript types and Zod validation schemas for all data models
- **Acceptance Criteria**:
  - [x] `Event`, `Scene`, `Session`, `Media`, `StatsOverview` types defined
  - [x] Enum types for `EventStatus`, `SceneStatus`, `SessionState`, `CaptureMode`, `EffectType`
  - [x] Zod schemas created for runtime validation
  - [x] All types match spec section 2
  - [x] Types exported from barrel file
- **Files**:
  - `web/src/lib/types/firestore.ts` (create) ✅
  - `web/src/lib/schemas/firestore.ts` (create) ✅
  - `web/src/lib/types/index.ts` (create) ✅

### Task 1.4: Event Repository Implementation ✅
- **Complexity**: M
- **Dependencies**: Task 1.2b, Task 1.3
- **Description**: Implement CRUD operations for events collection (uses Admin SDK)
- **Acceptance Criteria**:
  - [x] `createEvent()` creates event + default scene in transaction
  - [x] `getEvent()` fetches event by ID with validation
  - [x] `listEvents()` returns all events ordered by creation
  - [x] `updateEventBranding()` updates brand color and title overlay
  - [x] `getCurrentScene()` fetches active scene for event
  - [x] All functions handle errors gracefully
- **Files**:
  - `web/src/lib/repositories/events.ts` (create) ✅

### Task 1.5: Scene Repository Implementation ✅
- **Complexity**: S
- **Dependencies**: Task 1.2b, Task 1.3
- **Description**: Implement CRUD operations for scenes subcollection (uses Admin SDK)
- **Acceptance Criteria**:
  - [x] `updateScene()` updates scene fields
  - [x] `getScene()` fetches scene by ID
  - [x] Scene updates include `updatedAt` timestamp
  - [x] Validation on effect type and mode
- **Files**:
  - `web/src/lib/repositories/scenes.ts` (create) ✅

### Task 1.6: Session Repository Implementation ✅
- **Complexity**: M
- **Dependencies**: Task 1.2b, Task 1.3
- **Description**: Implement session lifecycle operations (uses Admin SDK)
- **Acceptance Criteria**:
  - [x] `startSession()` creates new session with `created` state
  - [x] `saveCapture()` updates session with input image path
  - [x] `updateSessionState()` transitions session state
  - [x] `getSession()` fetches session by ID
  - [x] State transitions follow spec section 10 state machine
- **Files**:
  - `web/src/lib/repositories/sessions.ts` (create) ✅

### Task 1.7: Storage Upload/Download Utilities ✅
- **Complexity**: M
- **Dependencies**: Task 1.2b
- **Description**: Implement Firebase Storage operations for images and files (uses Admin SDK)
- **Acceptance Criteria**:
  - [x] `uploadInputImage()` saves guest photo to correct path
  - [x] `uploadResultImage()` saves AI result to correct path
  - [x] `uploadReferenceImage()` saves scene reference image
  - [x] `uploadQrCode()` saves QR code PNG
  - [x] `getSignedUrl()` generates temporary signed URL
  - [x] `getPublicUrl()` generates token-based public URL
  - [x] All uploads include download tokens for public access
  - [x] File paths match spec section 3 storage layout
- **Files**:
  - `web/src/lib/storage/upload.ts` (create) ✅

### Task 1.8: Deploy POC Security Rules ✅
- **Complexity**: S
- **Dependencies**: Task 1.1
- **Description**: Deploy Firestore and Storage rules (allow reads, deny writes to force Server Actions)
- **Acceptance Criteria**:
  - [x] `firestore.rules` created: allow read: if true, allow write: if false
  - [x] `storage.rules` created: allow read: if true, allow write: if false
  - [x] Rules deployed to Firebase project (via `firebase deploy`)
  - [x] Rules include comments explaining hybrid approach
  - [x] Client SDK can read/subscribe to documents
  - [x] Client SDK cannot write (enforces Server Actions)
- **Files**:
  - `firestore.rules` (create) ✅
  - `storage.rules` (create) ✅
  - `firebase.json` (create) ✅
  - `.firebaserc` (create) ✅
  - `firestore.indexes.json` (create) ✅
  - `README.md` (update with deployment instructions) ✅

---

## Phase 2: Organizer UI (Days 3-4)

### Task 2.1: Event Server Actions ✅
- **Complexity**: M
- **Dependencies**: Task 1.4, Task 1.5
- **Description**: Create Server Actions for event management
- **Acceptance Criteria**:
  - [x] `createEventAction()` validates input and calls repository
  - [x] `getEventAction()` fetches event with error handling
  - [x] `listEventsAction()` returns event list
  - [x] `updateEventBrandingAction()` updates branding with revalidation
  - [x] `getCurrentSceneAction()` fetches active scene
  - [x] All actions use `"use server"` directive
  - [x] All actions revalidate relevant paths
- **Files**:
  - `web/src/app/actions/events.ts` (create) ✅

### Task 2.2: Scene Server Actions ✅
- **Complexity**: M
- **Dependencies**: Task 1.5, Task 1.7
- **Description**: Create Server Actions for scene configuration
- **Acceptance Criteria**:
  - [x] `updateSceneAction()` updates effect and prompt
  - [x] `uploadReferenceImageAction()` handles file upload from FormData
  - [x] Actions revalidate event page on changes
  - [x] File size validation (max 10MB for reference images)
- **Files**:
  - `web/src/app/actions/scenes.ts` (create) ✅

### Task 2.3: Events List Page ✅
- **Complexity**: M
- **Dependencies**: Task 2.1
- **Description**: Build `/events` page showing all events
- **Acceptance Criteria**:
  - [x] Page fetches events using `listEventsAction()`
  - [x] EventCard component displays title, status, join URL
  - [x] "Create Event" button navigates to `/events/new`
  - [x] Empty state shown when no events
  - [x] Responsive layout (mobile-first)
- **Files**:
  - `web/src/app/events/page.tsx` (create) ✅
  - `web/src/app/events/layout.tsx` (create) ✅
  - `web/src/components/organizer/EventCard.tsx` (create) ✅

### Task 2.4: Event Creation Form ✅
- **Complexity**: M
- **Dependencies**: Task 2.1
- **Description**: Build `/events/new` page with event creation form
- **Acceptance Criteria**:
  - [x] Page structure created
  - [x] Form has title, brand color, title overlay toggle inputs
  - [x] Form validation (title required, color valid hex)
  - [x] Submit calls `createEventAction()`
  - [x] Redirects to event detail page on success
  - [x] Shows error message on failure
  - [x] Custom form components (Input, Button, Label, Switch)
- **Files**:
  - `web/src/app/events/new/page.tsx` (create) ✅
  - `web/src/components/organizer/EventForm.tsx` (create) ✅

### Task 2.5: Event Detail Layout & Tabs ✅
- **Complexity**: S
- **Dependencies**: Task 2.1
- **Description**: Build `/events/[eventId]` layout with tab navigation
- **Acceptance Criteria**:
  - [x] Page structure created with WIP message
  - [x] Layout fetches event and passes to children
  - [x] Tabs for Scene, Branding, Distribution
  - [x] Tab navigation uses Next.js Link
  - [x] Active tab highlighted
  - [x] Event title shown in header
  - [x] Custom TabLink component with active state
- **Files**:
  - `web/src/app/events/[eventId]/layout.tsx` (create) ✅
  - `web/src/app/events/[eventId]/page.tsx` (create) ✅
  - `web/src/components/organizer/TabLink.tsx` (create) ✅

### Task 2.6: Scene Configuration Tab - Mode & Effect ✅
- **Complexity**: M
- **Dependencies**: Task 2.2, Task 2.5
- **Description**: Build Scene tab with mode selector and effect picker
- **Acceptance Criteria**:
  - [x] Mode selector shows Photo (active), Video/GIF/Boomerang (disabled)
  - [x] Effect picker shows background_swap and deep_fake options
  - [x] Visual cards for each effect option
  - [x] Selected effect highlighted
  - [x] Changes save immediately via `updateSceneAction()`
  - [x] Loading state during save
- **Files**:
  - `web/src/app/events/[eventId]/scene/page.tsx` (create) ✅
  - `web/src/components/organizer/ModeSelector.tsx` (create) ✅
  - `web/src/components/organizer/EffectPicker.tsx` (create) ✅

### Task 2.7: Scene Configuration Tab - Prompt Editor ✅
- **Complexity**: S
- **Dependencies**: Task 2.6
- **Description**: Add prompt editing to Scene tab
- **Acceptance Criteria**:
  - [x] Textarea for prompt input
  - [x] Character count display
  - [x] "Reset to Default" button
  - [x] Auto-save on blur or manual Save button
  - [x] Shows current prompt from scene
- **Files**:
  - `web/src/components/organizer/PromptEditor.tsx` (create) ✅
  - Update: `web/src/app/events/[eventId]/scene/page.tsx` ✅

### Task 2.8: Scene Configuration Tab - Reference Image Uploader ✅
- **Complexity**: M
- **Dependencies**: Task 2.6
- **Description**: Add reference image upload to Scene tab
- **Acceptance Criteria**:
  - [x] File input for image upload (JPEG, PNG only)
  - [x] Image preview after upload
  - [x] Replace image button if already uploaded
  - [x] Upload progress indicator
  - [x] Calls `uploadReferenceImageAction()`
  - [x] Shows current reference image if exists
- **Files**:
  - `web/src/components/organizer/RefImageUploader.tsx` (create) ✅
  - Update: `web/src/app/events/[eventId]/scene/page.tsx` ✅
  - Update: `web/src/app/actions/scenes.ts` (added `getImageUrlAction()`) ✅
  - Update: `web/next.config.ts` (configured Firebase Storage image domain) ✅

### Task 2.9: Branding Configuration Tab
- **Complexity**: M
- **Dependencies**: Task 2.1, Task 2.5
- **Description**: Build Branding tab with color picker and preview
- **Acceptance Criteria**:
  - [ ] Brand color picker (native or react-colorful)
  - [ ] Title overlay toggle switch
  - [ ] Live preview of branding
  - [ ] Changes save via `updateEventBrandingAction()`
  - [ ] Preview shows example guest screen with branding applied
- **Files**:
  - `web/src/app/events/[eventId]/branding/page.tsx` (create)
  - `web/src/components/organizer/BrandingForm.tsx` (create)
  - `web/src/components/organizer/BrandColorPicker.tsx` (create)

### Task 2.10: QR Code Generation
- **Complexity**: M
- **Dependencies**: Task 1.7
- **Description**: Implement QR code generation for join URLs
- **Acceptance Criteria**:
  - [ ] `qrcode` library installed
  - [ ] `generateJoinQr()` creates QR code PNG
  - [ ] QR code uploaded to Storage at correct path
  - [ ] QR includes full join URL
  - [ ] Error correction level M
  - [ ] 512x512px output
- **Files**:
  - `web/src/lib/qr/generate.ts` (create)
  - Update: `web/package.json` (add qrcode dependency)

### Task 2.11: Distribution Tab
- **Complexity**: M
- **Dependencies**: Task 2.10, Task 2.5
- **Description**: Build Distribution tab with join URL and QR code
- **Acceptance Criteria**:
  - [ ] Display join URL with copy button
  - [ ] Generate and display QR code (lazy generate on first view)
  - [ ] Download QR code button
  - [ ] "Open Guest View" button opens `/join/:eventId` in new tab
  - [ ] Copy success toast
- **Files**:
  - `web/src/app/events/[eventId]/distribution/page.tsx` (create)
  - `web/src/components/organizer/QRPanel.tsx` (create)

---

## Phase 3: Guest Flow - Capture (Days 5-6)

### Task 3.1: Guest Join Page Structure
- **Complexity**: S
- **Dependencies**: Task 2.1
- **Description**: Create `/join/[eventId]` page with basic structure
- **Acceptance Criteria**:
  - [ ] Page fetches event data
  - [ ] Page validates event exists (404 if not)
  - [ ] Page validates event is "live" (error if draft/archived)
  - [ ] Layout ready for guest flow components
- **Files**:
  - `web/src/app/join/[eventId]/page.tsx` (create)
  - `web/src/app/join/[eventId]/layout.tsx` (create)

### Task 3.2: Brand Theme Provider
- **Complexity**: S
- **Dependencies**: Task 3.1
- **Description**: Create client component to inject brand color as CSS variable
- **Acceptance Criteria**:
  - [ ] Component receives brandColor prop
  - [ ] Sets `--brand` CSS variable on mount
  - [ ] Updates variable when brandColor changes
  - [ ] Wraps guest flow content
- **Files**:
  - `web/src/components/guest/BrandThemeProvider.tsx` (create)
  - Update: `web/src/app/join/[eventId]/page.tsx`

### Task 3.3: Greeting Screen
- **Complexity**: S
- **Dependencies**: Task 3.2
- **Description**: Build initial greeting screen for guests
- **Acceptance Criteria**:
  - [ ] Displays event title (if showTitleOverlay is true)
  - [ ] Shows branded welcome message
  - [ ] "Get Started" button to request camera
  - [ ] Uses brand color for accents
  - [ ] Mobile-responsive layout
- **Files**:
  - `web/src/components/guest/GreetingScreen.tsx` (create)

### Task 3.4: Camera Access Hook
- **Complexity**: M
- **Dependencies**: None
- **Description**: Implement React hook for camera access via MediaDevices API
- **Acceptance Criteria**:
  - [ ] Hook requests user camera (front-facing)
  - [ ] Returns stream, error, and video ref
  - [ ] Cleans up stream on unmount
  - [ ] Handles permission denied gracefully
  - [ ] Mobile browser compatible (iOS Safari, Android Chrome)
- **Files**:
  - `web/src/hooks/useCamera.ts` (create)

### Task 3.5: Camera View Component
- **Complexity**: M
- **Dependencies**: Task 3.4
- **Description**: Build live camera preview component
- **Acceptance Criteria**:
  - [ ] Video element shows live camera feed
  - [ ] Maintains aspect ratio (9:16 or auto)
  - [ ] Fills viewport on mobile
  - [ ] Shows permission error state
  - [ ] Mirror effect for front camera
- **Files**:
  - `web/src/components/guest/CameraView.tsx` (create)

### Task 3.6: Countdown Component
- **Complexity**: S
- **Dependencies**: None
- **Description**: Build 3-2-1 countdown animation
- **Acceptance Criteria**:
  - [ ] Displays 3, 2, 1 with 1-second intervals
  - [ ] Animated transitions (scale/fade)
  - [ ] Calls callback on completion
  - [ ] Overlays camera view
  - [ ] Uses brand color for styling
- **Files**:
  - `web/src/components/guest/Countdown.tsx` (create)

### Task 3.7: Photo Capture Utility
- **Complexity**: S
- **Dependencies**: None
- **Description**: Implement utility to capture photo from video stream
- **Acceptance Criteria**:
  - [ ] Creates canvas from video element
  - [ ] Returns Blob (JPEG, quality 0.9)
  - [ ] Maintains video dimensions
  - [ ] Works on mobile browsers
- **Files**:
  - `web/src/lib/camera/capture.ts` (create)

### Task 3.8: Capture Button & Flow
- **Complexity**: M
- **Dependencies**: Task 3.5, Task 3.6, Task 3.7
- **Description**: Build capture button and orchestrate countdown + snap
- **Acceptance Criteria**:
  - [ ] Large circular capture button
  - [ ] Click starts countdown
  - [ ] Auto-captures after countdown
  - [ ] Button disabled during countdown
  - [ ] Shows preview of captured photo
- **Files**:
  - `web/src/components/guest/CaptureButton.tsx` (create)

### Task 3.9: Session Server Actions
- **Complexity**: M
- **Dependencies**: Task 1.6, Task 1.7
- **Description**: Create Server Actions for session management
- **Acceptance Criteria**:
  - [ ] `startSessionAction()` creates new session
  - [ ] `saveCaptureAction()` uploads photo and updates session
  - [ ] `getSessionAction()` fetches session data
  - [ ] FormData handling for file upload
  - [ ] Error handling for upload failures
- **Files**:
  - `web/src/app/actions/sessions.ts` (create)

### Task 3.10: Guest Flow State Machine with Real-time Updates
- **Complexity**: L
- **Dependencies**: Task 1.2, Task 3.3, Task 3.5, Task 3.8, Task 3.9
- **Description**: Implement useGuestFlow hook with state machine and real-time session subscriptions
- **Acceptance Criteria**:
  - [ ] State machine matches spec section 10
  - [ ] States: greeting, ready_to_capture, countdown, captured, transforming, review_ready, share, error
  - [ ] Transitions handled by actions
  - [ ] Side effects: camera request, upload, transform trigger
  - [ ] **Real-time subscription** to session updates using Client SDK `onSnapshot`
  - [ ] Instant state updates when AI transform completes (no polling)
  - [ ] Subscription cleanup on unmount
  - [ ] Hook returns current state and dispatch function
  - [ ] Integrates all previous guest components
- **Files**:
  - `web/src/hooks/useGuestFlow.ts` (create)
  - Update: `web/src/app/join/[eventId]/page.tsx` (integrate hook)

---

## Phase 4: AI Transform Pipeline (Days 7-8)

### Task 4.1: Nano Banana Types & Config
- **Complexity**: S
- **Dependencies**: None
- **Description**: Define types and environment variables for Nano Banana API
- **Acceptance Criteria**:
  - [ ] `TransformParams` type defined
  - [ ] Environment variables documented (API key, endpoints)
  - [ ] API endpoint configuration by effect type
- **Files**:
  - `web/src/lib/ai/types.ts` (create)
  - Update: `.env.local.example`

### Task 4.2: Mock Transform Implementation
- **Complexity**: M
- **Dependencies**: Task 4.1
- **Description**: Implement mock transform for development (no API dependency)
- **Acceptance Criteria**:
  - [ ] Fetches input image from signed URL
  - [ ] Applies simple overlay (colored tint + text)
  - [ ] Returns Buffer
  - [ ] Simulates 3-5 second processing delay
  - [ ] Used when API endpoint not configured
- **Files**:
  - `web/src/lib/ai/mock.ts` (create)

### Task 4.3: Nano Banana API Integration
- **Complexity**: M
- **Dependencies**: Task 4.1
- **Description**: Implement real Nano Banana API calls
- **Acceptance Criteria**:
  - [ ] `transformWithNanoBanana()` calls correct endpoint by effect
  - [ ] Sends input image URL, reference URL, prompt, brand color
  - [ ] Handles API authentication
  - [ ] Returns result image as Buffer
  - [ ] Throws descriptive errors on failure
  - [ ] Falls back to mock if endpoints not configured
- **Files**:
  - `web/src/lib/ai/nano-banana.ts` (create)
  - Update: `web/package.json` (add node-fetch if needed)

### Task 4.4: Transform Server Action
- **Complexity**: L
- **Dependencies**: Task 4.3, Task 3.9, Task 2.2
- **Description**: Create Server Action to orchestrate AI transform pipeline
- **Acceptance Criteria**:
  - [ ] `triggerTransformAction()` updates session to "transforming"
  - [ ] Fetches session and current scene configuration
  - [ ] Generates signed URLs for input and reference images
  - [ ] Calls `transformWithNanoBanana()` with correct params
  - [ ] Uploads result image to Storage
  - [ ] Updates session to "ready" with resultImagePath
  - [ ] On error, updates session to "error" with message
  - [ ] Revalidates join page path
  - [ ] Handles timeouts (60s max)
- **Files**:
  - Update: `web/src/app/actions/sessions.ts`

### Task 4.5: Result Viewer Component
- **Complexity**: M
- **Dependencies**: None
- **Description**: Build component to display AI-transformed result
- **Acceptance Criteria**:
  - [ ] Shows loading skeleton while transforming
  - [ ] Displays result image when ready
  - [ ] Shows error message if transform failed
  - [ ] Image responsive and maintains aspect ratio
  - [ ] Uses shadcn/ui Skeleton component
- **Files**:
  - `web/src/components/guest/ResultViewer.tsx` (create)

### Task 4.6: Retake Button
- **Complexity**: S
- **Dependencies**: Task 3.10
- **Description**: Build button to restart capture flow
- **Acceptance Criteria**:
  - [ ] Button dispatches "RETAKE" action to state machine
  - [ ] Returns to ready_to_capture state
  - [ ] Keeps existing session or creates new one (implementation choice)
  - [ ] Button styled with brand color
- **Files**:
  - `web/src/components/guest/RetakeButton.tsx` (create)

### Task 4.7: Integrate Transform into Guest Flow
- **Complexity**: M
- **Dependencies**: Task 4.4, Task 4.5, Task 3.10
- **Description**: Connect transform action to guest state machine
- **Acceptance Criteria**:
  - [ ] After capture, state transitions to "transforming"
  - [ ] `triggerTransformAction()` called automatically
  - [ ] Result viewer shows loading state
  - [ ] On completion, state transitions to "review_ready"
  - [ ] On error, state transitions to "error"
  - [ ] Error banner shown with retry option
- **Files**:
  - Update: `web/src/hooks/useGuestFlow.ts`
  - Update: `web/src/app/join/[eventId]/page.tsx`

### Task 4.8: Error Handling & Retry Logic
- **Complexity**: M
- **Dependencies**: Task 4.7
- **Description**: Implement robust error handling for transform failures
- **Acceptance Criteria**:
  - [ ] Transform errors caught and logged
  - [ ] Session marked as "error" with message
  - [ ] Guest sees friendly error message
  - [ ] "Try Again" button re-triggers transform
  - [ ] Transient errors retried automatically (max 3 attempts)
  - [ ] Timeout after 60 seconds
- **Files**:
  - `web/src/components/guest/ErrorBanner.tsx` (create)
  - Update: `web/src/app/actions/sessions.ts` (retry logic)
  - Update: `web/src/hooks/useGuestFlow.ts`

---

## Phase 5: Share & Result Flow (Day 9)

### Task 5.1: Next Button
- **Complexity**: S
- **Dependencies**: Task 4.6
- **Description**: Build button to proceed to share screen
- **Acceptance Criteria**:
  - [ ] Button dispatches "NEXT" action
  - [ ] Transitions from review_ready to share state
  - [ ] Styled with brand color
- **Files**:
  - `web/src/components/guest/NextButton.tsx` (create)

### Task 5.2: Share Link Generation
- **Complexity**: S
- **Dependencies**: Task 1.7
- **Description**: Implement helper to generate shareable result link
- **Acceptance Criteria**:
  - [ ] Generates `/s/:sessionId` URL
  - [ ] Includes full domain (NEXT_PUBLIC_BASE_URL)
  - [ ] Short and easy to share
- **Files**:
  - `web/src/lib/share/links.ts` (create)

### Task 5.3: Session Result Redirect Route
- **Complexity**: M
- **Dependencies**: Task 5.2, Task 1.7
- **Description**: Create `/s/[sessionId]` route that redirects to Storage result URL
- **Acceptance Criteria**:
  - [ ] Route fetches session by ID
  - [ ] Validates session has resultImagePath
  - [ ] Generates public URL for result image
  - [ ] Returns 302 redirect to Storage URL
  - [ ] Returns 404 if session not found or no result
- **Files**:
  - `web/src/app/s/[sessionId]/route.ts` (create)

### Task 5.4: Result QR Code Generation
- **Complexity**: S
- **Dependencies**: Task 2.10, Task 5.2
- **Description**: Generate QR code for result share link
- **Acceptance Criteria**:
  - [ ] `generateResultQr()` creates QR for `/s/:sessionId` URL
  - [ ] Uploaded to Storage (or generated on-the-fly)
  - [ ] 512x512px PNG
  - [ ] Error correction level M
- **Files**:
  - Update: `web/src/lib/qr/generate.ts`

### Task 5.5: Share Panel Component
- **Complexity**: M
- **Dependencies**: Task 5.2, Task 5.4
- **Description**: Build share screen with link, QR, and Web Share API
- **Acceptance Criteria**:
  - [ ] Display result share link (`/s/:sessionId`)
  - [ ] Copy link button with clipboard API
  - [ ] Display result QR code
  - [ ] Download QR button
  - [ ] "Share" button using Web Share API (if available)
  - [ ] Copy success toast
  - [ ] Fallback for browsers without Web Share API
- **Files**:
  - `web/src/components/guest/SharePanel.tsx` (create)

### Task 5.6: Close Button & Return to Greeting
- **Complexity**: S
- **Dependencies**: Task 5.5, Task 3.10
- **Description**: Add button to close share screen and return to greeting
- **Acceptance Criteria**:
  - [ ] "Close" or "Done" button dispatches action
  - [ ] State transitions back to greeting
  - [ ] Camera stream cleaned up if active
  - [ ] Session data cleared from local state
- **Files**:
  - Update: `web/src/components/guest/SharePanel.tsx`
  - Update: `web/src/hooks/useGuestFlow.ts`

### Task 5.7: Integrate Share Flow
- **Complexity**: M
- **Dependencies**: Task 5.1, Task 5.5, Task 5.6, Task 3.10
- **Description**: Connect share components to guest state machine
- **Acceptance Criteria**:
  - [ ] After review, Next button transitions to share state
  - [ ] Share panel shown with session data
  - [ ] Close button returns to greeting
  - [ ] All transitions smooth and tested
- **Files**:
  - Update: `web/src/hooks/useGuestFlow.ts`
  - Update: `web/src/app/join/[eventId]/page.tsx`

---

## Phase 6: Polish & Testing (Day 10)

### Task 6.1: Mobile Responsive Layout
- **Complexity**: M
- **Dependencies**: All UI tasks
- **Description**: Ensure all screens are mobile-responsive and touch-friendly
- **Acceptance Criteria**:
  - [ ] All organizer pages responsive (breakpoints: sm, md, lg)
  - [ ] Guest flow optimized for mobile (viewport-filling)
  - [ ] Touch targets minimum 44x44px
  - [ ] Text readable on small screens
  - [ ] Camera view fills viewport appropriately
  - [ ] No horizontal scroll on mobile
- **Files**:
  - Update: All component and page files (add responsive classes)

### Task 6.2: Loading States & Skeletons
- **Complexity**: S
- **Dependencies**: All UI tasks
- **Description**: Add loading states and skeletons throughout the app
- **Acceptance Criteria**:
  - [ ] Event list shows skeleton while loading
  - [ ] Event detail tabs show loading state
  - [ ] Transform shows skeleton/spinner
  - [ ] Form submissions show loading buttons
  - [ ] Uses shadcn/ui Skeleton component
- **Files**:
  - Update: Relevant page and component files

### Task 6.3: Error States & Validation
- **Complexity**: M
- **Dependencies**: All form tasks
- **Description**: Add comprehensive error handling and validation
- **Acceptance Criteria**:
  - [ ] Form validation errors shown inline
  - [ ] Toast notifications for async errors
  - [ ] Camera permission denied shows help message
  - [ ] Transform failures show retry option
  - [ ] Network errors handled gracefully
  - [ ] 404 pages for invalid routes
- **Files**:
  - `web/src/app/not-found.tsx` (create)
  - Update: Component files (add error states)

### Task 6.4: Toast Notifications
- **Complexity**: S
- **Dependencies**: Task 6.3
- **Description**: Implement toast notification system
- **Acceptance Criteria**:
  - [ ] shadcn/ui Toaster component added
  - [ ] Success toasts for copy, save actions
  - [ ] Error toasts for failures
  - [ ] Toast dismissible
  - [ ] Mobile-friendly positioning
- **Files**:
  - `web/src/components/ui/toaster.tsx` (install via shadcn)
  - Update: `web/src/app/layout.tsx` (add Toaster)
  - Update: Relevant action files

### Task 6.5: Environment Variables & Configuration
- **Complexity**: S
- **Dependencies**: None
- **Description**: Document and validate all environment variables
- **Acceptance Criteria**:
  - [ ] `.env.local.example` complete with all vars
  - [ ] README documents required env vars
  - [ ] Validation on app startup (missing vars)
  - [ ] Separate dev and prod configs
- **Files**:
  - Update: `.env.local.example`
  - Update: `web/README.md`
  - `web/src/lib/config/env.ts` (create validation)

### Task 6.6: Vercel Deployment Configuration
- **Complexity**: M
- **Dependencies**: Task 6.5
- **Description**: Configure Vercel project for deployment
- **Acceptance Criteria**:
  - [ ] Vercel project created and linked
  - [ ] Environment variables set in Vercel dashboard
  - [ ] Build settings configured (root: web/, build: pnpm build)
  - [ ] Custom domain configured (if applicable)
  - [ ] Edge config optimized
  - [ ] Preview deployments enabled for PRs
- **Files**:
  - `vercel.json` (create if needed)
  - Update: `web/package.json` (verify build scripts)

### Task 6.7: Cross-Browser Testing
- **Complexity**: M
- **Dependencies**: All UI tasks
- **Description**: Test app on target browsers and devices
- **Acceptance Criteria**:
  - [ ] Tested on iOS Safari (latest)
  - [ ] Tested on Android Chrome (latest)
  - [ ] Tested on desktop Chrome, Firefox, Safari
  - [ ] Camera works on all mobile browsers
  - [ ] QR codes scan successfully
  - [ ] Share links work correctly
  - [ ] No console errors
  - [ ] Performance acceptable (< 3s initial load)
- **Files**:
  - `TESTING.md` (create test report)

### Task 6.8: End-to-End Test (Manual)
- **Complexity**: L
- **Dependencies**: All previous tasks
- **Description**: Complete manual E2E test of full flow
- **Acceptance Criteria**:
  - [ ] **Organizer**: Create event with title, color, overlay
  - [ ] **Organizer**: Configure scene with background_swap effect
  - [ ] **Organizer**: Edit prompt and upload reference image
  - [ ] **Organizer**: Update branding (color, overlay toggle)
  - [ ] **Organizer**: View join URL and QR code
  - [ ] **Guest**: Scan QR or open link on mobile
  - [ ] **Guest**: Allow camera permission
  - [ ] **Guest**: Capture photo (countdown works)
  - [ ] **Guest**: See loading state during transform
  - [ ] **Guest**: View AI result (matches effect and prompt)
  - [ ] **Guest**: Retake works (new session created)
  - [ ] **Guest**: Share link generated and works
  - [ ] **Guest**: QR code for result generated
  - [ ] **Guest**: Copy link works
  - [ ] **Guest**: Close returns to greeting
  - [ ] Repeat with deep_fake effect
  - [ ] Test error scenarios (camera denied, transform failure)
- **Files**:
  - Update: `TESTING.md` (document test results)

### Task 6.9: Performance Optimization
- **Complexity**: M
- **Dependencies**: Task 6.8
- **Description**: Optimize app performance and bundle size
- **Acceptance Criteria**:
  - [ ] Images optimized (Next.js Image component)
  - [ ] Route code splitting working
  - [ ] Unused dependencies removed
  - [ ] Bundle size analyzed (webpack-bundle-analyzer)
  - [ ] Lighthouse score > 80 on mobile
  - [ ] No unnecessary re-renders (React DevTools)
- **Files**:
  - Update: Component files (add Image components)
  - `web/next.config.js` (optimize settings)

### Task 6.10: Documentation & README
- **Complexity**: S
- **Dependencies**: All tasks
- **Description**: Write comprehensive documentation
- **Acceptance Criteria**:
  - [ ] README includes project overview
  - [ ] README includes setup instructions (Firebase, env vars)
  - [ ] README includes development commands
  - [ ] README includes deployment instructions
  - [ ] Architecture documented (link to plan.md)
  - [ ] Known limitations documented (POC-only features)
  - [ ] Screenshots/GIFs of key flows
- **Files**:
  - Update: `README.md`
  - Update: `web/README.md`

---

## Summary

**Total Tasks**: 70
**Estimated Duration**: 10 days (8 hours/day)
**Complexity Breakdown**:
- Small (S): 29 tasks (~1-2 hours each)
- Medium (M): 37 tasks (~2-3 hours each)
- Large (L): 4 tasks (~3-4 hours each)

**Firebase Architecture**:
- Uses **hybrid approach** (Client SDK + Admin SDK)
- Client SDK (Task 1.2): Real-time subscriptions for guest flow
- Admin SDK (Task 1.2b): Server Actions for all mutations
- Security Rules (Task 1.8): Allow reads, deny writes (force Server Actions)

**Critical Path**:
1. Phase 1 foundation must complete first (including both Client & Admin SDK)
2. Phase 2 (Organizer UI) can start after Task 1.2b, 1.4-1.7
3. Phase 3 (Guest Capture) can start after Task 1.2 (Client SDK) + Phase 1
4. Phase 4 (AI Transform) depends on Phase 3
5. Phase 5 (Share) depends on Phase 4
6. Phase 6 (Polish) runs throughout and concludes project

**Dependencies Flow**:
```
Phase 1 (Foundation - Hybrid Firebase Setup)
    ├─> Phase 2 (Organizer UI - uses Admin SDK) ─┐
    └─> Phase 3 (Guest Capture - uses Client SDK) ─┴─> Phase 4 (AI Transform) ─> Phase 5 (Share) ─> Phase 6 (Polish)
```

**Next Steps**:
1. Review task breakdown with team
2. Assign tasks to developers
3. Use `/build 2025-10-7-poc [task-id]` to implement tasks systematically
4. Update task checklist as work progresses
