import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { MoreVertical, MessageCircle, Video, Share2 } from 'lucide-react'

const DashboardPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  // Mock data - replace with actual API calls
  const [recentChats, setRecentChats] = useState([])
  const [recentInterviews, setRecentInterviews] = useState([])
  const [recentShares, setRecentShares] = useState([])
  const [stats, setStats] = useState({
    totalChats: 0,
    totalInterviews: 0,
    totalMinutes: 0
  })

  useEffect(() => {
    // Mock data loading - replace with actual API calls
    setRecentChats([
      { id: 1, title: 'React Interview Prep', date: '2024-01-15', messages: 23 },
      { id: 2, title: 'JavaScript Concepts', date: '2024-01-14', messages: 18 },
      { id: 3, title: 'System Design', date: '2024-01-13', messages: 31 },
    ])
    
    setRecentInterviews([
      { id: 1, title: 'Frontend Developer Interview', date: '2024-01-15', duration: '45 min' },
      { id: 2, title: 'Full Stack Position', date: '2024-01-12', duration: '60 min' },
    ])
    
    setRecentShares([
      { id: 1, title: 'My React Interview', views: 156, date: '2024-01-10' },
    ])
    
    setStats({
      totalChats: 12,
      totalInterviews: 8,
      totalMinutes: 420
    })
  }, [])

  const GetStartedCard = ({ icon, title, description, onClick, bgColor = "bg-blue-2nd" }) => (
    <button
      onClick={onClick}
      className={`${bgColor} hover:opacity-90 transition-all duration-200 p-6 rounded-xl text-left w-full group`}
    >
      <div className="flex items-center mb-4">
        <img src={icon} alt={title} className="w-8 h-8 mr-3" />
        <h3 className="text-lg font-semibold text-white-primary">{title}</h3>
      </div>
      <p className="text-white-secondary text-sm group-hover:text-white-primary transition-colors">
        {description}
      </p>
    </button>
  )

  const ChatItem = ({ chat, type = 'chat' }) => {
    const [showMenu, setShowMenu] = useState(false)
    
    return (
      <div className="bg-light-dark-secondary rounded-lg p-4 hover:bg-gray-700 transition-colors group">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h4 className="font-medium text-white-primary mb-1">{chat.title}</h4>
            <div className="flex items-center text-sm text-white-secondary space-x-4">
              <span>{chat.date}</span>
              {type === 'chat' && <span>{chat.messages} messages</span>}
              {type === 'interview' && <span>{chat.duration}</span>}
              {type === 'share' && <span>{chat.views} views</span>}
            </div>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-600 transition-all"
            >
              <MoreVertical className="w-4 h-4 text-white-secondary" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-dark-primary border border-gray-600 rounded-lg py-2 min-w-[150px] z-10">
                <button className="w-full px-4 py-2 text-left text-sm text-white-secondary hover:text-white-primary hover:bg-gray-700">
                  Open
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-white-secondary hover:text-white-primary hover:bg-gray-700">
                  Share Chat
                </button>
                {user?.is_premium && (
                  <button className="w-full px-4 py-2 text-left text-sm text-white-secondary hover:text-white-primary hover:bg-gray-700">
                    Export as PDF
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-dark-primary">
      <div className="p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white-primary mb-2">
            {t('dashboard.welcome', { name: user?.full_name?.split(' ')[0] || 'User' })}
          </h1>
          <p className="text-white-secondary">
            Ready to practice your next interview?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-secondary text-sm">{t('dashboard.stats.totalChats')}</p>
                <p className="text-2xl font-bold text-white-primary">{stats.totalChats}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-2nd" />
            </div>
          </div>
          
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-secondary text-sm">{t('dashboard.stats.totalInterviews')}</p>
                <p className="text-2xl font-bold text-white-primary">{stats.totalInterviews}</p>
              </div>
              <Video className="w-8 h-8 text-success" />
            </div>
          </div>
          
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-secondary text-sm">{t('dashboard.stats.totalMinutes')}</p>
                <p className="text-2xl font-bold text-white-primary">{stats.totalMinutes}</p>
              </div>
              <Share2 className="w-8 h-8 text-warning" />
            </div>
          </div>
        </div>

        {/* Get Started Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white-primary mb-4">
            {t('dashboard.getStarted.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GetStartedCard
              icon="/src/assets/images/main_workspace_new_chat_icon.png"
              title={t('dashboard.getStarted.newChat')}
              description="Start a conversation with AI to practice general questions"
              onClick={() => navigate('/chat/new')}
              bgColor="bg-blue-2nd"
            />
            <GetStartedCard
              icon="/src/assets/images/main_workspace_new_interview_icon.png"
              title={t('dashboard.getStarted.newInterview')}
              description="Begin a mock interview session with voice interaction"
              onClick={() => navigate('/interview/new')}
              bgColor="bg-success"
            />
            <GetStartedCard
              icon="/src/assets/images/main_workspace_share_chat_icon.png"
              title={t('dashboard.getStarted.shareChat')}
              description="Share your interview practice with others"
              onClick={() => navigate('/shares')}
              bgColor="bg-warning"
            />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Recent Interview Chats */}
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white-primary">
                {t('dashboard.recentInterviews.title')}
              </h3>
              <button 
                onClick={() => navigate('/interviews')}
                className="text-blue-2nd hover:text-blue-primary text-sm font-medium"
              >
                {t('dashboard.recentInterviews.viewAll')}
              </button>
            </div>
            
            <div className="space-y-3">
              {recentInterviews.length > 0 ? (
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
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white-primary">
                {t('dashboard.recentChats.title')}
              </h3>
              <button 
                onClick={() => navigate('/chats')}
                className="text-blue-2nd hover:text-blue-primary text-sm font-medium"
              >
                {t('dashboard.recentChats.viewAll')}
              </button>
            </div>
            
            <div className="space-y-3">
              {recentChats.length > 0 ? (
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
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white-primary">
                {t('dashboard.recentShares.title')}
              </h3>
              <button 
                onClick={() => navigate('/shares')}
                className="text-blue-2nd hover:text-blue-primary text-sm font-medium"
              >
                {t('dashboard.recentShares.viewAll')}
              </button>
            </div>
            
            <div className="space-y-3">
              {recentShares.length > 0 ? (
                recentShares.map(share => (
                  <ChatItem key={share.id} chat={share} type="share" />
                ))
              ) : (
                <p className="text-white-secondary text-center py-8">
                  {t('dashboard.recentShares.noShares')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage