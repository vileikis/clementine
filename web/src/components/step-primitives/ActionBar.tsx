"use client";

import type { ReactNode } from "react";

interface ActionBarProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive action bar for CTA buttons.
 *
 * Mobile (< 1024px): Fixed to bottom of viewport with safe area padding
 * and gradient background for visibility over scrolling content.
 *
 * Desktop (>= 1024px): Static inline container, flows with content.
 */
export function ActionBar({ children, className = "" }: ActionBarProps) {
  return (
    <div
      className={`
        fixed bottom-0 inset-x-0 p-4 z-10
        bg-gradient-to-t from-[var(--step-bg,theme(colors.background))] via-[var(--step-bg,theme(colors.background))]/95 to-transparent
        lg:static lg:p-0 lg:bg-transparent lg:z-auto
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
