import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, showDetails: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[320px] rounded-3xl bg-slate-950/95 border border-red-500/40 backdrop-blur-2xl p-6 flex flex-col items-center justify-center text-center space-y-4 shadow-[0_0_40px_rgba(239,68,68,0.2)] relative overflow-hidden">
          {/* Subtle Grid Lines Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef4444_1px,transparent_1px),linear-gradient(to_bottom,#ef4444_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.04] pointer-events-none" />

          {/* Animated Status Glow Badge */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 flex items-center justify-center font-bold animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
            </span>
          </div>

          <div className="space-y-1.5 max-w-md relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-400 font-bold mb-1">
              <ShieldAlert className="w-3 h-3" />
              <span>SYSTEM DEFENSE INTERCEPT</span>
            </div>
            
            <h3 className="font-orbitron font-bold text-white text-base tracking-wide">
              {this.props.fallbackTitle || 'Transmission Render Exception'}
            </h3>

            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              A temporary rendering anomaly was isolated. Click below to re-initialize the component state without losing session memory.
            </p>

            {this.state.error && (
              <div className="mt-3">
                <button
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 inline-flex items-center gap-1"
                >
                  <Terminal className="w-3 h-3" />
                  {this.state.showDetails ? 'Hide Exception Log' : 'Inspect Exception Log'}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-900/90 border border-red-500/30 text-left font-mono text-[10px] text-red-300 overflow-x-auto max-h-24 max-w-xs mx-auto text-left shadow-inner">
                    {this.state.error.toString()}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={this.handleReset}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-slate-950 font-orbitron font-bold text-xs shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all duration-200 relative z-10"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>RESET COMPONENT FEED</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}