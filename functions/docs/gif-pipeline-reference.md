# GIF Pipeline Reference

This document captures the GIF processing algorithm from the legacy `media-pipeline` service for future reference when implementing GIF support in the new transform pipeline.

## Overview

The GIF pipeline creates animated boomerang GIFs from a sequence of input frames (photos). Key features:
- Boomerang effect (forward + reverse playback)
- Palette-based optimization for smaller file sizes
- Scale and center-crop to target dimensions
- Optional overlay compositing

## Pipeline Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     GIF Pipeline Workflow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Download Frames                                             │
│     └─> Unique frames from session.capturedMedia                │
│                                                                 │
│  2. Create Boomerang Sequence                                   │
│     └─> [1,2,3,4] + [3,2,1] = [1,2,3,4,3,2,1]                  │
│     └─> No file duplication, just array references              │
│                                                                 │
│  3. Generate Palette                                            │
│     └─> Extract optimal 256-color palette from frames           │
│     └─> Uses ffmpeg palettegen filter                           │
│                                                                 │
│  4. Create GIF with Palette                                     │
│     └─> Concat file for frame sequence + durations              │
│     └─> Apply palette with dithering (bayer)                    │
│     └─> Infinite loop (-loop 0)                                 │
│                                                                 │
│  5. Scale and Crop GIF                                          │
│     └─> Scale to cover target dimensions                        │
│     └─> Center-crop to exact dimensions                         │
│                                                                 │
│  6. Apply Overlay (optional)                                    │
│     └─> Composite overlay PNG on all frames                     │
│                                                                 │
│  7. Generate Thumbnail                                          │
│     └─> Extract first frame as JPEG                             │
│                                                                 │
│  8. Upload Outputs                                              │
│     └─> GIF + thumbnail to Cloud Storage                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Boomerang Algorithm

Creates a smooth back-and-forth animation without repeating start/end frames:

```typescript
// Original frames: [frame1, frame2, frame3, frame4]
// Reversed middle:         [frame3, frame2]
// Boomerang:       [frame1, frame2, frame3, frame4, frame3, frame2]

const boomerangFrames = [
  ...downloadedFrames,                      // [1, 2, 3, 4]
  ...downloadedFrames.slice(1, -1).reverse() // [3, 2]
];
```

Note: No file duplication - the boomerang array references the same file paths multiple times.

## FFmpeg Commands

### 1. Generate Palette

Creates an optimal 256-color palette from all frames for better GIF quality:

```bash
ffmpeg -f concat -safe 0 -i concat.txt \
  -vf "scale=WIDTH:-1:flags=lanczos,palettegen=stats_mode=diff" \
  -y palette.png
```

Key options:
- `palettegen=stats_mode=diff` - Optimizes for frame differences (better for animation)
- `scale=WIDTH:-1:flags=lanczos` - High-quality scaling

### 2. Create GIF with Palette

```bash
ffmpeg -f concat -safe 0 -i concat.txt -i palette.png \
  -filter_complex "scale=WIDTH:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  -loop 0 \
  -y output.gif
```

Key options:
- `paletteuse=dither=bayer:bayer_scale=5` - Ordered dithering for consistent quality
- `diff_mode=rectangle` - Only encode changed regions (smaller file size)
- `-loop 0` - Infinite loop

### 3. Concat File Format

```
file '/tmp/frame-001.jpg'
duration 0.5
file '/tmp/frame-002.jpg'
duration 0.5
file '/tmp/frame-003.jpg'
duration 0.5
...
```

Duration = 1 / fps (e.g., 2 fps = 0.5s per frame)

### 4. Scale and Crop GIF

Ensures exact output dimensions with center-crop:

```bash
ffmpeg -i input.gif \
  -vf "scale=WIDTH:HEIGHT:flags=lanczos:force_original_aspect_ratio=increase,crop=WIDTH:HEIGHT:(iw-WIDTH)/2:(ih-HEIGHT)/2" \
  -y output.gif
```

Key options:
- `force_original_aspect_ratio=increase` - Scale to cover target dimensions
- `crop=W:H:(iw-W)/2:(ih-H)/2` - Center-crop to exact dimensions

### 5. Apply Overlay

Composites overlay PNG on all GIF frames:

```bash
ffmpeg -i input.gif -i overlay.png \
  -filter_complex "[0][1]overlay=0:0:shortest=1" \
  -y output.gif
```

Note: FFmpeg automatically applies the overlay to all frames in animated formats.

## Configuration

### Target Dimensions

| Aspect Ratio | Width | Height |
|--------------|-------|--------|
| Square (1:1) | 1080  | 1080   |
| Story (9:16) | 1080  | 1920   |

### Timeouts

| Frame Count | Timeout |
|-------------|---------|
| < 5 frames  | 45s     |
| 5-10 frames | 90s     |

### Default FPS

2 fps (0.5s per frame) - Creates smooth, shareable boomerang effect

## Quality Optimizations

1. **Palette generation**: Per-GIF optimal palette instead of generic web colors
2. **Bayer dithering**: Reduces banding artifacts in gradients
3. **Rectangle diff mode**: Only encodes changed pixels between frames
4. **Lanczos scaling**: High-quality resampling algorithm
5. **Scale before crop**: Ensures no letterboxing, fills entire frame

## Error Handling

- Validate minimum 2 frames for GIF
- Validate all input files exist before processing
- Check output file size > 0 after each step
- Cleanup temporary files (concat.txt, palette.png) in finally block

## File Size Considerations

Typical output sizes:
- 4 frames, 1080x1080: ~500KB - 2MB
- 4 frames, 1080x1920: ~800KB - 3MB

Factors affecting size:
- Frame complexity (detailed scenes = larger)
- Color variety (more colors = larger)
- Movement amount (more change = larger)

## Future Implementation Notes

When implementing GIF support in the new transform pipeline:

1. **Node Type**: Consider `output.gif` node type that takes multiple captured media
2. **Boomerang Toggle**: Make boomerang effect optional via node config
3. **FPS Config**: Allow configurable frame rate (1-10 fps)
4. **Frame Selection**: Option to select which captured media to include
5. **AI Transform**: Consider applying AI transform to individual frames before GIF creation
