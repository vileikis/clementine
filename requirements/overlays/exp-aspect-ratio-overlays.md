PRD: Experience-Level Prompt & Aspect Ratio System

1. Purpose & Problem Statement

Clementine experiences currently involve multiple competing sources of truth for visual output:
• Camera capture aspect ratio
• AI generation aspect ratio
• Overlay aspect ratio
• Output media constraints (image, GIF, video)
• Project-level vs experience-level configuration

This creates ambiguity, complexity in the transform pipeline, and a high risk of visual bugs (cropping errors, stretched overlays, mismatched compositions).

This PRD defines a single, enforceable hierarchy where:
• The Experience Output Aspect Ratio is the source of truth
• All upstream and downstream systems conform to it
• Prompts, camera capture, AI generation, and overlays are aligned deterministically

⸻

2. Core Principle (Non-Negotiable)

The Experience Output Aspect Ratio dictates everything.

Once an experience is configured with an output aspect ratio, no other system is allowed to override it.

This includes:
• Camera framing
• Image upload handling
• AI generation configuration
• Overlay selection and compositing
• Final media export

If something cannot support the selected ratio, it is not allowed for that experience.

⸻

3. Experience Configuration Model

Each Experience defines:

3.1 Output Media Type
• Image
• GIF
• Video

3.2 Output Aspect Ratio (Required)

Supported ratios depend on media type:

Images & GIFs
• 1:1
• 3:2
• 2:3
• 9:16

Video
• 9:16
• 1:1

This constraint is enforced at config time. Unsupported combinations are not selectable.

⸻

4. Prompt System

4.1 Prompt Ownership
• Each experience has a primary AI generation prompt
• The prompt is authored with the output aspect ratio in mind
• Aspect ratio is injected explicitly into the generation context (not inferred)

Example (conceptual):

“Generate a cinematic portrait optimized for a 3:2 horizontal composition…”

4.2 Prompt Resolution

At job execution time, the prompt is resolved using:
• Experience prompt
• Session inputs
• Fixed output aspect ratio
• Media type constraints

There is no dynamic aspect ratio switching at runtime.

⸻

5. Camera & Input Handling

5.1 Camera Capture
• Camera UI is configured based on the experience’s output aspect ratio
• The camera preview frame visually matches the final output ratio
• Device orientation (portrait / landscape) is derived from the ratio

5.2 Image Uploads
• Uploaded images are:
• Cropped or framed to match the output aspect ratio
• Never stretch or distort
• Any required cropping is made explicit to the user via UI framing

⸻

6. AI Generation Alignment

6.1 Generation Configuration
• AI image/video generation is explicitly instructed to generate in the target ratio
• If the underlying model does not support a ratio, that model cannot be used for the experience

6.2 No Post-Generation Aspect Fixing
• The system does not rely on resizing or cropping AI outputs after generation
• Generation must produce a correctly composed frame from the start

This avoids:
• Cut-off subjects
• Misaligned overlays
• Low-quality upscaling

⸻

7. Overlay System

7.1 Overlay Ownership
• Overlays are defined at the Project level
• Experiences decide whether overlays apply, not which overlay exists

7.2 Overlay Selection Rules

At job execution: 1. The system looks for an overlay matching:
• Media type
• Output aspect ratio 2. If found → apply it 3. If not found → fallback behavior applies

7.3 Fallback Strategy
• Optional default overlay (aspect-ratio-agnostic)
• Or no overlay at all

Fallback behavior is deterministic and explicit.

⸻

8. Transform Job Execution

8.1 Snapshotting

When a job is created, the system snapshots:
• Experience configuration
• Output aspect ratio
• Media type
• Prompt
• Overlay applicability
• Session inputs

This snapshot is immutable.

8.2 Deterministic Execution

The transform pipeline uses only the snapshot, never live config, ensuring:
• Reproducibility
• Debuggability
• Safe retries

8.3 Media Processing
• FFmpeg or equivalent compositing respects the output ratio
• Overlays are merged using ratio-specific layout logic
• No conditional resizing at this stage

⸻

9. UX & Editor Implications

9.1 Experience Editor
• Output aspect ratio is selected early
• Changing it later warns about:
• Prompt assumptions
• Overlay availability
• Model compatibility

9.2 Guardrails
• Invalid combinations are blocked, not warned
• The editor enforces correctness by design

⸻

10. Explicit Non-Goals

This system does not support:
• Multiple output aspect ratios per experience
• Runtime aspect ratio switching
• “Auto” aspect ratios
• Letting AI “figure it out”

Those are future problems. This PRD is about shipping a stable, scalable core.

⸻

11. Open Questions (Intentionally Deferred)
    • Should some overlays be selectable per experience instead of auto-resolved?
    • Do we ever allow experiences to override project overlays?
    • Do we support safe-area overlays for social platforms later?

These are deliberately excluded to avoid premature complexity.
