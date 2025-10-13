import { useTranslation } from 'react-i18next'
import { Crown, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '../common/Button'

const PremiumUpgradeButton = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleUpgrade = () => {
    navigate('/workspace/premium')
  }

  return (
    <Button
      onClick={handleUpgrade}
      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg transition-all duration-200 hover:shadow-xl"
    >
      <Crown className="w-4 h-4" />
      <span>{t('premium.upgrade')}</span>
      <Sparkles className="w-4 h-4" />
    </Button>
  )
}

export default PremiumUpgradeButton