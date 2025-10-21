import { api } from './api'

export const paymentMethodsService = {
  // Create setup intent for adding payment method
  createSetupIntent: async () => {
    const response = await api.post('/payment-methods/setup-intent')
    return response.data
  },

  // Add payment method after Stripe confirmation
  addPaymentMethod: async (paymentMethodId) => {
    const response = await api.post('/payment-methods/', {
      stripe_payment_method_id: paymentMethodId
    })
    return response.data
  },

  // Get all payment methods
  getPaymentMethods: async () => {
    const response = await api.get('/payment-methods/')
    return response.data
  },

  // Update payment method (set as default, update name, etc.)
  updatePaymentMethod: async (paymentMethodId, updateData) => {
    const response = await api.put(`/payment-methods/${paymentMethodId}`, updateData)
    return response.data
  },

  // Delete payment method
  deletePaymentMethod: async (paymentMethodId) => {
    const response = await api.delete(`/payment-methods/${paymentMethodId}`)
    return response.data
  },

  // Set payment method as default
  setDefaultPaymentMethod: async (paymentMethodId) => {
    const response = await api.put(`/payment-methods/${paymentMethodId}`, {
      is_default: true
    })
    return response.data
  }
}

export default paymentMethodsService
