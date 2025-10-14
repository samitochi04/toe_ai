import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Share2, MessageCircle, Calendar, User, Crown } from 'lucide-react'
import shareService from '../services/share'
import { formatDateTime } from '../utils/helpers'

const SharedChatPage = () => {
  const { t } = useTranslation()
  const { shareToken } = useParams()
  const [sharedChat, setSharedChat] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSharedChat()
  }, [shareToken])

  const loadSharedChat = async () => {
    try {
      setIsLoading(true)
      const data = await shareService.getSharedChatByToken(shareToken)
      setSharedChat(data)
    } catch (error) {
      console.error('Error loading shared chat:', error)
      setError('This shared chat could not be found or has expired.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-white-primary">Loading shared chat...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <Share2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white-primary mb-2">Chat Not Found</h1>
          <p className="text-white-secondary">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="bg-light-dark-secondary rounded-xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white-primary">
                {sharedChat?.title || 'Shared Chat'}
              </h1>
              <div className="flex items-center gap-4 text-white-secondary text-sm">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>Shared by {sharedChat?.shared_by_alias || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateTime(sharedChat?.shared_at)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{sharedChat?.conversation?.length || 0} messages</span>
                </div>
              </div>
            </div>
          </div>

          {sharedChat?.description && (
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-white-primary">{sharedChat.description}</p>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="bg-light-dark-secondary rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white-primary mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversation
          </h2>

          {sharedChat?.conversation?.length === 0 ? (
            <div className="text-center py-8 text-white-secondary">
              No messages in this conversation.
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sharedChat?.conversation?.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl p-4 ${
                      message.role === 'user'
                        ? 'bg-brand-primary text-white'
                        : 'bg-gray-700 text-white-primary'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {formatDateTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Info */}
        {(sharedChat?.chat_type === 'interview' || sharedChat?.job_position) && (
          <div className="bg-light-dark-secondary rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-white-primary mb-4">Interview Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedChat?.job_position && (
                <div>
                  <label className="text-sm font-medium text-white-secondary">Position</label>
                  <div className="text-white-primary">{sharedChat.job_position}</div>
                </div>
              )}
              {sharedChat?.company_name && (
                <div>
                  <label className="text-sm font-medium text-white-secondary">Company</label>
                  <div className="text-white-primary">{sharedChat.company_name}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-white-primary font-medium">Powered by TOE AI</span>
            </div>
            <p className="text-white-secondary text-sm">
              Create your own AI interview sessions and share them with friends!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharedChatPage