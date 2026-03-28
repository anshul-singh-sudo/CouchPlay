"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in Engine:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-8">
          <div className="mb-6 p-6 bg-red-950/30 rounded-full border border-red-500/20">
            <AlertTriangle className="w-16 h-16 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black tracking-widest uppercase mb-4 text-rose-500">Emulator Engine Crash</h2>
          <p className="text-white/60 mb-8 max-w-lg text-center leading-relaxed">
            The WASM core or Game component encountered a fatal exception: 
            <br/><span className="font-mono text-xs text-rose-400 mt-2 block bg-black border border-white/10 p-2 rounded">{this.state.errorMsg}</span>
          </p>
          <button
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-full font-bold tracking-widest text-sm transition-colors shadow-lg shadow-rose-900/50"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            <RefreshCw className="w-4 h-4" /> Restart Engine
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
