import { Link } from 'react-router-dom'

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="text-8xl">🤖</div>
        <h1 className="text-4xl font-bold text-white-primary">
          404 - Page Not Found
        </h1>
        <p className="text-white-secondary max-w-md">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <Link
          to="/"
          className="inline-block bg-blue-2nd text-white-primary px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-colors"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage