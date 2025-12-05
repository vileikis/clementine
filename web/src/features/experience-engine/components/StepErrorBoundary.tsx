"use client";

// ============================================================================
// StepErrorBoundary Component
// ============================================================================
// Error boundary for step renderers to catch and display rendering errors
// gracefully without crashing the entire engine.

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface StepErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Step ID for error identification */
  stepId?: string;
  /** Callback when error occurs */
  onError?: (error: Error, stepId?: string) => void;
  /** Callback to retry rendering */
  onRetry?: () => void;
}

interface StepErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ============================================================================
// Component
// ============================================================================

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

  componentDidCatch(error: Error): void {
    // Report error to parent
    this.props.onError?.(error, this.props.stepId);
    console.error("[StepErrorBoundary] Step render error:", {
      stepId: this.props.stepId,
      error: error.message,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Step Rendering Error</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || "Something went wrong while rendering this step."}
          </p>
          {this.props.onRetry && (
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
