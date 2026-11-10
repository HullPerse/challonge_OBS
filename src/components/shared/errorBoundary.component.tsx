import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

import Button from "@/components/ui/button.component";

type ErrorBoundaryState = {
  error: Error | null;
};

/** Catches render and lazy-load failures so the UI never becomes a blank page. */
class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("UI crashed", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="flex h-full w-full flex-col items-center justify-center gap-3 bg-background p-6 text-center text-text-primary">
          <RotateCcw className="size-8 text-text-muted" />
          <h1 className="text-sm font-medium">Что-то пошло не так</h1>
          <p className="max-w-md text-xs text-text-muted">
            Интерфейс не смог отрисоваться. Перезагрузите страницу — данные турниров останутся в
            локальной базе.
          </p>
          <Button
            size="sm"
            onClick={() => {
              window.location.reload();
            }}
          >
            Перезагрузить
          </Button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
