import '@testing-library/jest-dom'

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
