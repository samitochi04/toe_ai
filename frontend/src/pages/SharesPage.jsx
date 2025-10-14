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

  const isPremium = user?.subscription_tier === 'Premium'

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
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white-primary mb-4">
              Premium Feature
            </h1>
            <p className="text-white-secondary text-lg mb-8 max-w-2xl mx-auto">
              The sharing feature is exclusive to Premium subscribers. Share your interview sessions 
              and chat conversations with friends, colleagues, and mentors to get valuable feedback.
            </p>
            
            <div className="bg-light-dark-secondary rounded-xl p-8 max-w-md mx-auto mb-8">
              <h3 className="text-xl font-semibold text-white-primary mb-4">
                What you can share:
              </h3>
              <ul className="space-y-3 text-left">
                <li className="flex items-center gap-3 text-white-secondary">
                  <MessageCircle className="w-5 h-5 text-brand-primary" />
                  Normal chat conversations
                </li>
                <li className="flex items-center gap-3 text-white-secondary">
                  <Video className="w-5 h-5 text-brand-primary" />
                  Interview practice sessions
                </li>
                <li className="flex items-center gap-3 text-white-secondary">
                  <Users className="w-5 h-5 text-brand-primary" />
                  Share with custom aliases
                </li>
                <li className="flex items-center gap-3 text-white-secondary">
                  <Eye className="w-5 h-5 text-brand-primary" />
                  View analytics and engagement
                </li>
              </ul>
            </div>

            <Button
              onClick={() => navigate('/workspace/premium')}
              className="px-8 py-3 text-lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-white-primary">Loading shares...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white-primary">
            Shared Chats
          </h1>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span className="text-white-secondary">Premium Feature</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600 mb-8">
          <button
            onClick={() => setActiveTab('my-shares')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'my-shares'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-white-secondary hover:text-white-primary'
            }`}
          >
            My Shares ({shares.length})
          </button>
          <button
            onClick={() => setActiveTab('create-share')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'create-share'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-white-secondary hover:text-white-primary'
            }`}
          >
            Share New Chat
          </button>
        </div>

        {activeTab === 'my-shares' ? (
          // My Shares Tab
          <div className="space-y-6">
            {shares.length === 0 ? (
              <div className="text-center py-16">
                <Share2 className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-white-primary mb-2">
                  No shared chats yet
                </h3>
                <p className="text-white-secondary mb-6">
                  Start sharing your conversations with friends and colleagues
                </p>
                <Button onClick={() => setActiveTab('create-share')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Share Your First Chat
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {shares.map((share) => (
                  <div key={share.id} className="bg-light-dark-secondary rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                            {share.chat_type === 'interview' ? (
                              <Video className="w-4 h-4 text-white" />
                            ) : (
                              <MessageCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-white-primary">
                            {share.title}
                          </h3>
                        </div>
                        
                        {share.description && (
                          <p className="text-white-secondary mb-3">{share.description}</p>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-white-secondary">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Shared {formatDateTime(share.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{share.view_count || 0} views</span>
                          </div>
                          {share.expires_at && (
                            <div className="flex items-center gap-1">
                              <span>Expires {formatDateTime(share.expires_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyShareLink(share.share_token)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/shared/${share.share_token}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteShare(share.id)}
                          className="text-red-400 hover:text-red-300"
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
          <div className="space-y-8">
            {/* Normal Chats */}
            <div>
              <h2 className="text-xl font-semibold text-white-primary mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Normal Chats
              </h2>
              
              {normalChats.length === 0 ? (
                <div className="text-center py-8 bg-light-dark-secondary rounded-xl">
                  <p className="text-white-secondary">No normal chats to share yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {normalChats.map((chat) => (
                    <div key={chat.id} className="bg-light-dark-secondary rounded-xl p-4">
                      <h3 className="font-medium text-white-primary mb-2">
                        {chat.title || 'Untitled Chat'}
                      </h3>
                      <div className="text-sm text-white-secondary mb-3">
                        {chat.message_count || 0} messages • {formatDateTime(chat.updated_at)}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openShareModal(chat, 'normal')}
                        className="w-full"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Chat
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Interview Chats */}
            <div>
              <h2 className="text-xl font-semibold text-white-primary mb-4 flex items-center gap-2">
                <Video className="w-5 h-5" />
                Interview Chats
              </h2>
              
              {interviewChats.length === 0 ? (
                <div className="text-center py-8 bg-light-dark-secondary rounded-xl">
                  <p className="text-white-secondary">No interview chats to share yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interviewChats.map((chat) => (
                    <div key={chat.id} className="bg-light-dark-secondary rounded-xl p-4">
                      <h3 className="font-medium text-white-primary mb-1">
                        {chat.title || 'Untitled Interview'}
                      </h3>
                      {chat.job_position && (
                        <div className="text-sm text-brand-primary mb-2">
                          {chat.job_position}
                          {chat.company_name && ` at ${chat.company_name}`}
                        </div>
                      )}
                      <div className="text-sm text-white-secondary mb-3">
                        {formatDateTime(chat.updated_at)}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openShareModal(chat, 'interview')}
                        className="w-full"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Interview
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
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white-primary mb-6">
              Share "{selectedChat?.title}"
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Share Title
                </label>
                <Input
                  value={shareForm.title}
                  onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                  placeholder="Give your share a title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={shareForm.description}
                  onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                  placeholder="Add context or notes about this conversation..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Link Expires In
                </label>
                <select
                  value={shareForm.expires_in_days}
                  onChange={(e) => setShareForm({ ...shareForm, expires_in_days: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value={1}>1 day</option>
                  <option value={7}>1 week</option>
                  <option value={30}>1 month</option>
                  <option value={90}>3 months</option>
                  <option value={0}>Never</option>
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
                  Allow viewers to leave comments (coming soon)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowShareModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareChat}
                className="flex-1"
                disabled={!shareForm.title}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Chat
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default SharesPage