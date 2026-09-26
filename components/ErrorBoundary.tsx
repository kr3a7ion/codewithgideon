import React from "react";

type Props = { children: React.ReactNode; resetKey?: string };
type State = { error: Error | null };

/**
 * Keeps one broken section from blanking the whole site. Resets when the
 * route changes (resetKey).
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Page crashed:", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-[55vh] px-6 py-20">
        <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-600 dark:text-orange-300">
            Something went wrong
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            This page hit an unexpected error. Reloading usually fixes it. If it
            keeps happening, please contact support.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-blue-900 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"
            >
              Reload page
            </button>
            <button
              onClick={() => window.location.assign("/")}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-blue-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
