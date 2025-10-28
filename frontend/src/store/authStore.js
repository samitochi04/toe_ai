import { create } from 'zustand'
import { authService } from '../services/auth'
import { storage } from '../utils/storage'
import { supabase } from '../services/supabase'

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
      // Use Supabase OAuth flow for Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback/google`
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      // The redirect will happen automatically
      // Session handling will be done in the callback page
      
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Google sign in failed',
      })
      throw error
    }
  },

  handleOAuthCallback: async () => {
    set({ isLoading: true, error: null })

    try {
      // Get session from URL after OAuth redirect
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        throw new Error(error.message)
      }

      if (session) {
        // Send session data to our backend for processing
        const authResponse = await authService.googleAuth({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user
        })

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

        return authResponse
      } else {
        throw new Error('No session found in OAuth callback')
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'OAuth callback failed',
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
      // console.error('Logout error:', error)
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
      // console.error('Failed to refresh user profile:', error)
    }
    return null
  },

  // Helper getters
  getIsAuthenticated: () => get().isAuthenticated,
  getCurrentUser: () => get().user,
}))

export default useAuthStore
