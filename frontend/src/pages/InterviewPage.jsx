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
  Crown,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import useUsageLimit from '../hooks/useUsageLimit'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import { chatService } from '../services/chat'
import { formatDateTime } from '../utils/helpers'

// Import static assets
import staticInterviewImage from '../assets/images/static_image_interview.jpg'
import interviewVideo from '../assets/video/toe_ai_video.mp4'

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
  const [recordingTime, setRecordingTime] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isAISpeaking, setIsAISpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentChatId, setCurrentChatId] = useState(null)
  const [attachedFiles, setAttachedFiles] = useState([])

  // Additional UI states
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showConversation, setShowConversation] = useState(false)
  const [isVideoTransitioning, setIsVideoTransitioning] = useState(false)

  // Refs
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)
  const autoSendTimerRef = useRef(null)
  const audioRef = useRef(null)
  const messagesEndRef = useRef(null)
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)

  const isPremium = user?.subscription?.status === 'active'

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
              language: response.language || response.interview_settings?.language || 'en',
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

  useEffect(() => {
    // Clear transcription when AI stops speaking
    if (!isAISpeaking) {
      setTimeout(() => {
        // Cleared transcription state
      }, 2000) // Clear after 2 seconds
    }
  }, [isAISpeaking])

  useEffect(() => {
    // Auto-scroll conversation when new messages arrive and conversation is open
    if (showConversation && messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, showConversation])

  // Cleanup effect for timers
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current)
      }
    }
  }, [])

  // Auto-resize textarea when input changes
  useEffect(() => {
    const textarea = document.querySelector('textarea[placeholder="Type your response..."]')
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200)
      textarea.style.height = newHeight + 'px'
    }
  }, [inputMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
      
      // Create language-appropriate introduction message
      let introMessage
      if (interviewSettings.language === 'fr') {
        introMessage = `Bonjour, je suis ${userName}. Je suis ici pour le poste de ${jobPosition}${companyName ? ` chez ${companyName}` : ''}.`
      } else {
        introMessage = `Hello, I am ${userName}. I am here for the ${jobPosition} position${companyName ? ` at ${companyName}` : ''}.`
      }
      
      await handleSendMessage(introMessage)
    }, 1000)
  }

  const handleSendMessage = async (messageContent = inputMessage) => {
    if (!messageContent.trim() && attachedFiles.length === 0) return

    try {
      setIsLoading(true)
      
      // Add user message immediately with file info
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: messageContent || (attachedFiles.length > 0 ? '[File attached]' : ''),
        timestamp: new Date().toISOString(),
        files: attachedFiles.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size
        }))
      }
      setMessages(prev => [...prev, userMessage])
      setInputMessage('')
      
      let response
      
      // Use different methods based on whether files are attached
      if (attachedFiles.length > 0) {
        // Use sendMessage for file handling
        response = await chatService.sendMessage(
          currentChatId || 'new',
          messageContent,
          attachedFiles,
          'interview'
        )
        
        // Clear attached files after sending
        setAttachedFiles([])
      } else {
        // Use regular interview message sending
        response = await chatService.sendInterviewMessage(
          currentChatId,
          messageContent,
          jobPosition,
          companyName,
          difficulty,
          interviewSettings
        )
      }

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
          
          // Update transcription with AI message
          // Store AI response for potential transcription use
          
          // Play audio if available and not muted
          if (aiMsg.audio_url && !isMuted) {
            playAudio(aiMsg.audio_url)
          }
        }    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const playAudio = async (audioUrl) => {
    try {
      // Start video transition with blur effect
      setIsVideoTransitioning(true)
      
      // Wait for blur transition
      setTimeout(() => {
        setIsAISpeaking(true)
        setIsVideoTransitioning(false)
      }, 300)

      const audio = new Audio(audioUrl)
      audio.muted = isMuted
      audioRef.current = audio
      
      audio.onended = () => {
        // Transition back to static image with blur
        setIsVideoTransitioning(true)
        setTimeout(() => {
          setIsAISpeaking(false)
          setIsVideoTransitioning(false)
        }, 300)
      }
      
      audio.onerror = () => {
        setIsVideoTransitioning(true)
        setTimeout(() => {
          setIsAISpeaking(false)
          setIsVideoTransitioning(false)
        }, 300)
      }
      
      await audio.play()
    } catch (error) {
      console.error('Audio play failed:', error)
      setIsVideoTransitioning(true)
      setTimeout(() => {
        setIsAISpeaking(false)
        setIsVideoTransitioning(false)
      }, 300)
    }
  }

  const handleMuteToggle = () => {
    setIsMuted(!isMuted)
    
    // If there's currently playing audio, mute/unmute it immediately
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
    }
    
    // Also control the background video
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
    
    toast.success(isMuted ? 'Audio unmuted' : 'Audio muted')
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
        
        // Clear recording timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
          recordingTimerRef.current = null
        }
        setRecordingTime(0)
        
        // Show transcribing state
        setIsTranscribing(true)
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
              const transcribedText = response.text
              setInputMessage(transcribedText)
              setIsTranscribing(false)
              
              // Auto-send after 2 seconds
              toast.success('Speech transcribed! Sending in 2 seconds... (Edit to cancel auto-send)', {
                duration: 2000,
                action: {
                  label: 'Cancel',
                  onClick: () => {
                    if (autoSendTimerRef.current) {
                      clearTimeout(autoSendTimerRef.current)
                      autoSendTimerRef.current = null
                      toast.success('Auto-send cancelled')
                    }
                  }
                }
              })
              autoSendTimerRef.current = setTimeout(() => {
                // Send the transcribed text directly
                handleSendMessage(transcribedText)
              }, 2000)
            }
          } catch (error) {
            console.error('Speech to text error:', error)
            setIsTranscribing(false)
            toast.error('Failed to convert speech to text')
          }

          stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.start()
        setIsRecording(true)
        
        // Start recording timer
        setRecordingTime(0)
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
        
        toast.success('Recording started... Click again to stop')
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
    fileInputRef.current?.click()
  }

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    // Validate files
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    
    const validFiles = []
    const errors = []

    files.forEach(file => {
      if (file.size > maxSize) {
        errors.push(`${file.name}: File too large (max 10MB)`)
        return
      }

      const isValidType = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.split('/')[0])
        }
        return file.type === type
      })

      if (!isValidType) {
        errors.push(`${file.name}: Unsupported file type`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      toast.error(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...validFiles])
      toast.success(`${validFiles.length} file(s) attached`)
    }

    // Reset input
    event.target.value = ''
  }

  const handleRemoveFile = (fileIndex) => {
    setAttachedFiles(prev => prev.filter((_, index) => index !== fileIndex))
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
                  Company Name *
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
                  Interview Language
                </label>
                <select
                  value={interviewSettings.language}
                  onChange={(e) => setInterviewSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-3 bg-light-dark-secondary border border-gray-600 rounded-xl text-white-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                </select>
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
            onClick={handleMuteToggle}
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

      {/* Main Content Area with Scroll */}
      <div className="flex-1 flex flex-col overflow-y-auto scroll-smooth">
        {/* Video/Image Section - Full Width */}
        <div className="flex-1 flex flex-col" id="interview-video">
          {/* Video/Image Container - Expanded */}
          <div className="flex-1 flex items-center justify-center p-4 pb-2 min-h-[60vh]">
            <div className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-gray-800 shadow-2xl border border-gray-700">
              {/* Static Image */}
              <img
                src={staticInterviewImage}
                alt="AI Interviewer"
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                  isAISpeaking ? 'opacity-0' : 'opacity-100'
                } ${isVideoTransitioning ? 'blur-sm' : 'blur-0'}`}
              />
              
              {/* Video Element */}
              <video
                ref={videoRef}
                src={interviewVideo}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                  isAISpeaking ? 'opacity-100' : 'opacity-0'
                } ${isVideoTransitioning ? 'blur-sm' : 'blur-0'}`}
              />
              
              {/* Loading Overlay */}
              {isVideoTransitioning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-brand-primary rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-brand-primary rounded-full animate-bounce delay-100"></div>
                      <div className="w-3 h-3 bg-brand-primary rounded-full animate-bounce delay-200"></div>
                    </div>
                    <span className="text-white text-sm font-medium">Processing...</span>
                  </div>
                </div>
              )}
              
              {/* AI Speaking Indicator */}
              {isAISpeaking && !isVideoTransitioning && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black bg-opacity-50 px-3 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm">Speaking...</span>
                </div>
              )}
              
              {/* Loading Indicator when processing user message */}
              {isLoading && !isAISpeaking && !isVideoTransitioning && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black bg-opacity-50 px-3 py-2 rounded-full">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    {/* <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-200"></div> */}
                  </div>
                  <span className="text-white text-sm">Loading...</span>
                </div>
              )}
            </div>
          </div>

          {/* Input Area - Enhanced UX */}
          <div className="p-4 bg-gray-900/80 border-t border-gray-700/50">
            <div className="max-w-4xl mx-auto">
              {/* File attachments area */}
              {attachedFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg border border-gray-600">
                      <div className="flex items-center gap-2">
                        {file.type.startsWith('image/') ? (
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={file.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                            <Paperclip className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-white-primary truncate max-w-32">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Recording/Transcribing Indicator */}
              {(isRecording || isTranscribing) && (
                <div className={`mb-3 p-3 rounded-xl border ${
                  isRecording 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {isRecording ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-400 font-medium">Recording</span>
                          <span className="text-red-300 text-sm">{formatRecordingTime(recordingTime)}</span>
                        </div>
                        <span className="text-gray-400 text-sm">Click the microphone again to stop</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-spin border-2 border-blue-200 border-t-transparent"></div>
                          <span className="text-blue-400 font-medium">Transcribing speech...</span>
                        </div>
                        <span className="text-gray-400 text-sm">Please wait</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-end gap-3 bg-light-dark-secondary rounded-2xl border border-gray-600 focus-within:border-brand-primary/60 focus-within:shadow-lg focus-within:shadow-brand-primary/20 transition-all duration-200 p-3">
                <div className="flex-1 relative min-h-[24px]">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value)
                      // Clear auto-send timer if user types
                      if (autoSendTimerRef.current) {
                        clearTimeout(autoSendTimerRef.current)
                        autoSendTimerRef.current = null
                      }
                      // Auto-resize textarea
                      e.target.style.height = 'auto'
                      const newHeight = Math.min(Math.max(e.target.scrollHeight, 40), 200)
                      e.target.style.height = newHeight + 'px'
                    }}
                    placeholder={isRecording ? "Recording..." : isTranscribing ? "Transcribing..." : "Type your response..."}
                    rows={1}
                    disabled={isRecording || isTranscribing}
                    className="w-full px-2 py-2 pr-10 bg-transparent text-white-primary placeholder-gray-400 focus:outline-none resize-none scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700 scrollbar-corner-transparent disabled:opacity-50"
                    style={{ 
                      minHeight: '40px', 
                      maxHeight: '200px',
                      lineHeight: '1.5',
                      fontSize: '14px'
                    }}
                    onKeyDown={(e) => {
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
                    disabled={isRecording || isTranscribing}
                    className="absolute right-1 top-1 text-gray-400 hover:text-white-primary rounded-lg p-1.5 h-auto disabled:opacity-50"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceRecord}
                    disabled={isTranscribing}
                    className={`relative p-2.5 rounded-lg transition-all duration-200 ${
                      isRecording 
                        ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30 animate-pulse' 
                        : isTranscribing
                        ? 'text-blue-400 bg-blue-500/20 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white-primary hover:bg-gray-700'
                    }`}
                    title={isRecording ? 'Stop Recording' : isTranscribing ? 'Transcribing...' : 'Start Recording'}
                  >
                    {isRecording ? (
                      <MicOff className="w-4 h-4" />
                    ) : isTranscribing ? (
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                    {isRecording && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Clear auto-send timer if user manually sends
                      if (autoSendTimerRef.current) {
                        clearTimeout(autoSendTimerRef.current)
                        autoSendTimerRef.current = null
                      }
                      handleSendMessage()
                    }}
                    disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isLoading || isRecording || isTranscribing}
                    className={`p-2.5 rounded-lg transition-all duration-200 ${
                      (inputMessage.trim() || attachedFiles.length > 0) && !isLoading && !isRecording && !isTranscribing
                        ? 'bg-brand-primary hover:bg-brand-primary/90 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    title={isRecording ? 'Finish recording first' : isTranscribing ? 'Transcribing...' : 'Send message'}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Section with Toggle */}
          <div className="p-4 pt-2 bg-gray-900/30">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={() => setShowConversation(!showConversation)}
                className="w-full flex items-center justify-between p-4 bg-light-dark-secondary rounded-xl hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-brand-primary/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-white-primary font-medium">Interview Conversation</span>
                  {messages.length > 0 && (
                    <span className="px-2 py-1 bg-brand-primary text-white text-xs rounded-full">
                      {messages.length}
                    </span>
                  )}
                </div>
                {showConversation ? (
                  <ChevronUp className="w-5 h-5 text-white-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white-secondary" />
                )}
              </button>
              
              {showConversation && (
                <div className="mt-4 max-h-80 overflow-y-auto space-y-3 p-4 bg-gray-900 rounded-xl border border-gray-700 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                  {messages.length === 0 ? (
                    <div className="text-center text-white-secondary py-8">
                      <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => (
                        <div
                          key={message.id || index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-3 text-sm ${
                              message.role === 'user'
                                ? 'bg-brand-primary text-white'
                                : 'bg-gray-700 text-white-primary'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Display attached files */}
                            {message.files && message.files.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {message.files.map((file, fileIndex) => (
                                  <div key={fileIndex} className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded text-xs">
                                    <Paperclip className="w-3 h-3" />
                                    <span className="truncate max-w-24">{file.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <p className="text-xs opacity-70 mt-1">
                              {formatDateTime(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] rounded-lg p-3 bg-gray-700 text-white-primary">
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
                    </>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
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
      
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

export default InterviewPage