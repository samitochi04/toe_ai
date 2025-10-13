import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { Crown } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import PremiumUpgradeButton from './PremiumUpgradeButton'
import UsageLimitModal from '../common/UsageLimitModal'
import useChatStore from '../../store/chatStore'
import useAuthStore from '../../store/authStore'
import useUsageLimit from '../../hooks/useUsageLimit'
import Button from '../common/Button'

const ChatInterface = () => {
  const { t } = useTranslation()
  const { chatId } = useParams()
  const navigate = useNavigate()
  const messagesEndRef = useRef(null)
  
  const { user } = useAuthStore()
  const { 
    currentChat, 
    messages, 
    isLoading, 
    isTyping,
    error,
    loadChat, 
    sendMessage, 
    createNewChat,
    clearCurrentChat,
    clearError
  } = useChatStore()

  const {
    usage,
    isPremium,
    checkUsageLimit,
    incrementUsage,
    showLimitModal,
    limitType,
    handleLimitModalClose
  } = useUsageLimit()

  const [inputMessage, setInputMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState([])

  useEffect(() => {
    if (chatId && chatId !== 'new') {
      loadChat(chatId)
    } else if (chatId === 'new') {
      clearCurrentChat()
    }

    return () => {
      // Clean up when leaving chat
      if (chatId === 'new') {
        clearCurrentChat()
      }
    }
  }, [chatId, loadChat, clearCurrentChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Handle usage limit errors
  useEffect(() => {
    if (error === 'USAGE_LIMIT_REACHED') {
      // The usage limit modal will be shown by the hook
      clearError()
    }
  }, [error, clearError])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (content, files = []) => {
    if (!content.trim() && files.length === 0) return

    // Check usage limit before sending
    if (!checkUsageLimit('normal')) {
      return
    }

    try {
      // Send message (handles chat creation internally if needed)
      const result = await sendMessage(chatId, content, files)
      
      // If this was a new chat, navigate to the new chat URL
      if (result.isNewChat && result.chat?.id) {
        navigate(`/workspace/chat/${result.chat.id}`, { replace: true })
      }

      // Increment usage count on success
      incrementUsage('normal')

      setInputMessage('')
      setAttachedFiles([])
    } catch (error) {
      console.error('Error sending message:', error)
      // Error is handled in the store and useEffect above
    }
  }

  const handleFileAttach = (files) => {
    if (!isPremium) {
      // Show premium upgrade modal or redirect
      return
    }
    setAttachedFiles(prev => [...prev, ...files])
  }

  const handleFileRemove = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col h-full bg-dark-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-light-dark-secondary">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-semibold text-white-primary">
            {currentChat?.title || t('chat.newChat')}
          </h1>
          {currentChat && (
            <span className="text-sm text-gray-400">
              {messages.length} {t('chat.messages')}
            </span>
          )}
        </div>
        
        {/* Usage info and premium upgrade button for non-premium users */}
        {!isPremium && (
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              {usage.normalChats}/{usage.normalLimit} chats used
            </div>
            <PremiumUpgradeButton />
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white-primary mb-2">
              {t('chat.welcomeTitle')}
            </h3>
            <p className="text-gray-400 max-w-md">
              {t('chat.welcomeMessage')}
            </p>
            
            {/* Usage warning for free users approaching limit */}
            {!isPremium && usage.normalChats >= usage.normalLimit * 0.8 && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg max-w-sm">
                <p className="text-yellow-400 text-sm">
                  You have {usage.normalLimit - usage.normalChats} chat{usage.normalLimit - usage.normalChats !== 1 ? 's' : ''} remaining this month.
                </p>
              </div>
            )}
          </div>
        )}

        {messages.map((message, index) => (
          <MessageBubble
            key={message.id || `message-${index}`}
            message={message}
            isOwnMessage={message.role === 'user'}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <MessageBubble
            key="typing-indicator"
            message={{
              id: 'typing-indicator',
              content: '...',
              role: 'assistant',
              created_at: new Date().toISOString()
            }}
            isOwnMessage={false}
            isTyping={true}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-light-dark-secondary">
        <ChatInput
          value={inputMessage}
          onChange={setInputMessage}
          onSend={handleSendMessage}
          onFileAttach={handleFileAttach}
          onFileRemove={handleFileRemove}
          attachedFiles={attachedFiles}
          isLoading={isLoading}
          isPremium={isPremium}
          disabled={isLoading}
        />
      </div>

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={handleLimitModalClose}
        type={limitType}
        currentUsage={usage[limitType === 'interview' ? 'interviewChats' : 'normalChats']}
        limit={usage[limitType === 'interview' ? 'interviewLimit' : 'normalLimit']}
      />
    </div>
  )
}

export default ChatInterface