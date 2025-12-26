import { describe, expect, it } from 'vitest'
import { MOCK_WORKSPACES } from '../constants'
import { getWorkspaceInitials } from '../lib'

describe('WorkspaceSelector logic', () => {
  it('returns correct initials for valid workspace', () => {
    const workspace = MOCK_WORKSPACES.find((w) => w.id === 'acme-inc')
    const initials = getWorkspaceInitials(workspace?.name)
    expect(initials).toBe('AI')
  })

  it('returns single letter for single word workspace', () => {
    const workspace = MOCK_WORKSPACES.find((w) => w.id === 'acme')
    const initials = getWorkspaceInitials(workspace?.name)
    expect(initials).toBe('A')
  })

  it('returns two letters for three word workspace', () => {
    const workspace = MOCK_WORKSPACES.find((w) => w.id === 'acme-corp')
    const initials = getWorkspaceInitials(workspace?.name)
    expect(initials).toBe('AC')
  })

  it('returns ? for empty workspace name', () => {
    const workspace = MOCK_WORKSPACES.find((w) => w.id === 'empty-name')
    const initials = getWorkspaceInitials(workspace?.name)
    expect(initials).toBe('?')
  })

  it('returns ? for invalid workspace ID', () => {
    const workspace = MOCK_WORKSPACES.find((w) => w.id === 'invalid-workspace')
    const initials = getWorkspaceInitials(workspace?.name)
    expect(initials).toBe('?')
  })
})
