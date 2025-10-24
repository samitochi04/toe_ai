import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'

const OAuthCallbackPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const handleOAuthCallback = useAuthStore(state => state.handleOAuthCallback)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleOAuthCallback()
        // Redirect to dashboard on successful authentication
        navigate('/dashboard')
      } catch (error) {
        console.error('OAuth callback error:', error)
        
        // Handle specific SSL/certificate errors
        if (error.message?.includes('ERR_CERT_AUTHORITY_INVALID') || 
            error.message?.includes('ERR_NETWORK') ||
            error.code === 'ERR_NETWORK') {
          console.error('SSL Certificate Error: Backend SSL certificate is invalid')
          navigate('/?error=ssl_certificate_invalid')
        } else {
          // Redirect to landing page with error
          navigate('/?error=oauth_failed')
        }
      }
    }

    handleCallback()
  }, [handleOAuthCallback, navigate])

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-purple mx-auto mb-4"></div>
        <p className="text-text-secondary">{t('oAuth.completing')}</p>
      </div>
    </div>
  )
}

export default OAuthCallbackPage