import { api } from './api'

export const shareService = {
  // Get user's shared chats
  getSharedChats: async () => {
    const response = await api.get('/sharing/my-shares')
    return response.data
  },

  // Share a chat
  shareChat: async (chatId, chatType, shareData) => {
    const response = await api.post('/sharing/create', {
      chat_id: chatId,
      chat_type: chatType,
      ...shareData
    })
    return response.data
  },

  // Get shared chat by token
  getSharedChatByToken: async (shareToken) => {
    const response = await api.get(`/sharing/token/${shareToken}`)
    return response.data
  },

  // Update shared chat
  updateSharedChat: async (shareId, updates) => {
    const response = await api.put(`/sharing/${shareId}`, updates)
    return response.data
  },

  // Delete shared chat
  deleteSharedChat: async (shareId) => {
    const response = await api.delete(`/sharing/${shareId}`)
    return response.data
  },

  // Get share analytics (basic analytics for now)
  getShareAnalytics: async (shareId) => {
    // For now, return basic analytics - to be enhanced later
    return {
      views: 0,
      last_accessed: null
    }
  }
}

export default shareService