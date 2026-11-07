"use client";

import { Component, type ReactNode } from "react";

type Props = { label: string; children: ReactNode; fallback?: ReactNode };
type State = { failed: boolean };

export class WidgetBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error): void {
    console.error(`[WidgetBoundary:${this.props.label}] caught error:`, error);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      this.props.fallback ?? (
        <p role="status" className="py-2 text-sm text-slate-500">
          This section is unavailable right now.{" "}
          <button
            type="button"
            onClick={() => this.setState({ failed: false })}
            className="font-medium text-[#1155CC] underline"
          >
            Retry
          </button>
        </p>
      )
    );
  }
}
