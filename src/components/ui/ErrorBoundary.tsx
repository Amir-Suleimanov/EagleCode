import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info); }

  render() {
    if (this.state.hasError) {
      return <main className="fatal-error"><p className="eyebrow">SYSTEM / UI</p><h1>Экран временно недоступен</h1><p>Перезагрузите страницу и повторите действие.</p><button className="button button-primary" onClick={() => window.location.reload()}>Перезагрузить</button></main>;
    }
    return this.props.children;
  }
}

