import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  onReset?: () => void
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false })
    this.props.onReset?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
          <p className="mb-2 text-4xl" aria-hidden="true">
            ⚠️
          </p>
          <h1 className="mb-2 text-xl font-bold text-white">Algo salió mal</h1>
          <p className="mb-6 max-w-sm text-sm text-purple-200">
            La pantalla dejó de responder. Puedes volver al menú e intentar de nuevo.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-bold text-white shadow-lg transition active:scale-95"
          >
            Volver al menú
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
