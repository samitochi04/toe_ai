import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import { useEffect } from 'react'

// Pages
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ChatPage from './pages/ChatPage'
import ChatsListPage from './pages/ChatsListPage'
import InterviewPage from './pages/InterviewPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import BillingPage from './pages/BillingPage'
import SharedChatPage from './pages/SharedChatPage'
import NotFoundPage from './pages/NotFoundPage'
import InterviewChatsListPage from './pages/InterviewChatsListPage'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'
import WorkspaceLayout from './components/layout/WorkspaceLayout'

function App() {
  const { initializeAuth, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

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

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-dark-primary">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/workspace/dashboard" replace /> : <LandingPage />
            } 
          />
          <Route path="/shared/:shareToken" element={<SharedChatPage />} />
          
          {/* Protected Workspace Routes - FIXED: Removed nested WorkspaceLayout */}
          <Route 
            path="/workspace/*" 
            element={
              <ProtectedRoute>
                <WorkspaceLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="chats" element={<ChatsListPage />} />
            <Route path="chat/new" element={<ChatPage />} />
            <Route path="chat/:chatId" element={<ChatPage />} />
            <Route path="interviews" element={<InterviewChatsListPage />} />
            <Route path="interview/new" element={<InterviewPage />} />
            <Route path="interview/:chatId" element={<InterviewPage />} />
            <Route path="premium" element={<BillingPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Redirect old dashboard route */}
          <Route path="/dashboard" element={<Navigate to="/workspace/dashboard" replace />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ErrorBoundary>
  )
}

export default App