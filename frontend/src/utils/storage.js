/**
 * Local storage utility functions for TOE AI Frontend
 * Handles authentication tokens and user preferences
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'toe_ai_access_token',
  REFRESH_TOKEN: 'toe_ai_refresh_token',
  USER_DATA: 'toe_ai_user_data',
  SETTINGS: 'toe_ai_settings',
  CHAT_DRAFTS: 'toe_ai_chat_drafts',
  LANGUAGE: 'toe_ai_language'
}

/**
 * Safe localStorage wrapper with error handling
 */
class StorageManager {
  constructor() {
    this.isAvailable = this.checkStorageAvailability()
  }

  checkStorageAvailability() {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      console.warn('localStorage is not available:', e)
      return false
    }
  }

  setItem(key, value) {
    if (!this.isAvailable) return false

    try {
      const serializedValue = JSON.stringify(value)
      localStorage.setItem(key, serializedValue)
      return true
    } catch (error) {
      console.error('Error setting localStorage item:', error)
      return false
    }
  }

  getItem(key, defaultValue = null) {
    if (!this.isAvailable) return defaultValue

    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      return JSON.parse(item)
    } catch (error) {
      console.error('Error getting localStorage item:', error)
      return defaultValue
    }
  }

  removeItem(key) {
    if (!this.isAvailable) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing localStorage item:', error)
      return false
    }
  }

  clear() {
    if (!this.isAvailable) return false

    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }

  // Authentication token methods
  setAccessToken(token) {
    return this.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
  }

  getAccessToken() {
    return this.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  }

  setRefreshToken(token) {
    return this.setItem(STORAGE_KEYS.REFRESH_TOKEN, token)
  }

  getRefreshToken() {
    return this.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  setTokens(accessToken, refreshToken) {
    this.setAccessToken(accessToken)
    this.setRefreshToken(refreshToken)
  }

  clearTokens() {
    this.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    this.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  }

  // User data methods
  setUserData(userData) {
    return this.setItem(STORAGE_KEYS.USER_DATA, userData)
  }

  getUserData() {
    return this.getItem(STORAGE_KEYS.USER_DATA)
  }

  clearUserData() {
    return this.removeItem(STORAGE_KEYS.USER_DATA)
  }

  // Settings methods
  setSettings(settings) {
    return this.setItem(STORAGE_KEYS.SETTINGS, settings)
  }

  getSettings() {
    return this.getItem(STORAGE_KEYS.SETTINGS, {
      theme: 'dark',
      language: 'en',
      notifications: true,
      autoSave: true
    })
  }

  updateSettings(newSettings) {
    const currentSettings = this.getSettings()
    const updatedSettings = { ...currentSettings, ...newSettings }
    return this.setSettings(updatedSettings)
  }

  // Language preference
  setLanguage(language) {
    return this.setItem(STORAGE_KEYS.LANGUAGE, language)
  }

  getLanguage() {
    return this.getItem(STORAGE_KEYS.LANGUAGE, 'en')
  }

  // Remember last visited workspace path
  setLastPath(path) {
    return this.setItem('toe_ai_last_path', path)
  }

  getLastPath() {
    console.log(`Getting last path from storage ######################## ${this.getItem('toe_ai_last_path', null)}`)
    return this.getItem('toe_ai_last_path', null)
  }

  clearLastPath() {
    return this.removeItem('toe_ai_last_path')
  }

  // Chat drafts (for auto-save functionality)
  setChatDraft(chatId, content) {
    const drafts = this.getChatDrafts()
    drafts[chatId] = {
      content,
      timestamp: new Date().toISOString()
    }
    return this.setItem(STORAGE_KEYS.CHAT_DRAFTS, drafts)
  }

  getChatDraft(chatId) {
    const drafts = this.getChatDrafts()
    return drafts[chatId]?.content || ''
  }

  getChatDrafts() {
    return this.getItem(STORAGE_KEYS.CHAT_DRAFTS, {})
  }

  removeChatDraft(chatId) {
    const drafts = this.getChatDrafts()
    delete drafts[chatId]
    return this.setItem(STORAGE_KEYS.CHAT_DRAFTS, drafts)
  }

  clearChatDrafts() {
    return this.removeItem(STORAGE_KEYS.CHAT_DRAFTS)
  }

  // Clear all app data (logout)
  clearAllData() {
    this.clearTokens()
    this.clearUserData()
    this.clearChatDrafts()
    // Keep settings and language preference
  }

  // Get storage usage info
  getStorageInfo() {
    if (!this.isAvailable) {
      return { available: false, used: 0, total: 0 }
    }

    try {
      let totalSize = 0
      const items = {}

      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const value = localStorage.getItem(key)
          const size = new Blob([value]).size
          items[key] = size
          totalSize += size
        }
      }

      return {
        available: true,
        used: totalSize,
        total: 5 * 1024 * 1024, // Approximate 5MB limit for localStorage
        items
      }
    } catch (error) {
      console.error('Error getting storage info:', error)
      return { available: false, used: 0, total: 0 }
    }
  }
}

// Create and export singleton instance
export const storage = new StorageManager()

// Export storage keys for direct access if needed
export { STORAGE_KEYS }

// Default export
export default storage