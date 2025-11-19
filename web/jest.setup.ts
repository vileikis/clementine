import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfill TextEncoder/TextDecoder for Node environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

// Mock Firebase Admin SDK globally to prevent initialization errors in tests
jest.mock('@/lib/firebase/admin', () => ({
  db: {
    collection: jest.fn(),
    runTransaction: jest.fn(),
  },
  storage: {
    file: jest.fn(),
  },
}))

// Mock ResizeObserver for Radix UI components that use it (like Slider)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock PointerEvent for Radix UI Select component
global.PointerEvent = class PointerEvent extends Event {
  constructor(type: string, params: PointerEventInit = {}) {
    super(type, params);
  }
} as unknown as typeof PointerEvent;

// Mock hasPointerCapture and scrollIntoView for Radix UI Select component
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = jest.fn();
  Element.prototype.setPointerCapture = jest.fn();
  Element.prototype.releasePointerCapture = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
}
