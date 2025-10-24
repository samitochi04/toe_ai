import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { storage } from '@/utils/storage'
import { useTranslation } from 'react-i18next'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore()
  const { t } = useTranslation()

  // Show a loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-primary">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-2nd border-t-transparent"></div>
          <p className="text-white-secondary">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // If not authenticated, redirect to landing page
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} replace />
  }

  // Otherwise render the protected route
  return children
}

export default ProtectedRoute
