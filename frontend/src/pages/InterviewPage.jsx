import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  ArrowLeft,
  Paperclip,
  Download,
  Crown
} from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import useUsageLimit from '../hooks/useUsageLimit'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { chatService } from '../services/chat'
import { formatDateTime } from '../utils/helpers'

const InterviewPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { chatId } = useParams()
  const location = useLocation()
  const { user } = useAuthStore()
  const { checkUsageLimit, incrementUsage } = useUsageLimit()
  
  // Interview setup states
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [jobPosition, setJobPosition] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [interviewSettings, setInterviewSettings] = useState({
    voice_type: 'alloy',
    voice_speed: 1.0,
    language: 'en',
    max_duration_minutes: 60
  })

  // Chat states
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentChatId, setCurrentChatId] = useState(null)

  // Additional UI states
  const [showTranscription, setShowTranscription] = useState(true)
  const [currentTranscription, setCurrentTranscription] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Refs
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const audioRef = useRef(null)
  const messagesEndRef = useRef(null)

  const isPremium = user?.subscription_tier === 'Premium'

  // Load existing chat or setup new interview
  useEffect(() => {
    const loadChatData = async () => {
      if (chatId && chatId !== 'new') {
        try {
          setIsLoadingChat(true)
          console.log('Loading interview chat:', chatId)
          
          const response = await chatService.getChat(chatId, 'interview')
          console.log('Chat loaded:', response)
          
          if (response) {
            setJobPosition(response.job_position || '')
            setCompanyName(response.company_name || '')
            setDifficulty(response.interview_settings?.difficulty || 'medium')
            setInterviewSettings({
              voice_type: response.interview_settings?.voice_type || 'alloy',
              voice_speed: response.interview_settings?.voice_speed || 1.0,
              language: response.interview_settings?.language || 'en',
              max_duration_minutes: response.interview_settings?.max_duration_minutes || 60
            })
            
            const conversation = response.conversation || response.messages || []
            const formattedMessages = conversation.map((msg, index) => ({
              ...msg,
              id: msg.id || `msg-${chatId}-${index}`,
              timestamp: msg.timestamp || msg.created_at || new Date().toISOString()
            }))
            
            setMessages(formattedMessages)
            setCurrentChatId(chatId)
            setIsSetupComplete(true)
          }
        } catch (error) {
          console.error('Error loading interview chat:', error)
          toast.error('Failed to load interview chat')
          // Don't redirect on error, just show setup
          setIsSetupComplete(false)
        } finally {
          setIsLoadingChat(false)
        }
      } else {
        // New interview - show setup
        setIsSetupComplete(false)
        setIsLoadingChat(false)
      }
    }

    loadChatData()
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleStartInterview = async () => {
    if (!jobPosition.trim()) {
      toast.error('Please enter a job position')
      return
    }

    if (!checkUsageLimit('interview')) {
      return
    }

    setIsSetupComplete(true)
    
    // Start with introduction message
    setTimeout(async () => {
      const userName = user?.full_name?.split(' ')[0] || 'Candidate'
      const introMessage = `Hello, I am ${userName}. I am here for the ${jobPosition} position${companyName ? ` at ${companyName}` : ''}.`
      await handleSendMessage(introMessage)
    }, 1000)
  }

  const handleSendMessage = async (messageContent = inputMessage) => {
    if (!messageContent.trim()) return

    try {
      setIsLoading(true)
      
      // Add user message immediately
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, userMessage])
      setInputMessage('')

      // Send to API
      const response = await chatService.sendInterviewMessage(
        currentChatId,
        messageContent,
        jobPosition,
        companyName,
        difficulty,
        interviewSettings
      )

      // Update chat ID if new chat
      if (response.isNewChat && response.chat) {
        setCurrentChatId(response.chat.id)
        window.history.replaceState(null, '', `/workspace/interview/${response.chat.id}`)
        incrementUsage('interview')
      }

      // Add AI response
      if (response.message || response.aiMessage) {
        const aiMsg = response.message || response.aiMessage
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: aiMsg.content,
          timestamp: aiMsg.timestamp || new Date().toISOString(),
          audio_url: aiMsg.audio_url
        }
        
        setMessages(prev => [...prev, aiMessage])
        
        // Play audio if available and not muted
        if (aiMsg.audio_url && !isMuted) {
          playAudio(aiMsg.audio_url)
        }
      }

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const playAudio = async (audioUrl) => {
    try {
      setIsAISpeaking(true)
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsAISpeaking(false)
      }
      
      audio.onerror = () => {
        setIsAISpeaking(false)
      }
      
      await audio.play()
    } catch (error) {
      console.error('Audio play failed:', error)
      setIsAISpeaking(false)
    }
  }

  const handleVoiceRecord = async () => {
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          const formData = new FormData()
          formData.append('audio', audioBlob, 'recording.wav')

          try {
            const response = await chatService.speechToText(formData)
            if (response.text) {
              setInputMessage(response.text)
            }
          } catch (error) {
            console.error('Speech to text error:', error)
            toast.error('Failed to convert speech to text')
          }

          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Error accessing microphone:', error)
        toast.error('Failed to access microphone')
      }
    }
  }

  const handleFileUpload = () => {
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }
    toast.info('File upload feature coming soon')
  }

  const handleExportPDF = () => {
    if (!isPremium) {
      setShowUpgradeModal(true)
      return
    }
    toast.info('PDF export feature coming soon')
  }

  const handleGoBack = () => {
    navigate('/workspace/interviews')
  }

  if (isLoadingChat) {
    return (
      <div className="flex items-center justify-center h-full bg-dark-primary">
        <div className="text-white-primary">Loading interview...</div>
      </div>
    )
  }

  if (!isSetupComplete) {
    return (
      <div className="flex flex-col h-full bg-dark-primary">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="text-white-secondary hover:text-white-primary"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold text-white-primary">
              New Interview Setup
            </h1>
          </div>
        </div>

        {/* Setup Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white-primary mb-2">
                Interview Setup
              </h2>
              <p className="text-white-secondary">
                Let's set up your AI interview session
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Job Position *
                </label>
                <input
                  type="text"
                  value={jobPosition}
                  onChange={(e) => setJobPosition(e.target.value)}
                  placeholder="e.g., Frontend Developer"
                  className="w-full px-4 py-3 bg-light-dark-secondary border border-gray-600 rounded-xl text-white-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google"
                  className="w-full px-4 py-3 bg-light-dark-secondary border border-gray-600 rounded-xl text-white-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-3 bg-light-dark-secondary border border-gray-600 rounded-xl text-white-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleStartInterview}
              className="w-full py-3"
              disabled={!jobPosition.trim()}
            >
              Start Interview
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-dark-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-white-secondary hover:text-white-primary"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white-primary">
              {jobPosition} Interview{companyName && ` at ${companyName}`}
            </h1>
            <p className="text-sm text-white-secondary capitalize">
              Difficulty: {difficulty}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="text-white-secondary hover:text-white-primary"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPDF}
            className="text-white-secondary hover:text-white-primary"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-xl p-4 ${
                message.role === 'user'
                  ? 'bg-brand-primary text-white'
                  : 'bg-light-dark-secondary text-white-primary'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-2">
                {formatDateTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-xl p-4 bg-light-dark-secondary text-white-primary">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white-secondary rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white-secondary rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-white-secondary rounded-full animate-pulse delay-200"></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-600">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your response..."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-light-dark-secondary border border-gray-600 rounded-xl text-white-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFileUpload}
              className="absolute right-2 top-2 text-white-secondary hover:text-white-primary"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVoiceRecord}
            className={`p-3 ${isRecording ? 'text-red-400 bg-red-500/20' : 'text-white-secondary hover:text-white-primary'}`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className="px-6 py-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Premium Upgrade Modal */}
      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        size="md"
      >
        <div className="p-6 text-center">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white-primary mb-2">
            Premium Feature
          </h3>
          <p className="text-white-secondary mb-6">
            This feature is only available for Premium users. Upgrade now to unlock voice recording and file uploads.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="ghost"
              onClick={() => setShowUpgradeModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => navigate('/workspace/premium')}
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default InterviewPage