import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class EnterpriseErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[EnterpriseErrorBoundary] Error in ${this.props.moduleName || 'Module'}:`, error, errorInfo);
    // TODO: Send to telemetry service
  }

  private handleMakeReport = () => {
    const report = {
      module: this.props.moduleName,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      time: new Date().toISOString(),
      url: window.location.href
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    alert("Fehlerbericht in die Zwischenablage kopiert.");
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-full min-h-[400px] w-full flex flex-col items-center justify-center p-8 text-center bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {this.props.fallbackTitle || "Ein Modul-Fehler ist aufgetreten"}
          </h2>

          <p className="text-gray-500 max-w-md mb-6">
            Das Modul "{this.props.moduleName || 'Unbekannt'}" konnte nicht geladen werden.
            Ihre anderen Daten sind sicher.
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => this.setState({ hasError: false })}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </Button>

            <Button
              variant="ghost"
              onClick={this.handleMakeReport}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Bericht kopieren
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
