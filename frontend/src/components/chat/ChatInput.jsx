import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Paperclip, X, Image, FileText } from 'lucide-react'
import Button from '../common/Button'

const ChatInput = ({
  value,
  onChange,
  onSend,
  onFileAttach,
  onFileRemove,
  attachedFiles = [],
  isLoading = false,
  isPremium = false,
  disabled = false
}) => {
  const { t } = useTranslation()
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [value])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Allow sending if either text OR files are present
    if (!value.trim() && attachedFiles.length === 0) return
    if (disabled || isLoading) return
    
    onSend(value, attachedFiles)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    handleFileUpload(files)
  }

  const handleFileUpload = (files) => {
    if (!isPremium) {
      // Show premium required message
      alert(t('chat.premiumRequired'))
      return
    }

    const validFiles = files.filter(file => {
      const isValidType = file.type.includes('image/') || file.type === 'application/pdf'
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      if (!isValidType) {
        alert(t('chat.invalidFileType'))
        return false
      }
      
      if (!isValidSize) {
        alert(t('chat.fileTooLarge'))
        return false
      }
      
      return true
    })

    if (validFiles.length > 0) {
      onFileAttach(validFiles)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!isPremium) return
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (!isPremium) return
    
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const renderAttachedFiles = () => {
    if (attachedFiles.length === 0) return null

    return (
      <div className="px-4 py-2 border-b border-light-dark-secondary">
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center space-x-2 bg-light-dark-secondary rounded-lg px-3 py-2">
              <div className="flex-shrink-0">
                {file.type?.includes('image') ? (
                  <Image className="w-4 h-4 text-blue-400" />
                ) : (
                  <FileText className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white-primary truncate max-w-32">
                  {file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {Math.round(file.size / 1024)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFileRemove(index)}
                className="p-1 text-gray-400 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${isDragOver ? 'bg-blue-500/10' : ''}`}>
      {renderAttachedFiles()}
      
      <form onSubmit={handleSubmit} className="p-3 md:p-4">
        <div 
          className={`relative flex items-end space-x-2 md:space-x-3 bg-light-dark-secondary rounded-xl border transition-all duration-200 ${
            isDragOver ? 'border-blue-500 bg-blue-500/5' : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* File attachment button */}
          <div className="flex-shrink-0 p-2 md:p-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={!isPremium || disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isPremium || disabled}
              className={`p-2 md:p-2 transition-colors touch-manipulation ${
                isPremium 
                  ? 'text-gray-400 hover:text-white-primary hover:bg-gray-600' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              title={isPremium ? t('chat.attachFile') : t('chat.premiumRequired')}
            >
              <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>

          {/* Text input */}
          <div className="flex-1 py-2 md:py-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? t('chat.inputDisabled') : t('chat.inputPlaceholder')}
              disabled={disabled}
              className="w-full bg-transparent text-white-primary placeholder-gray-400 resize-none border-0 outline-none focus:ring-0 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent text-sm md:text-base"
              rows={1}
              style={{ minHeight: '20px' }}
            />
          </div>

          {/* Send button */}
          <div className="flex-shrink-0 p-2 md:p-3">
            <Button
              type="submit"
              variant={value.trim() || attachedFiles.length > 0 ? 'primary' : 'ghost'}
              size="sm"
              disabled={disabled || isLoading || (!value.trim() && attachedFiles.length === 0)}
              className="p-2 md:p-2 transition-all duration-200 touch-manipulation"
              isLoading={isLoading}
            >
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>

        {/* File upload hint for non-premium users */}
        {!isPremium && (
          <div className="mt-1 md:mt-2 text-xs text-gray-400 text-center">
            {t('chat.upgradeForFiles')}
          </div>
        )}

        {/* Drag and drop overlay */}
        {isDragOver && isPremium && (
          <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Paperclip className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-blue-400 font-medium">{t('chat.dropFiles')}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default ChatInput