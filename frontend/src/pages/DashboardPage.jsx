import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useAuthStore from '../store/authStore'
import { chatService } from '../services/chat'
import shareService from '../services/share'
import { MoreVertical, MessageCircle, Video, Share2 } from 'lucide-react'

const DashboardPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, userProfile } = useAuthStore()
  
  // Real data states
  const [recentChats, setRecentChats] = useState([])
  const [recentInterviews, setRecentInterviews] = useState([])
  const [recentShares, setRecentShares] = useState([])
  const [stats, setStats] = useState({
    totalChats: 0,
    totalInterviews: 0,
    totalShares: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ show: false, chat: null, type: '' })

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Load recent chats and interviews
        const [normalChatsResponse, interviewChatsResponse] = await Promise.all([
          chatService.getChats('normal'),
          chatService.getChats('interview')
        ])
        
        // Process normal chats
        const normalChats = normalChatsResponse.chats || []
        const recentNormalChats = normalChats
          .slice(0, 5) // Get 5 most recent
          .map(chat => ({
            id: chat.id,
            title: chat.title || t('chats.untitled'),
            date: new Date(chat.updated_at || chat.created_at).toLocaleDateString(),
            messages: chat.message_count || 0,
            type: 'normal'
          }))
        
        // Process interview chats
        const interviewChats = interviewChatsResponse.chats || []
        const recentInterviewsData = interviewChats
          .slice(0, 5) // Get 5 most recent
          .map(chat => ({
            id: chat.id,
            title: chat.title || t('interview.interface.noInterviews'),
            date: new Date(chat.updated_at || chat.created_at).toLocaleDateString(),
            jobPosition: chat.job_position,
            companyName: chat.company_name,
            type: 'interview'
          }))

        // Load shares data if user is premium
        let sharesData = []
        let totalShares = 0
        if (user?.subscription?.status === 'active') {
          try {
            const sharesResponse = await shareService.getSharedChats()
            sharesData = sharesResponse.shares || []
            totalShares = sharesData.length
            
            // Process recent shares (top 5)
            const recentSharesData = sharesData
              .slice(0, 5)
              .map(share => ({
                id: share.id,
                title: share.title,
                date: new Date(share.created_at).toLocaleDateString(),
                views: share.view_count || 0,
                type: 'share'
              }))
            
            setRecentShares(recentSharesData)
          } catch (error) {
            // console.error('Error loading shares:', error)
            // Don't fail the entire load if shares fail
            setRecentShares([])
          }
        }
        
        // Calculate stats with real data
        setRecentChats(recentNormalChats)
        setRecentInterviews(recentInterviewsData)
        setStats({
          totalChats: normalChats.length,
          totalInterviews: interviewChats.length,
          totalShares: totalShares
        })
        
      } catch (error) {
        // console.error('Error loading dashboard data:', error)
        // Fallback to empty data on error
        setRecentChats([])
        setRecentInterviews([])
        setRecentShares([])
        setStats({ totalChats: 0, totalInterviews: 0, totalShares: 0 })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboardData()
  }, [user?.subscription?.status])

  const GetStartedCard = ({ icon, title, description, onClick, bgColor = "bg-blue-2nd" }) => (
    <button
      onClick={onClick}
      className={`${bgColor} hover:opacity-90 transition-all duration-200 p-4 md:p-6 rounded-xl text-left w-full group`}
    >
      <div className="flex items-center mb-3 md:mb-4">
        <img src={icon} alt={title} className="w-6 h-6 md:w-8 md:h-8 mr-3" />
        <h3 className="text-base md:text-lg font-semibold text-white-primary">{title}</h3>
      </div>
      <p className="text-white-secondary text-xs md:text-sm group-hover:text-white-primary transition-colors">
        {description}
      </p>
    </button>
  )

  const ChatItem = ({ chat, type = 'chat' }) => {
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef(null)
    
    // Close menu when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setShowMenu(false)
        }
      }

      if (showMenu) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [showMenu])

    const handleOpenChat = () => {
      setShowMenu(false)
      if (type === 'chat') {
        navigate(`/workspace/chat/${chat.id}`)
      } else if (type === 'interview') {
        navigate(`/workspace/interview/${chat.id}`)
      } else if (type === 'share') {
        navigate(`/workspace/share/${chat.id}`)
      }
    }

    const handleShareChat = () => {
      setShowMenu(false)
      navigate('/workspace/shares')
    }

    const handleExportPDF = async () => {
      setShowMenu(false)
      try {
        // Implement PDF export functionality
        // This would call an API endpoint to generate and download PDF
      } catch (error) {
        // console.error('Error exporting PDF:', error)
      }
    }

    const handleDeleteChat = () => {
      setShowMenu(false)
      setDeleteModal({ show: true, chat, type })
    }
    
    return (
      <div className="bg-light-dark-secondary rounded-lg p-3 md:p-4 hover:bg-gray-700 transition-colors group cursor-pointer"
           onClick={handleOpenChat}>
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white-primary mb-1 text-sm md:text-base truncate">{chat.title}</h4>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs md:text-sm text-white-secondary space-y-1 sm:space-y-0 sm:space-x-4">
              <span>{chat.date}</span>
              {type === 'chat' && chat.messages && <span>{chat.messages} messages</span>}
              {type === 'interview' && chat.jobPosition && <span className="truncate">{chat.jobPosition}</span>}
              {type === 'share' && chat.views && <span>{chat.views} views</span>}
            </div>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="opacity-0 group-hover:opacity-100 p-1 md:p-2 rounded-md hover:bg-gray-600 transition-all duration-200 touch-manipulation"
            >
              <MoreVertical className="w-4 h-4 text-white-secondary" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-light-dark-secondary border border-gray-600 rounded-lg py-1 min-w-[140px] z-20 shadow-xl">
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenChat()
                  }}
                  className="w-full px-3 py-2 text-left text-xs md:text-sm text-white-secondary hover:text-white-primary hover:bg-gray-700 transition-colors touch-manipulation"
                >
                  {t('common.open')} {type}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShareChat()
                  }}
                  className="w-full px-3 py-2 text-left text-xs md:text-sm text-white-secondary hover:text-white-primary hover:bg-gray-700 transition-colors touch-manipulation"
                >
                  {t('common.share')} {type}
                </button>
                {user?.is_premium && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExportPDF()
                    }}
                    className="w-full px-3 py-2 text-left text-xs md:text-sm text-white-secondary hover:text-white-primary hover:bg-gray-700 transition-colors touch-manipulation"
                  >
                    {t('common.export')} as PDF
                  </button>
                )}
                <div className="border-t border-gray-600 my-1"></div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteChat()
                  }}
                  className="w-full px-3 py-2 text-left text-xs md:text-sm text-red-400 hover:text-red-300 hover:bg-gray-700 transition-colors touch-manipulation"
                >
                  {t('common.delete')} {type}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const DeleteModal = () => {
    if (!deleteModal.show) return null

    const confirmDelete = async () => {
      try {
        await chatService.deleteChat(deleteModal.chat.id)
        setDeleteModal({ show: false, chat: null, type: '' })
        // Refresh the dashboard data
        window.location.reload()
      } catch (error) {
        // console.error('Error deleting chat:', error)
      }
    }

    const cancelDelete = () => {
      setDeleteModal({ show: false, chat: null, type: '' })
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-light-dark-secondary rounded-lg p-4 md:p-6 max-w-md w-full">
          <h3 className="text-base md:text-lg font-semibold text-white-primary mb-4">
            {t('common.delete')} {deleteModal.type}
          </h3>
          <p className="text-white-secondary mb-6 text-sm md:text-base">
            {t('chat.deleteConfirmMessage')}
          </p>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={cancelDelete}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors touch-manipulation order-2 sm:order-1"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors touch-manipulation order-1 sm:order-2"
            >
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-dark-primary">
      <div className="p-4 md:p-6">
        {/* Welcome Section */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white-primary mb-2">
            {t('dashboard.welcome', { name: user?.full_name?.split(' ')[0] || t('common.user') })}
          </h1>
          <p className="text-white-secondary text-sm md:text-base">
            {t('dashboard.readyToPractice')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-light-dark-secondary rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-secondary text-sm">{t('dashboard.stats.totalChats')}</p>
                <p className="text-xl md:text-2xl font-bold text-white-primary">
                  {isLoading ? '...' : stats.totalChats}
                </p>
              </div>
              <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-2nd" />
            </div>
          </div>
          
          <div className="bg-light-dark-secondary rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-secondary text-sm">{t('dashboard.stats.totalInterviews')}</p>
                <p className="text-xl md:text-2xl font-bold text-white-primary">
                  {isLoading ? '...' : stats.totalInterviews}
                </p>
              </div>
              <Video className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-light-dark-secondary rounded-xl p-4 md:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-secondary text-sm">{t('dashboard.stats.totalShares')}</p>
                <p className="text-xl md:text-2xl font-bold text-white-primary">
                  {isLoading ? '...' : stats.totalShares}
                </p>
              </div>
              <Share2 className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Get Started Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-white-primary mb-4">
            {t('dashboard.getStarted.title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <GetStartedCard
              icon="/assets/images/main_workspace_new_chat_icon.png"
              title={t('dashboard.getStarted.newChat')}
              description={t('dashboard.getStarted.newChatDescription')}
              onClick={() => navigate('/workspace/chat/new')}
              bgColor="bg-blue-2nd"
            />
            <GetStartedCard
              icon="/assets/images/main_workspace_new_interview_icon.png"
              title={t('dashboard.getStarted.newInterview')}
              description={t('dashboard.getStarted.newInterviewDescription')}
              onClick={() => navigate('/workspace/interview/new')}
              bgColor="bg-success"
            />
            <GetStartedCard
              icon="/assets/images/main_workspace_share_chat_icon.png"
              title={t('dashboard.getStarted.shareChat')}
              description={t('dashboard.getStarted.shareChatDescription')}
              onClick={() => navigate('/workspace/shares')}
              bgColor="bg-warning"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {/* Recent Interview Chats */}
          <div className="bg-light-dark-secondary rounded-xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-semibold text-white-primary">
                {t('dashboard.recentInterviews.title')}
              </h3>
              <button 
                onClick={() => navigate('/workspace/interviews')}
                className="text-blue-2nd hover:text-blue-primary text-xs md:text-sm font-medium"
              >
                {t('dashboard.recentInterviews.viewAll')}
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white-secondary">{t('common.loading')}</div>
                </div>
              ) : recentInterviews.length > 0 ? (
                recentInterviews.map(interview => (
                  <ChatItem key={interview.id} chat={interview} type="interview" />
                ))
              ) : (
                <p className="text-white-secondary text-center py-8">
                  {t('dashboard.recentInterviews.noInterviews')}
                </p>
              )}
            </div>
          </div>

          {/* Recent Chats */}
          <div className="bg-light-dark-secondary rounded-xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-semibold text-white-primary">
                {t('dashboard.recentChats.title')}
              </h3>
              <button 
                onClick={() => navigate('/workspace/chats')}
                className="text-blue-2nd hover:text-blue-primary text-xs md:text-sm font-medium"
              >
                {t('dashboard.recentChats.viewAll')}
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white-secondary">{t('common.loading')}</div>
                </div>
              ) : recentChats.length > 0 ? (
                recentChats.map(chat => (
                  <ChatItem key={chat.id} chat={chat} type="chat" />
                ))
              ) : (
                <p className="text-white-secondary text-center py-8">
                  {t('dashboard.recentChats.noChats')}
                </p>
              )}
            </div>
          </div>

          {/* Recent Shares */}
          <div className="bg-light-dark-secondary rounded-xl p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-semibold text-white-primary">
                {t('dashboard.recentShares.title')}
              </h3>
              <button 
                onClick={() => navigate('/workspace/shares')}
                className="text-blue-2nd hover:text-blue-primary text-xs md:text-sm font-medium"
              >
                {t('dashboard.recentShares.viewAll')}
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white-secondary">{t('common.loading')}</div>
                </div>
              ) : recentShares.length > 0 ? (
                recentShares.map(share => (
                  <ChatItem key={share.id} chat={share} type="share" />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-white-secondary mb-4">
                    {t('dashboard.recentShares.noShares')}
                  </p>
                  {userProfile?.subscription === 'premium' ? (
                    <p className="text-white-secondary text-sm">
                      {t('dashboard.recentShares.shareWithFriends')}
                    </p>
                  ) : (
                    <button
                      onClick={() => navigate('/workspace/premium')}
                      className="bg-gradient-to-r from-blue-primary to-purple-secondary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                    >
                      {t('common.upgradeButton')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteModal />
    </div>
  )
}

export default DashboardPage