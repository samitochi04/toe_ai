import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, X, File, Image as ImageIcon, AlertCircle } from 'lucide-react'
import Button from '../common/Button'

const FileUpload = ({ 
  onFilesSelect, 
  onFileRemove, 
  files = [], 
  maxFiles = 5, 
  maxSize = 10 * 1024 * 1024, // 10MB 
  acceptedTypes = ['image/*', '.pdf'],
  isPremium = false,
  disabled = false,
  className = ''
}) => {
  const { t } = useTranslation()
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxSize) {
      return { valid: false, error: t('chat.fileTooLarge') }
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      } else if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      } else {
        return file.type === type
      }
    })

    if (!isValidType) {
      return { valid: false, error: t('chat.invalidFileType') }
    }

    return { valid: true }
  }

  const handleFileSelect = (selectedFiles) => {
    if (!isPremium) {
      alert(t('chat.premiumRequired'))
      return
    }

    const newFiles = Array.from(selectedFiles)
    const validFiles = []
    const errors = []

    for (const file of newFiles) {
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`)
        break
      }

      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(`${file.name}: ${validation.error}`)
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      onFilesSelect(validFiles)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    if (!isPremium || disabled) return
    
    const droppedFiles = e.dataTransfer.files
    handleFileSelect(droppedFiles)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!isPremium || disabled) return
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleInputChange = (e) => {
    handleFileSelect(e.target.files)
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleRemoveFile = (index) => {
    onFileRemove(index)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5 text-blue-400" />
    } else {
      return <File className="w-5 h-5 text-red-400" />
    }
  }

  return (
    <div className={`file-upload ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          dragOver
            ? 'border-blue-400 bg-blue-400/5'
            : 'border-gray-600 hover:border-gray-500'
        } ${!isPremium ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => isPremium && !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          disabled={!isPremium || disabled}
          className="hidden"
        />

        <div className="text-center">
          <Upload className={`mx-auto h-12 w-12 ${isPremium ? 'text-gray-400' : 'text-gray-600'}`} />
          <div className="mt-4">
            <p className={`text-sm font-medium ${isPremium ? 'text-white-primary' : 'text-gray-500'}`}>
              {isPremium ? t('chat.dropFiles') : t('chat.premiumRequired')}
            </p>
            <p className={`text-xs ${isPremium ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              {isPremium && (
                <>
                  {acceptedTypes.includes('image/*') && 'Images'} 
                  {acceptedTypes.includes('.pdf') && (acceptedTypes.includes('image/*') ? ' and PDFs' : 'PDFs')} 
                  {' '}up to {formatFileSize(maxSize)}
                </>
              )}
            </p>
          </div>
        </div>

        {!isPremium && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-primary/80 rounded-lg">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-white-primary">
                {t('chat.upgradeForFiles')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-light-dark-secondary rounded-lg border border-gray-600"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white-primary truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>

              {uploadProgress[file.name] && (
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[file.name]}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {uploadProgress[file.name]}%
                  </span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                className="p-2 text-gray-400 hover:text-red-400 ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {isPremium && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || files.length >= maxFiles}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>
              {files.length > 0 
                ? t('common.addMore') 
                : t('chat.attachFile')
              }
            </span>
          </Button>
          
          <p className="text-xs text-gray-400 text-center mt-2">
            {files.length} / {maxFiles} files selected
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUpload