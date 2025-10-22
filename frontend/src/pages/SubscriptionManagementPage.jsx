import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Crown, 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  Download,
  ExternalLink,
  Check
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { profileService } from '../services/profile'
import { paymentApi } from '../services/payments'
import Button from '../components/common/Button'
import { toast } from 'react-hot-toast'

export default function SubscriptionManagementPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [subscription, setSubscription] = useState(null)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [billingHistory, setBillingHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      // Load profile data with subscription
      const profileData = await profileService.getProfile()
      const userSubscription = profileData.subscription

      // Check if user has active premium subscription
      if (!userSubscription || userSubscription.status !== 'active') {
        toast.info('No active premium subscription found')
        navigate('/workspace/premium')
        return
      }

      // Get tier info
      const tier = userSubscription.subscription_tiers || {}
      
      setSubscription({
        id: userSubscription.id,
        tier: tier.name || 'Premium',
        tier_id: userSubscription.tier_id,
        status: userSubscription.status,
        stripe_customer_id: userSubscription.stripe_customer_id,
        stripe_subscription_id: userSubscription.stripe_subscription_id,
        current_period_start: userSubscription.current_period_start,
        current_period_end: userSubscription.current_period_end,
        amount: tier.price_monthly || 9.99,
        currency: 'USD',
        billing_cycle: 'monthly',
        features: tier.features || {}
      })

      // Load payment methods
      try {
        const methods = await profileService.getPaymentMethods()
        setPaymentMethods(methods || [])
      } catch (error) {
        console.error('Error loading payment methods:', error)
        setPaymentMethods([])
      }

      // Load billing history
      try {
        const history = await paymentApi.getPaymentHistory()
        // API returns { payments: [], subscription: {} }
        setBillingHistory(history.payments || [])
      } catch (error) {
        console.error('Error loading billing history:', error)
        setBillingHistory([])
      }

    } catch (error) {
      console.error('Error loading subscription:', error)
      toast.error('Failed to load subscription data')
      navigate('/workspace/settings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.')) {
      return
    }

    try {
      setCancelling(true)
      await paymentApi.cancelSubscription()
      toast.success('Subscription cancelled successfully. You will have access until the end of your current billing period.')
      
      // Reload subscription data
      await loadSubscriptionData()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error(error.response?.data?.detail || 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      // TODO: Implement invoice download when Stripe invoice URL is available
      toast.info('Invoice download will be available soon')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice')
    }
  }

  const handleUpdatePaymentMethod = async () => {
    // Use the same billing portal as "Manage Billing" since it provides
    // a secure, PCI-compliant way to update payment methods
    await handleOpenBillingPortal()
  }

  const handleOpenBillingPortal = async () => {
    try {
      const returnUrl = `${window.location.origin}/workspace/subscription-management`
      const response = await paymentApi.createBillingPortalSession(returnUrl)
      
      if (response.url) {
        window.location.href = response.url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast.error('Failed to open billing portal')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-white-primary">Loading subscription details...</div>
      </div>
    )
  }

  if (!subscription) {
    return null
  }

  const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default) || paymentMethods[0]

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/workspace/settings')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold text-white-primary">Subscription Management</h1>
              <p className="text-white-secondary">Manage your premium subscription</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscription Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white-primary mb-4">Current Plan</h2>
              <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-yellow-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-white-primary">{subscription.tier} Plan</h3>
                      <p className="text-white-secondary">Full access to all features</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white-primary">
                      ${subscription.amount.toFixed(2)}
                      <span className="text-sm font-normal text-white-secondary">
                        /{subscription.billing_cycle}
                      </span>
                    </div>
                    <div className="text-green-400 text-sm capitalize">{subscription.status}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-white-secondary text-sm mb-1">Current Period Ends</div>
                    <div className="text-white-primary font-medium">
                      {subscription.current_period_end 
                        ? new Date(subscription.current_period_end).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-white-secondary text-sm mb-1">Payment Method</div>
                    <div className="text-white-primary font-medium">
                      {defaultPaymentMethod 
                        ? `•••• •••• •••• ${defaultPaymentMethod.card_last4}`
                        : 'No payment method'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white-primary mb-4">Premium Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Unlimited normal chats',
                  'Unlimited interview chats',
                  'Premium AI models',
                  'Priority support',
                  'Advanced features',
                  'File uploads',
                  'Chat sharing',
                  'Export chats to PDF'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <Check className="w-5 h-5 text-green-400" />
                    <span className="text-white-primary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white-primary mb-4">Billing History</h2>
              {billingHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-white-secondary">No billing history available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {billingHistory.map((invoice, index) => (
                    <div key={invoice.id || index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-white-secondary" />
                        <div>
                          <div className="text-white-primary font-medium">
                            {new Date(invoice.created_at || invoice.date).toLocaleDateString()}
                          </div>
                          <div className="text-white-secondary text-sm">
                            {invoice.description || 'Premium Subscription'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-white-primary font-medium">
                          ${(invoice.amount_paid || invoice.amount || 0).toFixed(2)}
                        </div>
                        <span className={`text-sm capitalize ${
                          invoice.status === 'paid' || invoice.status === 'succeeded' 
                            ? 'text-green-400' 
                            : invoice.status === 'pending' 
                            ? 'text-yellow-400' 
                            : 'text-red-400'
                        }`}>
                          {invoice.status}
                        </span>
                        {invoice.invoice_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.invoice_url, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white-primary mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleUpdatePaymentMethod}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <CreditCard className="w-4 h-4 mr-3" />
                  Update Payment Method
                </Button>
                <Button
                  onClick={handleOpenBillingPortal}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-3" />
                  Manage Billing
                </Button>
                <Button
                  onClick={() => window.open('mailto:support@toeai.com', '_blank')}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <ExternalLink className="w-4 h-4 mr-3" />
                  Contact Support
                </Button>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white-primary mb-4">Subscription Details</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-white-secondary text-sm">Plan</div>
                  <div className="text-white-primary font-medium">{subscription.tier}</div>
                </div>
                <div>
                  <div className="text-white-secondary text-sm">Status</div>
                  <div className={`font-medium capitalize ${
                    subscription.status === 'active' ? 'text-green-400' :
                    subscription.status === 'cancelled' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {subscription.status}
                  </div>
                </div>
                <div>
                  <div className="text-white-secondary text-sm">Started</div>
                  <div className="text-white-primary font-medium">
                    {subscription.current_period_start 
                      ? new Date(subscription.current_period_start).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-white-secondary text-sm">Renewal Date</div>
                  <div className="text-white-primary font-medium">
                    {subscription.current_period_end 
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-white-secondary text-sm">Amount</div>
                  <div className="text-white-primary font-medium">
                    ${subscription.amount.toFixed(2)} {subscription.currency}
                  </div>
                </div>
                {subscription.stripe_subscription_id && (
                  <div>
                    <div className="text-white-secondary text-sm">Subscription ID</div>
                    <div className="text-white-primary font-medium text-xs">
                      {subscription.stripe_subscription_id.substring(0, 20)}...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel Subscription */}
            {subscription.status === 'active' && (
              <div className="bg-light-dark-secondary rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-white-primary">Cancel Subscription</h3>
                </div>
                <p className="text-white-secondary text-sm mb-4">
                  You can cancel your subscription at any time. You'll continue to have access to premium features until {
                    subscription.current_period_end 
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : 'the end of your billing period'
                  }.
                </p>
                <Button
                  onClick={handleCancelSubscription}
                  variant="destructive"
                  disabled={cancelling}
                  className="w-full"
                >
                  {cancelling ? 'Processing...' : 'Cancel Subscription'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}