import { useState } from 'react'
import { paymentApi } from '../services/payments'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export const usePayments = () => {
  const { refreshUserProfile } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [subscriptionStatus, setSubscriptionStatus] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])

  const createCheckoutSession = async (planType = 'monthly') => {
    setIsLoading(true)
    try {
      const response = await paymentApi.createCheckoutSession(planType)
      
      // The response structure should be: response.checkout_url (not response.data.checkout_url)
      if (response?.checkout_url) {
        // Redirect to Stripe checkout
        window.location.href = response.checkout_url
      } else {
        // console.error('No checkout_url in response:', response)
        toast.error('Failed to get checkout URL')
      }
      return response
    } catch (error) {
      // console.error('Error creating checkout session:', error)
      toast.error(error.response?.data?.detail || 'Failed to create checkout session')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getSubscriptionStatus = async () => {
    setIsLoading(true)
    try {
      const response = await paymentApi.getSubscriptionStatus()
      setSubscriptionStatus(response.data)
      return response.data
    } catch (error) {
      // console.error('Error getting subscription status:', error)
      // Don't show error toast for subscription status as it might not exist for free users
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await paymentApi.cancelSubscription()
      toast.success('Subscription will be cancelled at the end of the current billing period')
      await getSubscriptionStatus() // Refresh status
      return response.data
    } catch (error) {
      // console.error('Error cancelling subscription:', error)
      toast.error(error.response?.data?.detail || 'Failed to cancel subscription')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const reactivateSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await paymentApi.reactivateSubscription()
      toast.success('Subscription reactivated successfully')
      await getSubscriptionStatus() // Refresh status
      return response.data
    } catch (error) {
      // console.error('Error reactivating subscription:', error)
      toast.error(error.response?.data?.detail || 'Failed to reactivate subscription')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentHistory = async () => {
    setIsLoading(true)
    try {
      const response = await paymentApi.getPaymentHistory()
      setPaymentHistory(response.data?.payments || [])
      return response.data
    } catch (error) {
      // console.error('Error getting payment history:', error)
      toast.error(error.response?.data?.detail || 'Failed to get payment history')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createBillingPortalSession = async (returnUrl = window.location.origin + '/billing') => {
    setIsLoading(true)
    try {
      const response = await paymentApi.createBillingPortalSession(returnUrl)
      if (response.data?.url) {
        window.location.href = response.data.url
      }
      return response.data
    } catch (error) {
      // console.error('Error creating billing portal session:', error)
      toast.error(error.response?.data?.detail || 'Failed to access billing portal')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    subscriptionStatus,
    paymentHistory,
    createCheckoutSession,
    getSubscriptionStatus,
    cancelSubscription,
    reactivateSubscription,
    getPaymentHistory,
    createBillingPortalSession
  }
}

export default usePayments
