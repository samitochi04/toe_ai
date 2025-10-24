import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { formatDateTime } from '../../utils/helpers'
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import Button from '../common/Button'

const MessageBubble = ({ message, isOwnMessage, isTyping = false }) => {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const handleFeedback = (type) => {
    setFeedback(type)
    // Here you could send feedback to the API
    console.log('Feedback:', type, 'for message:', message.id)
  }

  const renderContent = () => {
    if (isTyping) {
      return (
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )
    }

    // Render markdown for AI messages, plain text for user messages
    if (isOwnMessage) {
      return (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </div>
      )
    } else {
      return (
        <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for markdown elements
              h1: ({ children }) => (
                <h1 className="text-lg font-bold text-white-primary mb-2 mt-4 first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-base font-bold text-white-primary mb-2 mt-3 first:mt-0">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-bold text-white-primary mb-2 mt-3 first:mt-0">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-white-primary mb-2 last:mb-0">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="font-bold text-white-primary">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-white-primary">
                  {children}
                </em>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-white-primary mb-2 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside text-white-primary mb-2 space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="text-white-primary">
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-300 my-2">
                  {children}
                </blockquote>
              ),
              code: ({ inline, children }) => {
                if (inline) {
                  return (
                    <code className="bg-gray-700 text-yellow-300 px-1 py-0.5 rounded text-xs font-mono">
                      {children}
                    </code>
                  )
                }
                return (
                  <code className="block bg-gray-800 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre">
                    {children}
                  </code>
                )
              },
              pre: ({ children }) => (
                <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre mb-2">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  {children}
                </a>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto mb-2">
                  <table className="min-w-full border border-gray-600">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-gray-700">
                  {children}
                </thead>
              ),
              th: ({ children }) => (
                <th className="border border-gray-600 px-3 py-2 text-left text-white-primary font-medium">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-600 px-3 py-2 text-white-primary">
                  {children}
                </td>
              ),
              hr: () => (
                <hr className="border-gray-600 my-4" />
              )
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      )
    }
  }

  const renderFiles = () => {
    if (!message.files || message.files.length === 0) return null

    return (
      <div className="mt-2 space-y-2">
        {message.files.map((file, index) => (
          <div key={index} className="flex items-center space-x-2 p-2 bg-light-dark-secondary rounded-lg">
            <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
              {file.type?.includes('image') ? (
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white-primary truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-400">
                {file.size ? `${Math.round(file.size / 1024)} KB` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isOwnMessage) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[70%] bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
          {renderContent()}
          {renderFiles()}
          <div className="text-xs text-blue-100 mt-2 text-right">
            {formatDateTime(message.created_at || message.timestamp || new Date())}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex mb-4">
      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
        <span className="text-white text-sm font-medium">{t('chat.aiAssistant')}</span>
      </div>
      <div className="flex-1 max-w-[70%]">
        <div className="bg-light-dark-secondary text-white-primary rounded-2xl rounded-bl-md px-4 py-3">
          {renderContent()}
          {renderFiles()}
        </div>
        
        {!isTyping && (
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-400">
              {formatDateTime(message.created_at || message.timestamp || new Date())}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Copy button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="p-1 text-gray-400 hover:text-white-primary"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>

              {/* Feedback buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('like')}
                className={`p-1 ${feedback === 'like' ? 'text-green-400' : 'text-gray-400 hover:text-white-primary'}`}
              >
                <ThumbsUp className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback('dislike')}
                className={`p-1 ${feedback === 'dislike' ? 'text-red-400' : 'text-gray-400 hover:text-white-primary'}`}
              >
                <ThumbsDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble