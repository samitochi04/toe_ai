import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { api } from '../services/api'

export const useUsageLimit = () => {
  const { user } = useAuthStore()
  const [usage, setUsage] = useState({
    normalChats: 0,
    interviewChats: 0,
    normalLimit: 10,
    interviewLimit: 5,
    loading: true
  })

  const [showLimitModal, setShowLimitModal] = useState(false)
  const [limitType, setLimitType] = useState('normal')

  const isPremium = user?.subscription?.status === 'active'
  
  // Debug log to check subscription status
  console.log('User subscription debug:', {
    user: user?.email,
    hasSubscription: !!user?.subscription,
    subscriptionStatus: user?.subscription?.status,
    isPremium
  })

  useEffect(() => {
    if (user) {
      fetchUsage()
    }
  }, [user])

  const fetchUsage = async () => {
    try {
      const response = await api.get('/users/usage')
      
      if (response.data) {
        setUsage({
          normalChats: response.data.normal_chats_used || 0,
          interviewChats: response.data.interview_chats_used || 0,
          normalLimit: response.data.normal_chat_limit || 100,
          interviewLimit: response.data.interview_chat_limit || 50,
          loading: false
        })
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
      // Set default values on error (high limits for development)
      setUsage({
        normalChats: 0,
        interviewChats: 0,
        normalLimit: 100,
        interviewLimit: 50,
        loading: false
      })
    }
  }

  const checkUsageLimit = (type) => {
    if (isPremium) return true

    const current = type === 'interview' ? usage.interviewChats : usage.normalChats
    const limit = type === 'interview' ? usage.interviewLimit : usage.normalLimit

    if (current >= limit) {
      setLimitType(type)
      setShowLimitModal(true)
      return false
    }

    // Show warning when approaching limit (80% or more)
    const percentage = (current / limit) * 100
    if (percentage >= 80 && percentage < 100) {
      const remaining = limit - current
      toast(`⚠️ Only ${remaining} ${type} chat${remaining !== 1 ? 's' : ''} remaining this month`, {
        duration: 5000,
        style: {
          background: '#fbbf24',
          color: '#000'
        }
      })
    }

    return true
  }

  const incrementUsage = (type) => {
    if (isPremium) return

    setUsage(prev => ({
      ...prev,
      [type === 'interview' ? 'interviewChats' : 'normalChats']: 
        prev[type === 'interview' ? 'interviewChats' : 'normalChats'] + 1
    }))
  }

  const getUsagePercentage = (type) => {
    const current = type === 'interview' ? usage.interviewChats : usage.normalChats
    const limit = type === 'interview' ? usage.interviewLimit : usage.normalLimit
    return Math.min((current / limit) * 100, 100)
  }

  const getRemainingUsage = (type) => {
    const current = type === 'interview' ? usage.interviewChats : usage.normalChats
    const limit = type === 'interview' ? usage.interviewLimit : usage.normalLimit
    return Math.max(limit - current, 0)
  }

  const handleLimitModalClose = () => {
    setShowLimitModal(false)
  }

  return {
    usage,
    isPremium,
    checkUsageLimit,
    incrementUsage,
    getUsagePercentage,
    getRemainingUsage,
    showLimitModal,
    limitType,
    handleLimitModalClose,
    fetchUsage
  }
}

export default useUsageLimit
