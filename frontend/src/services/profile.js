import { api } from './api'
import paymentMethodsService from './paymentMethods'

export const profileService = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/profile')
    return response.data
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData)
    return response.data
  },

  // Update user settings (for now, just store in profile)
  updateSettings: async (settings) => {
    const response = await api.put('/users/profile', settings)
    return response.data
  },

  // Get user subscription info (included in profile)
  getSubscription: async () => {
    const response = await api.get('/users/profile')
    return response.data.subscription
  },

  // Create setup intent for adding payment method
  createSetupIntent: async () => {
    const response = await api.post('/payment-methods/setup-intent')
    return response.data
  },

  // Add payment method using Stripe Elements
  addPaymentMethod: async (paymentMethodId) => {
    return await paymentMethodsService.addPaymentMethod(paymentMethodId)
  },

  // Get payment methods
  getPaymentMethods: async () => {
    return await paymentMethodsService.getPaymentMethods()
  },

  // Remove payment method
  removePaymentMethod: async (paymentMethodId) => {
    return await paymentMethodsService.deletePaymentMethod(paymentMethodId)
  },

  // Update language preference (store in localStorage for now)
  updateLanguage: async (language) => {
    // Store language preference in localStorage
    localStorage.setItem('app_language', language)
    return {
      success: true,
      language
    }
  }
}

export default profileService