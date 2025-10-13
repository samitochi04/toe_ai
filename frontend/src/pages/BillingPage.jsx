import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Crown, Check, Sparkles, CreditCard, Calendar, Users, Zap, Shield } from 'lucide-react'
import useAuthStore from '../store/authStore'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import toast from 'react-hot-toast'

const BillingPage = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [selectedPlan, setSelectedPlan] = useState('monthly')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [usage, setUsage] = useState({
    normalChats: 0,
    interviewChats: 0,
    normalLimit: 10,
    interviewLimit: 5
  })

  const isPremium = user?.subscription_tier === 'Premium'

  const plans = {
    monthly: {
      id: 'premium_monthly',
      name: 'Premium Monthly',
      price: 5,
      currency: '€',
      period: 'month',
      priceId: 'price_premium_monthly',
      description: 'Perfect for regular interview practice'
    },
    yearly: {
      id: 'premium_yearly', 
      name: 'Premium Yearly',
      price: 50,
      currency: '€',
      period: 'year',
      originalPrice: 60,
      priceId: 'price_premium_yearly',
      discount: 17,
      description: 'Best value - 2 months free!'
    }
  }

  const features = {
    free: [
      { text: '10 normal chats per month', included: true },
      { text: '5 interview sessions per month', included: true },
      { text: 'Basic AI responses', included: true },
      { text: 'Text-only conversations', included: true },
      { text: 'Limited file uploads', included: false },
      { text: 'Voice interaction', included: false },
      { text: 'PDF export', included: false },
      { text: 'Priority support', included: false },
      { text: 'Advanced interview settings', included: false }
    ],
    premium: [
      { text: 'Unlimited normal chats', included: true },
      { text: 'Unlimited interview sessions', included: true },
      { text: 'Advanced AI responses', included: true },
      { text: 'Voice-to-voice interaction', included: true },
      { text: 'File uploads & sharing', included: true },
      { text: 'PDF export of conversations', included: true },
      { text: 'Priority customer support', included: true },
      { text: 'Advanced interview settings', included: true },
      { text: 'Custom interview scenarios', included: true }
    ]
  }

  useEffect(() => {
    // Fetch user usage data
    fetchUsageData()
  }, [])

  const fetchUsageData = async () => {
    try {
      // This would be replaced with actual API call
      setUsage({
        normalChats: 8,
        interviewChats: 3,
        normalLimit: 10,
        interviewLimit: 5
      })
    } catch (error) {
      console.error('Error fetching usage:', error)
    }
  }

  const handleUpgrade = (planType) => {
    setSelectedPlan(planType)
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const plan = plans[selectedPlan]
      
      // This would integrate with Stripe
      const response = await fetch('/api/v1/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          price_id: plan.priceId,
          success_url: `${window.location.origin}/workspace/premium?success=true`,
          cancel_url: `${window.location.origin}/workspace/premium?canceled=true`
        })
      })

      const { checkout_url } = await response.json()
      window.location.href = checkout_url

    } catch (error) {
      toast.error('Payment failed. Please try again.')
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

  const UsageCard = ({ title, used, limit, icon: Icon, color }) => (
    <div className="bg-light-dark-secondary rounded-xl p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${color}-500/20`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
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
          <span className="text-gray-400">Usage</span>
          <span className="text-white-primary">{Math.round((used / limit) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              used >= limit 
                ? 'bg-red-500' 
                : used >= limit * 0.8 
                  ? 'bg-yellow-500'
                  : `bg-${color}-500`
            }`}
            style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
          />
        </div>
      </div>

      {used >= limit && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">
          Limit reached! Upgrade to Premium for unlimited access.
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Crown className="w-12 h-12 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold text-white-primary mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Unlock unlimited interview practice with our premium features
          </p>
        </div>

        {/* Current Usage (Free users only) */}
        {!isPremium && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white-primary mb-6 text-center">
              Current Usage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <UsageCard
                title="Normal Chats"
                used={usage.normalChats}
                limit={usage.normalLimit}
                icon={Zap}
                color="blue"
              />
              <UsageCard
                title="Interview Sessions"
                used={usage.interviewChats}
                limit={usage.interviewLimit}
                icon={Users}
                color="green"
              />
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
              Monthly
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 relative ${
                selectedPlan === 'yearly'
                  ? 'bg-blue-2nd text-white-primary shadow-lg'
                  : 'text-gray-400 hover:text-white-primary'
              }`}
            >
              Yearly
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
              <h3 className="text-2xl font-bold text-white-primary mb-2">Free</h3>
              <div className="text-4xl font-bold text-white-primary mb-2">
                €0<span className="text-lg text-gray-400">/month</span>
              </div>
              <p className="text-gray-400">Perfect for getting started</p>
            </div>

            <FeatureList features={features.free} />

            <div className="mt-8">
              <Button
                variant="secondary"
                className="w-full"
                disabled={!isPremium}
              >
                {isPremium ? 'Current Plan' : 'Current Plan'}
              </Button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-2xl p-8 border-2 border-yellow-500/30 relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-dark-primary px-6 py-2 rounded-full font-bold text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Most Popular</span>
              </div>
            </div>

            <div className="text-center mb-8 mt-4">
              <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white-primary mb-2">Premium</h3>
              <div className="text-4xl font-bold text-white-primary mb-2">
                €{plans[selectedPlan].price}
                <span className="text-lg text-gray-400">/{plans[selectedPlan].period}</span>
              </div>
              {selectedPlan === 'yearly' && (
                <div className="text-sm text-green-400 mb-2">
                  Save €{plans.yearly.originalPrice - plans.yearly.price} per year
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
                {isPremium ? 'Manage Subscription' : 'Upgrade to Premium'}
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white-primary text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h3 className="font-semibold text-white-primary mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-400">
                Yes! You can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.
              </p>
            </div>
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h3 className="font-semibold text-white-primary mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-400">
                We accept all major credit cards including Visa, Mastercard, and American Express through our secure Stripe payment processor.
              </p>
            </div>
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h3 className="font-semibold text-white-primary mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-400">
                Your free account already gives you access to try our platform. Premium users get unlimited access to all features immediately upon upgrade.
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
            Upgrade to Premium
          </h2>
          <div className="bg-light-dark-secondary rounded-lg p-4 mb-6">
            <div className="text-3xl font-bold text-white-primary">
              €{plans[selectedPlan].price}
              <span className="text-lg text-gray-400">/{plans[selectedPlan].period}</span>
            </div>
            {selectedPlan === 'yearly' && (
              <div className="text-green-400 text-sm mt-1">
                17% discount - Save €{plans.yearly.originalPrice - plans.yearly.price}
              </div>
            )}
            <p className="text-gray-400 mt-2">{plans[selectedPlan].description}</p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              isLoading={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-dark-primary font-bold flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>Proceed to Payment</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowPaymentModal(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
          
          <p className="text-xs text-gray-400 mt-4">
            Secure payment powered by Stripe. Your card details are never stored on our servers.
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default BillingPage