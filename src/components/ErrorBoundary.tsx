import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("PlantCare AI uncaught runtime error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F9F5] dark:bg-[#0F231B] text-[#163A2D] dark:text-[#F1F7F3] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#173126] border border-[#DCE7DF] dark:border-[#244737] rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-[#163A2D] dark:text-[#F1F7F3]">
                Something went wrong
              </h1>
              <p className="text-sm text-[#668074] dark:text-[#B0C9BA]">
                PlantCare AI encountered an unexpected issue while rendering this view.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="text-left bg-[#F6F9F5] dark:bg-[#12281E] p-3.5 rounded-xl border border-[#DCE7DF] dark:border-[#244737] overflow-auto max-h-32 text-xs font-mono text-[#527063] dark:text-[#8EAD9B]">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#176B4D] hover:bg-[#12563D] text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#1D3B2D] border border-[#DCE7DF] dark:border-[#244737] hover:bg-[#F0F6F1] dark:hover:bg-[#244737] text-[#163A2D] dark:text-[#F1F7F3] text-sm font-semibold transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
