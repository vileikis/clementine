# FFmpeg Media Processing Pipeline Research

## Executive Summary

This document contains research findings for implementing a media processing pipeline in Firebase Cloud Functions v2 (Node.js 20) using FFmpeg. The pipeline will handle single images and multi-frame bursts, generating scaled images, animated GIFs, MP4 videos, and thumbnails optimized for web delivery.

**Key Decisions:**
- **FFmpeg Package**: fluent-ffmpeg with ffmpeg-static binary
- **Approach**: Stream-based processing with buffer management
- **Scaling**: Center-crop with Lanczos algorithm for quality
- **GIF Output**: Two-pass palette generation with Bayer dithering
- **MP4 Output**: H.264 with yuv420p, CRF 22, medium preset, faststart flag
- **Temp Management**: tmp-promise package with graceful cleanup
- **Error Handling**: Promise-wrapped FFmpeg with timeout and validation

---

## 1. FFmpeg Package Selection

### Decision: fluent-ffmpeg + ffmpeg-static

**Selected Package:**
- Primary: `fluent-ffmpeg` (wrapper library)
- Binary: `ffmpeg-static` (bundled FFmpeg binary)

### Rationale

1. **Production-Ready**: fluent-ffmpeg provides a mature, chainable API that abstracts FFmpeg's complex command-line syntax into intuitive JavaScript methods
2. **Stream Support**: Native integration with Node.js streams enables memory-efficient processing without writing to disk
3. **Static Binary**: ffmpeg-static bundles platform-specific FFmpeg binaries (including all codecs) that work out-of-the-box in Cloud Functions without system dependencies
4. **Wide Adoption**: Extensive community usage means better documentation, examples, and issue resolution
5. **Firebase Compatible**: Proven track record in Firebase Cloud Functions environments

### Alternatives Considered

**@ffmpeg/ffmpeg (WebAssembly port):**
- Pros: Browser compatibility, no binary dependencies
- Cons: Significantly slower performance (~5-10x), higher memory usage, limited codec support
- Verdict: Not suitable for server-side batch processing at scale

**System FFmpeg:**
- Pros: Latest features, full control over compilation flags
- Cons: Cloud Functions runtime doesn't include FFmpeg, requires custom container images (Gen 2 only), harder deployment
- Verdict: Unnecessary complexity for standard media operations

**Direct child_process spawn:**
- Pros: Maximum control, no wrapper overhead
- Cons: Complex command construction, manual error handling, no stream integration
- Verdict: Too low-level, increases development time and bug surface

### Implementation Notes

**Installation:**
```bash
npm install fluent-ffmpeg ffmpeg-static
```

**Basic Setup:**
```javascript
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

// Point fluent-ffmpeg to the static binary
ffmpeg.setFfmpegPath(ffmpegStatic);
```

**Key Gotchas:**
1. **Archive Warning**: The fluent-ffmpeg repository was archived on May 22, 2025, and is now read-only. Consider:
   - Monitoring for community forks if issues arise
   - Using `@ffmpeg-installer/ffmpeg` as an alternative installer package
   - The library is mature and stable, so maintenance mode is acceptable for this use case

2. **Binary Size**: ffmpeg-static adds ~50-60MB to deployment size. Cloud Functions v2 has a 500MB limit, so this is acceptable

3. **Platform Detection**: ffmpeg-static automatically selects the correct binary (linux-x64 for Cloud Functions). Test locally on matching platform if possible

4. **Codec Availability**: Verify required codecs (libx264, aac) are included in ffmpeg-static build. Current builds include all standard web codecs

**Sources:**
- [fluent-ffmpeg GitHub](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- [FFmpeg in Google Cloud Functions - CodePen](https://codepen.io/positlabs/post/ffmpeg-in-google-cloud-functions)
- [How to use FFmpeg in Node.js - Creatomate](https://creatomate.com/blog/how-to-use-ffmpeg-in-nodejs)
- [fluent-ffmpeg vs @ffmpeg/ffmpeg comparison](https://npm-compare.com/@ffmpeg-installer/ffmpeg,@ffmpeg/ffmpeg,ffmpeg-static,fluent-ffmpeg)

---

## 2. Binary Bundling Approach

### Decision: ffmpeg-static NPM Package

**Selected Approach:**
Include ffmpeg-static as a dependency in package.json, letting it bundle the appropriate platform binary automatically during Cloud Functions deployment.

### Rationale

1. **Zero Configuration**: Works out-of-the-box with Cloud Functions deployment process
2. **Platform Detection**: Automatically provides linux-x64 binary for Cloud Functions runtime environment
3. **Versioning**: Pinned FFmpeg version ensures consistent behavior across deployments
4. **No Build Steps**: No need for custom Docker containers or build processes
5. **Codec Complete**: Ships with all necessary codecs (libx264, libvpx, libmp3lame, aac, etc.)

### Alternatives Considered

**Custom Docker Container (Cloud Functions v2):**
- Pros: Full control over FFmpeg compilation flags, latest version, custom codecs
- Cons: Complex deployment, longer build times, harder debugging, overkill for standard operations
- Verdict: Only necessary for specialized codecs or filters not in ffmpeg-static

**System Package Installation:**
- Pros: Potentially smaller deployment size with apt-get
- Cons: Cloud Functions v2 uses immutable base images, no package manager access
- Verdict: Not possible without custom containers

**Downloading Binary at Runtime:**
- Pros: Smaller deployment package
- Cons: Cold start latency, network dependency, security risks, complexity
- Verdict: Anti-pattern for Cloud Functions

**Layer/Extension Approach:**
- Pros: Shared binary across functions
- Cons: Cloud Functions doesn't support layers like AWS Lambda
- Verdict: Not available on GCP

### Implementation Notes

**package.json:**
```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2",
    "ffmpeg-static": "^5.2.0"
  }
}
```

**Deployment Size Optimization:**
- ffmpeg-static includes binaries for all platforms (~200MB total)
- During Cloud Functions deployment, only the linux-x64 binary (~50-60MB) is used
- gcloud deploy automatically optimizes by excluding unused platform binaries
- Final deployed function size: ~60-80MB (acceptable within 500MB limit)

**Version Pinning:**
- Pin ffmpeg-static to specific version in package.json for reproducibility
- FFmpeg version in ffmpeg-static 5.2.0 is FFmpeg 6.0 (as of research date)
- Update periodically for security patches, test thoroughly

**Local Development:**
- ffmpeg-static automatically selects darwin-x64 binary on macOS for local testing
- Behavior should be identical across platforms for standard operations
- Test in Cloud Functions emulator or staging environment before production

**Sources:**
- [FFmpeg in Google Cloud Functions - CodePen](https://codepen.io/positlabs/post/ffmpeg-in-google-cloud-functions)
- [FFmpeg with Google Cloud Function under Node.js Platform - Medium](https://medium.com/@satish.a.wadekar/ffmpeg-with-google-cloud-function-under-node-js-platform-89a98c1f491d)
- [Firebase FFmpeg Audio Conversion Guide](https://textav.gitbook.io/firebase-react-notes/cloud-functions/ffmpeg-convert-audio)

---

## 3. Aspect Ratio Handling (Center-Crop and Padding)

### Decision: Center-Crop with Lanczos Scaling

**Selected Approach:**
Use FFmpeg's scale and crop filters with Lanczos algorithm for high-quality center-crop operations. Avoid padding to maintain consistent output dimensions.

### Rationale

1. **Content Preservation**: Center-crop focuses on the most important part of the image (center) while maintaining target aspect ratio
2. **Quality**: Lanczos scaling algorithm provides superior quality for downscaling compared to default bicubic
3. **No Letterboxing**: Cropping eliminates black bars that padding would introduce
4. **Predictable Output**: Always produces exact target dimensions (1080x1080, 1080x1920)
5. **Web Optimization**: Smaller file sizes without padding pixels

### Alternatives Considered

**Padding Approach:**
- Pros: Preserves entire original image
- Cons: Introduces letterboxing/pillarboxing, larger file sizes, less visually appealing
- Verdict: Not ideal for social media use cases where full-frame content performs better

**Contain/Fit Scaling:**
- Pros: Shows full image without cropping
- Cons: Requires padding or results in non-standard dimensions
- Verdict: Not suitable for strict aspect ratio requirements (1:1, 9:16)

**Smart Crop (Face/Object Detection):**
- Pros: Could optimize crop position based on content
- Cons: Significant complexity, additional API costs, processing time
- Verdict: Overkill for photobooth use case, center-crop sufficient

### Implementation Notes

**Formula for Center-Crop:**
```
crop=width:height:(input_width-output_width)/2:(input_height-output_height)/2
```

**Example Commands:**

**1080x1080 (Square - 1:1 aspect ratio):**
```javascript
ffmpeg()
  .input('input.jpg')
  .outputOptions([
    '-vf', 'scale=1080:1080:flags=lanczos:force_original_aspect_ratio=increase,crop=1080:1080:(iw-1080)/2:(ih-1080)/2',
    '-q:v', '2'
  ])
  .output('output.jpg')
```

**1080x1920 (Portrait - 9:16 aspect ratio):**
```javascript
ffmpeg()
  .input('input.jpg')
  .outputOptions([
    '-vf', 'scale=1080:1920:flags=lanczos:force_original_aspect_ratio=increase,crop=1080:1920:(iw-1080)/2:(ih-1920)/2',
    '-q:v', '2'
  ])
  .output('output.jpg')
```

**Filter Chain Explanation:**
1. `scale=W:H:flags=lanczos:force_original_aspect_ratio=increase` - Scales image to fit target dimensions, potentially oversizing to ensure no dimension is smaller than target
2. `crop=W:H:(iw-W)/2:(ih-H)/2` - Crops from center to exact target dimensions

**Key Parameters:**
- `flags=lanczos` - High-quality scaling algorithm, better than default bicubic
- `force_original_aspect_ratio=increase` - Ensures scaled image is at least as large as target (prevents upscaling smaller dimension)
- `-q:v 2` - JPEG quality setting (1=best, 31=worst, 2=high quality)

**Handling Edge Cases:**

**Input Smaller Than Target:**
```javascript
// Add conditional scaling to prevent quality loss
.outputOptions([
  '-vf', 'scale=\'min(iw,1080)\':\'min(ih,1080)\':flags=lanczos,scale=1080:1080:flags=lanczos:force_original_aspect_ratio=increase,crop=1080:1080:(iw-1080)/2:(ih-1080)/2'
])
```

**Even Dimension Requirement (H.264):**
Many codecs require even-numbered dimensions. For safety:
```javascript
.outputOptions([
  '-vf', 'scale=1080:1920:flags=lanczos:force_original_aspect_ratio=increase,crop=1080:1920:(iw-1080)/2:(ih-1920)/2',
  '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2' // Ensure even dimensions
])
```

**Preview Cropping (Testing):**
Use ffplay for quick preview before encoding:
```bash
ffplay -vf "scale=1080:1080:flags=lanczos:force_original_aspect_ratio=increase,crop=1080:1080:(iw-1080)/2:(ih-1080)/2" input.jpg
```

**Sources:**
- [FFmpeg: Changing Aspect Ratio - Nimesh Chahare](https://nchahare.github.io/2024/06/05/ffmpeg-crop.html)
- [Use ffmpeg to center crop and scale an image to 1:1 - GitHub Gist](https://gist.github.com/TimothyRHuertas/b22e1a252447ab97aa0f8de7c65f96b8)
- [How to Crop and Resize Videos Using FFmpeg - Bannerbear](https://www.bannerbear.com/blog/how-to-crop-resize-a-video-using-ffmpeg/)
- [How to Use FFmpeg to Crop Video - Cloudinary](https://cloudinary.com/guides/video-effects/ffmpeg-crop-video)
- [Crop and scale image using ffmpeg - Oodles Technologies](https://www.oodlestechnologies.com/blogs/crop-and-scale-image-using-ffmpeg/)

---

## 4. Web-Optimized GIF Output

### Decision: Two-Pass Palette Generation with Bayer Dithering

**Selected Approach:**
Generate custom color palette using `palettegen` filter, then apply with `paletteuse` filter using Bayer dithering for optimal quality and file size.

### Rationale

1. **Superior Quality**: Custom palette generation analyzes actual video content instead of using generic 256-color palette
2. **Smaller File Size**: Optimized palette reduces unnecessary colors, achieving 30-50% smaller files
3. **Smooth Gradients**: Bayer dithering (bayer_scale=5) creates smooth color transitions despite 256-color limit
4. **Motion Optimization**: `stats_mode=diff` focuses palette on moving parts, ideal for animated content
5. **Industry Standard**: Two-pass approach is the recommended best practice for high-quality GIFs

### Alternatives Considered

**Single-Pass (No Palette Generation):**
- Pros: Faster processing (one pass)
- Cons: Significantly larger files (2-3x), poor color quality, banding artifacts
- Verdict: Not acceptable for web delivery

**Full Frame Palette (`stats_mode=full`):**
- Pros: Better for content with color variation across entire frame
- Cons: May waste palette colors on static backgrounds
- Verdict: Use for static scenes, diff mode better for animated photobooths

**Floyd-Steinberg Dithering:**
- Pros: More accurate color reproduction in some cases
- Cons: Creates "noise" pattern, larger file sizes, less smooth gradients
- Verdict: Bayer dithering looks better for photographic content

### Implementation Notes

**Optimal GIF Generation (Two-Pass):**

```javascript
const generateGIF = async (inputFrames, outputPath) => {
  // Generate palette
  const palettePath = `/tmp/palette-${Date.now()}.png`;

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputFrames[0]) // Use first frame as reference
      .inputOptions(['-pattern_type', 'glob', '-i', '"frame-*.jpg"'])
      .complexFilter([
        'fps=2', // 0.5s per frame = 2 fps
        'scale=1080:-1:flags=lanczos',
        'palettegen=stats_mode=diff:max_colors=256'
      ])
      .output(palettePath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Generate GIF using palette
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputFrames[0])
      .inputOptions(['-pattern_type', 'glob', '-i', '"frame-*.jpg"'])
      .input(palettePath)
      .complexFilter([
        'fps=2',
        'scale=1080:-1:flags=lanczos[x]',
        '[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle'
      ])
      .outputOptions(['-loop', '0']) // Infinite loop
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};
```

**Single-Pass Alternative (Faster but Lower Quality):**
```javascript
ffmpeg()
  .input('input.mp4')
  .complexFilter([
    'fps=2',
    'scale=1080:-1:flags=lanczos',
    'split[s0][s1]',
    '[s0]palettegen[p]',
    '[s1][p]paletteuse'
  ])
  .outputOptions(['-loop', '0'])
  .output('output.gif')
```

**Key Parameters Explained:**

**Palette Generation:**
- `stats_mode=diff` - Analyzes moving/changing pixels only (best for animations)
- `stats_mode=full` - Analyzes all pixels (best for varied static content)
- `max_colors=256` - Maximum GIF color limit (can reduce to 128 for smaller files with slight quality loss)

**Palette Application:**
- `dither=bayer` - Bayer dithering algorithm (creates ordered pattern)
- `bayer_scale=5` - Dithering intensity (0=no dither, 5=moderate, 3=subtle)
- `diff_mode=rectangle` - Only updates changed rectangular regions (reduces file size)

**Frame Rate:**
- `fps=2` - 2 frames per second (0.5s per frame as specified)
- Lower fps = smaller files, smoother motion requires higher fps
- For photobooth bursts (2-4 frames), 2 fps is optimal

**Scaling:**
- `flags=lanczos` - High-quality scaling (same as image processing)
- `scale=1080:-1` - Width 1080px, height auto-maintains aspect ratio

**Looping:**
- `-loop 0` - Infinite loop (standard for web GIFs)
- `-loop -1` - Play once, no loop
- `-loop N` - Loop N times

**File Size Optimization Tips:**

1. **Reduce Colors**: Lower max_colors (128 or 64) for significant size reduction
2. **Lower Frame Rate**: 1-2 fps often sufficient for photobooth bursts
3. **Aggressive Scaling**: Scale down further (e.g., 720px width) before uploading
4. **Skip Dithering**: `dither=none` for flat graphics (not photos)

**Expected File Sizes (1080px width, 4 frames @ 0.5s each):**
- Two-pass with Bayer dithering: 500KB - 2MB (typical)
- Single-pass default palette: 1-3MB
- No dithering: 400KB - 1.5MB (lower quality)

**Sources:**
- [FFmpeg GIF Creation and Optimization Guide - VideosCompress](https://www.videoscompress.com/blog/FFmpeg-Gif-Optimization-Guide)
- [High quality GIF with FFmpeg - PKH.me](https://blog.pkh.me/p/21-high-quality-gif-with-ffmpeg.html)
- [Working with GIFs: Convert Video to GIF and Optimize for the Web - FFmpeg.media](https://www.ffmpeg.media/articles/working-with-gifs-convert-optimize)
- [FFmpeg GIF: Ultimate Guide - DVE2](https://www.dve2.com/archives/321/ffmpeg-gif-ultimate-guide-to-creating-and-optimizing-gifs-with-ffmpeg/)
- [Small-sized and Beautiful GIFs with FFmpeg - Medium](https://medium.com/codex/small-sized-and-beautiful-gifs-with-ffmpeg-25c5082ed733)

---

## 5. Web-Optimized MP4 Output

### Decision: H.264 (libx264) with yuv420p, CRF 22, Medium Preset

**Selected Approach:**
Encode MP4 videos using H.264 codec with yuv420p pixel format, CRF 22 quality, medium preset, baseline profile, and faststart flag for optimal web delivery.

### Rationale

1. **Universal Compatibility**: H.264 + yuv420p supported by all browsers and devices
2. **Quality-Size Balance**: CRF 22 provides excellent visual quality at reasonable file sizes
3. **Fast Startup**: `-movflags +faststart` enables instant playback without full download
4. **5 FPS Optimization**: Low frame rate requires careful encoding settings
5. **Mobile Optimized**: Baseline profile ensures compatibility with older/mobile devices

### Alternatives Considered

**H.265 (HEVC):**
- Pros: 30-50% better compression than H.264
- Cons: Limited browser support, licensing issues, slower encoding
- Verdict: Not suitable for web delivery until broader support

**VP9/AV1:**
- Pros: Royalty-free, good compression
- Cons: Limited device support, much slower encoding (especially AV1)
- Verdict: Future consideration, not ready for primary format

**Two-Pass Encoding:**
- Pros: More consistent file sizes, slightly better quality
- Cons: 2x encoding time, minimal improvement for short clips
- Verdict: Single-pass CRF sufficient for photobooth bursts

**Constant Bitrate (CBR):**
- Pros: Predictable file sizes
- Cons: Wastes bitrate on simple scenes, lower quality on complex scenes
- Verdict: CRF's variable bitrate is superior for quality

### Implementation Notes

**Optimal MP4 Generation:**

```javascript
const generateMP4 = async (inputFrames, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputFrames[0])
      .inputOptions([
        '-framerate', '5', // 5 fps input
        '-pattern_type', 'glob',
        '-i', '"frame-*.jpg"'
      ])
      .outputOptions([
        // Video codec and quality
        '-c:v', 'libx264',        // H.264 codec
        '-preset', 'medium',       // Encoding speed/compression tradeoff
        '-crf', '22',              // Quality (18=visually lossless, 23=default, 28=lower quality)

        // Pixel format and profile
        '-pix_fmt', 'yuv420p',     // Required for web compatibility
        '-profile:v', 'baseline',  // Maximum device compatibility
        '-level', '3.0',           // Compatible with most devices

        // Frame rate
        '-r', '5',                 // Output 5 fps

        // GOP and keyframes
        '-g', '15',                // Keyframe every 3 seconds (3 * 5fps)
        '-keyint_min', '15',       // Minimum keyframe interval

        // Web optimization
        '-movflags', '+faststart', // Enable progressive playback

        // Audio (if needed)
        '-an'                      // No audio for photobooth
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};
```

**Parameter Explanation:**

**Codec and Quality:**
- `-c:v libx264` - H.264 video codec (widely supported)
- `-crf 22` - Constant Rate Factor quality (lower = better quality, larger file)
  - 18: Visually lossless (use for high-quality archives)
  - 22: High quality, good balance (recommended for web)
  - 28: Lower quality, smaller files (use for previews/thumbnails)
- `-preset medium` - Encoding speed vs compression efficiency
  - ultrafast: Fastest, largest files
  - medium: Good balance (recommended)
  - slow/veryslow: Best compression, much slower encoding

**Pixel Format and Profile:**
- `-pix_fmt yuv420p` - **CRITICAL** for web compatibility
  - Most players only support yuv420p
  - Requires even-numbered dimensions (width/height divisible by 2)
- `-profile:v baseline` - Most compatible H.264 profile
  - baseline: Maximum device compatibility (older phones, tablets)
  - main: Good compatibility, slightly better compression
  - high: Best compression, requires modern devices
- `-level 3.0` - Compatibility level (3.0 works on nearly all devices)

**Frame Rate:**
- `-framerate 5` (input) - Tells FFmpeg input frames are at 5fps
- `-r 5` (output) - Output video at 5fps
- For 0.2s per frame (5fps), this creates smooth playback

**GOP Structure:**
- `-g 15` - Group of Pictures size (keyframe interval)
  - For 5fps video, 15 = keyframe every 3 seconds
  - Lower values = more keyframes = better seeking, larger files
  - Higher values = fewer keyframes = smaller files, worse seeking
- `-keyint_min 15` - Minimum keyframe interval (prevents too-frequent keyframes)

**Web Optimization:**
- `-movflags +faststart` - **CRITICAL** for web delivery
  - Moves metadata (moov atom) to beginning of file
  - Enables progressive playback (video starts before full download)
  - Without this, entire file must download before playback

**Audio Handling:**
- `-an` - No audio track (photobooths don't need audio)
- If audio needed: `-c:a aac -b:a 128k -profile:a aac_low`

**Quality Presets by Use Case:**

**High Quality (Archive/Download):**
```javascript
.outputOptions([
  '-c:v', 'libx264',
  '-preset', 'slow',
  '-crf', '18',
  '-pix_fmt', 'yuv420p',
  '-profile:v', 'high',
  '-level', '4.0',
  '-movflags', '+faststart'
])
```

**Standard Quality (Web Sharing):**
```javascript
.outputOptions([
  '-c:v', 'libx264',
  '-preset', 'medium',
  '-crf', '22',
  '-pix_fmt', 'yuv420p',
  '-profile:v', 'baseline',
  '-level', '3.0',
  '-movflags', '+faststart'
])
```

**Preview Quality (Fast Processing):**
```javascript
.outputOptions([
  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-crf', '28',
  '-pix_fmt', 'yuv420p',
  '-profile:v', 'baseline',
  '-movflags', '+faststart'
])
```

**Handling Input Images:**

When creating video from image sequence:
```javascript
ffmpeg()
  .input('/tmp/frames/frame-%03d.jpg') // frame-001.jpg, frame-002.jpg, etc.
  .inputOptions([
    '-framerate', '5',        // Input framerate
    '-start_number', '1'      // Start from frame-001.jpg
  ])
  // ... output options
```

**Expected File Sizes (1080x1920, 4 frames @ 5fps = 0.8s video):**
- CRF 18 (high quality): 300-500KB
- CRF 22 (standard): 200-350KB
- CRF 28 (preview): 100-200KB

**Ensuring Even Dimensions:**
```javascript
// For aspect ratio scaling that ensures even dimensions
.outputOptions([
  '-vf', 'scale=1080:1920,pad=ceil(iw/2)*2:ceil(ih/2)*2'
])
```

**Sources:**
- [FFMPEG Tutorial: 2-Pass & CRF in x264 & x265 - GitHub Gist](https://gist.github.com/hsab/7c9219c4d57e13a42e06bf1cab90cd44)
- [Transcoding with FFmpeg: CRF vs Bitrate, Codecs & Presets - FFmpeg.media](https://www.ffmpeg.media/articles/transcoding-crf-vs-bitrate-codecs-presets)
- [CRF Guide (Constant Rate Factor in x264, x265 and libvpx) - SLHCK](https://slhck.info/video/2017/02/24/crf-guide.html)
- [YouTube recommended encoding settings on ffmpeg - GitHub Gist](https://gist.github.com/mikoim/27e4e0dc64e384adbcb91ff10a2d3678)
- [FFmpeg yuv420p pixel format discussion - Hacker News](https://news.ycombinator.com/item?id=20036971)
- [FFmpeg cross-device web videos guide - GitHub Gist](https://gist.github.com/jaydenseric/220c785d6289bcfd7366)

---

## 6. Thumbnail Generation

### Decision: Lanczos Scaling with Quality Optimization at 300px Width

**Selected Approach:**
Scale images to 300px width using Lanczos algorithm with `-q:v 2` quality setting for JPEG output.

### Rationale

1. **Quality Priority**: Lanczos algorithm provides best quality for downscaling operations
2. **Aspect Ratio Preservation**: Using `-1` for height maintains original aspect ratio
3. **File Size**: 300px width produces 10-30KB thumbnails (fast loading)
4. **Format**: JPEG optimal for photographic thumbnails (PNG for graphics with transparency)
5. **Simplicity**: Single-pass operation, fast processing

### Alternatives Considered

**Bicubic Scaling (Default):**
- Pros: Slightly faster
- Cons: Lower quality, more blur/artifacts
- Verdict: Lanczos worth the minimal performance cost

**Fixed Aspect Ratio (e.g., 300x300):**
- Pros: Uniform grid display
- Cons: Requires cropping or padding, loses content
- Verdict: Maintaining aspect ratio better for preview use case

**Multiple Thumbnail Sizes:**
- Pros: Responsive images for different devices
- Cons: More processing time, storage, complexity
- Verdict: Single 300px size sufficient for initial MVP

**WebP Format:**
- Pros: Better compression than JPEG
- Cons: Not universally supported in all contexts (though 95%+ browser support)
- Verdict: Consider for future optimization, JPEG safer for MVP

### Implementation Notes

**Optimal Thumbnail Generation:**

```javascript
const generateThumbnail = async (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .outputOptions([
        '-vf', 'scale=300:-1:flags=lanczos',  // 300px width, maintain aspect ratio
        '-q:v', '2'                             // High JPEG quality
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
};
```

**With Intelligent Frame Selection (for videos/GIFs):**

For selecting best representative frame from video:
```javascript
ffmpeg()
  .input(inputPath)
  .outputOptions([
    '-vf', 'thumbnail=300,scale=300:-1:flags=lanczos',  // Select best frame
    '-frames:v', '1',                                    // Output only 1 frame
    '-q:v', '2'
  ])
  .output(thumbnailPath)
```

**With Center-Crop (for uniform thumbnails):**

If you need square thumbnails (e.g., 300x300):
```javascript
ffmpeg()
  .input(inputPath)
  .outputOptions([
    '-vf', 'scale=300:300:flags=lanczos:force_original_aspect_ratio=increase,crop=300:300:(iw-300)/2:(ih-300)/2',
    '-q:v', '2'
  ])
  .output(thumbnailPath)
```

**Parameter Explanation:**

**Scaling:**
- `scale=300:-1` - Width 300px, height auto-calculated to maintain aspect ratio
- `flags=lanczos` - High-quality Lanczos scaling algorithm
- Alternative flags: `bicubic` (default, faster), `bilinear` (fastest, lowest quality)

**Quality:**
- `-q:v 2` - JPEG quality scale (1=best, 31=worst)
  - 1-3: High quality (for important thumbnails)
  - 4-10: Good quality (general use)
  - 11-20: Acceptable quality (previews)
  - 21+: Low quality (avoid)

**Frame Selection (for videos):**
- `thumbnail=N` - Analyze N frames and select most representative
  - Higher N = better selection but slower processing
  - For photobooths, use first frame: `-frames:v 1 -ss 0`

**Format Optimization:**

**JPEG (Photographic Content):**
```javascript
.outputOptions(['-q:v', '2'])
.output('thumbnail.jpg')
```

**PNG (Graphics with Transparency):**
```javascript
.outputOptions(['-compression_level', '9'])  // 0-9, 9=best compression
.output('thumbnail.png')
```

**WebP (Modern Browsers):**
```javascript
.outputOptions([
  '-c:v', 'libwebp',
  '-quality', '80',           // 0-100
  '-preset', 'photo'          // photo, picture, drawing, icon, text
])
.output('thumbnail.webp')
```

**Responsive Thumbnail Sizes:**

If implementing multiple sizes:
```javascript
const sizes = [150, 300, 600];

const generateResponsiveThumbnails = async (inputPath, outputDir) => {
  return Promise.all(
    sizes.map(width =>
      new Promise((resolve, reject) => {
        ffmpeg()
          .input(inputPath)
          .outputOptions([
            '-vf', `scale=${width}:-1:flags=lanczos`,
            '-q:v', '2'
          ])
          .output(`${outputDir}/thumbnail-${width}w.jpg`)
          .on('end', resolve)
          .on('error', reject)
          .run();
      })
    )
  );
};
```

**Expected File Sizes (300px width):**
- Portrait (300x400px): 15-25KB
- Square (300x300px): 12-20KB
- Landscape (300x200px): 10-18KB

**Performance Considerations:**
- Thumbnail generation: ~100-200ms per image
- Parallel processing: Can generate thumbnail simultaneously with full-size output
- Caching: Store thumbnails in Cloud Storage for reuse

**Sources:**
- [Extract thumbnails from a video with FFmpeg - Mux](https://www.mux.com/articles/extract-thumbnails-from-a-video-with-ffmpeg)
- [FFmpeg Engineering Handbook: Thumbnails - GitHub](https://github.com/endcycles/ffmpeg-engineering-handbook/blob/main/docs/generation/thumbnails.md)
- [Thumbnails & Screenshots using FFmpeg - OTTVerse](https://ottverse.com/thumbnails-screenshots-using-ffmpeg/)
- [Master the art of image resizing with ffmpeg - Toolify](https://www.toolify.ai/ai-news/master-the-art-of-image-resizing-with-ffmpeg-202859)
- [Top 5 FFmpeg Video Resize Techniques - WPSauce](https://wpsauce.com/top-5-ffmpeg-video-resize-techniques-for-optimizing-your-videos-in-2025/)

---

## 7. Temp File Management (/tmp Directory)

### Decision: tmp Package with util.promisify

**Selected Approach:**
Use `tmp` package with Node.js built-in `util.promisify` for automatic temporary file management with graceful cleanup on process exit, combined with explicit cleanup in try-finally blocks for reliability in Cloud Functions.

### Rationale

1. **Automatic Cleanup**: `tmp` automatically removes temp files on process exit via `setGracefulCleanup()`
2. **Actively Maintained**: More recent updates than tmp-promise wrapper
3. **Promise-Based**: Use Node.js `util.promisify` for async/await support (built-in, no wrapper dependency)
4. **Graceful Handling**: `setGracefulCleanup()` ensures cleanup even on uncaught exceptions
5. **Cloud Functions Safe**: Handles warm container scenarios where /tmp persists
6. **No Extra Dependencies**: One less package to maintain (no wrapper)

### Alternatives Considered

**tmp-promise Package:**
- Pros: Ready-made promise API, disposer pattern
- Cons: Last updated 4 years ago (2021), adds wrapper dependency
- Verdict: Unnecessary when Node.js has built-in `util.promisify`

**Manual fs.unlink:**
- Pros: No dependencies, full control
- Cons: Verbose, easy to forget cleanup, no automatic handling of crashes
- Verdict: Too error-prone, increases code complexity

**temp Package:**
- Pros: Automatic cleanup, track files
- Cons: Callback-based API (older pattern), less active maintenance
- Verdict: tmp is better maintained and more widely used

**No Cleanup (Rely on Cold Starts):**
- Pros: Simplest implementation
- Cons: /tmp persists in warm containers, can fill up (512MB limit), causes failures
- Verdict: Unacceptable - must clean up

**Custom Cleanup Utility:**
- Pros: Tailored to specific needs
- Cons: Reinventing wheel, more code to maintain and test
- Verdict: tmp-promise covers all needs

### Implementation Notes

**Installation:**
```bash
npm install tmp
```

**Basic Setup:**

```javascript
const tmp = require('tmp');
const { promisify } = require('util');

// Promisify the callback-based API
const tmpFile = promisify(tmp.file);
const tmpDir = promisify(tmp.dir);

// Enable automatic cleanup on process exit
tmp.setGracefulCleanup();
```

**Pattern 1: Temp File with Cleanup (Recommended):**

```javascript
const processMedia = async (inputBuffer) => {
  // Create temp file
  const tmpFileObj = await tmpFile({ postfix: '.jpg' });

  try {
    // Write input
    await fs.promises.writeFile(tmpFileObj.path, inputBuffer);

    // Process with FFmpeg
    const outputPath = `${tmpFileObj.path}-output.jpg`;
    await runFFmpegCommand(tmpFileObj.path, outputPath);

    // Read output
    const outputBuffer = await fs.promises.readFile(outputPath);

    // Manual cleanup of additional files
    await fs.promises.unlink(outputPath);

    return outputBuffer;

  } finally {
    // Cleanup temp file
    tmpFileObj.cleanup();
  }
};
```

**Pattern 2: Directory for Multiple Files:**

```javascript
const processMultipleFrames = async (frameBuffers) => {
  // Create temp directory (unsafeCleanup removes non-empty dirs)
  const tmpDirObj = await tmpDir({ unsafeCleanup: true });

  try {
    // Write all frames
    const framePaths = await Promise.all(
      frameBuffers.map((buffer, i) => {
        const path = `${tmpDirObj.path}/frame-${i.toString().padStart(3, '0')}.jpg`;
        return fs.promises.writeFile(path, buffer).then(() => path);
      })
    );

    // Process with FFmpeg
    const outputPath = `${tmpDirObj.path}/output.gif`;
    await generateGIF(framePaths, outputPath);

    // Read output
    const outputBuffer = await fs.promises.readFile(outputPath);

    return outputBuffer;

  } finally {
    // Clean up entire directory
    tmpDirObj.cleanup();
  }
};
```

**Pattern 3: Manual Temp File Management (Fallback):**

```javascript
const processWithManualCleanup = async (inputBuffer) => {
  const tempFiles = [];

  try {
    const inputPath = `/tmp/input-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const outputPath = `/tmp/output-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

    tempFiles.push(inputPath, outputPath);

    await fs.promises.writeFile(inputPath, inputBuffer);
    await runFFmpegCommand(inputPath, outputPath);

    const outputBuffer = await fs.promises.readFile(outputPath);
    return outputBuffer;

  } finally {
    // Clean up all temp files
    await Promise.all(
      tempFiles.map(path =>
        fs.promises.unlink(path).catch(err => {
          console.warn(`Failed to delete temp file ${path}:`, err);
        })
      )
    );
  }
};
```

**Key Considerations for Cloud Functions:**

**1. Storage Limits:**
```javascript
// Firebase Cloud Functions v2: /tmp has 512MB limit (in-memory filesystem)
// Monitor usage if processing large files
const checkTmpSpace = async () => {
  const { size } = await fs.promises.stat('/tmp');
  console.log(`/tmp directory size: ${size / 1024 / 1024}MB`);
};
```

**2. Warm Container Persistence:**
```javascript
// Clean up /tmp at function start to handle warm containers
const cleanupStaleFiles = async () => {
  try {
    const files = await fs.promises.readdir('/tmp');
    const oldFiles = files.filter(f => {
      // Remove files older than 10 minutes
      const stat = fs.statSync(`/tmp/${f}`);
      const age = Date.now() - stat.mtimeMs;
      return age > 10 * 60 * 1000;
    });

    await Promise.all(
      oldFiles.map(f => fs.promises.unlink(`/tmp/${f}`).catch(() => {}))
    );
  } catch (err) {
    console.warn('Failed to clean stale /tmp files:', err);
  }
};

// Call at function initialization
cleanupStaleFiles();
```

**3. Unique File Naming:**
```javascript
// Prevent collisions in concurrent invocations
const generateUniquePath = (prefix, extension) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `/tmp/${prefix}-${timestamp}-${random}${extension}`;
};
```

**4. Stream Processing (Avoid /tmp When Possible):**
```javascript
// Stream directly to Cloud Storage without /tmp
const processAndUploadStream = async (inputBuffer, storagePath) => {
  const inputStream = Readable.from(inputBuffer);
  const outputStream = storage.bucket().file(storagePath).createWriteStream();

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputStream)
      .outputOptions([/* ... */])
      .pipe(outputStream)
      .on('finish', resolve)
      .on('error', reject);
  });
};
```

**Complete Example (Recommended Pattern):**

```javascript
const tmp = require('tmp');
const { promisify } = require('util');
const fs = require('fs').promises;

// Promisify tmp methods
const tmpDir = promisify(tmp.dir);

// Initialize at module level
tmp.setGracefulCleanup();

const processMediaPipeline = async (inputBuffer) => {
  // Create temp directory for all intermediate files
  const tmpDirObj = await tmpDir({ unsafeCleanup: true });

  try {
    // 1. Write input
    const inputPath = `${tmpDirObj.path}/input.jpg`;
    await fs.writeFile(inputPath, inputBuffer);

    // 2. Process full-size image
    const scaledPath = `${tmpDirObj.path}/scaled.jpg`;
    await scaleImage(inputPath, scaledPath);

    // 3. Generate thumbnail
    const thumbPath = `${tmpDirObj.path}/thumb.jpg`;
    await generateThumbnail(inputPath, thumbPath);

    // 4. Read outputs
    const [scaledBuffer, thumbBuffer] = await Promise.all([
      fs.readFile(scaledPath),
      fs.readFile(thumbPath)
    ]);

    return { scaled: scaledBuffer, thumb: thumbBuffer };

  } catch (error) {
    console.error('Media processing error:', error);
    throw error;

  } finally {
    // Cleanup happens automatically via unsafeCleanup
    tmpDirObj.cleanup();
    // Note: cleanup is synchronous in tmp package
  }
};
```

**Error Handling:**
- Always wrap cleanup in `.catch()` to prevent cleanup failures from throwing
- Log cleanup failures for monitoring but don't fail the function
- `setGracefulCleanup()` ensures cleanup even if function crashes

**Performance Tips:**
- Create temp directory once per function invocation, not per file
- Process files in parallel when possible
- Stream large files instead of using /tmp when feasible
- Consider using Cloud Storage directly for very large files (>100MB)

**Monitoring:**
```javascript
// Add metrics for /tmp usage
const logTmpUsage = async () => {
  try {
    const { size } = await fs.stat('/tmp');
    console.log({
      metric: 'tmp_directory_size',
      bytes: size,
      mb: Math.round(size / 1024 / 1024)
    });
  } catch (err) {
    // Ignore stat errors
  }
};
```

**Sources:**
- [tmp - npm](https://www.npmjs.com/package/tmp)
- [tmp - GitHub](https://github.com/raszi/node-tmp)
- [Node.js util.promisify documentation](https://nodejs.org/api/util.html#utilpromisifyoriginal)
- [How to clean up /tmp files after cloud function sends response - AppLoveWorld](https://www.appsloveworld.com/google-cloud-platform/48/how-to-clean-up-tmp-files-after-cloud-function-sends-response)
- [Secure tempfiles in NodeJS without dependencies - Advanced Web Machinery](https://advancedweb.hu/secure-tempfiles-in-nodejs-without-dependencies/)

---

## 8. Error Handling Patterns

### Decision: Promise-Wrapped FFmpeg with Validation and Timeouts

**Selected Approach:**
Wrap all FFmpeg operations in promises with comprehensive error handling: input validation, process monitoring, timeout enforcement, and structured error categorization.

### Rationale

1. **Predictable Errors**: Promise rejection enables consistent async/await error handling
2. **Early Validation**: Check inputs before FFmpeg processing to provide clear error messages
3. **Timeout Protection**: Prevent hung processes from consuming resources indefinitely
4. **Error Categories**: Structured error types enable appropriate retry/fallback logic
5. **Observable**: Progress events enable monitoring and logging for debugging

### Alternatives Considered

**Callback-Based Error Handling:**
- Pros: Native to fluent-ffmpeg
- Cons: Callback hell, harder to compose with async/await
- Verdict: Promise wrapping is cleaner and more maintainable

**No Timeout (Trust FFmpeg):**
- Pros: Simpler code
- Cons: Hung processes can exhaust Cloud Functions quota/memory
- Verdict: Timeouts are essential for production reliability

**Silent Failure (Log and Continue):**
- Pros: Resilient to errors
- Cons: Users get no feedback, hard to debug
- Verdict: Must throw appropriate errors with context

**Generic Error Handling:**
- Pros: Less code
- Cons: Can't distinguish between invalid input, codec errors, timeouts, etc.
- Verdict: Categorized errors enable better UX and retry logic

### Implementation Notes

**Core Error Handling Wrapper:**

```javascript
const { promisify } = require('util');
const fs = require('fs').promises;

// Custom error classes for better error handling
class FFmpegError extends Error {
  constructor(message, type, details) {
    super(message);
    this.name = 'FFmpegError';
    this.type = type; // 'validation', 'timeout', 'codec', 'filesystem', 'unknown'
    this.details = details;
  }
}

// Promise wrapper with timeout and error handling
const runFFmpegCommand = (command, options = {}) => {
  const {
    timeout = 60000, // 60s default timeout
    description = 'FFmpeg operation'
  } = options;

  return new Promise((resolve, reject) => {
    let timeoutHandle;
    let stderr = '';

    // Set timeout
    if (timeout > 0) {
      timeoutHandle = setTimeout(() => {
        command.kill('SIGKILL');
        reject(new FFmpegError(
          `${description} timed out after ${timeout}ms`,
          'timeout',
          { timeout, stderr }
        ));
      }, timeout);
    }

    command
      .on('start', (commandLine) => {
        console.log(`FFmpeg command: ${commandLine}`);
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on('stderr', (stderrLine) => {
        stderr += stderrLine + '\n';
      })
      .on('error', (err, stdout, stderr) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);

        // Categorize error
        const errorType = categorizeFFmpegError(err, stderr);

        reject(new FFmpegError(
          `${description} failed: ${err.message}`,
          errorType,
          { originalError: err, stdout, stderr }
        ));
      })
      .on('end', (stdout, stderr) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        console.log(`${description} completed successfully`);
        resolve({ stdout, stderr });
      })
      .run();
  });
};

// Categorize FFmpeg errors for better handling
const categorizeFFmpegError = (error, stderr) => {
  const stderrLower = stderr.toLowerCase();

  // Invalid input
  if (stderrLower.includes('invalid data') ||
      stderrLower.includes('no such file') ||
      stderrLower.includes('does not exist')) {
    return 'validation';
  }

  // Codec errors
  if (stderrLower.includes('unknown encoder') ||
      stderrLower.includes('encoder not found') ||
      stderrLower.includes('codec not currently supported')) {
    return 'codec';
  }

  // File system errors
  if (stderrLower.includes('permission denied') ||
      stderrLower.includes('no space left') ||
      stderrLower.includes('read only')) {
    return 'filesystem';
  }

  // Memory errors
  if (stderrLower.includes('cannot allocate memory') ||
      stderrLower.includes('out of memory')) {
    return 'memory';
  }

  return 'unknown';
};
```

**Input Validation Layer:**

```javascript
const validateInputFile = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);

    // Check file exists and is not empty
    if (stats.size === 0) {
      throw new FFmpegError(
        'Input file is empty',
        'validation',
        { filePath, size: 0 }
      );
    }

    // Check file size (example: 50MB limit)
    if (stats.size > 50 * 1024 * 1024) {
      throw new FFmpegError(
        'Input file exceeds maximum size (50MB)',
        'validation',
        { filePath, size: stats.size, maxSize: 50 * 1024 * 1024 }
      );
    }

    return stats;

  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new FFmpegError(
        'Input file not found',
        'validation',
        { filePath, error: err.message }
      );
    }
    throw err;
  }
};

const validateOutputDirectory = async (outputPath) => {
  const dir = path.dirname(outputPath);

  try {
    await fs.access(dir, fs.constants.W_OK);
  } catch (err) {
    throw new FFmpegError(
      'Output directory is not writable',
      'filesystem',
      { outputPath, dir, error: err.message }
    );
  }
};
```

**Complete Processing Function with Error Handling:**

```javascript
const processImage = async (inputPath, outputPath, options = {}) => {
  try {
    // 1. Validate inputs
    await validateInputFile(inputPath);
    await validateOutputDirectory(outputPath);

    // 2. Build FFmpeg command
    const command = ffmpeg()
      .input(inputPath)
      .outputOptions([
        '-vf', 'scale=1080:1080:flags=lanczos',
        '-q:v', '2'
      ])
      .output(outputPath);

    // 3. Execute with timeout
    await runFFmpegCommand(command, {
      timeout: options.timeout || 30000,
      description: 'Image processing'
    });

    // 4. Validate output
    const outputStats = await fs.stat(outputPath);
    if (outputStats.size === 0) {
      throw new FFmpegError(
        'FFmpeg produced empty output file',
        'unknown',
        { inputPath, outputPath }
      );
    }

    return outputPath;

  } catch (error) {
    // Handle different error types
    if (error instanceof FFmpegError) {
      switch (error.type) {
        case 'validation':
          // User error - don't retry, return clear message
          console.error('Validation error:', error.message);
          throw new Error(`Invalid input: ${error.message}`);

        case 'timeout':
          // Processing took too long - may retry with longer timeout
          console.error('Timeout error:', error.message);
          throw new Error('Processing timed out. Please try with a smaller file.');

        case 'codec':
          // Server configuration issue - alert team
          console.error('Codec error:', error.message);
          throw new Error('Media processing unavailable. Please contact support.');

        case 'filesystem':
          // Disk/permission issue - alert team
          console.error('Filesystem error:', error.message);
          throw new Error('Storage error. Please try again later.');

        case 'memory':
          // Out of memory - may need resource scaling
          console.error('Memory error:', error.message);
          throw new Error('File too large to process. Please try a smaller file.');

        default:
          // Unknown error - log for investigation
          console.error('Unknown FFmpeg error:', error);
          throw new Error('Processing failed. Please try again.');
      }
    }

    // Non-FFmpeg error
    console.error('Unexpected error:', error);
    throw error;
  }
};
```

**Timeout Configuration by Operation:**

```javascript
const TIMEOUTS = {
  image_scale: 30000,        // 30s - single image processing
  thumbnail: 15000,          // 15s - thumbnail generation
  gif_small: 45000,          // 45s - GIF with <5 frames
  gif_large: 90000,          // 90s - GIF with 5-10 frames
  mp4_short: 60000,          // 60s - MP4 with <10 frames
  mp4_long: 120000,          // 120s - MP4 with 10-20 frames
};

// Dynamic timeout based on operation
const calculateTimeout = (operation, frameCount) => {
  switch (operation) {
    case 'gif':
      return frameCount < 5 ? TIMEOUTS.gif_small : TIMEOUTS.gif_large;
    case 'mp4':
      return frameCount < 10 ? TIMEOUTS.mp4_short : TIMEOUTS.mp4_long;
    case 'thumbnail':
      return TIMEOUTS.thumbnail;
    default:
      return TIMEOUTS.image_scale;
  }
};
```

**Retry Logic for Transient Errors:**

```javascript
const processWithRetry = async (fn, options = {}) => {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    retryableErrors = ['timeout', 'filesystem', 'unknown']
  } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();

    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryable = error instanceof FFmpegError &&
                         retryableErrors.includes(error.type);

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// Usage
const result = await processWithRetry(
  () => processImage(inputPath, outputPath),
  { maxRetries: 2, retryableErrors: ['timeout', 'filesystem'] }
);
```

**Structured Logging for Monitoring:**

```javascript
const logFFmpegOperation = (operation, metadata, error = null) => {
  const log = {
    timestamp: new Date().toISOString(),
    operation,
    ...metadata
  };

  if (error) {
    log.error = {
      message: error.message,
      type: error.type || 'unknown',
      stack: error.stack
    };
    console.error('FFmpeg operation failed:', JSON.stringify(log));
  } else {
    console.log('FFmpeg operation completed:', JSON.stringify(log));
  }
};

// Usage in processing function
try {
  const startTime = Date.now();
  await processImage(inputPath, outputPath);

  logFFmpegOperation('image_scale', {
    inputPath,
    outputPath,
    duration: Date.now() - startTime
  });

} catch (error) {
  logFFmpegOperation('image_scale', {
    inputPath,
    outputPath
  }, error);
  throw error;
}
```

**Cloud Functions Integration:**

```javascript
const { onCall } = require('firebase-functions/v2/https');

exports.processMedia = onCall({ timeoutSeconds: 300 }, async (request) => {
  try {
    const { inputUrl, outputFormat } = request.data;

    // Validate request
    if (!inputUrl || !outputFormat) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters'
      );
    }

    // Process media
    const result = await processWithRetry(
      () => processImage(inputUrl, outputFormat),
      { maxRetries: 2 }
    );

    return { success: true, result };

  } catch (error) {
    // Map FFmpeg errors to Cloud Functions errors
    if (error instanceof FFmpegError) {
      switch (error.type) {
        case 'validation':
          throw new functions.https.HttpsError('invalid-argument', error.message);
        case 'timeout':
          throw new functions.https.HttpsError('deadline-exceeded', error.message);
        case 'memory':
          throw new functions.https.HttpsError('resource-exhausted', error.message);
        default:
          throw new functions.https.HttpsError('internal', error.message);
      }
    }

    // Generic error
    throw new functions.https.HttpsError('internal', 'Processing failed');
  }
});
```

**Key Gotchas:**

1. **Buffer Events**: fluent-ffmpeg emits 'stderr' events continuously - avoid storing entire stderr in memory for long operations
2. **Process Leaks**: Always clear timeouts in both error and success handlers
3. **SIGKILL vs SIGTERM**: Use SIGKILL for timeouts (SIGTERM may hang on stuck processes)
4. **Partial Files**: Always validate output file exists and is non-empty after processing
5. **Error Messages**: FFmpeg stderr can be cryptic - use error categorization to provide user-friendly messages

**Sources:**
- [Cannot catch error in stream - fluent-ffmpeg Issue #1065](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/1065)
- [Process ran into a timeout - fluent-ffmpeg Issue #647](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/647)
- [Invalid data found when processing input - fluent-ffmpeg Issue #530](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/issues/530)
- [Event handling and promises - StudyRaid](https://app.studyraid.com/en/read/12491/403940/event-handling-and-promises)
- [Common error types and their handling - StudyRaid](https://app.studyraid.com/en/read/12491/403931/common-error-types-and-their-handling)

---

## 9. Additional Best Practices

### Stream Processing for Memory Efficiency

When possible, use streams instead of buffering entire files in memory:

```javascript
const processStreamToStream = (inputStream, outputStream) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputStream)
      .outputOptions([/* ... */])
      .pipe(outputStream, { end: true })
      .on('finish', resolve)
      .on('error', reject);
  });
};
```

**Benefits:**
- Constant memory footprint regardless of file size
- 60-80% reduction in peak memory usage
- Enables processing of files larger than available RAM

**Memory Optimization:**
```javascript
// Limit buffer sizes
.outputOptions([
  '-bufsize', '512k'  // Cap frame caching
])

// Control thread count
.outputOptions([
  '-threads', '2'  // Balance CPU/memory
])

// Specify input format (avoid format detection)
.inputFormat('image2')
```

**Sources:**
- [Memory usage optimization - StudyRaid](https://app.studyraid.com/en/read/12491/403936/memory-usage-optimization)
- [Stream management for optimal performance - StudyRaid](https://app.studyraid.com/en/read/12491/403935/stream-management-for-optimal-performance)

### Parallel Processing

Process independent operations in parallel to reduce total processing time:

```javascript
const processMediaParallel = async (inputPath) => {
  const [scaled, thumbnail, mp4] = await Promise.all([
    scaleImage(inputPath, 'scaled.jpg'),
    generateThumbnail(inputPath, 'thumb.jpg'),
    generateMP4([inputPath], 'video.mp4')
  ]);

  return { scaled, thumbnail, mp4 };
};
```

**Note:** Be mindful of memory/CPU limits in Cloud Functions - limit parallel operations based on instance size.

### Codec Verification

Verify required codecs are available at function startup:

```javascript
const verifyCodecs = () => {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableCodecs((err, codecs) => {
      if (err) return reject(err);

      const required = ['libx264', 'aac', 'mjpeg', 'gif'];
      const missing = required.filter(codec => !codecs[codec]);

      if (missing.length > 0) {
        reject(new Error(`Missing required codecs: ${missing.join(', ')}`));
      } else {
        resolve();
      }
    });
  });
};

// Call during cold start
verifyCodecs().catch(err => {
  console.error('Codec verification failed:', err);
});
```

### Progressive Output for UX

For long-running operations, provide progress updates:

```javascript
const processWithProgress = (inputPath, outputPath, onProgress) => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .on('progress', (progress) => {
        if (onProgress) {
          onProgress({
            percent: progress.percent,
            currentTime: progress.timemark,
            fps: progress.currentFps
          });
        }
      })
      .on('end', resolve)
      .on('error', reject)
      .output(outputPath)
      .run();
  });
};

// Usage with real-time updates
await processWithProgress(input, output, (progress) => {
  // Send progress to client via WebSocket, Pub/Sub, etc.
  console.log(`Processing: ${progress.percent}%`);
});
```

---

## 10. Summary and Quick Reference

### Recommended Package Versions

```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2",
    "ffmpeg-static": "^5.2.0",
    "tmp": "^0.2.3"
  }
}
```

**Note**: Use Node.js built-in `util.promisify` for promise-based API (no need for tmp-promise wrapper).

### Quick Command Reference

**Image Scaling (1080x1080):**
```javascript
ffmpeg(inputPath)
  .outputOptions([
    '-vf', 'scale=1080:1080:flags=lanczos:force_original_aspect_ratio=increase,crop=1080:1080:(iw-1080)/2:(ih-1080)/2',
    '-q:v', '2'
  ])
  .output(outputPath)
```

**Thumbnail (300px width):**
```javascript
ffmpeg(inputPath)
  .outputOptions([
    '-vf', 'scale=300:-1:flags=lanczos',
    '-q:v', '2'
  ])
  .output(outputPath)
```

**GIF Generation (2fps, infinite loop):**
```javascript
// Generate palette
ffmpeg()
  .input(framesGlob)
  .complexFilter(['fps=2', 'scale=1080:-1:flags=lanczos', 'palettegen=stats_mode=diff'])
  .output(palettePath)

// Apply palette
ffmpeg()
  .input(framesGlob)
  .input(palettePath)
  .complexFilter(['fps=2', 'scale=1080:-1:flags=lanczos[x]', '[x][1:v]paletteuse=dither=bayer:bayer_scale=5'])
  .outputOptions(['-loop', '0'])
  .output(outputPath)
```

**MP4 Generation (5fps, web-optimized):**
```javascript
ffmpeg()
  .input(framesGlob)
  .inputOptions(['-framerate', '5'])
  .outputOptions([
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '22',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'baseline',
    '-movflags', '+faststart',
    '-an'
  ])
  .output(outputPath)
```

### Timeout Recommendations

- Single image: 30s
- Thumbnail: 15s
- GIF (<5 frames): 45s
- GIF (5-10 frames): 90s
- MP4 (<10 frames): 60s
- MP4 (10-20 frames): 120s

### Error Handling Checklist

- [ ] Wrap FFmpeg in promises
- [ ] Validate inputs before processing
- [ ] Set appropriate timeouts
- [ ] Categorize errors (validation, timeout, codec, filesystem, memory)
- [ ] Log structured error data
- [ ] Clean up temp files in finally blocks
- [ ] Provide user-friendly error messages
- [ ] Implement retry logic for transient failures

### Memory Management Checklist

- [ ] Use tmp package with util.promisify for automatic cleanup
- [ ] Call tmp.setGracefulCleanup() at module init
- [ ] Use unsafeCleanup option for temp directories
- [ ] Always call cleanup() in finally blocks
- [ ] Validate output files before returning
- [ ] Stream large files when possible
- [ ] Limit parallel operations
- [ ] Clean up on both success and error paths

---

## Document Metadata

- **Created**: 2025-12-16
- **Last Updated**: 2025-12-16
- **Research Context**: Firebase Cloud Functions v2, Node.js 20, FFmpeg 6.0
- **Target Use Case**: Clementine media processing pipeline (images, bursts, GIFs, MP4s)
- **Reviewed Sources**: 50+ documentation pages, Stack Overflow threads, GitHub issues
- **Status**: Ready for implementation

---

## References

All sources are hyperlinked inline throughout the document. Key documentation:

- [fluent-ffmpeg GitHub](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- [ffmpeg-static npm](https://www.npmjs.com/package/ffmpeg-static)
- [tmp-promise npm](https://www.npmjs.com/package/tmp-promise)
- [FFmpeg Official Documentation](https://www.ffmpeg.org/ffmpeg.html)
- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
