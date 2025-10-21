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
    set({ isLoading: true }) // start loading

    const token = storage.getAccessToken()
    const user = storage.getUserData()

    if (token && user) {
      try {
        await authService.verifyToken()
        set({ user, isAuthenticated: true }) // don't set isLoading yet

        // Fetch latest user profile
        await get().refreshUserProfile()
      } catch (error) {
        console.log('Token verification failed, attempting refresh...')
        const refreshToken = storage.getRefreshToken()
        if (refreshToken) {
          try {
            const response = await authService.refreshToken(refreshToken)
            storage.setAccessToken(response.access_token)
            storage.setRefreshToken(response.refresh_token)

            set({ user, isAuthenticated: true })

            await get().refreshUserProfile()
          } catch {
            storage.clearAllData()
            set({ user: null, isAuthenticated: false })
          }
        } else {
          storage.clearAllData()
          set({ user: null, isAuthenticated: false })
        }
      }
    } else {
      set({ user: null, isAuthenticated: false })
    }

    set({ isLoading: false }) // finally stop loading
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

      // Fetch complete user profile including subscription data
      await get().refreshUserProfile()

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

      // Fetch complete user profile including subscription data
      await get().refreshUserProfile()

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
          callback: async response => {
            try {
              if (response.credential) {
                // Send ID token to backend
                const authResponse = await authService.googleAuth(
                  response.credential
                )
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

                // Fetch complete user profile including subscription data
                await get().refreshUserProfile()

                resolve(authResponse)
              } else {
                throw new Error(
                  'Google authentication failed - no credential received'
                )
              }
            } catch (error) {
              set({
                isLoading: false,
                error: error.message || 'Google sign in failed',
              })
              reject(error)
            }
          },
        })

        // Prompt for Google sign-in
        window.google.accounts.id.prompt(notification => {
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
                  },
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
  updateUserData: userData => {
    set(state => ({
      user: { ...state.user, ...userData },
    }))
    storage.setUserData({ ...get().user, ...userData })
  },

  // Check if user is premium based on subscription status
  isPremiumUser: () => {
    const user = get().user
    if (!user || !user.subscription) {
      return false
    }
    // Check if subscription status is "active" (premium) vs "free"
    return user.subscription.status === 'active'
  },

  // Refresh user profile data (useful after payment)
  refreshUserProfile: async () => {
    try {
      const baseURL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
      const response = await fetch(`${baseURL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${storage.getAccessToken()}`,
        },
      })

      if (response.ok) {
        const profileData = await response.json()
        set(state => ({
          user: { ...state.user, ...profileData },
        }))
        storage.setUserData({ ...get().user, ...profileData })
        return profileData
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error)
    }
    return null
  },

  // Helper getters
  getIsAuthenticated: () => get().isAuthenticated,
  getCurrentUser: () => get().user,
}))

export default useAuthStore
