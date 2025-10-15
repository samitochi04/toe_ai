import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  Globe, 
  CreditCard, 
  Crown, 
  Edit, 
  Save, 
  X, 
  Plus,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import profileService from '../services/profile'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import Modal from '../components/common/Modal'

const SettingsPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, updateUserData } = useAuthStore()
  
  // Profile states
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    alias: '',
    phone: '',
    bio: ''
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)
  
  // Payment states
  const [paymentMethods, setPaymentMethods] = useState([])
  const [showAddCard, setShowAddCard] = useState(false)
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })
  const [showCvv, setShowCvv] = useState(false)
  
  // Subscription states
  const [subscription, setSubscription] = useState(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)

  const isPremium = user?.subscription?.status === 'active'

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Load profile data
      if (user) {
        setProfile({
          full_name: user.full_name || '',
          email: user.email || '',
          alias: user.alias || '',
          phone: user.phone || '',
          bio: user.bio || ''
        })
      }

      // Load subscription info
      try {
        const profileData = await profileService.getProfile()
        setSubscription(profileData.subscription || {
          tier: 'Free',
          status: 'active',
          expires_at: null,
          features: ['10 normal chats/day', '5 interview chats/day', 'Basic support']
        })
      } catch (error) {
        console.error('Error loading subscription:', error)
        // Set default free subscription
        setSubscription({
          tier: 'Free',
          status: 'active',
          expires_at: null,
          features: ['10 normal chats/day', '5 interview chats/day', 'Basic support']
        })
      }

      // Load payment methods if premium
      if (isPremium) {
        try {
          const payments = await profileService.getPaymentMethods()
          setPaymentMethods(payments.payment_methods || [])
        } catch (error) {
          console.error('Error loading payment methods:', error)
        }
      }

    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setProfileLoading(true)
      
      // Only send fields that the backend accepts
      const updateData = {
        full_name: profile.full_name,
        bio: profile.bio
      }
      
      const updatedUser = await profileService.updateProfile(updateData)
      updateUserData(updatedUser)
      setIsEditingProfile(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleLanguageChange = async (newLanguage) => {
    try {
      await i18n.changeLanguage(newLanguage)
      setSelectedLanguage(newLanguage)
      
      // Save to backend if user is logged in
      if (user) {
        await profileService.updateLanguage(newLanguage)
      }
      
      toast.success('Language updated successfully!')
    } catch (error) {
      console.error('Error changing language:', error)
      toast.error('Failed to update language')
    }
  }

  const handleAddCard = async () => {
    if (!isPremium) {
      toast.error('Premium subscription required to add payment methods')
      return
    }

    try {
      const newCard = await profileService.addPaymentMethod(cardForm)
      setPaymentMethods([...paymentMethods, newCard])
      setCardForm({ number: '', expiry: '', cvv: '', name: '' })
      setShowAddCard(false)
      toast.success('Payment method added successfully!')
    } catch (error) {
      console.error('Error adding payment method:', error)
      toast.error('Failed to add payment method')
    }
  }

  const handleRemoveCard = async (cardId) => {
    try {
      await profileService.removePaymentMethod(cardId)
      setPaymentMethods(paymentMethods.filter(card => card.id !== cardId))
      toast.success('Payment method removed successfully!')
    } catch (error) {
      console.error('Error removing payment method:', error)
      toast.error('Failed to remove payment method')
    }
  }

  const formatCardNumber = (number) => {
    return number.replace(/(.{4})/g, '$1 ').trim()
  }

  const maskCardNumber = (number) => {
    const cleaned = number.replace(/\s/g, '')
    return `**** **** **** ${cleaned.slice(-4)}`
  }

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-white-primary">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-white-primary mb-8">
          Settings
        </h1>

        <div className="space-y-8">
          {/* Profile Section */}
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-brand-primary" />
                <h2 className="text-xl font-semibold text-white-primary">Profile Information</h2>
              </div>
              <Button
                variant={isEditingProfile ? "ghost" : "primary"}
                size="sm"
                onClick={() => {
                  if (isEditingProfile) {
                    setIsEditingProfile(false)
                    // Reset profile data
                    setProfile({
                      full_name: user?.full_name || '',
                      email: user?.email || '',
                      alias: user?.alias || '',
                      phone: user?.phone || '',
                      bio: user?.bio || ''
                    })
                  } else {
                    setIsEditingProfile(true)
                  }
                }}
              >
                {isEditingProfile ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Full Name
                </label>
                {isEditingProfile ? (
                  <Input
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="p-3 bg-gray-800 rounded-xl text-white-primary">
                    {profile.full_name || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Email
                </label>
                <div className="p-3 bg-gray-800 rounded-xl text-white-secondary">
                  {profile.email} (Cannot be changed)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Alias (for sharing)
                </label>
                {isEditingProfile ? (
                  <Input
                    value={profile.alias}
                    onChange={(e) => setProfile({ ...profile, alias: e.target.value })}
                    placeholder="Enter your alias"
                  />
                ) : (
                  <div className="p-3 bg-gray-800 rounded-xl text-white-primary">
                    {profile.alias || 'Not set'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Phone (Optional)
                </label>
                {isEditingProfile ? (
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="p-3 bg-gray-800 rounded-xl text-white-primary">
                    {profile.phone || 'Not set'}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Bio (Optional)
                </label>
                {isEditingProfile ? (
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                  />
                ) : (
                  <div className="p-3 bg-gray-800 rounded-xl text-white-primary min-h-[80px]">
                    {profile.bio || 'No bio set'}
                  </div>
                )}
              </div>
            </div>

            {isEditingProfile && (
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleUpdateProfile}
                  isLoading={profileLoading}
                  className="px-6"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          {/* Language Section */}
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-brand-primary" />
              <h2 className="text-xl font-semibold text-white-primary">Language Preferences</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedLanguage === 'en'
                    ? 'border-brand-primary bg-brand-primary/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇺🇸</span>
                  <div className="text-left">
                    <div className="text-white-primary font-medium">English</div>
                    <div className="text-white-secondary text-sm">United States</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleLanguageChange('fr')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedLanguage === 'fr'
                    ? 'border-brand-primary bg-brand-primary/20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🇫🇷</span>
                  <div className="text-left">
                    <div className="text-white-primary font-medium">Français</div>
                    <div className="text-white-secondary text-sm">France</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-white-primary">Membership</h2>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white-primary">
                    {subscription?.tier || 'Free'} Plan
                  </h3>
                  <p className="text-white-secondary">
                    {subscription?.status === 'active' ? 'Active' : 'Inactive'}
                    {subscription?.expires_at && (
                      <span> • Expires {new Date(subscription.expires_at).toLocaleDateString()}</span>
                    )}
                  </p>
                </div>
                {!isPremium && (
                  <Button
                    onClick={() => navigate('/workspace/premium')}
                    className="px-6"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-white-primary">Features:</h4>
                <ul className="space-y-1">
                  {(subscription?.features || []).map((feature, index) => (
                    <li key={index} className="text-white-secondary text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {!isPremium && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-500 font-medium">Upgrade to Premium</span>
                  </div>
                  <p className="text-white-secondary text-sm">
                    Unlock unlimited chats, voice features, file uploads, and more!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods Section */}
          <div className="bg-light-dark-secondary rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-brand-primary" />
                <h2 className="text-xl font-semibold text-white-primary">Payment Methods</h2>
              </div>
              {isPremium && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddCard(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </Button>
              )}
            </div>

            {!isPremium ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-white-secondary mb-4">
                  Payment methods are available for Premium subscribers only
                </p>
                <Button onClick={() => navigate('/workspace/premium')}>
                  Upgrade to Premium
                </Button>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-white-secondary mb-4">No payment methods added yet</p>
                <Button onClick={() => setShowAddCard(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Card
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((card) => (
                  <div key={card.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white-primary font-medium">
                          {maskCardNumber(card.number)}
                        </div>
                        <div className="text-white-secondary text-sm">
                          Expires {card.expiry} • {card.name}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCard(card.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add Card Modal */}
        <Modal isOpen={showAddCard} onClose={() => setShowAddCard(false)} size="lg">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white-primary mb-6">Add Payment Method</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Card Number
                </label>
                <Input
                  value={formatCardNumber(cardForm.number)}
                  onChange={(e) => setCardForm({ ...cardForm, number: e.target.value.replace(/\s/g, '') })}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white-secondary mb-2">
                    Expiry Date
                  </label>
                  <Input
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white-secondary mb-2">
                    CVV
                  </label>
                  <div className="relative">
                    <Input
                      type={showCvv ? "text" : "password"}
                      value={cardForm.cvv}
                      onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                      placeholder="123"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCvv(!showCvv)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white-secondary hover:text-white-primary"
                    >
                      {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white-secondary mb-2">
                  Cardholder Name
                </label>
                <Input
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowAddCard(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCard}
                className="flex-1"
                disabled={!cardForm.number || !cardForm.expiry || !cardForm.cvv || !cardForm.name}
              >
                Add Card
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default SettingsPage