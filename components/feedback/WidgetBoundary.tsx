"use client";

import { Component, type ReactNode } from "react";
import { logger } from "@/lib/logger";

type Props = { label: string; children: ReactNode; fallback?: ReactNode };
type State = { failed: boolean };

export class WidgetBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error): void {
    logger.error(`[WidgetBoundary:${this.props.label}] caught error`, {
      label: this.props.label,
      error: error.message,
    });
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      this.props.fallback ?? (
        <output className="block py-2 text-sm text-slate-500">
          This section is unavailable right now.{" "}
          <button
            type="button"
            onClick={() => this.setState({ failed: false })}
            className="font-medium text-[#1155CC] underline"
          >
            Retry
          </button>
        </output>
      )
    );
  }
}
