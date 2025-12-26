import { describe, expect, it } from 'vitest'
import { getWorkspaceInitials } from './getWorkspaceInitials'

describe('getWorkspaceInitials', () => {
  it('returns single letter for single word', () => {
    expect(getWorkspaceInitials('Acme')).toBe('A')
  })

  it('returns two letters for two words', () => {
    expect(getWorkspaceInitials('Acme Inc')).toBe('AI')
  })

  it('returns two letters for three+ words', () => {
    expect(getWorkspaceInitials('Acme Corporation Inc')).toBe('AC')
  })

  it('returns ? for empty string', () => {
    expect(getWorkspaceInitials('')).toBe('?')
  })

  it('returns ? for null', () => {
    expect(getWorkspaceInitials(null)).toBe('?')
  })

  it('returns ? for undefined', () => {
    expect(getWorkspaceInitials(undefined)).toBe('?')
  })

  it('returns ? for whitespace-only string', () => {
    expect(getWorkspaceInitials('   ')).toBe('?')
  })

  it('returns single letter for single-letter workspace', () => {
    expect(getWorkspaceInitials('X')).toBe('X')
  })
})
