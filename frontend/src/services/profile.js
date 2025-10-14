import { api } from './api'

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

  // Add payment method (mock for now - to be implemented in backend)
  addPaymentMethod: async (paymentData) => {
    // TODO: Implement payment methods endpoint in backend
    return {
      success: true,
      message: 'Payment method functionality will be available soon'
    }
  },

  // Get payment methods (mock for now - to be implemented in backend)
  getPaymentMethods: async () => {
    // TODO: Implement payment methods endpoint in backend
    return []
  },

  // Remove payment method (mock for now - to be implemented in backend)
  removePaymentMethod: async (paymentMethodId) => {
    // TODO: Implement payment methods endpoint in backend
    return {
      success: true,
      message: 'Payment method functionality will be available soon'
    }
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