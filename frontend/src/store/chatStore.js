import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { chatService } from '../services/chat'

const useChatStore = create(
  devtools(
    (set, get) => ({
      // State
      chats: [],
      currentChat: null,
      messages: [],
      isLoading: false,
      isTyping: false,
      error: null,
      searchQuery: '',
      filteredChats: [],

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setTyping: (typing) => set({ isTyping: typing }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Chat management
      fetchChats: async () => {
        try {
          set({ isLoading: true, error: null })
          const response = await chatService.getChats('normal')
          
          // Backend now returns { chats: [...], total: ..., etc }
          const chats = response.chats || []
          
          set({ 
            chats, 
            filteredChats: chats,
            isLoading: false 
          })
        } catch (error) {
          console.error('Error fetching chats:', error)
          set({ 
            chats: [],
            filteredChats: [],
            error: error.message || 'Failed to fetch chats',
            isLoading: false 
          })
        }
      },

      createNewChat: async (chatData) => {
        try {
          set({ isLoading: true, error: null })
          const newChat = await chatService.createChat(chatData)
          
          set((state) => ({
            chats: [newChat, ...state.chats],
            filteredChats: [newChat, ...state.filteredChats],
            currentChat: newChat,
            messages: [],
            isLoading: false
          }))
          
          return newChat
        } catch (error) {
          console.error('Error creating chat:', error)
          set({ 
            error: error.message || 'Failed to create chat',
            isLoading: false 
          })
          throw error
        }
      },

      loadChat: async (chatId) => {
        try {
          set({ isLoading: true, error: null })
          
          // Validate chatId before attempting to load
          if (!chatId || chatId === 'undefined' || chatId === 'null' || chatId === 'new') {
            throw new Error('Invalid chat ID')
          }
          
          // Get chat details with messages
          const chat = await chatService.getChat(chatId, 'normal')
          
          // Ensure messages are properly formatted and available
          const messages = chat.messages || chat.conversation || []
          const formattedMessages = messages.map((msg, index) => ({
            ...msg,
            id: msg.id || `msg-${chatId}-${index}`,
            created_at: msg.timestamp || msg.created_at || new Date().toISOString(),
            timestamp: msg.timestamp || msg.created_at || new Date().toISOString()
          }))
          
          set({
            currentChat: {
              ...chat,
              messages: formattedMessages,
              conversation: formattedMessages
            },
            messages: formattedMessages,
            isLoading: false
          })
        } catch (error) {
          console.error('Error loading chat:', error)
          set({ 
            error: error.message || 'Failed to load chat',
            isLoading: false 
          })
          
          // If chat not found or invalid, redirect to new chat
          if (error.message?.includes('Invalid chat ID')) {
            // Clear current chat state
            set({
              currentChat: null,
              messages: []
            })
          }
        }
      },

      clearCurrentChat: () => {
        set({
          currentChat: null,
          messages: []
        })
      },

      sendMessage: async (chatId, content, files = []) => {
        const { messages, currentChat } = get()
        
        try {
          set({ isLoading: true, error: null, isTyping: true })

          // Add user message immediately for better UX
          const tempUserMessage = {
            id: 'temp-' + Date.now(),
            content,
            role: 'user',
            files: files.map(file => ({
              name: file.name,
              type: file.type,
              size: file.size
            })),
            created_at: new Date().toISOString(),
            timestamp: new Date().toISOString()
          }

          set((state) => ({
            messages: [...state.messages, tempUserMessage]
          }))

          // Send message to API with conversation context
          // Handle cases where chatId might be 'new', undefined, or invalid
          const effectiveChatId = chatId === 'new' || !chatId || chatId === 'undefined' ? 'new' : chatId
          const response = await chatService.sendMessage(effectiveChatId, content, files, 'normal')

          // Remove temp message and update with the real chat data
          set((state) => ({
            messages: state.messages.filter(msg => msg.id && !msg.id.startsWith('temp-')),
            isTyping: false,
            isLoading: false
          }))

          // Update current chat and messages from response
          if (response.chat) {
            const chatMessages = response.chat.messages || response.chat.conversation || []
            const formattedMessages = chatMessages.map((msg, index) => ({
              ...msg,
              id: msg.id || `msg-${response.chat.id}-${index}`,
              created_at: msg.timestamp || msg.created_at || new Date().toISOString(),
              timestamp: msg.timestamp || msg.created_at || new Date().toISOString()
            }))

            set((state) => ({
              currentChat: {
                ...response.chat,
                messages: formattedMessages,
                conversation: formattedMessages
              },
              messages: formattedMessages,
              chats: response.isNewChat 
                ? [response.chat, ...state.chats]
                : state.chats.map(chat => 
                    chat.id === response.chat.id ? response.chat : chat
                  ),
              filteredChats: response.isNewChat
                ? [response.chat, ...state.filteredChats]
                : state.filteredChats.map(chat => 
                    chat.id === response.chat.id ? response.chat : chat
                  )
            }))
          }

          return response
        } catch (error) {
          console.error('Error sending message:', error)
          
          // Remove temp message on error
          set((state) => ({
            messages: state.messages.filter(msg => msg.id && !msg.id.startsWith('temp-')),
            isTyping: false,
            isLoading: false
          }))

          // Handle payment required error (402)
          if (error.response?.status === 402) {
            set({ error: 'USAGE_LIMIT_REACHED' })
          } else {
            set({ error: error.message || 'Failed to send message' })
          }
          
          throw error
        }
      },

      updateChat: async (chatId, updates) => {
        try {
          set({ error: null })
          const updatedChat = await chatService.updateChat(chatId, updates, 'normal')
          
          set((state) => ({
            chats: state.chats.map(chat => 
              chat.id === chatId ? updatedChat : chat
            ),
            filteredChats: state.filteredChats.map(chat => 
              chat.id === chatId ? updatedChat : chat
            ),
            currentChat: state.currentChat?.id === chatId ? updatedChat : state.currentChat
          }))
          
          return updatedChat
        } catch (error) {
          console.error('Error updating chat:', error)
          set({ error: error.message || 'Failed to update chat' })
          throw error
        }
      },

      deleteChat: async (chatId) => {
        try {
          set({ error: null })
          await chatService.deleteChat(chatId, 'normal')
          
          set((state) => ({
            chats: state.chats.filter(chat => chat.id !== chatId),
            filteredChats: state.filteredChats.filter(chat => chat.id !== chatId),
            currentChat: state.currentChat?.id === chatId ? null : state.currentChat,
            messages: state.currentChat?.id === chatId ? [] : state.messages
          }))
        } catch (error) {
          console.error('Error deleting chat:', error)
          set({ error: error.message || 'Failed to delete chat' })
          throw error
        }
      },

      // Search and filter
      setSearchQuery: (query) => {
        const { chats } = get()
        const filtered = query.trim() === '' 
          ? chats 
          : chats.filter(chat => 
              chat.title.toLowerCase().includes(query.toLowerCase()) ||
              chat.preview?.toLowerCase().includes(query.toLowerCase())
            )
        
        set({ 
          searchQuery: query,
          filteredChats: filtered 
        })
      },

      // Message actions
      addMessage: (message) => {
        set((state) => ({
          messages: [...state.messages, message]
        }))
      },

      updateMessage: (messageId, updates) => {
        set((state) => ({
          messages: state.messages.map(msg =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          )
        }))
      },

      deleteMessage: async (messageId) => {
        try {
          await chatService.deleteMessage(messageId)
          set((state) => ({
            messages: state.messages.filter(msg => msg.id !== messageId)
          }))
        } catch (error) {
          console.error('Error deleting message:', error)
          set({ error: error.message || 'Failed to delete message' })
          throw error
        }
      },

      // File upload
      uploadFiles: async (files) => {
        try {
          set({ isLoading: true, error: null })
          const uploadedFiles = await chatService.uploadFiles(files)
          set({ isLoading: false })
          return uploadedFiles
        } catch (error) {
          console.error('Error uploading files:', error)
          set({ 
            error: error.message || 'Failed to upload files',
            isLoading: false 
          })
          throw error
        }
      },

      // Reset store
      reset: () => {
        set({
          chats: [],
          currentChat: null,
          messages: [],
          isLoading: false,
          isTyping: false,
          error: null,
          searchQuery: '',
          filteredChats: []
        })
      }
    }),
    {
      name: 'chat-store'
    }
  )
)

export default useChatStore