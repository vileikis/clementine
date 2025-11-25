"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to show confirmation dialog when user tries to leave page with unsaved changes.
 * Handles both:
 * - Browser tab close / refresh (beforeunload event)
 * - Client-side navigation (Next.js router interception)
 *
 * @param hasUnsavedChanges - Boolean indicating if there are unsaved changes
 * @param message - Optional custom message (only shown for beforeunload, browser controls the text for navigation)
 */
export function useUnsavedChanges(
  hasUnsavedChanges: boolean,
  message: string = "You have unsaved changes. Are you sure you want to leave?"
) {
  const router = useRouter();

  // Handle browser tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        // Modern browsers require returnValue to be set
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, message]);

  // Handle client-side navigation by intercepting link clicks and back/forward
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    // Intercept link clicks
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && anchor.href) {
        // Check if it's an internal navigation (same origin)
        const url = new URL(anchor.href, window.location.origin);
        const isInternal = url.origin === window.location.origin;
        const isSamePage = url.pathname === window.location.pathname;

        if (isInternal && !isSamePage) {
          const confirmed = window.confirm(message);
          if (!confirmed) {
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    };

    // Intercept browser back/forward navigation
    const handlePopState = () => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(message);
        if (!confirmed) {
          // Push the current URL back to prevent navigation
          window.history.pushState(null, "", window.location.href);
        }
      }
    };

    // Push initial state to enable popstate interception
    window.history.pushState(null, "", window.location.href);

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasUnsavedChanges, message, router]);
}
