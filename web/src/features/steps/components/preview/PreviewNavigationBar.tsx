"use client";

/**
 * Component: PreviewNavigationBar
 *
 * Fixed bottom navigation bar for experience playback mode.
 * Provides Back, Next, Restart, and Exit controls with step counter.
 *
 * Mobile-first design with 44x44px minimum touch targets per Constitution.
 */

import { ChevronLeft, ChevronRight, RotateCcw, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PreviewNavigationBarProps } from "../../types/playback.types";

export function PreviewNavigationBar({
  currentIndex,
  totalSteps,
  canGoBack,
  canGoNext: _canGoNext, // Reserved for future disabled state
  isCompleted,
  onBack,
  onNext,
  onRestart,
  onExit,
}: PreviewNavigationBarProps) {
  void _canGoNext; // Used to satisfy interface, Next is always enabled until completed
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-t flex items-center justify-between px-4 gap-2 z-50"
      role="navigation"
      aria-label="Playback controls"
    >
      {/* Left: Back + Step Counter */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={!canGoBack}
          className="h-11 w-11 shrink-0"
          aria-label="Previous step"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        {/* Step Counter */}
        <span className="text-sm font-medium tabular-nums min-w-[48px] text-center">
          {totalSteps > 0 ? `${currentIndex + 1} / ${totalSteps}` : "0 / 0"}
        </span>
      </div>

      {/* Center: Next/Complete */}
      <div className="flex-1 flex justify-center">
        {isCompleted ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500" />
            <span>Experience Complete</span>
          </div>
        ) : (
          <Button
            variant="default"
            onClick={onNext}
            className="h-11 px-6 gap-1"
            aria-label={
              currentIndex >= totalSteps - 1 ? "Complete experience" : "Next step"
            }
          >
            <span>{currentIndex >= totalSteps - 1 ? "Complete" : "Next"}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Right: Restart + Exit */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRestart}
          className="h-11 w-11 shrink-0"
          aria-label="Restart experience"
          title="Restart"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="h-11 w-11 shrink-0"
          aria-label="Exit playback"
          title="Exit"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
}
