"use client";

/**
 * Component: StepErrorBoundary
 *
 * Error boundary for step rendering in playback mode.
 * Catches errors during step rendering and displays a fallback UI
 * that allows navigation to continue.
 *
 * Features:
 * - Graceful error display with step type info
 * - Resets on step change via key prop
 * - Navigation still works when step fails
 */

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface StepErrorBoundaryProps {
  /** Children to render (step component) */
  children: ReactNode;
  /** Step type for error message context */
  stepType?: string;
  /** Key to reset boundary on step change */
  stepId?: string;
}

interface StepErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class StepErrorBoundary extends Component<
  StepErrorBoundaryProps,
  StepErrorBoundaryState
> {
  constructor(props: StepErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): StepErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging
    console.error("StepErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h3 className="text-lg font-medium mb-2">Unable to render step</h3>
          {this.props.stepType && (
            <p className="text-sm text-muted-foreground mb-2">
              Step type: {this.props.stepType}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Use the navigation controls below to continue.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-4 p-2 bg-muted rounded text-xs text-left max-w-full overflow-auto">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
