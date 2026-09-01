import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-apple-primaryBg dark:bg-black text-apple-textPrimary dark:text-white flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full p-6 bg-white dark:bg-[#1C1C1E] rounded-3xl border border-apple-border/70 dark:border-white/10 shadow-2xl space-y-4 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-title3 font-bold tracking-tight">Something went wrong</h2>
              <p className="text-footnote text-apple-textSecondary dark:text-white/60 mt-1">
                {this.state.error?.message || 'An unexpected error occurred while rendering.'}
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-apple-blue hover:bg-apple-blueHover text-white font-semibold text-footnote flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Workspace</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
