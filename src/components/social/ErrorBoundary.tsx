import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[300px] rounded-3xl bg-slate-950/90 border border-red-500/30 backdrop-blur-xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-orbitron font-bold text-white text-base">
              {this.props.fallbackTitle || 'Transmission Render Exception'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              A temporary render exception occurred. Click reset to restore the data feed without refreshing the page.
            </p>
          </div>

          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-slate-950 font-orbitron font-bold text-xs shadow-md flex items-center gap-1.5 hover:scale-105 transition-transform"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET INTERFACE</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}