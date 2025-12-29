import { describe, expect, it } from 'vitest'
import {
  COLOR_REGEX,
  themeBackgroundSchema,
  themeButtonSchema,
  themeSchema,
  themeTextSchema,
  updateThemeSchema,
} from './theme.schemas'

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
      radius: 'md',
    }
    expect(() => themeButtonSchema.parse(validButton)).not.toThrow()
  })

  it('should accept null backgroundColor', () => {
    const buttonWithNullBg = {
      backgroundColor: null,
      textColor: '#FFFFFF',
      radius: 'md',
    }
    const result = themeButtonSchema.parse(buttonWithNullBg)
    expect(result.backgroundColor).toBeNull()
  })

  it('should default backgroundColor to null when not provided', () => {
    const buttonWithoutBg = {
      textColor: '#FFFFFF',
      radius: 'md',
    }
    const result = themeButtonSchema.parse(buttonWithoutBg)
    expect(result.backgroundColor).toBeNull()
  })

  it('should accept all radius presets', () => {
    const radii = ['none', 'sm', 'md', 'full']
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
      radius: 'md',
    }
    expect(() => themeButtonSchema.parse(invalidButton)).toThrow(
      'Invalid hex color format',
    )
  })

  it('should reject invalid textColor hex color', () => {
    const invalidButton = {
      backgroundColor: '#FF5733',
      textColor: 'white',
      radius: 'md',
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
  it('should validate valid theme background configuration', () => {
    const validBackground = {
      color: '#FFFFFF',
      image: 'https://example.com/bg.jpg',
      overlayOpacity: 0.5,
    }
    expect(() => themeBackgroundSchema.parse(validBackground)).not.toThrow()
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

  it('should accept overlayOpacity of 0', () => {
    const bgWithZeroOpacity = {
      color: '#FFFFFF',
      image: 'https://example.com/bg.jpg',
      overlayOpacity: 0,
    }
    expect(() => themeBackgroundSchema.parse(bgWithZeroOpacity)).not.toThrow()
  })

  it('should accept overlayOpacity of 1', () => {
    const bgWithFullOpacity = {
      color: '#FFFFFF',
      image: 'https://example.com/bg.jpg',
      overlayOpacity: 1,
    }
    expect(() => themeBackgroundSchema.parse(bgWithFullOpacity)).not.toThrow()
  })

  it('should reject overlayOpacity less than 0', () => {
    const invalidBg = {
      color: '#FFFFFF',
      image: 'https://example.com/bg.jpg',
      overlayOpacity: -0.1,
    }
    expect(() => themeBackgroundSchema.parse(invalidBg)).toThrow()
  })

  it('should reject overlayOpacity greater than 1', () => {
    const invalidBg = {
      color: '#FFFFFF',
      image: 'https://example.com/bg.jpg',
      overlayOpacity: 1.1,
    }
    expect(() => themeBackgroundSchema.parse(invalidBg)).toThrow()
  })

  it('should reject invalid background color', () => {
    const invalidBg = {
      color: 'white',
      image: 'https://example.com/bg.jpg',
      overlayOpacity: 0.5,
    }
    expect(() => themeBackgroundSchema.parse(invalidBg)).toThrow(
      'Invalid hex color format',
    )
  })

  it('should reject invalid image URL', () => {
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
      radius: 'md',
    },
    background: {
      color: '#F0F0F0',
      image: 'https://example.com/bg.jpg',
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

  it('should reject missing primaryColor', () => {
    const { primaryColor, ...themeWithoutPrimary } = validTheme
    expect(() => themeSchema.parse(themeWithoutPrimary)).toThrow()
  })

  it('should reject missing text configuration', () => {
    const { text, ...themeWithoutText } = validTheme
    expect(() => themeSchema.parse(themeWithoutText)).toThrow()
  })

  it('should reject missing button configuration', () => {
    const { button, ...themeWithoutButton } = validTheme
    expect(() => themeSchema.parse(themeWithoutButton)).toThrow()
  })

  it('should reject missing background configuration', () => {
    const { background, ...themeWithoutBackground } = validTheme
    expect(() => themeSchema.parse(themeWithoutBackground)).toThrow()
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

describe('updateThemeSchema', () => {
  it('should validate empty update object', () => {
    expect(() => updateThemeSchema.parse({})).not.toThrow()
  })

  it('should validate partial theme update with only primaryColor', () => {
    const partialUpdate = {
      primaryColor: '#FF0000',
    }
    expect(() => updateThemeSchema.parse(partialUpdate)).not.toThrow()
  })

  it('should validate partial theme update with only text', () => {
    const partialUpdate = {
      text: {
        color: '#000000',
      },
    }
    expect(() => updateThemeSchema.parse(partialUpdate)).not.toThrow()
  })

  it('should validate partial theme update with only text alignment', () => {
    const partialUpdate = {
      text: {
        alignment: 'left',
      },
    }
    expect(() => updateThemeSchema.parse(partialUpdate)).not.toThrow()
  })

  it('should validate partial theme update with only button background', () => {
    const partialUpdate = {
      button: {
        backgroundColor: '#00FF00',
      },
    }
    expect(() => updateThemeSchema.parse(partialUpdate)).not.toThrow()
  })

  it('should validate partial theme update with multiple fields', () => {
    const partialUpdate = {
      primaryColor: '#FF0000',
      text: {
        color: '#FFFFFF',
      },
      button: {
        radius: 'full',
      },
    }
    expect(() => updateThemeSchema.parse(partialUpdate)).not.toThrow()
  })

  it('should reject invalid primaryColor in update', () => {
    const invalidUpdate = {
      primaryColor: 'red',
    }
    expect(() => updateThemeSchema.parse(invalidUpdate)).toThrow(
      'Invalid hex color format',
    )
  })

  it('should reject invalid nested color in update', () => {
    const invalidUpdate = {
      text: {
        color: 'black',
      },
    }
    expect(() => updateThemeSchema.parse(invalidUpdate)).toThrow(
      'Invalid hex color format',
    )
  })

  it('should allow null fontFamily in update', () => {
    const updateWithNullFont = {
      fontFamily: null,
    }
    expect(() => updateThemeSchema.parse(updateWithNullFont)).not.toThrow()
  })

  it('should allow null button backgroundColor in update', () => {
    const updateWithNullBg = {
      button: {
        backgroundColor: null,
      },
    }
    expect(() => updateThemeSchema.parse(updateWithNullBg)).not.toThrow()
  })
})
