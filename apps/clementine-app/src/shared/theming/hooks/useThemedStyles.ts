import { useMemo } from 'react'
import { useEventTheme } from './useEventTheme'
import type { CSSProperties } from 'react'

/**
 * Style objects returned by useThemedStyles hook
 */
export interface ThemedStyles {
  /** Text styles: color and textAlign */
  text: CSSProperties
  /** Button styles: backgroundColor, color, borderRadius */
  button: CSSProperties
  /** Background styles: backgroundColor, backgroundImage (if present), fontFamily (if present) */
  background: CSSProperties
}

/**
 * Hook that computes inline CSS style objects from theme values.
 *
 * Must be used within a ThemeProvider component.
 *
 * @returns Object with text, button, and background style objects
 *
 * @example
 * ```tsx
 * function ThemedSection() {
 *   const styles = useThemedStyles();
 *
 *   return (
 *     <div style={styles.background}>
 *       <p style={styles.text}>Styled text</p>
 *       <button style={styles.button}>Styled button</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useThemedStyles(): ThemedStyles {
  const { theme, buttonBgColor, buttonTextColor, buttonRadius } =
    useEventTheme()

  return useMemo<ThemedStyles>(() => {
    const textStyles: CSSProperties = {
      color: theme.text.color,
      textAlign: theme.text.alignment,
    }

    const buttonStyles: CSSProperties = {
      backgroundColor: buttonBgColor,
      color: buttonTextColor,
      borderRadius: buttonRadius,
    }

    const backgroundStyles: CSSProperties = {
      backgroundColor: theme.background.color,
      ...(theme.background.image && {
        backgroundImage: `url(${theme.background.image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }),
      ...(theme.fontFamily && { fontFamily: theme.fontFamily }),
    }

    return {
      text: textStyles,
      button: buttonStyles,
      background: backgroundStyles,
    }
  }, [theme, buttonBgColor, buttonTextColor, buttonRadius])
}
