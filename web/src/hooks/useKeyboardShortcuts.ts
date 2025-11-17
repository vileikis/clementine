import { useEffect } from "react";

/**
 * Hook to register keyboard shortcuts
 * Usage: useKeyboardShortcuts({ "Cmd+S": handleSave, "Escape": handleClose })
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Build the shortcut key from the event
      const keys: string[] = [];
      if (event.ctrlKey || event.metaKey) keys.push(event.metaKey ? "Cmd" : "Ctrl");
      if (event.altKey) keys.push("Alt");
      if (event.shiftKey) keys.push("Shift");

      // Add the actual key (normalize special keys)
      const key = event.key === "Escape" ? "Escape" : event.key.toUpperCase();
      if (key !== "CONTROL" && key !== "META" && key !== "ALT" && key !== "SHIFT") {
        keys.push(key);
      }

      const shortcut = keys.join("+");

      // Check if this shortcut is registered
      for (const [registered, handler] of Object.entries(shortcuts)) {
        // Normalize registered shortcut for comparison
        const normalizedRegistered = registered
          .split("+")
          .map(k => k.trim().toUpperCase())
          .join("+")
          .replace("CMD", "CMD");

        const normalizedShortcut = shortcut.toUpperCase().replace("META", "CMD");

        if (normalizedRegistered === normalizedShortcut) {
          event.preventDefault();
          handler();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
