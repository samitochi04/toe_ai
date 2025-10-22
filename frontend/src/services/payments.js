import api from './api'

export const paymentApi = {
  // Create checkout session for premium subscription
  createCheckoutSession: async (planType = 'monthly') => {
    const response = await api.post('/payments/create-checkout-session', {
      plan_type: planType
    })
    console.log('Payment API response:', response.data) // Debug log
    return response.data
  },

  // Get subscription status
  getSubscriptionStatus: async () => {
    const response = await api.get('/payments/subscription-status')
    return response.data
  },

  // Cancel subscription
  cancelSubscription: async () => {
    const response = await api.post('/payments/cancel-subscription')
    return response.data
  },

  // Reactivate subscription
  reactivateSubscription: async () => {
    const response = await api.post('/payments/reactivate-subscription')
    return response.data
  },

  // Get payment history
  getPaymentHistory: async () => {
    const response = await api.get('/payments/payment-history')
    return response.data
  },

  // Create billing portal session
  createBillingPortalSession: async (returnUrl) => {
    const response = await api.get('/payments/billing-portal', {
      params: { return_url: returnUrl }
    })
    return response.data
  },

  // Get checkout session details
  getCheckoutSession: async (sessionId) => {
    const response = await api.get(`/payments/checkout-session/${sessionId}`)
    return response.data
  }
}

export default paymentApi
