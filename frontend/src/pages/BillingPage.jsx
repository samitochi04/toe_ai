import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Crown, Check, Sparkles, CreditCard, Calendar, Users, Zap, Shield } from 'lucide-react'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'
import { api } from '../services/api'
import usePayments from '../hooks/usePayments'

const BillingPage = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { createCheckoutSession, isLoading: paymentLoading } = usePayments()
  
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [usage, setUsage] = useState({
    normalChats: 0,
    interviewChats: 0,
    normalLimit: 10,
    interviewLimit: 5
  })
  const [usageLoading, setUsageLoading] = useState(true)

  const isPremium = user?.subscription?.status === 'active'

  const plans = {
    monthly: {
      id: 'premium_monthly',
      name: t('billing.plans.monthly.name'),
      price: 5,
      currency: '€',
      period: 'month',
      priceId: 'price_premium_monthly',
      description: t('billing.plans.monthly.description')
    },
    yearly: {
      id: 'premium_yearly', 
      name: t('billing.plans.yearly.name'),
      price: 50,
      currency: '€',
      period: 'year',
      originalPrice: 60,
      priceId: 'price_premium_yearly',
      discount: 17,
      description: t('billing.plans.yearly.description')
    }
  }

  const features = {
    free: [
      { text: t('billing.features.free.normalChats'), included: true },
      { text: t('billing.features.free.interviewSessions'), included: true },
      { text: t('billing.features.free.basicAI'), included: true },
      { text: t('billing.features.free.textOnly'), included: true },
      { text: t('billing.features.free.limitedUploads'), included: false },
      { text: t('billing.features.free.voiceInteraction'), included: false },
      { text: t('billing.features.free.pdfExport'), included: false },
      { text: t('billing.features.free.prioritySupport'), included: false },
      { text: t('billing.features.free.advancedSettings'), included: false }
    ],
    premium: [
      { text: t('billing.features.premium.unlimitedChats'), included: true },
      { text: t('billing.features.premium.unlimitedSessions'), included: true },
      { text: t('billing.features.premium.advancedAI'), included: true },
      { text: t('billing.features.premium.voiceToVoice'), included: true },
      { text: t('billing.features.premium.fileSharing'), included: true },
      { text: t('billing.features.premium.pdfConversations'), included: true },
      { text: t('billing.features.premium.prioritySupport'), included: true },
      { text: t('billing.features.premium.advancedSettings'), included: true },
      { text: t('billing.features.premium.customScenarios'), included: true }
    ]
  }

  useEffect(() => {
    // Fetch user usage data
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      setUsageLoading(true)
      const response = await api.get('/users/usage')
      
      if (response.data) {
        setUsage({
          normalChats: response.data.normal_chats_used || 0,
          interviewChats: response.data.interview_chats_used || 0,
          normalLimit: response.data.normal_chat_limit || 10,
          interviewLimit: response.data.interview_chat_limit || 5
        })
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
      toast.error(t('billing.errors.loadUsageData'))
      // Set default values on error
      setUsage({
        normalChats: 0,
        interviewChats: 0,
        normalLimit: 10,
        interviewLimit: 5
      })
    } finally {
      setUsageLoading(false)
    }
  }

  const handleUpgrade = (planType) => {
    setSelectedPlan(planType)
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    try {
      setIsLoading(true)
      // Pass the selected plan type (monthly or yearly) to the checkout session
      await createCheckoutSession(selectedPlan)
    } catch (error) {
      toast.error(t('billing.errors.paymentFailed'))
      console.error('Payment error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const FeatureList = ({ features, highlight = false }) => (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center space-x-3">
          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
            feature.included 
              ? highlight ? 'bg-yellow-500' : 'bg-green-500'
              : 'bg-gray-600'
          }`}>
            {feature.included ? (
              <Check className="w-3 h-3 text-white" />
            ) : (
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            )}
          </div>
          <span className={`text-sm ${
            feature.included ? 'text-white-primary' : 'text-gray-400 line-through'
          }`}>
            {feature.text}
          </span>
        </li>
      ))}
    </ul>
  )

  const UsageCard = ({ title, used, limit, icon: Icon, color }) => {
    const usagePercentage = Math.min((used / limit) * 100, 100)
    
    // Define static color values for inline styles
    const colorStyles = {
      blue: {
        iconBg: 'rgba(59, 130, 246, 0.2)',
        iconColor: '#60a5fa',
        progressColor: '#3b82f6'
      },
      green: {
        iconBg: 'rgba(34, 197, 94, 0.2)',
        iconColor: '#4ade80',
        progressColor: '#22c55e'
      }
    }

    const currentColors = colorStyles[color] || colorStyles.blue
    
    // Determine progress bar color based on usage
    let progressColor = currentColors.progressColor
    if (used >= limit) {
      progressColor = '#ef4444' // red-500
    } else if (used >= limit * 0.8) {
      progressColor = '#eab308' // yellow-500
    }

    return (
      <div className="bg-light-dark-secondary rounded-xl p-6 border border-gray-600">
        {usageLoading ? (
          // Loading skeleton
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-gray-600 rounded-lg"></div>
                <div className="h-4 bg-gray-600 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-600 rounded w-12"></div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <div className="h-3 bg-gray-600 rounded w-12"></div>
                <div className="h-3 bg-gray-600 rounded w-8"></div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="h-2 bg-gray-600 rounded-full w-1/2"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: currentColors.iconBg }}
                >
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: currentColors.iconColor }}
                  />
                </div>
                <h3 className="font-medium text-white-primary">{title}</h3>
              </div>
              <span className={`text-sm px-2 py-1 rounded-full ${
                used >= limit 
                  ? 'bg-red-500/20 text-red-400' 
                  : used >= limit * 0.8 
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-green-500/20 text-green-400'
              }`}>
                {used}/{limit}
              </span>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{t('billing.ui.usage')}</span>
                <span className="text-white-primary">{Math.round(usagePercentage)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    backgroundColor: progressColor,
                    width: `${usagePercentage}%`,
                    minWidth: usagePercentage > 0 ? '2px' : '0%' // Ensure visibility for small percentages
                  }}
                />
              </div>
            </div>

            {used >= limit && (
              <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
                {t('billing.ui.limitReached')}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Crown className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-white-primary mb-4">
            {t('billing.ui.chooseYourPlan')}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t('billing.ui.unlimitedPractice')}
          </p>
        </div>

        {/* Current Usage (Free users only) */}
        {!isPremium && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white-primary mb-6 text-center">
              {t('billing.ui.currentUsage')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <UsageCard
                title={t('billing.ui.normalChats')}
                used={usage.normalChats}
                limit={usage.normalLimit}
                icon={Zap}
                color="blue"
              />
              <UsageCard
                title={t('billing.ui.interviewSessions')}
                used={usage.interviewChats}
                limit={usage.interviewLimit}
                icon={Users}
                color="green"
              />
            </div>
            
            {/* Refresh usage button */}
            <div className="text-center mt-4">
              <button
                onClick={fetchUsageData}
                disabled={usageLoading}
                className="text-blue-400 hover:text-blue-300 text-sm underline disabled:opacity-50"
              >
                {usageLoading ? t('billing.ui.refreshing') : t('billing.ui.refreshUsageData')}
              </button>
            </div>
          </div>
        )}

        {/* Plan Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-light-dark-secondary rounded-xl p-1 inline-flex">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedPlan === 'monthly'
                  ? 'bg-blue-2nd text-white-primary shadow-lg'
                  : 'text-gray-400 hover:text-white-primary'
              }`}
            >
              {t('billing.ui.monthly')}
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 relative ${
                selectedPlan === 'yearly'
                  ? 'bg-blue-2nd text-white-primary shadow-lg'
                  : 'text-gray-400 hover:text-white-primary'
              }`}
            >
              {t('billing.ui.yearly')}
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-dark-primary text-xs font-bold px-2 py-1 rounded-full">
                -17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Free Plan */}
          <div className="bg-light-dark-secondary rounded-2xl p-8 border border-gray-600 relative">
            <div className="text-center mb-8">
              <Shield className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white-primary mb-2">{t('billing.ui.free')}</h3>
              <div className="text-4xl font-bold text-white-primary mb-2">
                €0<span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-gray-400">{t('billing.ui.perfectForGettingStarted')}</p>
            </div>

            <FeatureList features={features.free} />

            <div className="mt-8">
              <Button
                variant="secondary"
                className="w-full"
                disabled={!isPremium}
              >
                {isPremium ? t('billing.ui.currentPlan') : t('billing.ui.currentPlan')}
              </Button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-8 border-2 border-yellow-500/30 relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-dark-primary px-6 py-2 rounded-full font-bold text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>{t('billing.ui.mostPopular')}</span>
              </div>
            </div>

            <div className="text-center mb-8 mt-4">
              <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white-primary mb-2">{t('billing.ui.premium')}</h3>
              <div className="text-4xl font-bold text-white-primary mb-2">
                €{plans[selectedPlan].price}
                <span className="text-lg text-gray-400">/{plans[selectedPlan].period}</span>
              </div>
              {selectedPlan === 'yearly' && (
                <div className="text-sm text-green-400 mb-2">
                  {t('billing.ui.savePerYear', { amount: plans.yearly.originalPrice - plans.yearly.price })}
                </div>
              )}
              <p className="text-gray-400">{plans[selectedPlan].description}</p>
            </div>

            <FeatureList features={features.premium} highlight={true} />

            <div className="mt-8">
              <Button
                onClick={() => handleUpgrade(selectedPlan)}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-dark-primary font-bold"
              >
                {isPremium ? t('billing.ui.manageSubscription') : t('billing.ui.upgradeToPremium')}
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white-primary text-center mb-8">
            {t('billing.ui.frequentlyAskedQuestions')}
          </h2>
          <div className="space-y-6">
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h3 className="font-semibold text-white-primary mb-2">
                {t('billing.faq.cancelAnytime.question')}
              </h3>
              <p className="text-gray-400">
                {t('billing.faq.cancelAnytime.answer')}
              </p>
            </div>
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h3 className="font-semibold text-white-primary mb-2">
                {t('billing.faq.paymentMethods.question')}
              </h3>
              <p className="text-gray-400">
                {t('billing.faq.paymentMethods.answer')}
              </p>
            </div>
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h3 className="font-semibold text-white-primary mb-2">
                {t('billing.faq.freeTrial.question')}
              </h3>
              <p className="text-gray-400">
                {t('billing.faq.freeTrial.answer')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}>
        <div className="text-center p-6">
          <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white-primary mb-4">
            {t('billing.paymentModal.title')}
          </h2>
          <div className="bg-light-dark-secondary rounded-lg p-4 mb-6">
            <div className="text-3xl font-bold text-white-primary">
              €{plans[selectedPlan].price}
              <span className="text-lg text-gray-400">/{plans[selectedPlan].period}</span>
            </div>
            {selectedPlan === 'yearly' && (
              <div className="text-green-400 text-sm mt-1">
                {t('billing.paymentModal.discount', { amount: plans.yearly.originalPrice - plans.yearly.price })}
              </div>
            )}
            <p className="text-gray-400 mt-2">{plans[selectedPlan].description}</p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              isLoading={isLoading || paymentLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-dark-primary font-bold flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>{t('billing.paymentModal.proceedToPayment')}</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowPaymentModal(false)}
              className="w-full"
            >
              {t('billing.paymentModal.cancel')}
            </Button>
          </div>
          
          <p className="text-xs text-gray-400 mt-4">
            {t('billing.paymentModal.securePayment')}
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default BillingPage