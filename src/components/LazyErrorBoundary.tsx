import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
  className?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class LazyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LazyErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className={
            this.props.className ??
            'my-4 p-6 rounded-2xl border border-red-200 bg-red-50/80 text-center flex flex-col items-center justify-center gap-3'
          }
        >
          <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-red-900">
            {this.props.fallbackTitle ?? 'Component failed to load'}
          </p>
          <p className="text-xs text-red-700 max-w-md">
            {this.props.fallbackMessage ??
              'A network interruption prevented this section from loading. Your draft and preferences remain safe.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-red-300 text-xs font-semibold text-red-800 shadow-sm hover:bg-red-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry loading
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
