## Brief 4: Epic - Advanced Camera Capture Steps (Video & GIF)

**Objective**
Leverage the existing `capture.photo` camera lifecycle renderer to introduce two new capture steps: Video and GIF. Implement corresponding cloud function executors to process the final media outputs.

### Task 4A: Feature - Video Capture Step (`capture.video`)

**Acceptance Criteria**

- **Admin Configuration**: Admins must be able to define the maximum video length (minimum 8 seconds, maximum 60 seconds).
- **Guest Recording**: Guests must be able to start recording and manually stop at any time. The recording must automatically stop if the admin-defined limit is reached.
- **UI/UX**: Re-use the existing camera renderer, adding clear indicators for recording status and elapsed time.
- **Backend Processor**: Create a new `videoOutcome` executor in Cloud Functions to finalize the video file, apply necessary overlays, and save to storage.

### Task 4B: Feature - GIF Capture Step (`capture.gif`)

**Acceptance Criteria**

- **Multi-Photo Capture**: Allow guests to manually capture exactly 4 distinct photos.
- **Progress UI**: Display clear visual feedback indicating how many photos have been taken and how many remain (e.g., "Step 2 of 4"). Do not use a countdown timer; capture must be user-initiated for each frame.
- **Backend Processor**: Create a new `gifOutcome` executor in Cloud Functions.
- **Boomerang Generation**: The cloud function must use the `sharp` library to merge the 4 photos into a boomerang sequence (Frames: 1, 2, 3, 4, 3, 2). Apply necessary overlays before saving.
