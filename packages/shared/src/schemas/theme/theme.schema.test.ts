import { describe, it, expect } from 'vitest'
import {
  themeSchema,
  themeTextSchema,
  themeButtonSchema,
  themeBackgroundSchema,
  COLOR_REGEX,
  BUTTON_RADIUS_OPTIONS,
} from './theme.schema'
import {
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TEXT_ALIGNMENT,
  DEFAULT_BUTTON_TEXT_COLOR,
  DEFAULT_BUTTON_RADIUS,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_OVERLAY_OPACITY,
} from './theme.constants'

describe('COLOR_REGEX', () => {
  it('accepts valid 6-digit hex colors', () => {
    const validColors = ['#000000', '#FFFFFF', '#ffffff', '#3B82F6', '#AbCdEf']
    validColors.forEach((color) => {
      expect(COLOR_REGEX.test(color)).toBe(true)
    })
  })

  it('rejects invalid hex color formats', () => {
    const invalidColors = [
      '#fff', // 3-digit shorthand
      '#FFFFFFF', // 7 digits
      '#FFFFF', // 5 digits
      'FFFFFF', // missing hash
      '#GGGGGG', // invalid hex chars
      '#12345G', // invalid hex char
      '', // empty
      'red', // color name
      'rgb(0,0,0)', // rgb format
    ]
    invalidColors.forEach((color) => {
      expect(COLOR_REGEX.test(color)).toBe(false)
    })
  })
})

describe('themeTextSchema', () => {
  it('applies defaults when parsing empty object', () => {
    const result = themeTextSchema.parse({})
    expect(result).toEqual({
      color: DEFAULT_TEXT_COLOR,
      alignment: DEFAULT_TEXT_ALIGNMENT,
    })
  })

  it('validates color format', () => {
    expect(() => themeTextSchema.parse({ color: 'invalid' })).toThrow()
    expect(() => themeTextSchema.parse({ color: '#fff' })).toThrow()
  })

  it('validates alignment enum', () => {
    expect(themeTextSchema.parse({ alignment: 'left' }).alignment).toBe('left')
    expect(themeTextSchema.parse({ alignment: 'center' }).alignment).toBe('center')
    expect(themeTextSchema.parse({ alignment: 'right' }).alignment).toBe('right')
    expect(() => themeTextSchema.parse({ alignment: 'justify' })).toThrow()
  })
})

describe('themeButtonSchema', () => {
  it('applies defaults when parsing empty object', () => {
    const result = themeButtonSchema.parse({})
    expect(result).toEqual({
      backgroundColor: null,
      textColor: DEFAULT_BUTTON_TEXT_COLOR,
      radius: DEFAULT_BUTTON_RADIUS,
    })
  })

  it('allows null backgroundColor', () => {
    const result = themeButtonSchema.parse({ backgroundColor: null })
    expect(result.backgroundColor).toBeNull()
  })

  it('validates backgroundColor when provided', () => {
    expect(themeButtonSchema.parse({ backgroundColor: '#FF0000' }).backgroundColor).toBe('#FF0000')
    expect(() => themeButtonSchema.parse({ backgroundColor: 'red' })).toThrow()
  })

  it('validates all radius options', () => {
    BUTTON_RADIUS_OPTIONS.forEach((radius) => {
      expect(themeButtonSchema.parse({ radius }).radius).toBe(radius)
    })
    expect(() => themeButtonSchema.parse({ radius: 'circle' })).toThrow()
  })
})

describe('themeBackgroundSchema', () => {
  it('applies defaults when parsing empty object', () => {
    const result = themeBackgroundSchema.parse({})
    expect(result).toEqual({
      color: DEFAULT_BACKGROUND_COLOR,
      image: null,
      overlayOpacity: DEFAULT_OVERLAY_OPACITY,
    })
  })

  it('validates overlayOpacity bounds (0-1)', () => {
    expect(themeBackgroundSchema.parse({ overlayOpacity: 0 }).overlayOpacity).toBe(0)
    expect(themeBackgroundSchema.parse({ overlayOpacity: 0.5 }).overlayOpacity).toBe(0.5)
    expect(themeBackgroundSchema.parse({ overlayOpacity: 1 }).overlayOpacity).toBe(1)
  })

  it('rejects overlayOpacity outside bounds', () => {
    expect(() => themeBackgroundSchema.parse({ overlayOpacity: -0.1 })).toThrow()
    expect(() => themeBackgroundSchema.parse({ overlayOpacity: 1.1 })).toThrow()
  })

  it('validates image as mediaReference or null', () => {
    const result = themeBackgroundSchema.parse({
      image: { mediaAssetId: 'asset-123', url: 'https://example.com/image.png' },
    })
    expect(result.image).toEqual({ mediaAssetId: 'asset-123', url: 'https://example.com/image.png' })
  })

  it('rejects invalid image url format', () => {
    expect(() =>
      themeBackgroundSchema.parse({
        image: { mediaAssetId: 'asset-123', url: 'not-a-url' },
      })
    ).toThrow()
  })
})

describe('themeSchema', () => {
  it('applies all defaults when parsing empty object', () => {
    const result = themeSchema.parse({})
    expect(result).toEqual({
      fontFamily: null,
      primaryColor: DEFAULT_PRIMARY_COLOR,
      text: {
        color: DEFAULT_TEXT_COLOR,
        alignment: DEFAULT_TEXT_ALIGNMENT,
      },
      button: {
        backgroundColor: null,
        textColor: DEFAULT_BUTTON_TEXT_COLOR,
        radius: DEFAULT_BUTTON_RADIUS,
      },
      background: {
        color: DEFAULT_BACKGROUND_COLOR,
        image: null,
        overlayOpacity: DEFAULT_OVERLAY_OPACITY,
      },
    })
  })

  it('allows partial overrides with nested defaults', () => {
    const result = themeSchema.parse({
      primaryColor: '#FF0000',
      text: { color: '#000000' },
    })
    expect(result.primaryColor).toBe('#FF0000')
    expect(result.text.color).toBe('#000000')
    expect(result.text.alignment).toBe(DEFAULT_TEXT_ALIGNMENT) // default applied
  })

  it('validates primaryColor format', () => {
    expect(() => themeSchema.parse({ primaryColor: 'blue' })).toThrow()
  })

  it('allows nullable fontFamily', () => {
    expect(themeSchema.parse({ fontFamily: null }).fontFamily).toBeNull()
    expect(themeSchema.parse({ fontFamily: 'Inter' }).fontFamily).toBe('Inter')
  })
})
