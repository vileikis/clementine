import { beforeEach, describe, expect, it } from 'vitest'
import { useEventDesignerStore } from './useEventDesignerStore'

describe('useEventDesignerStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEventDesignerStore.getState().resetSaveState()
  })

  describe('startSave', () => {
    it('should increment pendingSaves counter', () => {
      const { startSave, pendingSaves } = useEventDesignerStore.getState()

      expect(pendingSaves).toBe(0)

      startSave()
      expect(useEventDesignerStore.getState().pendingSaves).toBe(1)

      startSave()
      expect(useEventDesignerStore.getState().pendingSaves).toBe(2)
    })

    it('should not modify lastCompletedAt when incrementing', () => {
      const { startSave } = useEventDesignerStore.getState()

      startSave()

      expect(useEventDesignerStore.getState().lastCompletedAt).toBeNull()
    })
  })

  describe('completeSave', () => {
    it('should decrement pendingSaves counter', () => {
      const { startSave, completeSave } = useEventDesignerStore.getState()

      // Start 3 saves
      startSave()
      startSave()
      startSave()
      expect(useEventDesignerStore.getState().pendingSaves).toBe(3)

      // Complete 1 save
      completeSave()
      expect(useEventDesignerStore.getState().pendingSaves).toBe(2)

      // Complete another save
      completeSave()
      expect(useEventDesignerStore.getState().pendingSaves).toBe(1)
    })

    it('should set lastCompletedAt when counter reaches 0', () => {
      const { startSave, completeSave } = useEventDesignerStore.getState()

      // Start and complete 1 save
      startSave()
      const beforeComplete = Date.now()
      completeSave()

      const { pendingSaves, lastCompletedAt } = useEventDesignerStore.getState()

      expect(pendingSaves).toBe(0)
      expect(lastCompletedAt).not.toBeNull()
      expect(lastCompletedAt).toBeGreaterThanOrEqual(beforeComplete)
      expect(lastCompletedAt).toBeLessThanOrEqual(Date.now())
    })

    it('should NOT set lastCompletedAt when counter > 0', () => {
      const { startSave, completeSave } = useEventDesignerStore.getState()

      // Start 2 saves, complete 1
      startSave()
      startSave()
      completeSave()

      const { pendingSaves, lastCompletedAt } = useEventDesignerStore.getState()

      expect(pendingSaves).toBe(1)
      expect(lastCompletedAt).toBeNull()
    })

    it('should not go negative (defensive check)', () => {
      const { completeSave } = useEventDesignerStore.getState()

      // Call completeSave without any pending saves
      completeSave()

      expect(useEventDesignerStore.getState().pendingSaves).toBe(0)
    })
  })

  describe('resetSaveState', () => {
    it('should reset all state to initial values', () => {
      const { startSave, resetSaveState } = useEventDesignerStore.getState()

      // Modify state
      startSave()
      startSave()
      expect(useEventDesignerStore.getState().pendingSaves).toBe(2)

      // Reset
      resetSaveState()

      const state = useEventDesignerStore.getState()
      expect(state.pendingSaves).toBe(0)
      expect(state.lastCompletedAt).toBeNull()
    })

    it('should clear lastCompletedAt if it was set', () => {
      const { startSave, completeSave, resetSaveState } =
        useEventDesignerStore.getState()

      // Start and complete a save to set lastCompletedAt
      startSave()
      completeSave()
      expect(useEventDesignerStore.getState().lastCompletedAt).not.toBeNull()

      // Reset
      resetSaveState()

      expect(useEventDesignerStore.getState().lastCompletedAt).toBeNull()
    })
  })

  describe('reference counting behavior', () => {
    it('should handle multiple concurrent saves correctly', () => {
      const { startSave, completeSave } = useEventDesignerStore.getState()

      // Simulate 3 saves starting
      startSave() // Save 1
      startSave() // Save 2
      startSave() // Save 3
      expect(useEventDesignerStore.getState().pendingSaves).toBe(3)

      // Save 1 completes
      completeSave()
      expect(useEventDesignerStore.getState().pendingSaves).toBe(2)
      expect(useEventDesignerStore.getState().lastCompletedAt).toBeNull()

      // Save 2 completes
      completeSave()
      expect(useEventDesignerStore.getState().pendingSaves).toBe(1)
      expect(useEventDesignerStore.getState().lastCompletedAt).toBeNull()

      // Save 3 completes - lastCompletedAt should now be set
      completeSave()
      expect(useEventDesignerStore.getState().pendingSaves).toBe(0)
      expect(useEventDesignerStore.getState().lastCompletedAt).not.toBeNull()
    })
  })
})
