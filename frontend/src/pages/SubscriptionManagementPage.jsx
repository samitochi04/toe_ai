import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Crown, 
  ArrowLeft, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  Download,
  ExternalLink
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { profileService } from '../services/profile'
import Button from '../components/common/Button'
import { toast } from 'react-hot-toast'

export default function SubscriptionManagementPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  const loadSubscriptionData = async () => {
    try {
      const profileData = await profileService.getProfile()
      const userSubscription = profileData.subscription || user?.subscription
      
      if (userSubscription.status === 'active' ) {
        setSubscription({
          tier: 'Premium',
          status: 'active',
          expires_at: userSubscription.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          billing_cycle: userSubscription.billing_cycle || 'monthly',
          amount: userSubscription.amount || 9.99,
          currency: userSubscription.currency || 'USD',
          next_billing_date: userSubscription.next_billing_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_method: userSubscription.payment_method || { last4: '4242', brand: 'visa' }
        })
      } else {
        // Redirect to premium page if not premium
        navigate('/workspace/premium')
        return
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
      toast.error('Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true)
      // TODO: Implement cancel subscription API call
      toast.success('Subscription cancellation request submitted. You will continue to have access until your current billing period ends.')
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast.error('Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  const handleDownloadInvoice = () => {
    // TODO: Implement invoice download
    toast.success('Invoice download functionality will be available soon')
  }

  const handleUpdatePaymentMethod = () => {
    // Navigate to payment method update
    navigate('/workspace/settings?tab=payment')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-white-primary">Loading subscription details...</div>
      </div>
    )
  }

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
                      <h3 className="text-lg font-semibold text-white-primary">Premium Plan</h3>
                      <p className="text-white-secondary">Full access to all features</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white-primary">
                      ${subscription?.amount}
                      <span className="text-sm font-normal text-white-secondary">
                        /{subscription?.billing_cycle}
                      </span>
                    </div>
                    <div className="text-green-400 text-sm">Active</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-white-secondary text-sm mb-1">Next Billing Date</div>
                    <div className="text-white-primary font-medium">
                      {new Date(subscription?.next_billing_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-white-secondary text-sm mb-1">Payment Method</div>
                    <div className="text-white-primary font-medium">
                      •••• •••• •••• {subscription?.payment_method?.last4}
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
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white-primary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Billing History */}
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white-primary mb-4">Billing History</h2>
              <div className="space-y-3">
                {/* Mock billing history - replace with real data */}
                {[
                  { date: new Date().toISOString(), amount: subscription?.amount, status: 'paid' },
                  { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), amount: subscription?.amount, status: 'paid' },
                  { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), amount: subscription?.amount, status: 'paid' }
                ].map((invoice, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-5 h-5 text-white-secondary" />
                      <div>
                        <div className="text-white-primary font-medium">
                          {new Date(invoice.date).toLocaleDateString()}
                        </div>
                        <div className="text-white-secondary text-sm">Premium Subscription</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-white-primary font-medium">${invoice.amount}</div>
                      <span className="text-green-400 text-sm capitalize">{invoice.status}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownloadInvoice}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
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
                  onClick={handleDownloadInvoice}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-3" />
                  Download Invoice
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
                  <div className="text-white-primary font-medium">Premium</div>
                </div>
                <div>
                  <div className="text-white-secondary text-sm">Status</div>
                  <div className="text-green-400 font-medium">Active</div>
                </div>
                <div>
                  <div className="text-white-secondary text-sm">Renewal Date</div>
                  <div className="text-white-primary font-medium">
                    {new Date(subscription?.next_billing_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-white-secondary text-sm">Amount</div>
                  <div className="text-white-primary font-medium">
                    ${subscription?.amount} {subscription?.currency}
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel Subscription */}
            <div className="bg-light-dark-secondary rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-white-primary">Cancel Subscription</h3>
              </div>
              <p className="text-white-secondary text-sm mb-4">
                You can cancel your subscription at any time. You'll continue to have access to premium features until your current billing period ends.
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
          </div>
        </div>
      </div>
    </div>
  )
}