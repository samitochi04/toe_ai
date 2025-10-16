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
    // For now, simulate successful payment method addition
    const mockPaymentMethod = {
      id: `pm_${Date.now()}`,
      number: paymentData.number,
      last4: paymentData.number.slice(-4),
      brand: paymentData.number.startsWith('4') ? 'visa' : 'mastercard',
      expiry: paymentData.expiry,
      name: paymentData.name,
      isDefault: false
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return mockPaymentMethod
  },

  // Get payment methods (mock for now - to be implemented in backend)
  getPaymentMethods: async () => {
    // TODO: Implement payment methods endpoint in backend
    // For now, return mock data for premium users
    const profileData = await api.get('/users/profile')
    const user = profileData.data
    
    if (user?.subscription?.status === 'active' && user?.subscription?.tier?.toLowerCase() === 'premium') {
      return [
        {
          id: 'pm_1',
          number: '4242424242424242',
          last4: '4242',
          brand: 'visa',
          expiry: '12/25',
          name: 'John Doe',
          isDefault: true
        }
      ]
    }
    
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