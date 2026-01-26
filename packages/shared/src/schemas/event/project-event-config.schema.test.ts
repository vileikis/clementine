import { describe, it, expect } from 'vitest'
import {
  overlayReferenceSchema,
  overlaysConfigSchema,
  shareOptionsConfigSchema,
  ctaConfigSchema,
  shareConfigSchema,
  welcomeConfigSchema,
  projectEventConfigSchema,
  experiencePickerLayoutSchema,
  CURRENT_CONFIG_VERSION,
} from './project-event-config.schema'

describe('overlayReferenceSchema', () => {
  it('accepts valid overlay reference', () => {
    const result = overlayReferenceSchema.parse({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/overlay.png',
    })
    expect(result).toEqual({
      mediaAssetId: 'asset-123',
      url: 'https://example.com/overlay.png',
      filePath: null,
    })
  })

  it('accepts null', () => {
    expect(overlayReferenceSchema.parse(null)).toBeNull()
  })

  it('rejects invalid URL format', () => {
    expect(() =>
      overlayReferenceSchema.parse({
        mediaAssetId: 'asset-123',
        url: 'not-a-url',
      })
    ).toThrow()
  })
})

describe('overlaysConfigSchema', () => {
  it('applies null default when parsing undefined', () => {
    const result = overlaysConfigSchema.parse(undefined)
    expect(result).toBeNull()
  })

  it('applies null defaults for aspect ratio slots', () => {
    const result = overlaysConfigSchema.parse({})
    expect(result).toEqual({
      '1:1': null,
      '9:16': null,
    })
  })

  it('accepts overlay references for each aspect ratio', () => {
    const overlay = { mediaAssetId: 'asset-1', url: 'https://example.com/1.png' }
    const result = overlaysConfigSchema.parse({
      '1:1': overlay,
      '9:16': null,
    })
    expect(result!['1:1']).toEqual({ ...overlay, filePath: null })
    expect(result!['9:16']).toBeNull()
  })
})

describe('shareOptionsConfigSchema', () => {
  it('applies defaults when parsing empty object', () => {
    const result = shareOptionsConfigSchema.parse({})
    expect(result).toEqual({
      download: true,
      copyLink: true,
      email: false,
      instagram: false,
      facebook: false,
      linkedin: false,
      twitter: false,
      tiktok: false,
      telegram: false,
    })
  })

  it('allows overriding individual options', () => {
    const result = shareOptionsConfigSchema.parse({
      download: false,
      instagram: true,
    })
    expect(result.download).toBe(false)
    expect(result.instagram).toBe(true)
    expect(result.copyLink).toBe(true) // default preserved
  })
})

describe('ctaConfigSchema', () => {
  it('applies null defaults', () => {
    const result = ctaConfigSchema.parse({})
    expect(result).toEqual({
      label: null,
      url: null,
    })
  })

  it('accepts string values', () => {
    const result = ctaConfigSchema.parse({
      label: 'Click here',
      url: 'https://example.com',
    })
    expect(result.label).toBe('Click here')
    expect(result.url).toBe('https://example.com')
  })
})

describe('shareConfigSchema', () => {
  it('applies null defaults', () => {
    const result = shareConfigSchema.parse({})
    expect(result).toEqual({
      title: null,
      description: null,
      cta: null,
    })
  })

  it('accepts nested cta config', () => {
    const result = shareConfigSchema.parse({
      title: 'Share your creation',
      cta: { label: 'Visit us', url: 'https://example.com' },
    })
    expect(result.title).toBe('Share your creation')
    expect(result.cta).toEqual({ label: 'Visit us', url: 'https://example.com' })
  })
})

describe('welcomeConfigSchema', () => {
  it('applies defaults when parsing empty object', () => {
    const result = welcomeConfigSchema.parse({})
    expect(result).toEqual({
      title: 'Choose your experience',
      description: null,
      media: null,
      layout: 'list',
    })
  })

  it('validates layout enum', () => {
    expect(welcomeConfigSchema.parse({ layout: 'list' }).layout).toBe('list')
    expect(welcomeConfigSchema.parse({ layout: 'grid' }).layout).toBe('grid')
    expect(() => welcomeConfigSchema.parse({ layout: 'carousel' })).toThrow()
  })

  it('accepts media reference', () => {
    const result = welcomeConfigSchema.parse({
      media: { mediaAssetId: 'asset-1', url: 'https://example.com/welcome.png' },
    })
    expect(result.media).toEqual({
      mediaAssetId: 'asset-1',
      url: 'https://example.com/welcome.png',
      filePath: null,
    })
  })
})

describe('experiencePickerLayoutSchema', () => {
  it('accepts valid layout values', () => {
    expect(experiencePickerLayoutSchema.parse('list')).toBe('list')
    expect(experiencePickerLayoutSchema.parse('grid')).toBe('grid')
  })

  it('rejects invalid layout values', () => {
    expect(() => experiencePickerLayoutSchema.parse('carousel')).toThrow()
    expect(() => experiencePickerLayoutSchema.parse('tiles')).toThrow()
  })
})

describe('projectEventConfigSchema', () => {
  it('applies defaults when parsing empty object', () => {
    const result = projectEventConfigSchema.parse({})
    expect(result.schemaVersion).toBe(CURRENT_CONFIG_VERSION)
    expect(result.overlays).toBeNull()
    expect(result.shareOptions).toBeNull()
    expect(result.share).toBeNull()
    expect(result.welcome).toBeNull()
    expect(result.theme).toBeNull()
    expect(result.experiences).toBeNull()
  })

  it('preserves unknown fields (looseObject forward compatibility)', () => {
    const result: Record<string, unknown> = projectEventConfigSchema.parse({
      futureField: 'some value',
      anotherFutureField: 123,
    })
    expect(result['futureField']).toBe('some value')
    expect(result['anotherFutureField']).toBe(123)
  })

  it('composes nested schemas correctly', () => {
    const result = projectEventConfigSchema.parse({
      theme: {
        primaryColor: '#FF0000',
      },
      welcome: {
        title: 'Welcome!',
      },
      experiences: {
        main: [{ experienceId: 'exp-1' }],
      },
    })
    expect(result.theme?.primaryColor).toBe('#FF0000')
    expect(result.welcome?.title).toBe('Welcome!')
    expect(result.experiences?.main).toHaveLength(1)
  })

  it('validates nested theme schema', () => {
    expect(() =>
      projectEventConfigSchema.parse({
        theme: { primaryColor: 'not-a-hex' },
      })
    ).toThrow()
  })
})
