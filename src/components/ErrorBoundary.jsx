import React from "react";

/**
 * ErrorBoundary — wraps Analytics route only.
 * If Analytics crashes, fallback UI is shown.
 * The rest of the application continues to function normally.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto py-20 text-center animate-in fade-in">
          <div className="pro-card p-8 items-center">
            <div className="w-14 h-14 mb-6 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Erreur dans Analytics</h2>
            <p className="text-sm text-textdim mb-6 leading-relaxed">
              Une erreur inattendue est survenue dans le module Analytics. Le reste de l'application fonctionne normalement.
            </p>
            <p className="text-xs text-danger/70 font-mono mb-6 bg-danger/5 border border-danger/10 rounded-lg p-3 text-left break-all">
              {this.state.error?.message || "Erreur inconnue"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
