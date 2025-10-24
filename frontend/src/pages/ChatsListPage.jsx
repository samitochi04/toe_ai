import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Edit2, Trash2, Share2, Download } from 'lucide-react'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import { formatDateTime, formatDate } from '../utils/helpers'

const ChatsListPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  const { user } = useAuthStore()
  const {
    chats,
    filteredChats,
    isLoading,
    error,
    searchQuery,
    fetchChats,
    deleteChat,
    updateChat,
    setSearchQuery
  } = useChatStore()

  const [selectedChat, setSelectedChat] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadChats = async () => {
      setLoading(true)
      try {
        await fetchChats()
      } catch (error) {
        console.error('Error loading chats:', error)
        toast.error('Failed to load chats')
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [fetchChats])

  const handleNewChat = () => {
    navigate('/workspace/chat/new')
  }

  const handleChatClick = (chatId) => {
    // Validate chatId before navigating
    if (!chatId || chatId === 'undefined' || chatId === 'null') {
      console.error('Invalid chatId, cannot navigate')
      toast.error('Invalid chat selected')
      return
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(chatId)) {
      console.error('Invalid chatId format, cannot navigate')
      toast.error('Invalid chat format')
      return
    }
    
    navigate(`/workspace/chat/${chatId}`)
  }

  const handleDeleteChat = async () => {
    if (!selectedChat) return
    
    try {
      await deleteChat(selectedChat.id)
      setShowDeleteModal(false)
      setSelectedChat(null)
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const handleRenameChat = async () => {
    if (!selectedChat || !newTitle.trim()) return
    
    try {
      await updateChat(selectedChat.id, { title: newTitle.trim() })
      setShowRenameModal(false)
      setSelectedChat(null)
      setNewTitle('')
    } catch (error) {
      console.error('Error renaming chat:', error)
    }
  }

  const handleDropdownAction = (action, chat) => {
    setSelectedChat(chat)
    setDropdownOpen(null)
    
    switch (action) {
      case 'rename':
        setNewTitle(chat.title)
        setShowRenameModal(true)
        break
      case 'delete':
        setShowDeleteModal(true)
        break
      case 'share':
        // Implement share functionality
        console.log('Share chat:', chat.id)
        break
      case 'export':
        // Implement export functionality
        console.log('Export chat:', chat.id)
        break
    }
  }

  const ChatCard = ({ chat }) => (
    <div
      key={chat.id}
      onClick={() => handleChatClick(chat.id)}
      className="bg-light-dark-secondary rounded-xl p-4 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-600"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-medium text-white-primary truncate flex-1 mr-2">
          {chat.title || t('chats.untitled')}
        </h3>
        {chat.is_shared && (
          <Share2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
        )}
      </div>
      
      {chat.preview && (
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
          {chat.preview}
        </p>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {chat.messageCount || 0} {t('chat.messages')}
        </span>
        <span>
          {formatDateTime(chat.updated_at || chat.created_at)}
        </span>
      </div>
      
      {/* Remove debug info - was showing chat ID to users */}
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <div className="border-b border-light-dark-secondary bg-dark-secondary">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white-primary mb-2">
                {t('chat.myChats')}
              </h1>
              <p className="text-gray-400">
                {t('chat.manageConversations')}
              </p>
            </div>
            
            <Button onClick={handleNewChat} className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>{t('chat.newChat')}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder={t('chat.searchChats')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Chats Grid */}
        {!isLoading && filteredChats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChats.map((chat) => (
              <ChatCard key={chat.id} chat={chat} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredChats.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white-primary mb-2">
              {searchQuery ? t('chat.noSearchResults') : t('chat.noChats')}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchQuery ? t('chat.tryDifferentSearch') : t('chat.startFirstChat')}
            </p>
            {!searchQuery && (
              <Button onClick={handleNewChat} className="flex items-center space-x-2 mx-auto">
                <Plus className="w-5 h-5" />
                <span>{t('chat.createFirstChat')}</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white-primary mb-4">
            {t('chat.deleteConfirmTitle')}
          </h2>
          <p className="text-gray-300 mb-6">
            {t('chat.deleteConfirmMessage')}
          </p>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteChat}
              className="flex-1"
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal isOpen={showRenameModal} onClose={() => setShowRenameModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white-primary mb-4">
            {t('chat.renameChat')}
          </h2>
          <Input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('chat.enterNewTitle')}
            className="mb-6"
            autoFocus
          />
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowRenameModal(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleRenameChat}
              disabled={!newTitle.trim()}
              className="flex-1"
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ChatsListPage