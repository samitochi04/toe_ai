import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { chatService } from '../services/chat'
import { MoreVertical, MessageCircle, Video, Share2 } from 'lucide-react'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user, userProfile } = useAuthStore()
  
  // Real data states
  const [recentChats, setRecentChats] = useState([])
  const [recentInterviews, setRecentInterviews] = useState([])
  const [recentShares, setRecentShares] = useState([])
  const [stats, setStats] = useState({
    totalChats: 0,
    totalInterviews: 0,
    totalMinutes: 0
  })
  const [isLoading, setIsLoading] = useState(true)

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
            title: chat.title || 'Untitled Chat',
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
            title: chat.title || 'Untitled Interview',
            date: new Date(chat.updated_at || chat.created_at).toLocaleDateString(),
            duration: `${Math.floor(Math.random() * 60) + 15} min`, // Mock duration for now
            jobPosition: chat.job_position,
            companyName: chat.company_name,
            type: 'interview'
          }))
        
        // Calculate stats
        const totalMessages = normalChats.reduce((sum, chat) => sum + (chat.message_count || 0), 0)
        const estimatedMinutes = Math.floor(totalMessages * 1.5) // Estimate 1.5 min per message
        
        setRecentChats(recentNormalChats)
        setRecentInterviews(recentInterviewsData)
        setStats({
          totalChats: normalChats.length,
          totalInterviews: interviewChats.length,
          totalMinutes: estimatedMinutes
        })
        
        // For now, keep shares empty as we'll implement that later
        setRecentShares([])
        
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        // Fallback to empty data on error
        setRecentChats([])
        setRecentInterviews([])
        setRecentShares([])
        setStats({ totalChats: 0, totalInterviews: 0, totalMinutes: 0 })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadDashboardData()
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
            Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
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
                <p className="text-white-secondary text-sm">Total Chats</p>
                <p className="text-2xl font-bold text-white-primary">
                  {isLoading ? '...' : stats.totalChats}
                </p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-2nd" />
            </div>
          </div>
          
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-secondary text-sm">Total Interviews</p>
                <p className="text-2xl font-bold text-white-primary">
                  {isLoading ? '...' : stats.totalInterviews}
                </p>
              </div>
              <Video className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white-secondary text-sm">Practice Time</p>
                <p className="text-2xl font-bold text-white-primary">
                  {isLoading ? '...' : `${stats.totalMinutes} min`}
                </p>
              </div>
              <Share2 className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Get Started Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white-primary mb-4">
            Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GetStartedCard
              icon="/src/assets/images/main_workspace_new_chat_icon.png"
              title="New Chat"
              description="Start a conversation with AI to practice general questions"
              onClick={() => navigate('/chat/new')}
              bgColor="bg-blue-2nd"
            />
            <GetStartedCard
              icon="/src/assets/images/main_workspace_new_interview_icon.png"
              title="New Interview"
              description="Begin a mock interview session with voice interaction"
              onClick={() => navigate('/interview/new')}
              bgColor="bg-success"
            />
            <GetStartedCard
              icon="/src/assets/images/main_workspace_share_chat_icon.png"
              title="Share Chat"
              description="Share your interview practice with others (Premium feature)"
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
                Recent Interviews
              </h3>
              <button 
                onClick={() => navigate('/interviews')}
                className="text-blue-2nd hover:text-blue-primary text-sm font-medium"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white-secondary">Loading interviews...</div>
                </div>
              ) : recentInterviews.length > 0 ? (
                recentInterviews.map(interview => (
                  <ChatItem key={interview.id} chat={interview} type="interview" />
                ))
              ) : (
                <p className="text-white-secondary text-center py-8">
                  No interviews yet. Start your first AI interview to see it here!
                </p>
              )}
            </div>
          </div>

          {/* Recent Chats */}
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white-primary">
                Recent Chats
              </h3>
              <button 
                onClick={() => navigate('/chats')}
                className="text-blue-2nd hover:text-blue-primary text-sm font-medium"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white-secondary">Loading chats...</div>
                </div>
              ) : recentChats.length > 0 ? (
                recentChats.map(chat => (
                  <ChatItem key={chat.id} chat={chat} type="chat" />
                ))
              ) : (
                <p className="text-white-secondary text-center py-8">
                  No chats yet. Start a conversation to see it here!
                </p>
              )}
            </div>
          </div>

          {/* Recent Shares */}
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white-primary">
                Recent Shares
              </h3>
              <button 
                onClick={() => navigate('/shares')}
                className="text-blue-2nd hover:text-blue-primary text-sm font-medium"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="text-white-secondary">Loading shares...</div>
                </div>
              ) : recentShares.length > 0 ? (
                recentShares.map(share => (
                  <ChatItem key={share.id} chat={share} type="share" />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-white-secondary mb-4">
                    No shared chats yet.
                  </p>
                  {userProfile?.subscription === 'premium' ? (
                    <p className="text-white-secondary text-sm">
                      Share your conversations with friends from the chat page!
                    </p>
                  ) : (
                    <button
                      onClick={() => navigate('/settings')}
                      className="bg-gradient-to-r from-blue-primary to-purple-secondary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                    >
                      Upgrade to Premium to Share
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage