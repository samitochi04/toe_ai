import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Crown, Sparkles, Zap, Users, AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

const UsageLimitModal = ({ 
  isOpen, 
  onClose, 
  type = 'normal', // 'normal' or 'interview'
  currentUsage = 0,
  limit = 10
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleUpgrade = () => {
    onClose()
    navigate('/workspace/premium')
  }

  const getIcon = () => {
    return type === 'interview' ? Users : Zap
  }

  const getTitle = () => {
    return type === 'interview' 
      ? t('usageLimit.title') 
      : t('usageLimit.title')
  }

  const getDescription = () => {
    return type === 'interview'
      ? `You've used all ${limit} of your monthly interview sessions. ${t('usageLimit.subtitle')}`
      : `You've used all ${limit} of your monthly normal chats. ${t('usageLimit.subtitle')}`
  }

  const Icon = getIcon()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center p-6">
        {/* Warning Icon */}
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white-primary mb-2">
          {getTitle()}
        </h2>

        {/* Usage Display */}
        <div className="bg-light-dark-secondary rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <Icon className="w-6 h-6 text-red-400" />
            <span className="text-lg font-medium text-white-primary">
              {t('usageLimit.freeUsage', { current: currentUsage, limit: limit })}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-red-500"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 mb-8">
          {getDescription()}
        </p>

        {/* Premium Benefits */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 mb-6 border border-yellow-500/30">
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-yellow-500">Premium Benefits</span>
          </div>
          <ul className="text-sm text-gray-300 space-y-2">
            <li className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>{t('usageLimit.features.unlimitedChats')}</span>
            </li>
            <li className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>{t('usageLimit.features.voiceInteraction')}</span>
            </li>
            <li className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>{t('usageLimit.features.exportPdf')}</span>
            </li>
            <li className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>{t('usageLimit.features.prioritySupport')}</span>
            </li>
          </ul>
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-white-primary">
            {t('usageLimit.pricing.monthly')}<span className="text-lg text-gray-400">/month</span>
          </div>
          <div className="text-sm text-green-400">
            or {t('usageLimit.pricing.yearly')}/year (save 17%)
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-dark-primary font-bold flex items-center justify-center space-x-2"
          >
            <Crown className="w-5 h-5" />
            <span>{t('usageLimit.upgrade')}</span>
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-gray-400 hover:text-white-primary"
          >
            {t('common.maybeLater')}
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-4">
          Cancel anytime • Secure payment • Instant access
        </p>
      </div>
    </Modal>
  )
}

export default UsageLimitModal
