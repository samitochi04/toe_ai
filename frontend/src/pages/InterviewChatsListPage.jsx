import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Users, 
  Search, 
  Plus, 
  Calendar, 
  Building2, 
  Briefcase,
  Clock,
  MoreVertical,
  Trash2,
  ExternalLink,
  Download,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { api } from '../services/api'
import { chatService } from '../services/chat'
import { formatDateTime } from '../utils/helpers'

const InterviewChatsListPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [chats, setChats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChat, setSelectedChat] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showOptionsMenu, setShowOptionsMenu] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    has_next: false,
    has_prev: false
  })

  const isPremium = user?.subscription?.status === 'active'

  useEffect(() => {
    loadChats()
  }, [pagination.page, searchQuery])

  const loadChats = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString(),
      })
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await api.get(`/chats/interview?${params}`)
      
      setChats(response.data.chats)
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        has_next: response.data.has_next,
        has_prev: response.data.has_prev
      }))
    } catch (error) {
      console.error('Error loading interview chats:', error)
      toast.error(t('interviewsList.loadError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleChatClick = (chat) => {
    navigate(`/workspace/interview/${chat.id}`)
  }

  const handleNewInterview = () => {
    navigate('/workspace/interview/new')
  }

  const handleDeleteChat = async () => {
    if (!selectedChat) return

    try {
      await api.delete(`/chats/interview/${selectedChat.id}`)
      toast.success(t('interviewsList.deleteSuccessMessage'))
      setChats(prev => prev.filter(chat => chat.id !== selectedChat.id))
      setShowDeleteModal(false)
      setSelectedChat(null)
    } catch (error) {
      console.error('Error deleting chat:', error)
      toast.error(t('interviewsList.deleteErrorMessage'))
    }
  }

  const handleOpenChat = (chat) => {
    navigate(`/workspace/interview/${chat.id}`)
    setShowOptionsMenu(null)
  }

  const handleExportChat = async (chat) => {
    if (!isPremium) {
      toast.error(t('interviewsList.exportPremiumOnly'))
      return
    }

    try {
      toast.loading(t('interviewsList.generatingPdf'), { id: `pdf-export-${chat.id}` })
      
      const pdfData = await chatService.exportChatToPDF(chat.id, 'interview', {
        includeMetadata: true,
        includeAudioLinks: false
      })

      // Create download URL for the PDF
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '')
      const pdfUrl = `${baseUrl}${pdfData.pdf_url}`
      
      // Open PDF in new tab for viewing and downloading
      const newWindow = window.open(pdfUrl, '_blank')
      
      if (newWindow) {
        toast.success(t('interviewsList.pdfGeneratedSuccess'), { id: `pdf-export-${chat.id}` })
      } else {
        // Fallback if popup is blocked - create download link
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = pdfData.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(t('interviewsList.pdfDownloadedSuccess'), { id: `pdf-export-${chat.id}` })
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      
      if (error.response?.status === 404) {
        toast.error(t('interviewsList.pdfNotFoundError'), { id: `pdf-export-${chat.id}` })
      } else if (error.response?.status === 403) {
        toast.error(t('interviewsList.pdfPremiumRequiredError'), { id: `pdf-export-${chat.id}` })
      } else if (error.response?.status >= 500) {
        toast.error(t('interviewsList.pdfServerError'), { id: `pdf-export-${chat.id}` })
      } else {
        toast.error(t('interviewsList.pdfExportError'), { id: `pdf-export-${chat.id}` })
      }
    }
    
    setShowOptionsMenu(null)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-400 bg-green-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'hard': return 'text-red-400 bg-red-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const ChatCard = ({ chat }) => {
    const conversationLength = chat.conversation?.length || 0
    const difficulty = chat.interview_settings?.difficulty || 'medium'
    
    return (
      <div 
        className="bg-light-dark-secondary rounded-xl p-6 border border-gray-600 hover:border-gray-500 transition-all duration-200 cursor-pointer group relative"
        onClick={() => handleChatClick(chat)}
      >
        {/* Options Menu */}
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
            onClick={(e) => {
              e.stopPropagation()
              setShowOptionsMenu(showOptionsMenu === chat.id ? null : chat.id)
            }}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>

          {showOptionsMenu === chat.id && (
            <div className="absolute right-0 top-8 bg-dark-primary border border-gray-600 rounded-lg shadow-lg py-2 min-w-[150px] z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenChat(chat)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center space-x-2 text-white-primary"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{t('interviewsList.actions.open')}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleExportChat(chat)
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center space-x-2 ${
                  !isPremium ? 'text-gray-500' : 'text-white-primary'
                }`}
                disabled={!isPremium}
              >
                <Download className="w-4 h-4" />
                <span>{t('interviewsList.actions.export')}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedChat(chat)
                  setShowDeleteModal(true)
                  setShowOptionsMenu(null)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700 flex items-center space-x-2 text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('interviewsList.actions.delete')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Chat Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white-primary group-hover:text-blue-400 transition-colors line-clamp-1">
                {chat.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                {chat.job_position && (
                  <span className="text-sm text-gray-400 flex items-center">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {chat.job_position}
                  </span>
                )}
                {chat.company_name && (
                  <span className="text-sm text-gray-400 flex items-center">
                    <Building2 className="w-3 h-3 mr-1" />
                    {chat.company_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 text-gray-400">
              <span className="text-sm">{conversationLength} {t('interviewsList.messages')}</span>
            </div>
            {chat.duration_minutes > 0 && (
              <div className="flex items-center space-x-1 text-gray-400">
                <Clock className="w-3 h-3" />
                <span className="text-sm">{chat.duration_minutes}m</span>
              </div>
            )}
          </div>
          
          <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </span>
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{t('interviewsList.created')} {formatDateTime(chat.created_at)}</span>
          </div>
          {chat.updated_at !== chat.created_at && (
            <span>{t('interviewsList.updated')} {formatDateTime(chat.updated_at)}</span>
          )}
        </div>

        {/* Share indicator */}
        {chat.is_shared && (
          <div className="absolute top-2 left-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white-primary mb-2">
              {t('interviewsList.title')}
            </h1>
            <p className="text-gray-400">
              {t('interviewsList.subtitle')}
            </p>
          </div>
          <Button
            onClick={handleNewInterview}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium flex items-center space-x-2 mt-4 md:mt-0"
          >
            <Plus className="w-5 h-5" />
            <span>{t('interviewsList.newInterview')}</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('interviewsList.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-light-dark-secondary border border-gray-600 rounded-xl text-white-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Interview Chats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-light-dark-secondary rounded-xl p-6 border border-gray-600 animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-600 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-600 rounded"></div>
                  <div className="h-3 bg-gray-600 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : chats.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chats.map((chat) => (
                <ChatCard key={chat.id} chat={chat} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.per_page && (
              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="secondary"
                  disabled={!pagination.has_prev}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  {t('interviewsList.previous')}
                </Button>
                
                <span className="text-gray-400">
                  {t('interviewsList.page')} {pagination.page} {t('interviewsList.of')} {Math.ceil(pagination.total / pagination.per_page)}
                </span>
                
                <Button
                  variant="secondary"
                  disabled={!pagination.has_next}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  {t('interviewsList.next')}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white-primary mb-2">
              {t('interviewsList.noInterviews')}
            </h3>
            <p className="text-gray-400 mb-6">
              {t('interviewsList.getStarted')}
            </p>
            <Button
              onClick={handleNewInterview}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
            >
              {t('interviewsList.createFirst')}
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-white-primary mb-4">
            {t('interviewsList.deleteConfirmTitle')}
          </h2>
          <p className="text-gray-400 mb-6">
            {t('interviewsList.deleteConfirmMessage', { title: selectedChat?.title })}
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

      {/* Click outside to close options menu */}
      {showOptionsMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowOptionsMenu(null)}
        />
      )}
    </div>
  )
}

export default InterviewChatsListPage
