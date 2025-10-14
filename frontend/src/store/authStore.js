import { create } from 'zustand'
import { authService } from '../services/auth'
import { storage } from '../utils/storage'

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  initializeAuth: async () => {
    const token = storage.getAccessToken()
    const user = storage.getUserData()

    if (token && user) {
      try {
        // Verify token is still valid
        await authService.verifyToken()
        set({ user, isAuthenticated: true, isLoading: false })
      } catch (error) {
        console.log('Token verification failed, attempting refresh...')
        // Try to refresh token
        const refreshToken = storage.getRefreshToken()
        if (refreshToken) {
          try {
            const response = await authService.refreshToken(refreshToken)
            storage.setAccessToken(response.access_token)
            storage.setRefreshToken(response.refresh_token)
            
            set({ user, isAuthenticated: true, isLoading: false })
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
            // Refresh failed, clear storage
            storage.clearTokens()
            storage.clearUserData()
            set({ user: null, isAuthenticated: false, isLoading: false })
          }
        } else {
          // No refresh token, clear everything
          storage.clearTokens()
          storage.clearUserData()
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      }
    } else {
      set({ isLoading: false })
    }
  },

  signUp: async (name, email, password) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await authService.register({
        full_name: name,
        email,
        password,
      })

      const { access_token, refresh_token, user } = response

      // Store tokens and user data
      storage.setAccessToken(access_token)
      storage.setRefreshToken(refresh_token)
      storage.setUserData(user)

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })

      return response
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Sign up failed',
      })
      throw error
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null })
    
    try {
      const response = await authService.login(email, password)
      const { access_token, refresh_token, user } = response

      // Store tokens and user data
      storage.setAccessToken(access_token)
      storage.setRefreshToken(refresh_token)
      storage.setUserData(user)

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })

      return response
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Sign in failed',
      })
      throw error
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null })
    
    try {
      // Initialize Google Identity Services
      if (!window.google) {
        throw new Error('Google OAuth library not loaded')
      }

      // Get Google OAuth client ID from environment
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (!clientId) {
        throw new Error('Google Client ID not configured')
      }

      return new Promise((resolve, reject) => {
        // Initialize Google Identity Services with ID token callback
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              if (response.credential) {
                // Send ID token to backend
                const authResponse = await authService.googleAuth(response.credential)
                const { access_token, refresh_token, user } = authResponse

                // Store tokens and user data
                storage.setAccessToken(access_token)
                storage.setRefreshToken(refresh_token)
                storage.setUserData(user)

                set({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                })

                resolve(authResponse)
              } else {
                throw new Error('Google authentication failed - no credential received')
              }
            } catch (error) {
              set({
                isLoading: false,
                error: error.message || 'Google sign in failed',
              })
              reject(error)
            }
          }
        })

        // Prompt for Google sign-in
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to popup if prompt is blocked
            try {
              window.google.accounts.id.renderButton(
                document.createElement('div'),
                {
                  theme: 'outline',
                  size: 'large',
                  width: 300,
                  click_listener: () => {
                    // This triggers the popup
                  }
                }
              )
              
              // Trigger the popup manually
              const popup = window.open(
                `https://accounts.google.com/oauth/authorize?client_id=${clientId}&response_type=token&scope=openid email profile&redirect_uri=${window.location.origin}`,
                'googleSignIn',
                'width=500,height=600'
              )
              
              // Handle popup response (fallback - not ideal)
              const checkClosed = setInterval(() => {
                if (popup.closed) {
                  clearInterval(checkClosed)
                  set({ isLoading: false })
                  reject(new Error('Google sign-in was cancelled'))
                }
              }, 1000)
              
            } catch (fallbackError) {
              set({ isLoading: false })
              reject(new Error('Google sign-in is not available'))
            }
          }
        })
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Google sign in failed',
      })
      throw error
    }
  },

  signOut: async () => {
    set({ isLoading: true })
    
    try {
      await authService.logout()
    } catch (error) {
      // Even if logout fails on server, we still clear local data
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      storage.clearAllData()
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },

  updatePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null })
    
    try {
      await authService.updatePassword(currentPassword, newPassword)
      set({ isLoading: false })
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Password update failed',
      })
      throw error
    }
  },

  clearError: () => {
    set({ error: null })
  },

  // Update user data
  updateUserData: (userData) => {
    set(state => ({ 
      user: { ...state.user, ...userData }
    }))
    storage.setUserData({ ...get().user, ...userData })
  },

  // Helper getters
  getIsAuthenticated: () => get().isAuthenticated,
  getCurrentUser: () => get().user,
}))

export default useAuthStore