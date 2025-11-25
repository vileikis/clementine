import { useEffect } from "react";

/**
 * Hook to show browser confirmation dialog when user tries to leave page with unsaved changes
 * @param hasUnsavedChanges - Boolean indicating if there are unsaved changes
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        // Modern browsers require returnValue to be set
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);
}
