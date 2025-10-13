// Utility helper functions

/**
 * Format date and time for display
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} - Formatted date string
 */
export const formatDateTime = (dateInput) => {
  try {
    if (!dateInput) {
      return new Date().toLocaleString()
    }

    let date
    
    // Handle different input types
    if (dateInput instanceof Date) {
      date = dateInput
    } else if (typeof dateInput === 'string') {
      // Handle ISO string with Z suffix
      if (dateInput.includes('T') && dateInput.includes('Z')) {
        date = new Date(dateInput)
      } 
      // Handle ISO string with timezone offset
      else if (dateInput.includes('T') && (dateInput.includes('+') || dateInput.includes('-'))) {
        date = new Date(dateInput)
      }
      // Handle simple date string
      else {
        date = new Date(dateInput)
      }
    } else {
      date = new Date()
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return new Date().toLocaleString()
    }

    return date.toLocaleString()
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateInput)
    return new Date().toLocaleString()
  }
}

/**
 * Format date for display (date only)
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateInput) => {
  try {
    if (!dateInput) {
      return new Date().toLocaleDateString()
    }

    let date
    if (dateInput instanceof Date) {
      date = dateInput
    } else {
      date = new Date(dateInput)
    }

    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString()
    }

    return date.toLocaleDateString()
  } catch (error) {
    console.error('Error formatting date:', error)
    return new Date().toLocaleDateString()
  }
}

/**
 * Format time for display (time only)
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} - Formatted time string
 */
export const formatTime = (dateInput) => {
  try {
    if (!dateInput) {
      return new Date().toLocaleTimeString()
    }

    let date
    if (dateInput instanceof Date) {
      date = dateInput
    } else {
      date = new Date(dateInput)
    }

    if (isNaN(date.getTime())) {
      return new Date().toLocaleTimeString()
    }

    return date.toLocaleTimeString()
  } catch (error) {
    console.error('Error formatting time:', error)
    return new Date().toLocaleTimeString()
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (dateInput) => {
  try {
    if (!dateInput) {
      return 'Just now'
    }

    let date
    if (dateInput instanceof Date) {
      date = dateInput
    } else {
      date = new Date(dateInput)
    }

    if (isNaN(date.getTime())) {
      return 'Just now'
    }

    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days !== 1 ? 's' : ''} ago`
    }
  } catch (error) {
    console.error('Error getting relative time:', error)
    return 'Just now'
  }
}

// Format duration in seconds to human readable
export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Generate random ID
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Capitalize first letter
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

// Truncate text
export const truncate = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Check if email is valid
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Check if URL is valid
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Get file extension
export const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

// Convert blob to base64
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Download file
export const downloadFile = (url, filename) => {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      return true
    } catch (err) {
      return false
    } finally {
      document.body.removeChild(textArea)
    }
  }
}

// Sleep function
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Generate color from string (for avatars)
export const stringToColor = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const color = Math.floor(Math.abs((Math.sin(hash) * 16777215) % 1) * 16777215).toString(16)
  return '#' + Array(6 - color.length + 1).join('0') + color
}

// Get initials from name
export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Check if device is mobile
export const isMobile = () => {
  return window.innerWidth < 768
}

// Check if device is tablet
export const isTablet = () => {
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

// Check if device is desktop
export const isDesktop = () => {
  return window.innerWidth >= 1024
}

// Get device type
export const getDeviceType = () => {
  if (isMobile()) return 'mobile'
  if (isTablet()) return 'tablet'
  return 'desktop'
}

export default {
  formatDate,
  formatDateTime,
  formatTime,
  formatDuration,
  formatFileSize,
  generateId,
  debounce,
  throttle,
  capitalize,
  truncate,
  isValidEmail,
  isValidUrl,
  getFileExtension,
  blobToBase64,
  downloadFile,
  copyToClipboard,
  sleep,
  stringToColor,
  getInitials,
  isMobile,
  isTablet,
  isDesktop,
  getDeviceType,
}