import { Component, type ReactNode } from "react";
import { Card } from "./Misc";
import { ErrorState } from "./States";

/** Catches render errors of a page so the shell (sidebar, header) stays usable instead of a blank screen. */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    console.error(error);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Card>
        <ErrorState
          error={this.state.error}
          onRetry={() => this.setState({ error: null })}
        />
      </Card>
    );
  }
}
