/**
 * Default Theme Values
 *
 * Default theme configuration used when an event has no theme set.
 */

import type { Theme } from '@/shared/theming/schemas/theme.schemas'

export const DEFAULT_THEME: Theme = {
  fontFamily: null,
  primaryColor: '#3B82F6',
  text: {
    color: '#FFFFFF',
    alignment: 'center',
  },
  button: {
    backgroundColor: null,
    textColor: '#FFFFFF',
    radius: 'md',
  },
  background: {
    color: '#1E1E1E',
    image: null,
    overlayOpacity: 0.5,
  },
}
