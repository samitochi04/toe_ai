import useAuthStore from '../../store/authStore'
import { Navigate, useLocation } from 'react-router-dom'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-primary">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-2nd border-t-transparent"></div>
          <p className="text-white-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to landing page with return URL
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute