/**
 * useNavigateHome Hook
 *
 * Provides navigation to home (welcome screen) with confirmation dialog state.
 * Used in guest experience pages to handle safe exit with data loss warning.
 *
 * @example
 * ```tsx
 * function ExperiencePage() {
 *   const { showDialog, setShowDialog, openDialog, confirmNavigation } = useNavigateHome()
 *
 *   return (
 *     <>
 *       <RuntimeTopBar onHomeClick={openDialog} ... />
 *
 *       <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
 *         <AlertDialogAction onClick={confirmNavigation}>Exit</AlertDialogAction>
 *       </AlertDialog>
 *     </>
 *   )
 * }
 * ```
 */
import { useCallback, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useGuestContext } from '../contexts'

/**
 * useNavigateHome
 *
 * Returns:
 * - `showDialog`: Boolean state for dialog visibility
 * - `setShowDialog`: Setter for dialog visibility
 * - `openDialog`: Callback to open the confirmation dialog
 * - `confirmNavigation`: Callback to execute navigation to home
 */
export function useNavigateHome() {
  const navigate = useNavigate()
  const { project } = useGuestContext()
  const [showDialog, setShowDialog] = useState(false)

  /**
   * Opens the exit confirmation dialog
   */
  const openDialog = useCallback(() => {
    setShowDialog(true)
  }, [])

  /**
   * Confirms navigation and navigates to welcome page
   * Closes dialog and navigates to /join/$projectId
   */
  const confirmNavigation = useCallback(() => {
    setShowDialog(false)
    void navigate({
      to: '/join/$projectId',
      params: { projectId: project.id },
    })
  }, [navigate, project.id])

  return {
    showDialog,
    setShowDialog,
    openDialog,
    confirmNavigation,
  }
}
