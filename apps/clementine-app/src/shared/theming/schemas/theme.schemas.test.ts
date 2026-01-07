import { describe, expect, it } from 'vitest'
import {
  BUTTON_RADIUS_OPTIONS,
  COLOR_REGEX,
  normalizeBackgroundImage,
  themeBackgroundSchema,
  themeButtonSchema,
  themeSchema,
  themeTextSchema,
} from './theme.schemas'
import { mediaReferenceSchema } from './media-reference.schema'

describe('COLOR_REGEX', () => {
  it('should match valid hex colors', () => {
    const validColors = ['#000000', '#FFFFFF', '#FF5733', '#00ff00', '#AbCdEf']
    validColors.forEach((color) => {
      expect(COLOR_REGEX.test(color)).toBe(true)
    })
  })

  it('should reject invalid hex colors', () => {
    const invalidColors = [
      '#FFF', // Too short
      '#FFFFFFF', // Too long
      'FF5733', // Missing #
      '#GG5733', // Invalid characters
      '#ff57', // Wrong length
      'red', // Named color
      'rgb(255,0,0)', // RGB format
      '',
    ]
    invalidColors.forEach((color) => {
      expect(COLOR_REGEX.test(color)).toBe(false)
    })
  })
})

describe('BUTTON_RADIUS_OPTIONS', () => {
  it('should contain expected options', () => {
    expect(BUTTON_RADIUS_OPTIONS).toEqual(['square', 'rounded', 'pill'])
  })
})

describe('mediaReferenceSchema', () => {
  it('should validate valid media reference', () => {
    const validRef = {
      mediaAssetId: 'abc123',
      url: 'https://storage.googleapis.com/bucket/image.jpg',
    }
    expect(() => mediaReferenceSchema.parse(validRef)).not.toThrow()
  })

  it('should accept empty mediaAssetId for legacy data', () => {
    const legacyRef = {
      mediaAssetId: '',
      url: 'https://storage.googleapis.com/bucket/image.jpg',
    }
    const result = mediaReferenceSchema.parse(legacyRef)
    expect(result.mediaAssetId).toBe('')
    expect(result.url).toBe('https://storage.googleapis.com/bucket/image.jpg')
  })

  it('should reject missing mediaAssetId', () => {
    const invalidRef = {
      url: 'https://storage.googleapis.com/bucket/image.jpg',
    }
    expect(() => mediaReferenceSchema.parse(invalidRef)).toThrow()
  })

  it('should reject missing url', () => {
    const invalidRef = {
      mediaAssetId: 'abc123',
    }
    expect(() => mediaReferenceSchema.parse(invalidRef)).toThrow()
  })

  it('should reject invalid url format', () => {
    const invalidRef = {
      mediaAssetId: 'abc123',
      url: 'not-a-url',
    }
    expect(() => mediaReferenceSchema.parse(invalidRef)).toThrow()
  })
})

describe('normalizeBackgroundImage', () => {
  it('should return null for null input', () => {
    expect(normalizeBackgroundImage(null)).toBeNull()
  })

  it('should return null for undefined input', () => {
    expect(normalizeBackgroundImage(undefined)).toBeNull()
  })

  it('should convert string URL to MediaReference', () => {
    const url = 'https://storage.googleapis.com/bucket/image.jpg'
    const result = normalizeBackgroundImage(url)
    expect(result).toEqual({
      mediaAssetId: '',
      url,
    })
  })

  it('should passthrough MediaReference object', () => {
    const ref = {
      mediaAssetId: 'abc123',
      url: 'https://storage.googleapis.com/bucket/image.jpg',
    }
    const result = normalizeBackgroundImage(ref)
    expect(result).toEqual(ref)
  })

  it('should return null for non-string/non-object input', () => {
    expect(normalizeBackgroundImage(123)).toBeNull()
    expect(normalizeBackgroundImage(true)).toBeNull()
    expect(normalizeBackgroundImage([])).toBeNull()
  })
})

describe('themeTextSchema', () => {
  it('should validate valid theme text configuration', () => {
    const validText = {
      color: '#000000',
      alignment: 'center',
    }
    expect(() => themeTextSchema.parse(validText)).not.toThrow()
  })

  it('should accept all alignment values', () => {
    const alignments = ['left', 'center', 'right']
    alignments.forEach((alignment) => {
      const text = {
        color: '#000000',
        alignment,
      }
      expect(() => themeTextSchema.parse(text)).not.toThrow()
    })
  })

  it('should apply defaults for missing fields', () => {
    const result = themeTextSchema.parse({})
    expect(result.color).toBe('#1E1E1E') // Dark text for light theme
    expect(result.alignment).toBe('center')
  })

  it('should reject invalid hex color', () => {
    const invalidText = {
      color: 'red',
      alignment: 'center',
    }
    expect(() => themeTextSchema.parse(invalidText)).toThrow(
      'Invalid hex color format',
    )
  })

  it('should reject invalid alignment', () => {
    const invalidText = {
      color: '#000000',
      alignment: 'justify',
    }
    expect(() => themeTextSchema.parse(invalidText)).toThrow()
  })
})

describe('themeButtonSchema', () => {
  it('should validate valid theme button configuration', () => {
    const validButton = {
      backgroundColor: '#FF5733',
      textColor: '#FFFFFF',
      radius: 'rounded',
    }
    expect(() => themeButtonSchema.parse(validButton)).not.toThrow()
  })

  it('should accept null backgroundColor', () => {
    const buttonWithNullBg = {
      backgroundColor: null,
      textColor: '#FFFFFF',
      radius: 'rounded',
    }
    const result = themeButtonSchema.parse(buttonWithNullBg)
    expect(result.backgroundColor).toBeNull()
  })

  it('should default backgroundColor to null when not provided', () => {
    const buttonWithoutBg = {
      textColor: '#FFFFFF',
      radius: 'rounded',
    }
    const result = themeButtonSchema.parse(buttonWithoutBg)
    expect(result.backgroundColor).toBeNull()
  })

  it('should apply defaults for missing fields', () => {
    const result = themeButtonSchema.parse({})
    expect(result.backgroundColor).toBeNull()
    expect(result.textColor).toBe('#FFFFFF')
    expect(result.radius).toBe('rounded')
  })

  it('should accept all radius presets', () => {
    const radii = ['square', 'rounded', 'pill']
    radii.forEach((radius) => {
      const button = {
        backgroundColor: '#FF5733',
        textColor: '#FFFFFF',
        radius,
      }
      expect(() => themeButtonSchema.parse(button)).not.toThrow()
    })
  })

  it('should reject invalid backgroundColor hex color', () => {
    const invalidButton = {
      backgroundColor: 'blue',
      textColor: '#FFFFFF',
      radius: 'rounded',
    }
    expect(() => themeButtonSchema.parse(invalidButton)).toThrow(
      'Invalid hex color format',
    )
  })

  it('should reject invalid textColor hex color', () => {
    const invalidButton = {
      backgroundColor: '#FF5733',
      textColor: 'white',
      radius: 'rounded',
    }
    expect(() => themeButtonSchema.parse(invalidButton)).toThrow(
      'Invalid hex color format',
    )
  })

  it('should reject invalid radius preset', () => {
    const invalidButton = {
      backgroundColor: '#FF5733',
      textColor: '#FFFFFF',
      radius: 'large',
    }
    expect(() => themeButtonSchema.parse(invalidButton)).toThrow()
  })
})

describe('themeBackgroundSchema', () => {
  it('should validate valid theme background with MediaReference image', () => {
    const validBackground = {
      color: '#FFFFFF',
      image: {
        mediaAssetId: 'abc123',
        url: 'https://example.com/bg.jpg',
      },
      overlayOpacity: 0.5,
    }
    const result = themeBackgroundSchema.parse(validBackground)
    expect(result.image).toEqual({
      mediaAssetId: 'abc123',
      url: 'https://example.com/bg.jpg',
    })
  })

  it('should migrate legacy string URL to MediaReference', () => {
    const legacyBackground = {
      color: '#FFFFFF',
      image: 'https://example.com/bg.jpg',
      overlayOpacity: 0.5,
    }
    const result = themeBackgroundSchema.parse(legacyBackground)
    expect(result.image).toEqual({
      mediaAssetId: '',
      url: 'https://example.com/bg.jpg',
    })
  })

  it('should accept null image', () => {
    const bgWithNullImage = {
      color: '#FFFFFF',
      image: null,
      overlayOpacity: 0.5,
    }
    const result = themeBackgroundSchema.parse(bgWithNullImage)
    expect(result.image).toBeNull()
  })

  it('should default image to null when not provided', () => {
    const bgWithoutImage = {
      color: '#FFFFFF',
      overlayOpacity: 0.5,
    }
    const result = themeBackgroundSchema.parse(bgWithoutImage)
    expect(result.image).toBeNull()
  })

  it('should apply defaults for missing fields', () => {
    const result = themeBackgroundSchema.parse({})
    expect(result.color).toBe('#FFFFFF') // White background for light theme
    expect(result.image).toBeNull()
    expect(result.overlayOpacity).toBe(0.3)
  })

  it('should accept overlayOpacity of 0', () => {
    const bgWithZeroOpacity = {
      color: '#FFFFFF',
      image: { mediaAssetId: 'abc', url: 'https://example.com/bg.jpg' },
      overlayOpacity: 0,
    }
    expect(() => themeBackgroundSchema.parse(bgWithZeroOpacity)).not.toThrow()
  })

  it('should accept overlayOpacity of 1', () => {
    const bgWithFullOpacity = {
      color: '#FFFFFF',
      image: { mediaAssetId: 'abc', url: 'https://example.com/bg.jpg' },
      overlayOpacity: 1,
    }
    expect(() => themeBackgroundSchema.parse(bgWithFullOpacity)).not.toThrow()
  })

  it('should reject overlayOpacity less than 0', () => {
    const invalidBg = {
      color: '#FFFFFF',
      image: { mediaAssetId: 'abc', url: 'https://example.com/bg.jpg' },
      overlayOpacity: -0.1,
    }
    expect(() => themeBackgroundSchema.parse(invalidBg)).toThrow()
  })

  it('should reject overlayOpacity greater than 1', () => {
    const invalidBg = {
      color: '#FFFFFF',
      image: { mediaAssetId: 'abc', url: 'https://example.com/bg.jpg' },
      overlayOpacity: 1.1,
    }
    expect(() => themeBackgroundSchema.parse(invalidBg)).toThrow()
  })

  it('should reject invalid background color', () => {
    const invalidBg = {
      color: 'white',
      image: { mediaAssetId: 'abc', url: 'https://example.com/bg.jpg' },
      overlayOpacity: 0.5,
    }
    expect(() => themeBackgroundSchema.parse(invalidBg)).toThrow(
      'Invalid hex color format',
    )
  })

  it('should reject invalid MediaReference with bad URL', () => {
    const invalidBg = {
      color: '#FFFFFF',
      image: { mediaAssetId: 'abc', url: 'not-a-url' },
      overlayOpacity: 0.5,
    }
    expect(() => themeBackgroundSchema.parse(invalidBg)).toThrow()
  })

  it('should reject legacy string that is not a valid URL', () => {
    const invalidBg = {
      color: '#FFFFFF',
      image: 'not-a-url',
      overlayOpacity: 0.5,
    }
    expect(() => themeBackgroundSchema.parse(invalidBg)).toThrow()
  })
})

describe('themeSchema', () => {
  const validTheme = {
    fontFamily: 'Arial, sans-serif',
    primaryColor: '#FF5733',
    text: {
      color: '#000000',
      alignment: 'center',
    },
    button: {
      backgroundColor: '#00FF00',
      textColor: '#FFFFFF',
      radius: 'rounded',
    },
    background: {
      color: '#F0F0F0',
      image: {
        mediaAssetId: 'abc123',
        url: 'https://example.com/bg.jpg',
      },
      overlayOpacity: 0.5,
    },
  }

  it('should validate complete valid theme', () => {
    expect(() => themeSchema.parse(validTheme)).not.toThrow()
  })

  it('should accept null fontFamily', () => {
    const themeWithNullFont = {
      ...validTheme,
      fontFamily: null,
    }
    const result = themeSchema.parse(themeWithNullFont)
    expect(result.fontFamily).toBeNull()
  })

  it('should default fontFamily to null when not provided', () => {
    const { fontFamily, ...themeWithoutFont } = validTheme
    const result = themeSchema.parse(themeWithoutFont)
    expect(result.fontFamily).toBeNull()
  })

  it('should reject invalid primaryColor', () => {
    const invalidTheme = {
      ...validTheme,
      primaryColor: 'red',
    }
    expect(() => themeSchema.parse(invalidTheme)).toThrow(
      'Invalid hex color format',
    )
  })

  it('should apply all defaults when parsing empty object', () => {
    const result = themeSchema.parse({})
    expect(result.fontFamily).toBeNull()
    expect(result.primaryColor).toBe('#3B82F6')
    expect(result.text).toEqual({ color: '#1E1E1E', alignment: 'center' })
    expect(result.button).toEqual({
      backgroundColor: null,
      textColor: '#FFFFFF',
      radius: 'rounded',
    })
    expect(result.background).toEqual({
      color: '#FFFFFF',
      image: null,
      overlayOpacity: 0.3,
    })
  })

  it('should validate nested schemas correctly', () => {
    const themeWithInvalidNested = {
      ...validTheme,
      text: {
        ...validTheme.text,
        color: 'invalid',
      },
    }
    expect(() => themeSchema.parse(themeWithInvalidNested)).toThrow(
      'Invalid hex color format',
    )
  })
})
