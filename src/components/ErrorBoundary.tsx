import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: string | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, errorInfo: error?.message || 'Unknown application error' };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
              ⚡
            </div>
            <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Enerpack App</h2>
            <p className="text-sm text-slate-400 mb-6">
              {this.state.errorInfo || 'The application encountered a temporary display glitch.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, errorInfo: null });
                  window.location.reload();
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-sm uppercase tracking-wider"
              >
                Reload App
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-2xl transition-all text-xs uppercase tracking-wider"
              >
                Reset Saved State & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
