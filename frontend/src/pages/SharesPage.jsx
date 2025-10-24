import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { 
  Share2, 
  Plus, 
  Crown, 
  MessageCircle, 
  Video, 
  Eye, 
  Copy, 
  Trash2,
  Edit3,
  Calendar,
  Users,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import shareService from '../services/share'
import { chatService } from '../services/chat'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Input from '../components/common/Input'
import { formatDateTime } from '../utils/helpers'

const SharesPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [shares, setShares] = useState([])
  const [normalChats, setNormalChats] = useState([])
  const [interviewChats, setInterviewChats] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedChat, setSelectedChat] = useState(null)
  const [shareForm, setShareForm] = useState({
    title: '',
    description: '',
    allow_comments: false,
    expires_in_days: 30
  })
  const [activeTab, setActiveTab] = useState('my-shares') // 'my-shares' or 'create-share'

  const isPremium = user?.subscription?.status === 'active'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      if (isPremium) {
        // Load existing shares
        const sharesData = await shareService.getSharedChats()
        setShares(sharesData.shares || [])
        
        // Load user's chats for sharing
        const [normalChatsData, interviewChatsData] = await Promise.all([
          chatService.getChats('normal'),
          chatService.getChats('interview')
        ])
        
        setNormalChats(normalChatsData.chats || [])
        setInterviewChats(interviewChatsData.chats || [])
      }
    } catch (error) {
      console.error('Error loading shares data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShareChat = async () => {
    if (!selectedChat || !isPremium) return

    try {
      const shareData = {
        ...shareForm,
        title: shareForm.title || selectedChat.title,
        expires_at: shareForm.expires_in_days ? 
          new Date(Date.now() + shareForm.expires_in_days * 24 * 60 * 60 * 1000).toISOString() : 
          null
      }

      const newShare = await shareService.shareChat(
        selectedChat.id, 
        selectedChat.type, 
        shareData
      )
      
      setShares([newShare, ...shares])
      setShowShareModal(false)
      setSelectedChat(null)
      setShareForm({
        title: '',
        description: '',
        allow_comments: false,
        expires_in_days: 30
      })
      
      toast.success('Chat shared successfully!')
    } catch (error) {
      console.error('Error sharing chat:', error)
      toast.error('Failed to share chat')
    }
  }

  const handleCopyShareLink = (shareToken) => {
    const shareUrl = `${window.location.origin}/shared/${shareToken}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Share link copied to clipboard!')
  }

  const handleDeleteShare = async (shareId) => {
    if (!confirm('Are you sure you want to delete this shared chat?')) return

    try {
      await shareService.deleteSharedChat(shareId)
      setShares(shares.filter(share => share.id !== shareId))
      toast.success('Shared chat deleted successfully!')
    } catch (error) {
      console.error('Error deleting share:', error)
      toast.error('Failed to delete shared chat')
    }
  }

  const openShareModal = (chat, type) => {
    setSelectedChat({ ...chat, type })
    setShareForm({
      title: chat.title,
      description: '',
      allow_comments: false,
      expires_in_days: 30
    })
    setShowShareModal(true)
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-4xl">
          <div className="text-center py-12 md:py-16">
            <Crown className="w-12 h-12 md:w-16 md:h-16 text-yellow-500 mx-auto mb-4 md:mb-6" />
            <h1 className="text-2xl md:text-3xl font-bold text-white-primary mb-3 md:mb-4">
              {t('shares.premiumRequired.title')}
            </h1>
            <p className="text-white-secondary text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
              {t('shares.premiumRequired.description')}
            </p>
            
            <div className="bg-light-dark-secondary rounded-xl p-4 md:p-8 max-w-md mx-auto mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-semibold text-white-primary mb-3 md:mb-4">
                {t('shares.premiumRequired.whatYouCanShare')}
              </h3>
              <ul className="space-y-2 md:space-y-3 text-left">
                <li className="flex items-center gap-2 md:gap-3 text-white-secondary text-sm md:text-base">
                  <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-brand-primary flex-shrink-0" />
                  {t('shares.premiumRequired.features.0')}
                </li>
                <li className="flex items-center gap-2 md:gap-3 text-white-secondary text-sm md:text-base">
                  <Video className="w-4 h-4 md:w-5 md:h-5 text-brand-primary flex-shrink-0" />
                  {t('shares.premiumRequired.features.1')}
                </li>
                <li className="flex items-center gap-2 md:gap-3 text-white-secondary text-sm md:text-base">
                  <Users className="w-4 h-4 md:w-5 md:h-5 text-brand-primary flex-shrink-0" />
                  {t('shares.premiumRequired.features.2')}
                </li>
                <li className="flex items-center gap-2 md:gap-3 text-white-secondary text-sm md:text-base">
                  <Eye className="w-4 h-4 md:w-5 md:h-5 text-brand-primary flex-shrink-0" />
                  {t('shares.premiumRequired.features.3')}
                </li>
              </ul>
            </div>

            <Button
              onClick={() => navigate('/workspace/premium')}
              className="px-6 md:px-8 py-2 md:py-3 text-base md:text-lg"
            >
              <Crown className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              {t('shares.premiumRequired.upgradeButton')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-white-primary">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white-primary">
            {t('shares.title')}
          </h1>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
            <span className="text-sm md:text-base text-white-secondary">{t('shares.premiumFeature')}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600 mb-6 md:mb-8">
          <button
            onClick={() => setActiveTab('my-shares')}
            className={`px-3 md:px-6 py-2 md:py-3 font-medium border-b-2 transition-colors text-sm md:text-base ${
              activeTab === 'my-shares'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-white-secondary hover:text-white-primary'
            }`}
          >
            {t('shares.myShares')} ({shares.length})
          </button>
          <button
            onClick={() => setActiveTab('create-share')}
            className={`px-3 md:px-6 py-2 md:py-3 font-medium border-b-2 transition-colors text-sm md:text-base ${
              activeTab === 'create-share'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-white-secondary hover:text-white-primary'
            }`}
          >
            {t('shares.shareNewChat')}
          </button>
        </div>

        {activeTab === 'my-shares' ? (
          // My Shares Tab
          <div className="space-y-4 md:space-y-6">
            {shares.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <Share2 className="w-12 h-12 md:w-16 md:h-16 text-gray-600 mx-auto mb-4 md:mb-6" />
                <h3 className="text-lg md:text-xl font-semibold text-white-primary mb-2">
                  {t('shares.noShares')}
                </h3>
                <p className="text-white-secondary mb-4 md:mb-6 text-sm md:text-base">
                  {t('shares.startSharing')}
                </p>
                <Button onClick={() => setActiveTab('create-share')} className="text-sm md:text-base">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('shares.shareFirstChat')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {shares.map((share) => (
                  <div key={share.id} className="bg-light-dark-secondary rounded-xl p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-brand-primary rounded-full flex items-center justify-center flex-shrink-0">
                            {share.chat_type === 'interview' ? (
                              <Video className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            ) : (
                              <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            )}
                          </div>
                          <h3 className="text-base md:text-lg font-semibold text-white-primary truncate">
                            {share.title}
                          </h3>
                        </div>
                        
                        {share.description && (
                          <p className="text-white-secondary mb-3 text-sm md:text-base">{share.description}</p>
                        )}
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-6 text-xs md:text-sm text-white-secondary">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate">{t('shares.sharedOn')} {formatDateTime(share.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span>{share.view_count || 0} {t('shares.views')}</span>
                          </div>
                          {share.expires_at && (
                            <div className="flex items-center gap-1">
                              <span className="truncate">{t('shares.expires')} {formatDateTime(share.expires_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyShareLink(share.share_token)}
                          className="p-2 md:p-2"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/shared/${share.share_token}`, '_blank')}
                          className="p-2 md:p-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteShare(share.id)}
                          className="text-red-400 hover:text-red-300 p-2 md:p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Create Share Tab
          <div className="space-y-6 md:space-y-8">
            {/* Normal Chats */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white-primary mb-3 md:mb-4 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                {t('shares.normalChats')}
              </h2>
              
              {normalChats.length === 0 ? (
                <div className="text-center py-6 md:py-8 bg-light-dark-secondary rounded-xl">
                  <p className="text-white-secondary text-sm md:text-base">{t('shares.noNormalChats')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {normalChats.map((chat) => (
                    <div key={chat.id} className="bg-light-dark-secondary rounded-xl p-3 md:p-4">
                      <h3 className="font-medium text-white-primary mb-2 text-sm md:text-base truncate">
                        {chat.title || t('chats.untitled')}
                      </h3>
                      <div className="text-xs md:text-sm text-white-secondary mb-3">
                        {chat.message_count || chat.conversation?.length || 0} {t('chat.messages')} • {formatDateTime(chat.updated_at)}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openShareModal(chat, 'normal')}
                        className="w-full text-xs md:text-sm"
                      >
                        <Share2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        {t('shares.shareChat')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interview Chats */}
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-white-primary mb-3 md:mb-4 flex items-center gap-2">
                <Video className="w-4 h-4 md:w-5 md:h-5" />
                {t('shares.interviewChats')}
              </h2>
              
              {interviewChats.length === 0 ? (
                <div className="text-center py-6 md:py-8 bg-light-dark-secondary rounded-xl">
                  <p className="text-white-secondary text-sm md:text-base">{t('shares.noInterviewChats')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {interviewChats.map((chat) => (
                    <div key={chat.id} className="bg-light-dark-secondary rounded-xl p-3 md:p-4">
                      <h3 className="font-medium text-white-primary mb-1 text-sm md:text-base truncate">
                        {chat.title || t('interview.interface.noInterviews')}
                      </h3>
                      {chat.job_position && (
                        <div className="text-xs md:text-sm text-brand-primary mb-2 truncate">
                          {chat.job_position}
                          {chat.company_name && ` ${t('shares.at')} ${chat.company_name}`}
                        </div>
                      )}
                      <div className="text-xs md:text-sm text-white-secondary mb-3">
                        {chat.message_count || chat.conversation?.length || 0} {t('chat.messages')} • {formatDateTime(chat.updated_at)}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openShareModal(chat, 'interview')}
                        className="w-full text-xs md:text-sm"
                      >
                        <Share2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        {t('shares.shareInterview')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Share Modal */}
        <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} size="lg">
          <div className="p-4 md:p-6">
            <h3 className="text-lg md:text-xl font-semibold text-white-primary mb-4 md:mb-6 truncate">
              {t('shares.shareModal.title')} "{selectedChat?.title}"
            </h3>
            
            <div className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  {t('shares.shareModal.chatTitle')}
                </label>
                <Input
                  value={shareForm.title}
                  onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                  placeholder={t('shares.shareModal.titlePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  {t('shares.shareModal.description')}
                </label>
                <textarea
                  value={shareForm.description}
                  onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                  placeholder={t('shares.shareModal.descriptionPlaceholder')}
                  rows={3}
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-800 border border-gray-600 rounded-xl text-white-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  {t('shares.shareModal.expiresIn')}
                </label>
                <select
                  value={shareForm.expires_in_days}
                  onChange={(e) => setShareForm({ ...shareForm, expires_in_days: parseInt(e.target.value) })}
                  className="w-full px-3 md:px-4 py-2 md:py-3 bg-gray-800 border border-gray-600 rounded-xl text-white-primary focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm md:text-base"
                >
                  <option value={1}>1 {t('shares.shareModal.day')}</option>
                  <option value={7}>1 {t('shares.shareModal.week')}</option>
                  <option value={30}>1 {t('shares.shareModal.month')}</option>
                  <option value={90}>3 {t('shares.shareModal.months')}</option>
                  <option value={0}>{t('shares.shareModal.never')}</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allow_comments"
                  checked={shareForm.allow_comments}
                  onChange={(e) => setShareForm({ ...shareForm, allow_comments: e.target.checked })}
                  className="w-4 h-4 text-brand-primary bg-gray-800 border-gray-600 rounded focus:ring-brand-primary"
                />
                <label htmlFor="allow_comments" className="text-sm text-white-secondary">
                  {t('shares.shareModal.allowComments')}
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowShareModal(false)}
                className="flex-1 text-sm md:text-base"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleShareChat}
                className="flex-1 text-sm md:text-base"
                disabled={!shareForm.title}
              >
                <Share2 className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                {t('shares.shareModal.shareButton')}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default SharesPage