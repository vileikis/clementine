"use client";

import type { ReactNode } from "react";

interface ActionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Action bar for CTA buttons.
 *
 * On mobile: Absolutely positioned at bottom of parent container.
 * Parent must have `position: relative` and defined height.
 */
export function ActionBar({ children, className = "" }: ActionBarProps) {
  return (
    <div
      className={`
        absolute bottom-0 left-0 right-0 p-4
        ${className}
      `}
      style={{
        paddingBottom: `max(1rem, var(--safe-area-inset-bottom))`,
      }}
    >
      {children}
    </div>
  );
}
