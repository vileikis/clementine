import { describe, it, expect } from 'vitest'
import {
  imageMimeTypeSchema,
  mediaAssetTypeSchema,
  mediaAssetStatusSchema,
  mediaReferenceSchema,
  mediaAssetSchema,
  overlayReferenceSchema,
  experienceMediaSchema,
  experienceMediaAssetSchema,
} from './index'

describe('imageMimeTypeSchema', () => {
  it('accepts valid MIME types', () => {
    expect(imageMimeTypeSchema.parse('image/png')).toBe('image/png')
    expect(imageMimeTypeSchema.parse('image/jpeg')).toBe('image/jpeg')
    expect(imageMimeTypeSchema.parse('image/jpg')).toBe('image/jpg')
    expect(imageMimeTypeSchema.parse('image/webp')).toBe('image/webp')
    expect(imageMimeTypeSchema.parse('image/gif')).toBe('image/gif')
  })

  it('rejects invalid MIME types', () => {
    expect(() => imageMimeTypeSchema.parse('image/bmp')).toThrow()
    expect(() => imageMimeTypeSchema.parse('video/mp4')).toThrow()
    expect(() => imageMimeTypeSchema.parse('text/plain')).toThrow()
  })
})

describe('mediaAssetTypeSchema', () => {
  it('accepts valid asset types', () => {
    expect(mediaAssetTypeSchema.parse('overlay')).toBe('overlay')
    expect(mediaAssetTypeSchema.parse('logo')).toBe('logo')
    expect(mediaAssetTypeSchema.parse('other')).toBe('other')
  })

  it('rejects invalid asset types', () => {
    expect(() => mediaAssetTypeSchema.parse('image')).toThrow()
    expect(() => mediaAssetTypeSchema.parse('video')).toThrow()
  })
})

describe('mediaAssetStatusSchema', () => {
  it('accepts valid status values', () => {
    expect(mediaAssetStatusSchema.parse('active')).toBe('active')
    expect(mediaAssetStatusSchema.parse('deleted')).toBe('deleted')
  })

  it('rejects invalid status values', () => {
    expect(() => mediaAssetStatusSchema.parse('pending')).toThrow()
    expect(() => mediaAssetStatusSchema.parse('archived')).toThrow()
  })
})

describe('mediaReferenceSchema', () => {
  it('accepts valid media reference', () => {
    const result = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/image.png',
    })
    expect(result).toEqual({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/image.png',
      filePath: null,
      displayName: 'Untitled', // Default from merged media-naming feature
    })
  })

  it('accepts media reference with filePath', () => {
    const result = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/image.png',
      filePath: 'workspaces/ws-123/media/image.png',
    })
    expect(result.filePath).toBe('workspaces/ws-123/media/image.png')
  })

  it('defaults filePath to null for backward compatibility', () => {
    const result = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/image.png',
    })
    expect(result.filePath).toBeNull()
  })

  it('accepts explicit null filePath', () => {
    const result = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/image.png',
      filePath: null,
    })
    expect(result.filePath).toBeNull()
  })

  it('rejects invalid URL format', () => {
    expect(() =>
      mediaReferenceSchema.parse({
        mediaAssetId: 'asset-123',
        url: 'not-a-url',
      })
    ).toThrow()
  })

  it('rejects missing required fields', () => {
    expect(() => mediaReferenceSchema.parse({})).toThrow()
    expect(() =>
      mediaReferenceSchema.parse({ mediaAssetId: 'asset-123' })
    ).toThrow()
    expect(() =>
      mediaReferenceSchema.parse({ url: 'https://example.com/image.png' })
    ).toThrow()
  })

  it('preserves unknown fields (looseObject forward compatibility)', () => {
    const result = mediaReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/image.png',
      futureField: 'some value',
    }) as Record<string, unknown>
    expect(result['futureField']).toBe('some value')
  })
})

describe('mediaAssetSchema', () => {
  const validMediaAsset = {
    id: 'asset-123',
    fileName: 'overlay-V1StGXR8.png',
    filePath: 'workspaces/ws-123/media/overlay-V1StGXR8.png',
    url: 'https://firebasestorage.googleapis.com/v0/b/test/o/test.png',
    fileSize: 12345,
    mimeType: 'image/png',
    width: 1920,
    height: 1080,
    uploadedAt: 1704067200000,
    uploadedBy: 'user-456',
    type: 'overlay',
  }

  it('accepts valid media asset', () => {
    const result = mediaAssetSchema.parse(validMediaAsset)
    expect(result.id).toBe('asset-123')
    expect(result.fileName).toBe('overlay-V1StGXR8.png')
    expect(result.status).toBe('active') // default
  })

  it('applies default status of active', () => {
    const result = mediaAssetSchema.parse(validMediaAsset)
    expect(result.status).toBe('active')
  })

  it('accepts explicit status value', () => {
    const result = mediaAssetSchema.parse({ ...validMediaAsset, status: 'deleted' })
    expect(result.status).toBe('deleted')
  })

  it('rejects invalid mimeType', () => {
    expect(() =>
      mediaAssetSchema.parse({ ...validMediaAsset, mimeType: 'video/mp4' })
    ).toThrow()
  })

  it('rejects invalid URL format', () => {
    expect(() =>
      mediaAssetSchema.parse({ ...validMediaAsset, url: 'not-a-url' })
    ).toThrow()
  })

  it('rejects non-positive fileSize', () => {
    expect(() =>
      mediaAssetSchema.parse({ ...validMediaAsset, fileSize: 0 })
    ).toThrow()
    expect(() =>
      mediaAssetSchema.parse({ ...validMediaAsset, fileSize: -100 })
    ).toThrow()
  })

  it('rejects non-positive dimensions', () => {
    expect(() =>
      mediaAssetSchema.parse({ ...validMediaAsset, width: 0 })
    ).toThrow()
    expect(() =>
      mediaAssetSchema.parse({ ...validMediaAsset, height: -1 })
    ).toThrow()
  })

  it('preserves unknown fields (looseObject forward compatibility)', () => {
    const result = mediaAssetSchema.parse({
      ...validMediaAsset,
      futureField: 'some value',
    }) as Record<string, unknown>
    expect(result['futureField']).toBe('some value')
  })
})

describe('overlayReferenceSchema (nullable alias)', () => {
  it('accepts valid overlay reference', () => {
    const result = overlayReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/overlay.png',
    })
    expect(result?.mediaAssetId).toBe('asset-123')
  })

  it('accepts null', () => {
    expect(overlayReferenceSchema.parse(null)).toBeNull()
  })
})

describe('experienceMediaSchema (nullable alias)', () => {
  it('accepts valid experience media', () => {
    const result = experienceMediaSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/media.png',
    })
    expect(result?.mediaAssetId).toBe('asset-123')
  })

  it('accepts null', () => {
    expect(experienceMediaSchema.parse(null)).toBeNull()
  })
})

describe('experienceMediaAssetSchema (nullable alias)', () => {
  it('accepts valid experience media asset', () => {
    const result = experienceMediaAssetSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/asset.png',
    })
    expect(result?.mediaAssetId).toBe('asset-123')
  })

  it('accepts null', () => {
    expect(experienceMediaAssetSchema.parse(null)).toBeNull()
  })
})
