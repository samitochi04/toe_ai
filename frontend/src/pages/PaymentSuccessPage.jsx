import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Crown, ArrowRight } from 'lucide-react'
import Button from '../components/common/Button'
import useAuthStore from '../store/authStore'
import { paymentApi } from '../services/payments'

const PaymentSuccessPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { refreshUserProfile } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [sessionData, setSessionData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (sessionId) {
      // Verify the session with backend and refresh user profile
      Promise.all([
        paymentApi.getCheckoutSession(sessionId),
        refreshUserProfile() // Refresh user profile to get updated subscription status
      ])
        .then(([sessionResponse, profileResponse]) => {
          setSessionData(sessionResponse)
          console.log('User profile refreshed after payment:', profileResponse)
        })
        .catch(error => {
          console.error('Error verifying session:', error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [sessionId, refreshUserProfile])

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-light-dark-secondary rounded-xl p-8 text-center border border-gray-600">
        {isLoading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-white-primary">Verifying payment...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-white-primary mb-2">
                Payment Successful!
              </h1>
              <p className="text-gray-400">
                Welcome to TOE AI Premium! Your subscription is now active.
              </p>
            </div>

            <div className="bg-dark-primary rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-5 h-5 text-yellow-400 mr-2" />
                <span className="text-white-primary font-medium">Premium Plan</span>
              </div>
              <p className="text-gray-400 text-sm">
                You now have unlimited access to all features!
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/workspace/chat/new')}
                className="w-full"
              >
                Start Chatting
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                onClick={() => navigate('/billing')}
                variant="secondary"
                className="w-full"
              >
                View Billing
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentSuccessPage
