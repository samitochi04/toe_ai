import { api } from './api'

export const chatService = {
  // Get user's chats with proper message count
  getChats: async (chatType = 'normal') => {
    const endpoint = chatType === 'normal' ? '/chats/normal' : '/chats/interview'
    const response = await api.get(endpoint)
    
    // The backend now returns the correct format
    return response.data || { chats: [] }
  },

  // Get specific chat with all messages
  getChat: async (chatId, chatType = 'normal') => {
    // Validate chatId before making request
    if (!chatId || chatId === 'undefined' || chatId === 'null' || chatId === 'new') {
      throw new Error('Invalid chat ID provided')
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(chatId)) {
      throw new Error('Invalid chat ID format')
    }

    const endpoint = chatType === 'normal' 
      ? `/chats/normal/${chatId}` 
      : `/chats/interview/${chatId}`
    
    const response = await api.get(endpoint)
    
    // Backend returns the chat with conversation array
    const chat = response.data
    
    // Ensure messages are properly formatted for the frontend
    if (chat.conversation) {
      chat.messages = chat.conversation.map((msg, index) => ({
        ...msg,
        id: msg.id || `msg-${chatId}-${index}`,
        created_at: msg.timestamp || msg.created_at || new Date().toISOString(),
        timestamp: msg.timestamp || msg.created_at || new Date().toISOString()
      }))
    } else {
      chat.messages = []
      chat.conversation = []
    }
    
    return chat
  },

  // Create new chat
  createChat: async (chatData, chatType = 'normal') => {
    const endpoint = chatType === 'normal' ? '/chats/normal' : '/chats/interview'
    const response = await api.post(endpoint, chatData)
    return response.data
  },

  // Send message with conversation context
  sendMessage: async (chatId, content, files = [], chatType = 'normal') => {
    try {
      let chat = null
      let isNewChat = false
      
      // If chatId is 'new' or undefined, create a new chat first
      if (chatId === 'new' || !chatId || chatId === 'undefined') {
        const chatData = {
          title: content.length > 50 ? content.substring(0, 50) + '...' : content,
          conversation: []
        }
        
        chat = await chatService.createChat(chatData, chatType)
        chatId = chat.id
        isNewChat = true
      } else {
        // Get existing chat to include conversation history
        try {
          chat = await chatService.getChat(chatId, chatType)
        } catch (error) {
          // If chat doesn't exist, create a new one
          console.warn('Chat not found, creating new chat:', error)
          const chatData = {
            title: content.length > 50 ? content.substring(0, 50) + '...' : content,
            conversation: []
          }
          
          chat = await chatService.createChat(chatData, chatType)
          chatId = chat.id
          isNewChat = true
        }
      }
      
      // Prepare conversation history for AI context (last 10 messages)
      const conversationHistory = chat.conversation || []
      const recentMessages = conversationHistory.slice(-10)
      
      // Send message to AI with context
      const aiEndpoint = chatType === 'interview' ? '/ai/interview/chat' : '/ai/chat/completion'
      
      const requestBody = {
        content,
        conversation_history: recentMessages, // Include recent conversation
        include_audio: chatType === 'interview'
      }
      
      // Add interview-specific parameters if needed
      if (chatType === 'interview' && chat.job_position) {
        requestBody.job_position = chat.job_position
        requestBody.company_name = chat.company_name
        requestBody.difficulty = chat.interview_settings?.difficulty || 'medium'
      }
      
      const aiResponse = await api.post(aiEndpoint, requestBody)
      
      // Build updated conversation
      const userMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
        files: files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size
        }))
      }
      
      const aiMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiResponse.data.message.content,
        timestamp: new Date().toISOString(),
        audio_url: aiResponse.data.message.audio_url
      }
      
      const updatedConversation = [...conversationHistory, userMessage, aiMessage]
      
      // Update the chat with new messages
      const updateData = {
        conversation: updatedConversation,
        title: chat.title || (content.length > 50 ? content.substring(0, 50) + '...' : content)
      }
      
      const updateEndpoint = chatType === 'normal' 
        ? `/chats/normal/${chatId}` 
        : `/chats/interview/${chatId}`
      
      const updatedChat = await api.put(updateEndpoint, updateData)
      
      return {
        chat: {
          ...updatedChat.data,
          messages: updatedConversation,
          conversation: updatedConversation
        },
        isNewChat,
        userMessage,
        aiMessage,
        usage: aiResponse.data.usage,
        cost: aiResponse.data.cost
      }
      
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  },

  // Update chat
  updateChat: async (chatId, updates, chatType = 'normal') => {
    const endpoint = chatType === 'normal' 
      ? `/chats/normal/${chatId}` 
      : `/chats/interview/${chatId}`
    
    const response = await api.put(endpoint, updates)
    return response.data
  },

  // Delete chat
  deleteChat: async (chatId, chatType = 'normal') => {
    const endpoint = chatType === 'normal' 
      ? `/chats/normal/${chatId}` 
      : `/chats/interview/${chatId}`
    
    await api.delete(endpoint)
  },

  // Upload files
  uploadFiles: async (files) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    return response.data
  }
}