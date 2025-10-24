import { Component } from 'react'
import { useTranslation } from 'react-i18next'

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
      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} />
    }

    return this.props.children
  }
}

// Separate component to use hooks
function ErrorFallback({ error, errorInfo }) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">🚨</div>
        <h1 className="text-2xl font-bold text-white-primary">
          {t('errorBoundary.title')}
        </h1>
        <p className="text-white-secondary">
          {t('errorBoundary.description')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          {t('common.refreshPage')}
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-white-secondary">
              {t('errorBoundary.developmentDetails')}
            </summary>
            <pre className="mt-2 p-4 bg-light-dark-secondary rounded-lg text-xs text-white-primary overflow-auto">
              {error && error.toString()}
              <br />
              {errorInfo.componentStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export default ErrorBoundary