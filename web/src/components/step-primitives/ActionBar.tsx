"use client";

import type { ReactNode } from "react";

interface ActionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive action bar for CTA buttons.
 *
 * Mobile (< 1024px): Sticky at bottom of scroll container with safe area padding.
 *
 * Desktop (>= 1024px): Static inline container, flows with content.
 */
export function ActionBar({ children, className = "" }: ActionBarProps) {
  return (
    <div
      className={`
        sticky bottom-0 p-4 mt-auto
        lg:static lg:p-0 lg:mt-4
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
