import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-6xl">🚨</div>
            <h1 className="text-2xl font-bold text-white-primary">
              Oops! Something went wrong
            </h1>
            <p className="text-white-secondary">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-white-secondary">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-4 bg-light-dark-secondary rounded-lg text-xs text-white-primary overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary