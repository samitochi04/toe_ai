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
        // Generate title from first 10 words of user message
        const words = content.trim().split(/\s+/)
        const titleWords = words.slice(0, 10)
        const title = titleWords.join(' ') + (words.length > 10 ? '...' : '')
        
        const chatData = {
          title: title,
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
          // Generate title from first 10 words of user message
          const words = content.trim().split(/\s+/)
          const titleWords = words.slice(0, 10)
          const title = titleWords.join(' ') + (words.length > 10 ? '...' : '')
          
          const chatData = {
            title: title,
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
        title: chat.title || (() => {
          // Generate title from first 10 words if title is empty
          const words = content.trim().split(/\s+/)
          const titleWords = words.slice(0, 10)
          return titleWords.join(' ') + (words.length > 10 ? '...' : '')
        })()
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

  // Send interview message with context
  sendInterviewMessage: async (chatId, content, jobPosition, companyName, difficulty, settings) => {
    // Validate chatId first
    if (!chatId || chatId === 'undefined' || chatId === 'null' || chatId === 'new') {
      // Generate title from first 10 words for interview title
      const words = content.trim().split(/\s+/)
      const titleWords = words.slice(0, 10)
      const contentTitle = titleWords.join(' ') + (words.length > 10 ? '...' : '')
      
      // If no valid chatId, create a new chat first
      const chatData = {
        title: `${jobPosition} Interview${companyName ? ` at ${companyName}` : ''} - ${contentTitle}`,
        job_position: jobPosition,
        company_name: companyName,
        conversation: [],  // Start with empty conversation
        interview_settings: {
          difficulty,
          voice_type: settings?.voice_type || 'alloy',
          voice_speed: settings?.voice_speed || 1.0,
          language: settings?.language || 'en',
          max_duration_minutes: settings?.max_duration_minutes || 60
        }
      }
      
      // Create new interview chat
      const newChat = await api.post('/chats/interview', chatData)
      
      // Now send the message to the newly created chat
      const messageData = {
        content,
        include_audio: true,
        job_position: jobPosition,
        company_name: companyName,
        difficulty,
        voice_type: settings?.voice_type || 'alloy',
        voice_speed: settings?.voice_speed || 1.0
      }
      
      // Send message to the newly created chat
      const response = await api.post(`/chats/interview/${newChat.data.id}/message`, messageData)
      
      return {
        ...response.data,
        chat: newChat.data,
        isNewChat: true
      }
    }
    
    // For existing chats, send message normally
    const messageData = {
      content,
      include_audio: true,
      job_position: jobPosition,
      company_name: companyName,
      difficulty,
      voice_type: settings?.voice_type || 'alloy',
      voice_speed: settings?.voice_speed || 1.0
    }
    
    const response = await api.post(`/chats/interview/${chatId}/message`, messageData)
    return {
      ...response.data,
      isNewChat: false
    }
  },

  // Speech to text conversion
  speechToText: async (audioFormData) => {
    const response = await api.post('/ai/speech-to-text', audioFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Text to speech conversion
  textToSpeech: async (text, voice = 'alloy', speed = 1.0) => {
    const response = await api.post('/ai/text-to-speech', {
      text,
      voice,
      speed
    })
    return response.data
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
  },

  // Get specific interview chat
  getInterviewChat: async (chatId) => {
    // Validate chatId before making request
    if (!chatId || chatId === 'undefined' || chatId === 'null' || chatId === 'new') {
      throw new Error('Invalid chat ID provided')
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(chatId)) {
      throw new Error('Invalid chat ID format')
    }

    try {
      const response = await api.get(`/chats/interview/${chatId}`)
      return response
    } catch (error) {
      console.error('Error fetching interview chat:', error)
      throw error
    }
  },
}