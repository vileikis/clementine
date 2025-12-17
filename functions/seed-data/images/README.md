# Seed Images for Emulator Testing

This directory contains test images used to seed the Firebase Storage emulator during development.

## Required Images

Place 12 test images in this directory with the following naming convention:

```
photo-01.jpg
photo-02.jpg
photo-03.jpg
photo-04.jpg
photo-05.jpg
photo-06.jpg
photo-07.jpg
photo-08.jpg
photo-09.jpg
photo-10.jpg
photo-11.jpg
photo-12.jpg
```

## Image Requirements

- **Format**: JPEG (.jpg)
- **Size**: Keep under 500KB each for git performance
- **Content**: Any test photos (landscapes, portraits, objects, etc.)
- **Dimensions**: Any reasonable size (the processing pipeline will resize them)

## Usage

These images are used by the `scripts/seed-emulators.ts` script to create test sessions:

- **Session 1**: Uses `photo-01.jpg` (single image)
- **Session 2**: Uses `photo-07.jpg` through `photo-10.jpg` (4 images)
- **Session 3**: Uses all 12 photos (full sequence)

## Where to Get Test Images

You can use:
- Stock photo sites (Unsplash, Pexels - free license)
- Your own photos
- AI-generated images
- Simple colored rectangles for basic testing

**Recommendation**: Use diverse images (different subjects, orientations) to test edge cases in the media processing pipeline.
