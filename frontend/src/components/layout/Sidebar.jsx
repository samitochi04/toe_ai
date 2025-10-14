import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { ChevronDown, ChevronRight } from 'lucide-react'

const Sidebar = ({ isOpen, onToggle }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { signOut, user } = useAuthStore()
  
  const [expandedSections, setExpandedSections] = useState({
    chatting: false,
    interviewChat: false,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const MenuItem = ({ 
    icon, 
    label, 
    path, 
    onClick, 
    isActive = false, 
    hasSubmenu = false, 
    isExpanded = false,
    onToggle,
    className = ""
  }) => (
    <div className="relative">
      <button
        onClick={onClick || (() => path && navigate(path))}
        className={`
          w-full flex items-center px-4 py-3 text-left transition-all duration-200
          ${isActive 
            ? 'bg-white-primary text-dark-primary' 
            : 'text-white-secondary hover:text-white-primary hover:bg-gray-700'
          }
          ${className}
        `}
      >
        <img src={icon} alt={label} className="w-5 h-5 mr-3" />
        {isOpen && (
          <>
            <span className="flex-1 text-sm font-medium">{label}</span>
            {hasSubmenu && (
              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            )}
          </>
        )}
      </button>
      
      {/* Active indicator arrow */}
      {isActive && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
          <div className="w-0 h-0 border-l-8 border-l-white-primary border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
        </div>
      )}
    </div>
  )

  const SubMenuItem = ({ icon, label, path, isActive = false }) => (
    <button
      onClick={() => navigate(path)}
      className={`
        w-full flex items-center px-8 py-2 text-left transition-all duration-200
        ${isActive 
          ? 'bg-white-primary text-dark-primary' 
          : 'text-white-secondary hover:text-white-primary hover:bg-gray-700'
        }
      `}
    >
      <img src={icon} alt={label} className="w-4 h-4 mr-3" />
      {isOpen && <span className="text-sm">{label}</span>}
    </button>
  )

  return (
    <div className={`
      fixed left-0 top-0 h-full bg-light-dark-secondary border-r border-gray-700 transition-all duration-300 z-50
      ${isOpen ? 'w-64' : 'w-16'}
    `}>
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-700">
        <img 
          src="/src/assets/images/toe_ai_logo.png" 
          alt="TOE AI" 
          className="w-8 h-8"
        />
        {isOpen && (
          <span className="ml-3 text-lg font-bold text-white-primary">TOE AI</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 py-4">
          {/* Main Workspace */}
          <MenuItem
            icon="/src/assets/images/main_workspace_icon.png"
            label={t('workspace.mainWorkspace')}
            path="/workspace/dashboard"
            isActive={isActive('/workspace/dashboard')}
          />

          {/* Chatting Section */}
          <MenuItem
            icon="/src/assets/images/chatting_icon.png"
            label={t('workspace.chatting')}
            hasSubmenu={true}
            isExpanded={expandedSections.chatting}
            onClick={() => toggleSection('chatting')}
          />
          
          {expandedSections.chatting && isOpen && (
            <div className="bg-gray-800">
              <SubMenuItem
                icon="/src/assets/images/new_chat_icon.png"
                label={t('workspace.newChat')}
                path="/workspace/chat/new"
                isActive={isActive('/workspace/chat/new')}
              />
              <SubMenuItem
                icon="/src/assets/images/chats_icon.png"
                label={t('workspace.chats')}
                path="/workspace/chats"
                isActive={isActive('/workspace/chats')}
              />
            </div>
          )}

          {/* Interview Chat Section */}
          <MenuItem
            icon="/src/assets/images/interview_chat_icon.png"
            label={t('workspace.interviewChat')}
            hasSubmenu={true}
            isExpanded={expandedSections.interviewChat}
            onClick={() => toggleSection('interviewChat')}
          />
          
          {expandedSections.interviewChat && isOpen && (
            <div className="bg-gray-800">
              <SubMenuItem
                icon="/src/assets/images/new_interview_icon.png"
                label={t('workspace.newInterview')}
                path="/workspace/interview/new"
                isActive={isActive('/workspace/interview/new')}
              />

              <SubMenuItem
                icon="/src/assets/images/interviews_icon.png"
                label={t('workspace.interviews')}
                path="/workspace/interviews"
                isActive={isActive('/workspace/interviews')}
              />
            </div>
          )}

          {/* Shares */}
          <MenuItem
            icon="/src/assets/images/share_icon.png"
            label={t('workspace.shares')}
            path="/workspace/shares"
            isActive={isActive('/workspace/shares')}
          />
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700">
          {/* Premium */}
          <MenuItem
            icon="/src/assets/images/premium_icon.png"
            label={t('workspace.premium')}
            path="/workspace/premium"
            isActive={isActive('/workspace/premium')}
          />

          {/* Settings */}
          <MenuItem
            icon="/src/assets/images/settings_icon.png"
            label={t('workspace.settings')}
            path="/workspace/settings"
            isActive={isActive('/workspace/settings')}
          />

          {/* User Profile / Sign Out */}
          {isOpen && (
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-2nd rounded-full flex items-center justify-center">
                    <span className="text-white-primary text-sm font-medium">
                      {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white-primary truncate">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-white-secondary truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-white-secondary hover:text-white-primary transition-colors p-1"
                  title="Sign Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  )
}

export default Sidebar