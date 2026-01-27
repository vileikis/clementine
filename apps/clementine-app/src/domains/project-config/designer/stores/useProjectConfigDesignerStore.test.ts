import { beforeEach, describe, expect, it } from 'vitest'
import { useProjectConfigDesignerStore } from './useProjectConfigDesignerStore'

describe('useProjectConfigDesignerStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useProjectConfigDesignerStore.getState().resetSaveState()
  })

  describe('startSave', () => {
    it('should increment pendingSaves counter', () => {
      const { startSave, pendingSaves } =
        useProjectConfigDesignerStore.getState()

      expect(pendingSaves).toBe(0)

      startSave()
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(1)

      startSave()
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(2)
    })

    it('should not modify lastCompletedAt when incrementing', () => {
      const { startSave } = useProjectConfigDesignerStore.getState()

      startSave()

      expect(
        useProjectConfigDesignerStore.getState().lastCompletedAt,
      ).toBeNull()
    })
  })

  describe('completeSave', () => {
    it('should decrement pendingSaves counter', () => {
      const { startSave, completeSave } =
        useProjectConfigDesignerStore.getState()

      // Start 3 saves
      startSave()
      startSave()
      startSave()
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(3)

      // Complete 1 save
      completeSave()
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(2)

      // Complete another save
      completeSave()
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(1)
    })

    it('should set lastCompletedAt when counter reaches 0', () => {
      const { startSave, completeSave } =
        useProjectConfigDesignerStore.getState()

      // Start and complete 1 save
      startSave()
      const beforeComplete = Date.now()
      completeSave()

      const { pendingSaves, lastCompletedAt } =
        useProjectConfigDesignerStore.getState()

      expect(pendingSaves).toBe(0)
      expect(lastCompletedAt).not.toBeNull()
      expect(lastCompletedAt).toBeGreaterThanOrEqual(beforeComplete)
      expect(lastCompletedAt).toBeLessThanOrEqual(Date.now())
    })

    it('should NOT set lastCompletedAt when counter > 0', () => {
      const { startSave, completeSave } =
        useProjectConfigDesignerStore.getState()

      // Start 2 saves, complete 1
      startSave()
      startSave()
      completeSave()

      const { pendingSaves, lastCompletedAt } =
        useProjectConfigDesignerStore.getState()

      expect(pendingSaves).toBe(1)
      expect(lastCompletedAt).toBeNull()
    })

    it('should not go negative (defensive check)', () => {
      const { completeSave } = useProjectConfigDesignerStore.getState()

      // Call completeSave without any pending saves
      completeSave()

      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(0)
    })
  })

  describe('resetSaveState', () => {
    it('should reset all state to initial values', () => {
      const { startSave, resetSaveState } =
        useProjectConfigDesignerStore.getState()

      // Modify state
      startSave()
      startSave()
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(2)

      // Reset
      resetSaveState()

      const state = useProjectConfigDesignerStore.getState()
      expect(state.pendingSaves).toBe(0)
      expect(state.lastCompletedAt).toBeNull()
    })

    it('should clear lastCompletedAt if it was set', () => {
      const { startSave, completeSave, resetSaveState } =
        useProjectConfigDesignerStore.getState()

      // Start and complete a save to set lastCompletedAt
      startSave()
      completeSave()
      expect(
        useProjectConfigDesignerStore.getState().lastCompletedAt,
      ).not.toBeNull()

      // Reset
      resetSaveState()

      expect(
        useProjectConfigDesignerStore.getState().lastCompletedAt,
      ).toBeNull()
    })
  })

  describe('reference counting behavior', () => {
    it('should handle multiple concurrent saves correctly', () => {
      const { startSave, completeSave } =
        useProjectConfigDesignerStore.getState()

      // Simulate 3 saves starting
      startSave() // Save 1
      startSave() // Save 2
      startSave() // Save 3
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(3)

      // Save 1 completes
      completeSave()
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(2)
      expect(
        useProjectConfigDesignerStore.getState().lastCompletedAt,
      ).toBeNull()

      // Save 2 completes
      completeSave()
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(1)
      expect(
        useProjectConfigDesignerStore.getState().lastCompletedAt,
      ).toBeNull()

      // Save 3 completes - lastCompletedAt should now be set
      completeSave()
      expect(useProjectConfigDesignerStore.getState().pendingSaves).toBe(0)
      expect(
        useProjectConfigDesignerStore.getState().lastCompletedAt,
      ).not.toBeNull()
    })
  })
})
