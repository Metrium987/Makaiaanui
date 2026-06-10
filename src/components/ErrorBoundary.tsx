// @ts-nocheck — React 19 bundled types lack full class component `this.state`/`this.props`
// resolution without @types/react. This is the only class component in the project.
import React, { type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full p-8 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2 uppercase tracking-tight">
              Application Error
            </h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              An unexpected error occurred in the application. Your data is safe,
              but this view cannot be displayed right now.
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
                  Error Details
                </p>
                <p className="text-xs text-red-600 font-mono break-all">
                  {this.state.error.message || 'Unknown error'}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload App
              </button>
            </div>
            <p className="mt-6 text-[10px] text-slate-400 font-mono">
              If this persists, contact your system administrator.
            </p>
          </div>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}
