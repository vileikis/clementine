'use client';

import { Component, type ReactNode } from 'react';
import { AlertCircle, RotateCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JourneyErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  onRestart?: () => void;
}

interface JourneyErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class JourneyErrorBoundary extends Component<
  JourneyErrorBoundaryProps,
  JourneyErrorBoundaryState
> {
  constructor(props: JourneyErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): JourneyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('JourneyErrorBoundary caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRestart?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
          <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-8 text-center shadow-lg">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                Oops! Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message ||
                  'An unexpected error occurred. Please try again.'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {this.props.onRetry && (
                <Button
                  onClick={this.handleRetry}
                  size="lg"
                  className="w-full gap-2"
                >
                  <RotateCw className="h-5 w-5" />
                  Try Again
                </Button>
              )}

              {this.props.onRestart && (
                <Button
                  onClick={this.handleRestart}
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                >
                  <Home className="h-5 w-5" />
                  Start Over
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
